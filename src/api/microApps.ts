import request from '@/services/request'
import url from './url'

export type MicroAppVisibility = 'public' | 'tenant' | 'allowlist'

export type MicroAppManifest = {
  appId: string
  name: string
  version: string
  entry: string
  description?: string
  icon?: string
  iconFileId?: string
  permissions?: Record<string, unknown>
}

export type MicroAppVersion = {
  appId: string
  version: string
  manifest: MicroAppManifest
  packageSha256: string
  packageSize: number
  status: 'uploaded' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'deprecated'
  reviewReason?: string
  reviewerUserId?: string
  reviewedAt?: string
  publishedAt?: string
  packageBase64?: string
  scanReport?: {
    passed: boolean
    scannedAt: string
    fileCount: number
    issues: Array<{ level: 'error' | 'warning'; file: string; message: string }>
  } | null
}

export type MicroAppItem = {
  appId: string
  name: string
  description?: string
  ownerUserId: string
  tenantId?: string
  visibility: MicroAppVisibility
  status: 'active' | 'disabled'
  allowedUsers: string[]
  rolloutUsers: string[]
  rolloutTenants?: string[]
  rolloutPercent?: number
  releaseChannel?: 'stable' | 'beta' | 'dev'
  latestPublished?: MicroAppVersion | null
  versions?: MicroAppVersion[]
}

export const uploadMicroApp = (data: {
  manifest: MicroAppManifest
  packageBase64: string
  visibility: MicroAppVisibility
  allowedUsers?: string[]
  rolloutUsers?: string[]
  rolloutTenants?: string[]
  rolloutPercent?: number
  releaseChannel?: 'stable' | 'beta' | 'dev'
}) => request.post(url.microAppUpload, data)

export const uploadMicroAppChunk = (data: { uploadId: string; index: number; total: number; chunkBase64: string }) =>
  request.post(url.microAppUploadChunk, data)

export const completeMicroAppUpload = (data: {
  uploadId: string
  visibility: MicroAppVisibility
  allowedUsers?: string[]
  rolloutUsers?: string[]
  rolloutTenants?: string[]
  rolloutPercent?: number
  releaseChannel?: 'stable' | 'beta' | 'dev'
}) => request.post(url.microAppCompleteUpload, data)

export const getMicroApps = () => request.get<MicroAppItem[]>(url.microAppList, {})

export const reviewMicroApp = (data: {
  appId: string
  version: string
  decision: 'approved' | 'rejected'
  reason?: string
}) => request.post(url.microAppReview, data)

export const publishMicroApp = (data: { appId: string; version: string }) => request.post(url.microAppPublish, data)

export const rollbackMicroApp = (data: { appId: string; targetVersion?: string }) =>
  request.post(url.microAppRollback, data)

export const updateMicroAppAccess = (data: {
  appId: string
  visibility: MicroAppVisibility
  allowedUsers: string[]
  rolloutUsers: string[]
  rolloutTenants?: string[]
  rolloutPercent?: number
  releaseChannel?: 'stable' | 'beta' | 'dev'
}) => request.post(url.microAppUpdateAccess, data)

export const downloadMicroApp = (data: { appId: string; version?: string }) =>
  request.post<MicroAppVersion>(url.microAppDownload, data)

export const getMicroAppRuntimeTicket = (data: { appId: string; version?: string }) =>
  request.post(url.microAppRuntimeTicket, data)

export const exchangeMicroAppSession = (data: { ticket: string }) => request.post(url.microAppExchangeSession, data)

export const callMicroAppScopedApi = (data: {
  sessionToken: string
  scope: string
  payload?: Record<string, unknown>
}) => request.post(url.microAppScopedApi, data)

export const getMicroAppAuditLogs = (appId?: string) => request.get(url.microAppAuditLogs, { appId })

export const getMicroAppInstalls = (appId?: string) => request.get(url.microAppInstalls, { appId })
