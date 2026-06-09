import request from '@/services/request'
import url from './url'

export type CloudVideoUpscaleTaskStatus = 'queued' | 'running' | 'done' | 'error'

export interface CloudVideoUpscaleTask {
  id: string
  status: CloudVideoUpscaleTaskStatus
  progress: number
  message?: string
  downloadUrl?: string
}

export interface CloudVideoDownloadData {
  dataUrl: string
  fileName: string
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export const createCloudVideoUpscaleTask = async (file: File, model: string) => {
  const fileBase64 = await fileToBase64(file)

  return request.postWithOptions<CloudVideoUpscaleTask>(
    url.videoUpscaleTasks,
    {
      fileName: file.name,
      fileBase64,
      model,
      targetResolution: '4k'
    },
    {
      noRetry: true,
      suppressErrorLog: true
    }
  )
}

export const getCloudVideoUpscaleTask = (id: string) => {
  return request.get<CloudVideoUpscaleTask>(url.videoUpscaleTask(id), {}, undefined, true)
}

export const downloadCloudVideoUpscaleTask = (id: string) => {
  return request.get<CloudVideoDownloadData>(url.videoUpscaleDownload, { id }, undefined, true)
}
