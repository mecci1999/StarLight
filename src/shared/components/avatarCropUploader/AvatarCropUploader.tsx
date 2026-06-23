import { NButton, NModal, NSlider } from 'naive-ui'
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { resolveUploadedFileUrl, uploadFile } from '@/api/file'
import { extractUpdatedUser, updateUserAvatar } from '@/api/user'
import { putCachedAvatarSource } from '@/services/avatarCache'
import type { UserInfoType } from '@/types/userInfo'
import './AvatarCropUploader.scss'

const CROP_STAGE_SIZE = 280
const MAX_AVATAR_SOURCE_FILE_BYTES = 10 * 1024 * 1024
const MAX_AVATAR_UPLOAD_BYTES = 64 * 1024
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const AVATAR_COMPRESS_MIME_TYPES = ['image/webp', 'image/jpeg']
const AVATAR_COMPRESS_QUALITIES = [0.86, 0.76, 0.66, 0.56, 0.46, 0.36]
const AVATAR_COMPRESS_SIZES = [400, 320, 256]

type StoredUserProfile = Partial<UserInfoType> & {
  nickname?: string
}

type CropImageState = {
  file: File
  objectUrl: string
  image: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
}

type DragState = {
  startX: number
  startY: number
  originX: number
  originY: number
}

type CompressedAvatar = {
  fileBase64: string
  mimeType: string
  extension: string
  outputSize: number
  byteSize: number
  quality: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const estimateBase64Bytes = (base64: string) => Math.ceil((base64.length * 3) / 4)

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('头像压缩失败，请重新选择图片')
  return {
    mimeType: match[1],
    fileBase64: match[2],
    byteSize: estimateBase64Bytes(match[2])
  }
}

const getImageExtension = (mimeType: string) => (mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] || 'png')

const loadImageFromFile = (file: File) =>
  new Promise<CropImageState>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () =>
      resolve({
        file,
        objectUrl,
        image,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片读取失败'))
    }
    image.src = objectUrl
  })

