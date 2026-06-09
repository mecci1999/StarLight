import { computed, defineComponent, onBeforeUnmount, ref } from 'vue'
import { NButton, NCard, NProgress, NSlider, NSpace, NTag, useMessage } from 'naive-ui'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { open as openPath } from '@tauri-apps/plugin-shell'
import PageHeader from '@/shared/layout/PageHeader'
import {
  createCloudVideoUpscaleTask,
  downloadCloudVideoUpscaleTask,
  getCloudVideoUpscaleTask,
  type CloudVideoUpscaleTask
} from '@/api/videoUpscale'
import './VideoUpscalePage.scss'

type VideoMetadata = {
  name: string
  size: number
  duration: number
  width: number
  height: number
}

type UpscaleStatus = 'idle' | 'ready' | 'processing' | 'done' | 'error'
type UpscaleMode = 'local-ai' | 'cloud-ai' | 'browser-fallback'
type LocalUpscaleEngine = 'realesrgan' | 'ffmpeg'

type CapturableMediaElement = HTMLMediaElement & {
  captureStream?: () => MediaStream
  mozCaptureStream?: () => MediaStream
}

type EnhancementPreset = 'balanced' | 'cinema' | 'detail'

type EnhancementSettings = {
  sharpness: number
  clarity: number
  denoise: number
  saturation: number
  contrast: number
}

type RecorderFormat = {
  mimeType: string
  label: string
  extension: string
}

type LocalVideoUpscaleRuntime = {
  ffmpegAvailable: boolean
  aiUpscalerAvailable: boolean
  aiUpscalerPath?: string | null
}

type LocalVideoUpscaleTask = {
  id: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  message: string
  outputPath?: string | null
}

const VIDEO_UPSCALE_LOG_PREFIX = '[VideoUpscale]'

const createVideoUpscaleErrorMessage = (taskMessage: string) => {
  if (taskMessage.includes('FFmpeg 兜底也失败')) {
    return taskMessage
  }

  if (taskMessage.includes('SIGSEGV')) {
    return `${taskMessage}\nReal-ESRGAN 原生进程发生段错误，通常和 Vulkan/GPU 驱动、二进制架构或模型文件有关。请先尝试“浏览器增强”模式；如果继续使用本地 AI，请重新下载 macOS 版 realesrgan-ncnn-vulkan，并确认 models 目录与可执行文件在同一目录。`
  }

  return taskMessage
}

const TARGET_WIDTH = 3840
const TARGET_HEIGHT = 2160
const RECOMMENDED_SOURCE_WIDTH = 1920
const RECOMMENDED_SOURCE_HEIGHT = 1080
const ANALYSIS_WIDTH = 960
const ANALYSIS_HEIGHT = 540

const enhancementPresets: Record<EnhancementPreset, EnhancementSettings> = {
  balanced: {
    sharpness: 42,
    clarity: 24,
    denoise: 12,
    saturation: 8,
    contrast: 6
  },
  cinema: {
    sharpness: 28,
    clarity: 18,
    denoise: 22,
    saturation: 12,
    contrast: 10
  },
  detail: {
    sharpness: 62,
    clarity: 34,
    denoise: 6,
    saturation: 6,
    contrast: 8
  }
}

const clampColor = (value: number) => Math.max(0, Math.min(255, value))

