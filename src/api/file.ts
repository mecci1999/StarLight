import request from '@/services/request'
import url from './url'

export type FileUploadScene = 'micro-app-icon' | 'user-avatar' | 'general'

const uploadSceneCategory: Record<FileUploadScene, 'avatar' | 'general'> = {
  'user-avatar': 'avatar',
  'micro-app-icon': 'general',
  general: 'general'
}

export type FileUploadResult = {
  fileId?: string
  url?: string
  fileUrl?: string
  path?: string
  objectKey?: string
  name?: string
  size?: number
  mimeType?: string
}

const isExternalUrl = (value: string) =>
  /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('blob:')

const resolveClientAssetUrl = (value: string, serviceBaseUrl = import.meta.env.VITE_SERVICE_URL || '') => {
  if (!value || isExternalUrl(value)) return value
  if (!serviceBaseUrl) return value
  return new URL(value.startsWith('/') ? value : `/${value}`, serviceBaseUrl).toString()
}

export const uploadFile = (data: {
  scene: FileUploadScene
  fileName: string
  mimeType: string
  fileBase64: string
  bizType?: string
  bizId?: string
  metadata?: Record<string, unknown>
}) =>
  request.post<FileUploadResult>(url.fileUpload, {
    file: data.fileBase64,
    filename: data.fileName,
    mimetype: data.mimeType,
    category: uploadSceneCategory[data.scene],
    userId: data.bizId,
    metadata: {
      ...data.metadata,
      scene: data.scene,
      bizType: data.bizType,
      bizId: data.bizId
    }
  })

export const resolveUploadedFileUrl = (file: FileUploadResult, serviceBaseUrl?: string) => {
  const rawUrl = file.url || file.fileUrl || file.path || file.objectKey || ''
  const resolvedUrl = resolveClientAssetUrl(rawUrl, serviceBaseUrl)
  if (import.meta.env.DEV) {
    console.info('[AvatarSync][api:file:resolveUploadedFileUrl]', {
      file,
      rawUrl,
      resolvedUrl,
      serviceBaseUrl: serviceBaseUrl || import.meta.env.VITE_SERVICE_URL || ''
    })
  }
  return resolvedUrl
}