export default defineComponent({
  name: 'AvatarCropUploader',
  props: {
    userId: {
      type: String,
      required: true
    },
    buttonLabel: {
      type: String,
      default: '上传新头像'
    },
    buttonSize: {
      type: String,
      default: 'small'
    },
    buttonType: {
      type: String,
      default: 'primary'
    },
    buttonSecondary: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    triggerClass: {
      type: String,
      default: ''
    }
  },
  emits: {
    uploaded: (_payload: { avatar: string; user: StoredUserProfile }) => true,
    uploadingChange: (_uploading: boolean) => true
  },
  setup(props, { emit, slots }) {
    const fileInputRef = ref<HTMLInputElement | null>(null)
    const previewCanvasRef = ref<HTMLCanvasElement | null>(null)
    const cropVisible = ref(false)
    const cropImage = ref<CropImageState | null>(null)
    const zoom = ref(1)
    const offsetX = ref(0)
    const offsetY = ref(0)
    const uploading = ref(false)
    const dragState = ref<DragState | null>(null)

    const minZoom = computed(() => {
      const image = cropImage.value
      if (!image) return 1
      return Math.max(CROP_STAGE_SIZE / image.naturalWidth, CROP_STAGE_SIZE / image.naturalHeight)
    })

    const maxZoom = computed(() => Math.max(minZoom.value * 3, 3))
    const canConfirm = computed(() => Boolean(cropImage.value && props.userId && !uploading.value))

    const constrainOffset = () => {
      const image = cropImage.value
      if (!image) return
      const scaledWidth = image.naturalWidth * zoom.value
      const scaledHeight = image.naturalHeight * zoom.value
      const maxOffsetX = Math.max(0, (scaledWidth - CROP_STAGE_SIZE) / 2)
      const maxOffsetY = Math.max(0, (scaledHeight - CROP_STAGE_SIZE) / 2)
      offsetX.value = clamp(offsetX.value, -maxOffsetX, maxOffsetX)
      offsetY.value = clamp(offsetY.value, -maxOffsetY, maxOffsetY)
    }

    const drawPreview = () => {
      const canvas = previewCanvasRef.value
      const imageState = cropImage.value
      const context = canvas?.getContext('2d')
      if (!canvas || !context || !imageState) return

      canvas.width = CROP_STAGE_SIZE
      canvas.height = CROP_STAGE_SIZE
      context.clearRect(0, 0, CROP_STAGE_SIZE, CROP_STAGE_SIZE)
      context.fillStyle = '#101318'
      context.fillRect(0, 0, CROP_STAGE_SIZE, CROP_STAGE_SIZE)

      const scaledWidth = imageState.naturalWidth * zoom.value
      const scaledHeight = imageState.naturalHeight * zoom.value
      const drawX = (CROP_STAGE_SIZE - scaledWidth) / 2 + offsetX.value
      const drawY = (CROP_STAGE_SIZE - scaledHeight) / 2 + offsetY.value
      context.drawImage(imageState.image, drawX, drawY, scaledWidth, scaledHeight)
    }

    const closeCropper = () => {
      cropVisible.value = false
      if (cropImage.value) URL.revokeObjectURL(cropImage.value.objectUrl)
      cropImage.value = null
      dragState.value = null
      zoom.value = 1
      offsetX.value = 0
      offsetY.value = 0
    }

    const openPicker = () => {
      if (props.disabled || uploading.value) return
      fileInputRef.value?.click()
    }

    const openCropper = async (file: File) => {
      const imageState = await loadImageFromFile(file)
      if (cropImage.value) URL.revokeObjectURL(cropImage.value.objectUrl)
      cropImage.value = imageState
      zoom.value = Math.max(CROP_STAGE_SIZE / imageState.naturalWidth, CROP_STAGE_SIZE / imageState.naturalHeight)
      offsetX.value = 0
      offsetY.value = 0
      cropVisible.value = true
      await nextTick()
      drawPreview()
    }

    const handleFileChange = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
        window.$message.error('请上传 PNG、JPG 或 WebP 格式头像')
        return
      }
      if (file.size > MAX_AVATAR_SOURCE_FILE_BYTES) {
        window.$message.error(
          `头像原图不能超过 ${formatFileSize(MAX_AVATAR_SOURCE_FILE_BYTES)}，请先选择体积更小的图片`
        )
        return
      }
      try {
        await openCropper(file)
      } catch (error) {
        window.$message.error(error instanceof Error ? error.message : '图片读取失败')
      }
    }

    const exportAvatarCanvas = (outputSize: number) => {
      const imageState = cropImage.value
      if (!imageState) throw new Error('请选择头像图片')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('当前环境不支持头像裁剪')

      canvas.width = outputSize
      canvas.height = outputSize
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, outputSize, outputSize)
      const scale = outputSize / CROP_STAGE_SIZE
      const scaledWidth = imageState.naturalWidth * zoom.value * scale
      const scaledHeight = imageState.naturalHeight * zoom.value * scale
      const drawX = (outputSize - scaledWidth) / 2 + offsetX.value * scale
      const drawY = (outputSize - scaledHeight) / 2 + offsetY.value * scale
      context.drawImage(imageState.image, drawX, drawY, scaledWidth, scaledHeight)
      return canvas
    }

    const createCompressedAvatar = (): CompressedAvatar => {
      let smallest: CompressedAvatar | null = null

      for (const outputSize of AVATAR_COMPRESS_SIZES) {
        const canvas = exportAvatarCanvas(outputSize)
        for (const mimeType of AVATAR_COMPRESS_MIME_TYPES) {
          for (const quality of AVATAR_COMPRESS_QUALITIES) {
            const parsed = parseDataUrl(canvas.toDataURL(mimeType, quality))
            const candidate: CompressedAvatar = {
              fileBase64: parsed.fileBase64,
              mimeType: parsed.mimeType,
              extension: getImageExtension(parsed.mimeType),
              outputSize,
              byteSize: parsed.byteSize,
              quality
            }
            if (!smallest || candidate.byteSize < smallest.byteSize) smallest = candidate
            if (candidate.byteSize <= MAX_AVATAR_UPLOAD_BYTES) return candidate
          }
        }
      }

      if (smallest && smallest.byteSize <= MAX_AVATAR_UPLOAD_BYTES * 1.25) return smallest
      throw new Error(`头像压缩后仍超过 ${formatFileSize(MAX_AVATAR_UPLOAD_BYTES)}，请换一张更小的图片`)
    }

    const confirmUpload = async () => {
      const imageState = cropImage.value
      if (!imageState) return
      if (!props.userId) {
        window.$message.error('缺少用户信息，无法更新头像')
        return
      }
      uploading.value = true
      emit('uploadingChange', true)
      try {
        const compressedAvatar = createCompressedAvatar()
        const uploaded = await uploadFile({
          scene: 'user-avatar',
          bizType: 'user',
          bizId: props.userId,
          fileName: `${props.userId}-avatar.${compressedAvatar.extension}`,
          mimeType: compressedAvatar.mimeType,
          fileBase64: compressedAvatar.fileBase64,
          metadata: {
            sourceFileName: imageState.file.name,
            sourceMimeType: imageState.file.type,
            sourceSize: imageState.file.size,
            outputWidth: compressedAvatar.outputSize,
            outputHeight: compressedAvatar.outputSize,
            outputSize: compressedAvatar.byteSize,
            outputMimeType: compressedAvatar.mimeType,
            outputQuality: compressedAvatar.quality,
            cropZoom: zoom.value,
            cropOffsetX: Math.round(offsetX.value),
            cropOffsetY: Math.round(offsetY.value)
          }
        })
        if (import.meta.env.DEV) {
          console.info('[AvatarSync][uploader:uploadFile:response]', {
            uploaded,
            fileId: uploaded.fileId,
            url: uploaded.url,
            objectKey: uploaded.objectKey
          })
        }
        const avatar = resolveUploadedFileUrl(uploaded)
        if (!avatar) throw new Error('文件服务未返回头像地址')
        const response = await updateUserAvatar({
          userId: props.userId,
          avatar,
          avatarFileId: uploaded.fileId || uploaded.objectKey
        })
        const updatedUser = extractUpdatedUser(response)
        const nextAvatar = updatedUser.avatar || avatar
        putCachedAvatarSource(nextAvatar, `data:${compressedAvatar.mimeType};base64,${compressedAvatar.fileBase64}`)
        if (import.meta.env.DEV) {
          console.info('[AvatarSync][uploader:updateUserAvatar:response]', {
            requestAvatar: avatar,
            response,
            updatedUser,
            nextAvatar
          })
        }
        emit('uploaded', { avatar: nextAvatar, user: updatedUser })
        window.$message.success('头像已更新')
        closeCropper()
      } catch (error) {
        const message = error instanceof Error ? error.message : '头像上传失败，请稍后重试'
        window.$message.error(
          message.includes('too large') || message.includes('413') ? '头像压缩后仍过大，请换一张更小的图片' : message
        )
      } finally {
        uploading.value = false
        emit('uploadingChange', false)
      }
    }

    const handleZoomUpdate = (value: number) => {
      zoom.value = value
      constrainOffset()
      drawPreview()
    }

    const moveCrop = (clientX: number, clientY: number) => {
      const drag = dragState.value
      if (!drag) return
      offsetX.value = drag.originX + clientX - drag.startX
      offsetY.value = drag.originY + clientY - drag.startY
      constrainOffset()
      drawPreview()
    }

    const startDrag = (event: PointerEvent) => {
      if (!cropImage.value || uploading.value) return
      dragState.value = {
        startX: event.clientX,
        startY: event.clientY,
        originX: offsetX.value,
        originY: offsetY.value
      }
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    }

    const onDrag = (event: PointerEvent) => moveCrop(event.clientX, event.clientY)

    const endDrag = (event: PointerEvent) => {
      dragState.value = null
      const target = event.currentTarget as HTMLElement
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
    }

    watch(cropVisible, (visible) => {
      if (visible) void nextTick(drawPreview)
    })

    onBeforeUnmount(closeCropper)

    return () => (
      <>
        {slots.default ? (
          slots.default({ open: openPicker, uploading: uploading.value })
        ) : (
          <NButton
            class={props.triggerClass || undefined}
            size={props.buttonSize as 'tiny' | 'small' | 'medium' | 'large'}
            type={props.buttonType as 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'}
            secondary={props.buttonSecondary}
            loading={uploading.value}
            disabled={props.disabled}
            onClick={openPicker}>
            {props.buttonLabel}
          </NButton>
        )}
        <input
          ref={fileInputRef}
          class="avatar-crop-uploader__input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
        />
        <NModal
          show={cropVisible.value}
          preset="card"
          title="调整头像"
          class="avatar-crop-uploader__modal"
          maskClosable={!uploading.value}
          onUpdateShow={(value: boolean) => {
            if (!value && !uploading.value) closeCropper()
          }}>
          <div class="avatar-crop-uploader">
            <div class="avatar-crop-uploader__stage-shell">
              <div
                class="avatar-crop-uploader__stage"
                onPointerdown={startDrag}
                onPointermove={onDrag}
                onPointerup={endDrag}
                onPointercancel={endDrag}>
                <canvas ref={previewCanvasRef} width={CROP_STAGE_SIZE} height={CROP_STAGE_SIZE} />
                <div class="avatar-crop-uploader__mask" />
              </div>
              <p>拖动画面取景，缩放到满意后保存；系统会自动压缩头像体积。</p>
            </div>
            <div class="avatar-crop-uploader__controls">
              <span>缩放</span>
              <NSlider
                value={zoom.value}
                min={minZoom.value}
                max={maxZoom.value}
                step={0.01}
                disabled={!cropImage.value || uploading.value}
                onUpdate:value={handleZoomUpdate}
              />
            </div>
            <div class="avatar-crop-uploader__actions">
              <NButton disabled={uploading.value} onClick={closeCropper}>
                取消
              </NButton>
              <NButton type="primary" loading={uploading.value} disabled={!canConfirm.value} onClick={confirmUpload}>
                保存头像
              </NButton>
            </div>
          </div>
        </NModal>
      </>
    )
  }
})