const enhanceFramePixels = (imageData: ImageData, settings: EnhancementSettings) => {
  const { data, width, height } = imageData
  const source = new Uint8ClampedArray(data)
  const sharpenAmount = settings.sharpness / 100
  const clarityAmount = settings.clarity / 100
  const denoiseAmount = settings.denoise / 100
  const saturationAmount = 1 + settings.saturation / 100
  const contrastAmount = 1 + settings.contrast / 100

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4
      const left = index - 4
      const right = index + 4
      const top = index - width * 4
      const bottom = index + width * 4

      for (let channel = 0; channel < 3; channel += 1) {
        const current = source[index + channel]
        const neighborAverage =
          (source[left + channel] + source[right + channel] + source[top + channel] + source[bottom + channel]) / 4
        const denoised = current * (1 - denoiseAmount) + neighborAverage * denoiseAmount
        const detail = current - neighborAverage
        data[index + channel] = clampColor(denoised + detail * (sharpenAmount * 1.8 + clarityAmount))
      }

      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722

      data[index] = clampColor((luminance + (red - luminance) * saturationAmount - 128) * contrastAmount + 128)
      data[index + 1] = clampColor((luminance + (green - luminance) * saturationAmount - 128) * contrastAmount + 128)
      data[index + 2] = clampColor((luminance + (blue - luminance) * saturationAmount - 128) * contrastAmount + 128)
    }
  }
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'

  const rounded = Math.floor(seconds)
  const minutes = Math.floor(rounded / 60)
  const restSeconds = rounded % 60
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 MB'

  const megabytes = bytes / 1024 / 1024
  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`
}

const getRecorderFormat = (): RecorderFormat | null => {
  const candidates: RecorderFormat[] = [
    { mimeType: 'video/webm;codecs=vp9,opus', label: 'WebM VP9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', label: 'WebM VP8', extension: 'webm' },
    { mimeType: 'video/webm', label: 'WebM', extension: 'webm' },
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4 H.264', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=h264,aac', label: 'MP4 H.264', extension: 'mp4' },
    { mimeType: 'video/mp4', label: 'MP4', extension: 'mp4' }
  ]
  return candidates.find((item) => MediaRecorder.isTypeSupported(item.mimeType)) || null
}

export default defineComponent({
  name: 'VideoUpscalePage',
  setup() {
    const message = useMessage()
    const fileInputRef = ref<HTMLInputElement | null>(null)
    const videoRef = ref<HTMLVideoElement | null>(null)
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const analysisCanvasRef = ref<HTMLCanvasElement | null>(null)
    const sourceUrl = ref('')
    const browserSourceFile = ref<File | null>(null)
    const outputUrl = ref('')
    const selectedMode = ref<UpscaleMode>('local-ai')
    const localUpscaleEngine = ref<LocalUpscaleEngine>('realesrgan')
    const localInputPath = ref('')
    const localOutputPath = ref('')
    const localAiBinaryPath = ref('')
    const localRuntime = ref<LocalVideoUpscaleRuntime | null>(null)
    const localTaskId = ref('')
    const cloudTaskId = ref('')
    const cloudDownloadUrl = ref('')
    const cloudDownloadFileName = ref('')
    const taskTimer = ref<ReturnType<typeof setInterval> | null>(null)
    const metadata = ref<VideoMetadata | null>(null)
    const status = ref<UpscaleStatus>('idle')
    const progress = ref(0)
    const frameRate = ref(30)
    const bitrate = ref(28)
    const recorderFormat = ref<RecorderFormat | null>(typeof MediaRecorder === 'undefined' ? null : getRecorderFormat())
    const enhancementPreset = ref<EnhancementPreset>('balanced')
    const enhancementSettings = ref<EnhancementSettings>({ ...enhancementPresets.balanced })
    const errorMessage = ref('')
    const recorder = ref<MediaRecorder | null>(null)
    const animationFrameId = ref<number | null>(null)

    const sourceResolution = computed(() => {
      const item = metadata.value
      return item ? `${item.width} × ${item.height}` : '待上传'
    })

    const sourceQuality = computed(() => {
      const item = metadata.value
      if (!item) return { label: '等待素材', type: 'default' as const }
      if (item.width === RECOMMENDED_SOURCE_WIDTH && item.height === RECOMMENDED_SOURCE_HEIGHT) {
        return { label: '标准 1080p', type: 'success' as const }
      }
      if (item.width < RECOMMENDED_SOURCE_WIDTH || item.height < RECOMMENDED_SOURCE_HEIGHT) {
        return { label: '低于 1080p', type: 'warning' as const }
      }
      return { label: '高于 1080p', type: 'info' as const }
    })

    const outputFileName = computed(() => {
      const name = metadata.value?.name.replace(/\.[^.]+$/, '') || 'starlight-upscale'
      return `${name}-4k-enhanced.${recorderFormat.value?.extension || 'video'}`
    })

    const recorderFormatLabel = computed(() => recorderFormat.value?.label || '当前环境暂不支持导出编码')
    const selectedModeTitle = computed(() => {
      if (selectedMode.value === 'local-ai')
        return localUpscaleEngine.value === 'ffmpeg' ? '本地 FFmpeg 快速增强' : '本地 AI 超分'
      if (selectedMode.value === 'cloud-ai') return '云端 GPU 超分'
      return '浏览器兜底增强'
    })

    const runtimeDescription = computed(() => {
      if (selectedMode.value === 'cloud-ai') return '上传到 GPU Worker 执行视频超分，适合大文件和最高质量。'
      if (selectedMode.value === 'browser-fallback') return '不依赖本地模型，只使用浏览器 Canvas 与 MediaRecorder。'
      if (localUpscaleEngine.value === 'ffmpeg')
        return '仅使用 FFmpeg Lanczos 缩放、降噪与锐化，速度优先，不依赖 Real-ESRGAN。'
      if (!localRuntime.value) return '等待检测本地 FFmpeg 与 Real-ESRGAN。'
      if (localRuntime.value.ffmpegAvailable && localRuntime.value.aiUpscalerAvailable) {
        return `已检测到本地 AI 引擎：${localRuntime.value.aiUpscalerPath || 'realesrgan-ncnn-vulkan'}`
      }
      if (localAiBinaryPath.value) return `已手动选择 AI 引擎：${localAiBinaryPath.value}`
      if (localRuntime.value.ffmpegAvailable) {
        return '已检测到 FFmpeg；未检测到 Real-ESRGAN，请点击“AI 引擎”手动选择解压后的可执行文件。'
      }
      return '未检测到 FFmpeg 与 Real-ESRGAN；请安装后点击重新检测，或手动选择 AI 引擎。'
    })

    const enhancementSummary = computed(
      () =>
        `锐化 ${enhancementSettings.value.sharpness}% · 清晰度 ${enhancementSettings.value.clarity}% · 降噪 ${enhancementSettings.value.denoise}%`
    )

    const releaseObjectUrl = (url: string) => {
      if (url) URL.revokeObjectURL(url)
    }

    const resetOutput = () => {
      releaseObjectUrl(outputUrl.value)
      outputUrl.value = ''
      progress.value = 0
      errorMessage.value = ''
      if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value)
        animationFrameId.value = null
      }
    }

    const clearTaskTimer = () => {
      if (taskTimer.value) {
        clearInterval(taskTimer.value)
        taskTimer.value = null
      }
    }

    const applyTaskStatus = (task: LocalVideoUpscaleTask | CloudVideoUpscaleTask) => {
      console.log(`${VIDEO_UPSCALE_LOG_PREFIX} task status`, task)
      progress.value = Math.max(0, Math.min(100, task.progress || 0))
      if (task.status === 'done') {
        status.value = 'done'
        clearTaskTimer()
        if ('outputPath' in task && task.outputPath) {
          localOutputPath.value = task.outputPath
        }
        if ('downloadUrl' in task && task.downloadUrl) {
          cloudDownloadUrl.value = task.downloadUrl
        }
        message.success(task.message || '4K AI 视频增强完成')
        return
      }

      if (task.status === 'error') {
        status.value = 'error'
        errorMessage.value = createVideoUpscaleErrorMessage(task.message || '视频增强任务失败')
        clearTaskTimer()
        return
      }

      status.value = 'processing'
      errorMessage.value = task.message || '视频增强任务处理中'
    }

    const handlePickFile = () => {
      if (selectedMode.value === 'local-ai') {
        chooseLocalInput()
        return
      }
      fileInputRef.value?.click()
    }

    const prepareBrowserFile = (file: File) => {
      resetOutput()
      releaseObjectUrl(sourceUrl.value)
      browserSourceFile.value = file
      localInputPath.value = ''
      localOutputPath.value = ''
      sourceUrl.value = URL.createObjectURL(file)
      if (selectedMode.value === 'local-ai') {
        selectedMode.value = 'browser-fallback'
        message.info('拖拽文件无法提供本地路径，已切换到浏览器增强模式')
      }
      status.value = 'idle'
      metadata.value = {
        name: file.name,
        size: file.size,
        duration: 0,
        width: 0,
        height: 0
      }

      const input = fileInputRef.value
      if (input) input.value = ''
    }

    const probeLocalRuntime = async () => {
      try {
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} probing local runtime`)
        localRuntime.value = await invoke<LocalVideoUpscaleRuntime>('probe_video_upscale_runtime')
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} local runtime`, localRuntime.value)
      } catch (error) {
        console.error(`${VIDEO_UPSCALE_LOG_PREFIX} probe local runtime failed`, error)
        localRuntime.value = null
      }
    }

    const chooseLocalInput = async () => {
      try {
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} opening local input picker`)
        const result = await open({
          multiple: false,
          filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi'] }]
        })
        if (typeof result === 'string') {
          console.log(`${VIDEO_UPSCALE_LOG_PREFIX} local input selected`, { inputPath: result })
          resetOutput()
          releaseObjectUrl(sourceUrl.value)
          sourceUrl.value = ''
          browserSourceFile.value = null
          localInputPath.value = result
          metadata.value = {
            name: result.split(/[\\/]/).pop() || result,
            size: 0,
            duration: 0,
            width: 0,
            height: 0
          }
          status.value = 'ready'
        }
      } catch (error) {
        console.error(`${VIDEO_UPSCALE_LOG_PREFIX} local input picker failed`, error)
        message.warning('当前环境无法打开本地文件选择器，请使用浏览器兜底模式')
      }
    }

    const chooseLocalOutput = async () => {
      try {
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} opening local output picker`, { defaultPath: outputFileName.value })
        const result = await save({
          defaultPath: outputFileName.value.replace(/\.webm$|\.video$/, '.mp4'),
          filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
        })
        if (typeof result === 'string') {
          console.log(`${VIDEO_UPSCALE_LOG_PREFIX} local output selected`, { outputPath: result })
          localOutputPath.value = result
        }
      } catch (error) {
        console.error(`${VIDEO_UPSCALE_LOG_PREFIX} local output picker failed`, error)
        message.warning('当前环境无法选择输出路径')
      }
    }

    const chooseLocalAiBinary = async () => {
      try {
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} opening AI binary picker`)
        const result = await open({
          multiple: false,
          filters: [{ name: 'Real-ESRGAN Engine', extensions: ['*'] }]
        })
        if (typeof result === 'string') {
          console.log(`${VIDEO_UPSCALE_LOG_PREFIX} AI binary selected`, { aiBinaryPath: result })
          localAiBinaryPath.value = result
          message.success('AI 引擎路径已选择')
          return result
        }
      } catch (error) {
        console.error(`${VIDEO_UPSCALE_LOG_PREFIX} AI binary picker failed`, error)
        message.warning('当前环境无法选择 AI 引擎文件')
      }
      return ''
    }

    const handleFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return

      prepareBrowserFile(file)
    }

    const handleDropFile = (event: DragEvent) => {
      event.preventDefault()
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      prepareBrowserFile(file)
    }

    const handleDragOverFile = (event: DragEvent) => {
      event.preventDefault()
    }

    const pollLocalTask = (id: string) => {
      clearTaskTimer()
      taskTimer.value = setInterval(async () => {
        try {
          console.log(`${VIDEO_UPSCALE_LOG_PREFIX} polling local task`, { id })
          const task = await invoke<LocalVideoUpscaleTask>('get_video_upscale_task_status', { id })
          applyTaskStatus(task)
        } catch (error) {
          console.error(`${VIDEO_UPSCALE_LOG_PREFIX} polling local task failed`, { id, error })
          status.value = 'error'
          errorMessage.value = '读取本地 AI 任务进度失败'
          clearTaskTimer()
        }
      }, 1200)
    }

    const pollCloudTask = (id: string) => {
      clearTaskTimer()
      taskTimer.value = setInterval(async () => {
        try {
          const task = await getCloudVideoUpscaleTask(id)
          applyTaskStatus(task)
          if (task.status === 'done') {
            const downloadData = await downloadCloudVideoUpscaleTask(id)
            cloudDownloadUrl.value = downloadData.dataUrl
            cloudDownloadFileName.value = downloadData.fileName
          }
        } catch (error) {
          status.value = 'error'
          errorMessage.value = '读取云端 GPU 任务进度失败'
          clearTaskTimer()
        }
      }, 1800)
    }

    const startLocalAiUpscale = async () => {
      if (!localInputPath.value) {
        message.warning('请先选择本地源视频文件')
        return
      }

      const useRealEsrgan = localUpscaleEngine.value === 'realesrgan'
      const hasDetectedAiEngine = Boolean(localRuntime.value?.aiUpscalerAvailable)
      if (useRealEsrgan && !hasDetectedAiEngine && !localAiBinaryPath.value) {
        message.warning('请先选择 realesrgan-ncnn-vulkan AI 引擎文件')
        const selected = await chooseLocalAiBinary()
        if (!selected) return
      }

      if (!localOutputPath.value) {
        await chooseLocalOutput()
        if (!localOutputPath.value) return
      }

      resetOutput()
      status.value = 'processing'
      progress.value = 0
      try {
        const request = {
          inputPath: localInputPath.value,
          outputPath: localOutputPath.value,
          model: 'realesrgan-x4plus',
          scale: 4,
          engine: localUpscaleEngine.value,
          aiBinaryPath: localAiBinaryPath.value || undefined
        }
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} starting local AI upscale`, {
          ...request,
          runtime: localRuntime.value
        })
        const task = await invoke<LocalVideoUpscaleTask>('start_video_upscale_local', {
          request
        })
        console.log(`${VIDEO_UPSCALE_LOG_PREFIX} local AI task created`, task)
        localTaskId.value = task.id
        applyTaskStatus(task)
        pollLocalTask(task.id)
      } catch (error) {
        console.error(`${VIDEO_UPSCALE_LOG_PREFIX} start local AI upscale failed`, error)
        status.value = 'error'
        errorMessage.value = error instanceof Error ? error.message : String(error)
      }
    }

    const startCloudAiUpscale = async () => {
      const input = fileInputRef.value
      const file = browserSourceFile.value || input?.files?.[0]
      if (!file) {
        message.warning('请先选择要上传到 GPU Worker 的视频')
        handlePickFile()
        return
      }

      resetOutput()
      cloudDownloadUrl.value = ''
      cloudDownloadFileName.value = ''
      status.value = 'processing'
      progress.value = 0
      try {
        const task = await createCloudVideoUpscaleTask(file, 'rvrt-4x')
        cloudTaskId.value = task.id
        applyTaskStatus(task)
        pollCloudTask(task.id)
      } catch (error) {
        status.value = 'error'
        errorMessage.value = '云端 GPU Worker 暂不可用，请稍后重试或使用本地 AI 模式。'
      }
    }

    const handleMetadataLoaded = () => {
      const video = videoRef.value
      const item = metadata.value
      if (!video || !item) return

      metadata.value = {
        ...item,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      }
      status.value = 'ready'
      message.success('视频信息已读取，可以开始 4K 升级')
    }

    const applyPreset = (preset: EnhancementPreset) => {
      enhancementPreset.value = preset
      enhancementSettings.value = { ...enhancementPresets[preset] }
    }

    const setEnhancementSetting = (key: keyof EnhancementSettings, value: number) => {
      enhancementSettings.value = {
        ...enhancementSettings.value,
        [key]: value
      }
    }

    const drawEnhancedFrame = (
      context: CanvasRenderingContext2D,
      video: HTMLVideoElement,
      drawX: number,
      drawY: number,
      drawWidth: number,
      drawHeight: number
    ) => {
      const analysisCanvas = analysisCanvasRef.value
      const analysisContext = analysisCanvas?.getContext('2d', { willReadFrequently: true })
      if (!analysisCanvas || !analysisContext) {
        context.drawImage(video, drawX, drawY, drawWidth, drawHeight)
        return
      }

      analysisContext.imageSmoothingEnabled = true
      analysisContext.imageSmoothingQuality = 'high'
      analysisContext.drawImage(video, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)

      const imageData = analysisContext.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)
      enhanceFramePixels(imageData, enhancementSettings.value)
      analysisContext.putImageData(imageData, 0, 0)
      context.drawImage(analysisCanvas, drawX, drawY, drawWidth, drawHeight)
    }

    const drawFrame = () => {
      const video = videoRef.value
      const canvas = canvasRef.value
      const context = canvas?.getContext('2d')
      if (!video || !canvas || !context || status.value !== 'processing') return

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.fillStyle = '#000'
      context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)

      const sourceRatio = video.videoWidth / video.videoHeight
      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT
      const drawWidth = sourceRatio > targetRatio ? TARGET_WIDTH : TARGET_HEIGHT * sourceRatio
      const drawHeight = sourceRatio > targetRatio ? TARGET_WIDTH / sourceRatio : TARGET_HEIGHT
      const drawX = (TARGET_WIDTH - drawWidth) / 2
      const drawY = (TARGET_HEIGHT - drawHeight) / 2

      drawEnhancedFrame(context, video, drawX, drawY, drawWidth, drawHeight)

      if (Number.isFinite(video.duration) && video.duration > 0) {
        progress.value = Math.min(99, Math.round((video.currentTime / video.duration) * 100))
      }

      animationFrameId.value = requestAnimationFrame(drawFrame)
    }

    const createAudioStream = () => {
      const video = videoRef.value as CapturableMediaElement | null
      const capture = video?.captureStream || video?.mozCaptureStream
      return capture ? capture.call(video) : null
    }

    const startUpscale = async () => {
      if (selectedMode.value === 'local-ai') {
        await startLocalAiUpscale()
        return
      }

      if (selectedMode.value === 'cloud-ai') {
        await startCloudAiUpscale()
        return
      }

      const video = videoRef.value
      const canvas = canvasRef.value
      if (!video || !canvas || !metadata.value) return

      if (!window.MediaRecorder) {
        status.value = 'error'
        errorMessage.value = '当前运行环境不支持 MediaRecorder，无法在客户端导出视频。'
        return
      }

      const format = getRecorderFormat()
      recorderFormat.value = format
      if (!format) {
        status.value = 'error'
        errorMessage.value =
          '当前运行环境没有可用的视频编码器，请换用支持 MediaRecorder 视频编码的浏览器或桌面运行环境。'
        return
      }

      resetOutput()
      status.value = 'processing'
      canvas.width = TARGET_WIDTH
      canvas.height = TARGET_HEIGHT
      video.currentTime = 0
      video.muted = false

      const canvasStream = canvas.captureStream(frameRate.value)
      const audioStream = createAudioStream()
      audioStream?.getAudioTracks().forEach((track) => canvasStream.addTrack(track))
      const chunks: BlobPart[] = []

      recorder.value = new MediaRecorder(canvasStream, {
        mimeType: format.mimeType,
        videoBitsPerSecond: bitrate.value * 1000 * 1000
      })

      recorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.value.onerror = () => {
        status.value = 'error'
        errorMessage.value = '视频编码过程中断，请降低帧率或码率后重试。'
      }

      recorder.value.onstop = () => {
        canvasStream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunks, { type: format.mimeType })
        outputUrl.value = URL.createObjectURL(blob)
        progress.value = 100
        status.value = 'done'
        message.success(`4K ${format.label} 视频已生成`)
      }

      video.onended = () => {
        recorder.value?.stop()
        if (animationFrameId.value !== null) {
          cancelAnimationFrame(animationFrameId.value)
          animationFrameId.value = null
        }
      }

      recorder.value.start(1000)
      drawFrame()
      await video.play()
    }

    const stopUpscale = () => {
      clearTaskTimer()
      videoRef.value?.pause()
      recorder.value?.stop()
      if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value)
        animationFrameId.value = null
      }
    }

    onBeforeUnmount(() => {
      stopUpscale()
      releaseObjectUrl(sourceUrl.value)
      releaseObjectUrl(outputUrl.value)
    })

    probeLocalRuntime()

    return () => (
      <div class="video-upscale-page">
        <PageHeader title="4K 视频增强" subtitle="在客户端将 1080p 素材放大并导出为 3840 × 2160 视频。" />

        <section class="video-upscale-page__hero">
          <div class="video-upscale-page__hero-copy">
            <span class="video-upscale-page__eyebrow">Client Render Pipeline</span>
            <h2>上传 1080p 视频，生成一份增强后的 4K 输出文件。</h2>
            <p>
              页面在本机执行高质量采样、邻域降噪、反锐化细节增强、局部清晰度与色彩校正，再通过 MediaRecorder
              导出，不上传素材也不调用服务端。
            </p>
            <NSpace>
              <NButton
                type="primary"
                onClick={selectedMode.value === 'local-ai' ? chooseLocalInput : handlePickFile}
                disabled={status.value === 'processing'}>
                {selectedMode.value === 'local-ai' ? '选择本地视频' : '选择视频'}
              </NButton>
              <NButton onClick={startUpscale} disabled={status.value === 'processing'}>
                开始 AI 4K 增强
              </NButton>
              <NButton onClick={stopUpscale} disabled={status.value !== 'processing'}>
                停止处理
              </NButton>
            </NSpace>
          </div>
          <div class="video-upscale-page__target-card">
            <span>目标输出</span>
            <strong>3840 × 2160</strong>
            <small>
              {recorderFormatLabel.value} / {frameRate.value} FPS / {bitrate.value} Mbps
            </small>
            <em>{enhancementSummary.value}</em>
          </div>
        </section>

        <section class="video-upscale-page__mode-grid">
          {(['local-ai', 'cloud-ai', 'browser-fallback'] as UpscaleMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              class={[
                'video-upscale-page__mode-card',
                selectedMode.value === mode ? 'video-upscale-page__mode-card--active' : ''
              ]}
              disabled={status.value === 'processing'}
              onClick={() => {
                selectedMode.value = mode
                status.value = metadata.value || localInputPath.value || browserSourceFile.value ? 'ready' : 'idle'
                resetOutput()
              }}>
              <span>{mode === 'local-ai' ? '默认' : mode === 'cloud-ai' ? '最高质量' : '兜底'}</span>
              <strong>
                {mode === 'local-ai' ? '本地 AI 超分' : mode === 'cloud-ai' ? '云端 GPU Worker' : '浏览器增强'}
              </strong>
              <small>
                {mode === 'local-ai'
                  ? 'Tauri 调用本地引擎，可选 Real-ESRGAN 质量优先或 FFmpeg 快速处理。'
                  : mode === 'cloud-ai'
                    ? '提交到服务端 GPU Worker，适合最强模型。'
                    : '使用 Canvas/ImageData/MediaRecorder 快速导出。'}
              </small>
            </button>
          ))}
        </section>

        <input
          ref={fileInputRef}
          class="video-upscale-page__file-input"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
        />

        <section class="video-upscale-page__workspace">
          <NCard bordered={false} class="video-upscale-page__preview-card" title="素材预览">
            {sourceUrl.value ? (
              <video
                ref={videoRef}
                class="video-upscale-page__video"
                src={sourceUrl.value}
                controls={status.value !== 'processing'}
                playsinline
                onLoadedmetadata={handleMetadataLoaded}
              />
            ) : (
              <button
                class="video-upscale-page__drop-zone"
                type="button"
                onClick={handlePickFile}
                onDrop={handleDropFile}
                onDragover={handleDragOverFile}>
                <strong>{selectedMode.value === 'local-ai' ? '选择本地 1080p 视频' : '拖入或选择 1080p 视频'}</strong>
                <span>
                  {selectedMode.value === 'local-ai'
                    ? '本地 AI 超分需要真实文件路径，请点击这里打开系统文件选择器。'
                    : '支持浏览器可解码的视频格式，推荐 MP4 / H.264 源文件。'}
                </span>
              </button>
            )}
          </NCard>

          <aside class="video-upscale-page__side-panel">
            <NCard bordered={false} class="video-upscale-page__info-card" title="增强方案">
              <div class="video-upscale-page__info-list">
                <div>
                  <span>当前模式</span>
                  <strong>{selectedModeTitle.value}</strong>
                </div>
                <div>
                  <span>运行状态</span>
                  <strong>{runtimeDescription.value}</strong>
                </div>
                {selectedMode.value === 'local-ai' ? (
                  <div class="video-upscale-page__engine-section">
                    <span>处理引擎</span>
                    <div class="video-upscale-page__engine-grid">
                      {(['realesrgan', 'ffmpeg'] as LocalUpscaleEngine[]).map((engine) => (
                        <button
                          key={engine}
                          type="button"
                          class={[
                            'video-upscale-page__engine-card',
                            localUpscaleEngine.value === engine ? 'video-upscale-page__engine-card--active' : ''
                          ]}
                          disabled={status.value === 'processing'}
                          onClick={() => {
                            localUpscaleEngine.value = engine
                            resetOutput()
                          }}>
                          <strong>{engine === 'realesrgan' ? 'Real-ESRGAN' : 'FFmpeg 快速'}</strong>
                          <small>
                            {engine === 'realesrgan'
                              ? '质量优先，逐帧 AI 超分，速度较慢。'
                              : '速度优先，Lanczos 缩放 + 降噪锐化。'}
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedMode.value === 'local-ai' ? (
                  <div>
                    <span>输出路径</span>
                    <NButton
                      size="small"
                      secondary
                      onClick={chooseLocalOutput}
                      disabled={status.value === 'processing'}>
                      {localOutputPath.value ? '重新选择' : '选择'}
                    </NButton>
                  </div>
                ) : null}
                {selectedMode.value === 'local-ai' && localUpscaleEngine.value === 'realesrgan' ? (
                  <div>
                    <span>AI 引擎</span>
                    <NSpace size={8}>
                      <NButton
                        size="small"
                        secondary
                        onClick={chooseLocalAiBinary}
                        disabled={status.value === 'processing'}>
                        {localAiBinaryPath.value ? '重新选择' : '选择'}
                      </NButton>
                      <NButton
                        size="small"
                        tertiary
                        onClick={probeLocalRuntime}
                        disabled={status.value === 'processing'}>
                        重新检测
                      </NButton>
                    </NSpace>
                  </div>
                ) : null}
              </div>
            </NCard>

            <NCard bordered={false} class="video-upscale-page__info-card" title="视频信息">
              <div class="video-upscale-page__info-list">
                <div>
                  <span>文件名</span>
                  <strong>{metadata.value?.name || '尚未选择'}</strong>
                </div>
                <div>
                  <span>源分辨率</span>
                  <strong>{sourceResolution.value}</strong>
                </div>
                <div>
                  <span>时长 / 大小</span>
                  <strong>
                    {metadata.value
                      ? `${formatDuration(metadata.value.duration)} / ${formatFileSize(metadata.value.size)}`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>源质量判断</span>
                  <NTag bordered={false} type={sourceQuality.value.type}>
                    {sourceQuality.value.label}
                  </NTag>
                </div>
              </div>
            </NCard>

            <NCard bordered={false} class="video-upscale-page__info-card" title="编码参数">
              <div class="video-upscale-page__slider-row">
                <span>帧率</span>
                <NSlider
                  v-model:value={frameRate.value}
                  min={24}
                  max={60}
                  step={6}
                  disabled={status.value === 'processing'}
                />
                <strong>{frameRate.value} FPS</strong>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>码率</span>
                <NSlider
                  v-model:value={bitrate.value}
                  min={12}
                  max={60}
                  step={2}
                  disabled={status.value === 'processing'}
                />
                <strong>{bitrate.value} Mbps</strong>
              </div>
            </NCard>

            <NCard bordered={false} class="video-upscale-page__info-card" title="画质增强">
              <div class="video-upscale-page__preset-row">
                <NButton
                  size="small"
                  type={enhancementPreset.value === 'balanced' ? 'primary' : 'default'}
                  secondary={enhancementPreset.value !== 'balanced'}
                  disabled={status.value === 'processing'}
                  onClick={() => applyPreset('balanced')}>
                  均衡
                </NButton>
                <NButton
                  size="small"
                  type={enhancementPreset.value === 'cinema' ? 'primary' : 'default'}
                  secondary={enhancementPreset.value !== 'cinema'}
                  disabled={status.value === 'processing'}
                  onClick={() => applyPreset('cinema')}>
                  影院
                </NButton>
                <NButton
                  size="small"
                  type={enhancementPreset.value === 'detail' ? 'primary' : 'default'}
                  secondary={enhancementPreset.value !== 'detail'}
                  disabled={status.value === 'processing'}
                  onClick={() => applyPreset('detail')}>
                  细节
                </NButton>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>锐化</span>
                <NSlider
                  value={enhancementSettings.value.sharpness}
                  min={0}
                  max={80}
                  step={2}
                  disabled={status.value === 'processing'}
                  onUpdateValue={(value: number) => setEnhancementSetting('sharpness', value)}
                />
                <strong>{enhancementSettings.value.sharpness}%</strong>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>清晰</span>
                <NSlider
                  value={enhancementSettings.value.clarity}
                  min={0}
                  max={60}
                  step={2}
                  disabled={status.value === 'processing'}
                  onUpdateValue={(value: number) => setEnhancementSetting('clarity', value)}
                />
                <strong>{enhancementSettings.value.clarity}%</strong>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>降噪</span>
                <NSlider
                  value={enhancementSettings.value.denoise}
                  min={0}
                  max={50}
                  step={2}
                  disabled={status.value === 'processing'}
                  onUpdateValue={(value: number) => setEnhancementSetting('denoise', value)}
                />
                <strong>{enhancementSettings.value.denoise}%</strong>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>饱和</span>
                <NSlider
                  value={enhancementSettings.value.saturation}
                  min={-20}
                  max={30}
                  step={2}
                  disabled={status.value === 'processing'}
                  onUpdateValue={(value: number) => setEnhancementSetting('saturation', value)}
                />
                <strong>{enhancementSettings.value.saturation}%</strong>
              </div>
              <div class="video-upscale-page__slider-row">
                <span>对比</span>
                <NSlider
                  value={enhancementSettings.value.contrast}
                  min={-10}
                  max={30}
                  step={2}
                  disabled={status.value === 'processing'}
                  onUpdateValue={(value: number) => setEnhancementSetting('contrast', value)}
                />
                <strong>{enhancementSettings.value.contrast}%</strong>
              </div>
              <p class="video-upscale-page__algorithm-note">
                算法链路：1080p 采样 → 像素邻域降噪 → 反锐化细节增强 → 饱和度/对比度校正 → 4K 重采样编码。
              </p>
            </NCard>

            <NCard bordered={false} class="video-upscale-page__info-card" title="处理进度">
              <NProgress
                type="line"
                percentage={progress.value}
                status={status.value === 'error' ? 'error' : 'success'}
              />
              <p class="video-upscale-page__status-text">
                {status.value === 'processing'
                  ? '正在逐帧增强、放大并编码，请保持页面打开。'
                  : status.value === 'done'
                    ? '处理完成，可以下载 4K 视频。'
                    : status.value === 'error'
                      ? errorMessage.value
                      : '选择视频后开始处理。'}
              </p>
              {localOutputPath.value && status.value === 'done' ? (
                <NButton block type="primary" onClick={() => openPath(localOutputPath.value)}>
                  打开本地 4K 视频
                </NButton>
              ) : null}
              {cloudDownloadUrl.value && status.value === 'done' ? (
                <a
                  class="video-upscale-page__download"
                  href={cloudDownloadUrl.value}
                  download={cloudDownloadFileName.value || true}>
                  下载云端 4K 视频
                </a>
              ) : null}
              {outputUrl.value ? (
                <a class="video-upscale-page__download" href={outputUrl.value} download={outputFileName.value}>
                  下载增强 4K 视频
                </a>
              ) : null}
            </NCard>
          </aside>
        </section>

        <canvas ref={canvasRef} class="video-upscale-page__render-canvas" width={TARGET_WIDTH} height={TARGET_HEIGHT} />
        <canvas
          ref={analysisCanvasRef}
          class="video-upscale-page__render-canvas"
          width={ANALYSIS_WIDTH}
          height={ANALYSIS_HEIGHT}
        />
      </div>
    )
  }
})
