import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveUploadedFileUrl, uploadFile } from '../file'

const requestMock = vi.hoisted(() => ({
  post: vi.fn()
}))

vi.mock('@/services/request', () => ({
  default: requestMock
}))

vi.mock('../url', () => ({
  default: {
    fileUpload: '/api/file/v1/uploadFile'
  }
}))

describe('file api', () => {
  beforeEach(() => {
    requestMock.post.mockReset()
  })

  it('maps user avatar uploads to the backend file service contract', async () => {
    requestMock.post.mockResolvedValue({ fileId: 'file-1', url: '/uploads/avatar.webp' })

    await uploadFile({
      scene: 'user-avatar',
      bizType: 'user',
      bizId: 'user-1',
      fileName: 'avatar.png',
      mimeType: 'image/png',
      fileBase64: 'base64-content',
      metadata: { width: 256, height: 256 }
    })

    expect(requestMock.post).toHaveBeenCalledWith('/api/file/v1/uploadFile', {
      file: 'base64-content',
      filename: 'avatar.png',
      mimetype: 'image/png',
      category: 'avatar',
      userId: 'user-1',
      metadata: {
        width: 256,
        height: 256,
        scene: 'user-avatar',
        bizType: 'user',
        bizId: 'user-1'
      }
    })
  })

  it('resolves whichever file URL field the service returns', () => {
    expect(resolveUploadedFileUrl({ url: '/url.png' }, 'https://starlight.example.com')).toBe(
      'https://starlight.example.com/url.png'
    )
    expect(resolveUploadedFileUrl({ fileUrl: '/file-url.png' })).toBe('/file-url.png')
    expect(resolveUploadedFileUrl({ path: '/path.png' })).toBe('/path.png')
    expect(resolveUploadedFileUrl({ objectKey: 'object-key.png' })).toBe('object-key.png')
    expect(resolveUploadedFileUrl({ url: 'https://cdn.example.com/avatar.png' }, 'https://starlight.example.com')).toBe(
      'https://cdn.example.com/avatar.png'
    )
  })
})
