import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MICRO_APP_UPLOAD_CHUNK_BASE64_SIZE, uploadMicroAppPackage } from '../microApps'

const requestMock = vi.hoisted(() => ({
  post: vi.fn(),
  postWithOptions: vi.fn()
}))

vi.mock('@/services/request', () => ({
  default: requestMock
}))

vi.mock('../url', () => ({
  default: {
    microAppUpload: '/api/micro-app/v1/upload',
    microAppUploadChunk: '/api/micro-app/v1/uploadChunk',
    microAppCompleteUpload: '/api/micro-app/v1/completeUpload'
  }
}))

const payload = (packageBase64: string) => ({
  manifest: {
    appId: 'starlight-trails-workspace',
    name: 'StarLight Trails',
    version: '1.0.3',
    entry: 'index.html'
  },
  packageBase64,
  visibility: 'tenant' as const,
  rolloutPercent: 100,
  releaseChannel: 'stable' as const
})

describe('micro app package upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requestMock.post.mockResolvedValue({})
    requestMock.postWithOptions.mockResolvedValue({})
  })

  it('sends a small package through the direct upload endpoint', async () => {
    const input = payload('package')

    await uploadMicroAppPackage(input)

    expect(requestMock.post).toHaveBeenCalledWith('/api/micro-app/v1/upload', input)
    expect(requestMock.postWithOptions).not.toHaveBeenCalled()
  })

  it('uploads larger packages in ordered chunks before completing the upload', async () => {
    const packageBase64 = 'a'.repeat(MICRO_APP_UPLOAD_CHUNK_BASE64_SIZE * 2 + 9)

    await uploadMicroAppPackage(payload(packageBase64))

    expect(requestMock.postWithOptions).toHaveBeenCalledTimes(3)
    expect(requestMock.postWithOptions).toHaveBeenNthCalledWith(
      1,
      '/api/micro-app/v1/uploadChunk',
      expect.objectContaining({
        index: 0,
        total: 3,
        manifest: payload(packageBase64).manifest,
        chunkBase64: packageBase64.slice(0, MICRO_APP_UPLOAD_CHUNK_BASE64_SIZE)
      }),
      { suppressSuccessMessage: true, noRetry: true }
    )
    expect(requestMock.postWithOptions).toHaveBeenNthCalledWith(
      3,
      '/api/micro-app/v1/uploadChunk',
      expect.objectContaining({
        index: 2,
        total: 3,
        chunkBase64: packageBase64.slice(MICRO_APP_UPLOAD_CHUNK_BASE64_SIZE * 2)
      }),
      { suppressSuccessMessage: true, noRetry: true }
    )
    expect(requestMock.post).toHaveBeenCalledWith('/api/micro-app/v1/completeUpload', {
      uploadId: expect.stringMatching(/^starlight-trails-workspace-1\.0\.3-/),
      visibility: 'tenant',
      allowedUsers: undefined,
      rolloutUsers: undefined,
      rolloutTenants: undefined,
      rolloutPercent: 100,
      releaseChannel: 'stable'
    })
  })
})
