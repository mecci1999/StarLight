// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorType } from '@/common/exception'

const requestQueueState = {
  enqueue: vi.fn(),
  processQueue: vi.fn(),
  clear: vi.fn()
}

vi.mock('@/utils/RequestQueue', () => ({
  RequestQueue: vi.fn(() => requestQueueState)
}))

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  WebviewWindow: {
    getCurrent: vi.fn(() => ({ label: 'StarLight' }))
  }
}))

vi.mock('@/api/url', () => ({
  default: {
    refreshToken: 'http://127.0.0.1:6670/api/auth/v1/refreshToken'
  }
}))

const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value))
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  })
}

const createJwt = (expiresInMs: number) => {
  const payload = { exp: Math.floor((Date.now() + expiresInMs) / 1000) }
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `header.${encodedPayload}.signature`
}

describe('Http auth refresh', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    storage.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    document.cookie = 'ACCESS_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    document.cookie = 'REFRESH_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes before protected requests when the access token is near expiry', async () => {
    storage.set('ACCESS_TOKEN', createJwt(60 * 1000))
    storage.set('REFRESH_TOKEN', 'refresh-1')

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          status: 200,
          data: {
            content: {
              accessToken: 'new-access',
              refreshToken: 'refresh-1'
            },
            success: true,
            code: 200
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ status: 200, data: { content: { ok: true }, success: true, code: 200 } })
      } as Response)

    const { default: Http } = await import('../http')
    await Http('http://127.0.0.1:6670/api/metrics/v1/layout', { method: 'GET' })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:6670/api/auth/v1/refreshToken',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-1' }),
        credentials: 'include'
      })
    )
    const refreshRequest = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((refreshRequest.headers as Record<string, string>).Cookie).toBeUndefined()
    const retriedRequest = vi.mocked(fetch).mock.calls[1][1] as RequestInit
    expect((retriedRequest.headers as Headers).get('Authorization')).toBe('Bearer new-access')
  })

  it('still calls refresh endpoint when refresh token is only available as an HttpOnly cookie', async () => {
    storage.set('ACCESS_TOKEN', createJwt(-60 * 1000))

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          status: 200,
          data: {
            content: {
              accessToken: 'cookie-refresh-access',
              refreshToken: 'cookie-refresh-token'
            },
            success: true,
            code: 200
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ status: 200, data: { content: { ok: true }, success: true, code: 200 } })
      } as Response)

    const { default: Http } = await import('../http')
    await Http('http://127.0.0.1:6670/api/metrics/v1/layout', { method: 'GET' })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:6670/api/auth/v1/refreshToken',
      expect.objectContaining({
        method: 'POST',
        body: undefined,
        credentials: 'include'
      })
    )
  })

  it('keeps text/plain 500 responses as server errors instead of network errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      text: async () => '',
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input')
      }
    } as unknown as Response)

    const { default: Http } = await import('../http')

    await expect(
      Http('/api/auth/v1/verifyCode', {
        method: 'POST',
        body: { email: 'demo@example.com', type: 'login' },
        noRetry: true,
        suppressErrorLog: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Server,
      code: 500,
      message: '服务端暂不可用，请确认后端网关已启动'
    })
  })

  it('preserves the three-day session when refresh returns a server error', async () => {
    storage.set('REFRESH_TOKEN', 'refresh-1')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ status: 500, data: { message: 'temporary outage', success: false, code: 500 } })
    } as Response)

    const { restoreAuthSession } = await import('../http')

    await expect(restoreAuthSession()).resolves.toBe(false)
    expect(storage.get('REFRESH_TOKEN')).toBe('refresh-1')
    expect(window.dispatchEvent).not.toHaveBeenCalled()
  })

  it('does not clear the session when a retried protected request remains unauthorized', async () => {
    storage.set('ACCESS_TOKEN', createJwt(60 * 60 * 1000))
    storage.set('REFRESH_TOKEN', 'refresh-1')
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ status: 401, data: { message: 'endpoint denied', success: false, code: 40001 } })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          status: 200,
          data: { content: { accessToken: 'new-access', refreshToken: 'refresh-1' }, success: true, code: 200 }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ status: 401, data: { message: 'endpoint denied', success: false, code: 40001 } })
      } as Response)

    const { default: Http } = await import('../http')

    await expect(Http('http://127.0.0.1:6670/api/metrics/v1/layout', { method: 'GET' })).rejects.toMatchObject({
      message: '当前请求未获授权，请稍后重试'
    })
    expect(storage.get('REFRESH_TOKEN')).toBe('refresh-1')
    expect(window.dispatchEvent).not.toHaveBeenCalled()
  })
})
