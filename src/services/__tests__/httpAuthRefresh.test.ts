// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorType } from '@/common/exception'

const requestQueueState = {
  enqueue: vi.fn(),
  processQueue: vi.fn(),
  clear: vi.fn()
}

const tauriRuntimeState = {
  isTauri: vi.fn(() => false),
  platform: vi.fn(() => 'macos'),
  fetch: vi.fn(),
  invoke: vi.fn()
}

vi.mock('@/utils/RequestQueue', () => ({
  RequestQueue: vi.fn(() => requestQueueState)
}))

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  WebviewWindow: {
    getCurrent: vi.fn(() => ({ label: 'StarLight' }))
  }
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: tauriRuntimeState.invoke,
  isTauri: tauriRuntimeState.isTauri
}))

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: tauriRuntimeState.platform
}))

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: tauriRuntimeState.fetch
}))

vi.mock('@/api/url', () => ({
  default: {
    emailVerifyCode: 'https://api.starlight.host/api/auth/v1/verifyCode',
    login: 'https://api.starlight.host/api/auth/v1/login',
    scanQRcode: 'https://api.starlight.host/api/auth/v1/qrcode/scan',
    confirmQRcode: 'https://api.starlight.host/api/auth/v1/qrcode/confirm',
    cancelQRcode: 'https://api.starlight.host/api/auth/v1/qrcode/cancel',
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
    tauriRuntimeState.isTauri.mockReturnValue(false)
    tauriRuntimeState.platform.mockReturnValue('macos')
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

  it('uses the buffered native authentication transport when restoring a persisted iOS session', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    storage.set('REFRESH_TOKEN', 'refresh-1')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': ['application/json'] },
      bodyText: JSON.stringify({
        status: 200,
        data: { content: { accessToken: 'restored-access', refreshToken: 'refresh-2' }, success: true, code: 200 }
      })
    })

    const { restoreAuthSession } = await import('../http')

    await expect(restoreAuthSession()).resolves.toBe(true)
    expect(tauriRuntimeState.invoke).toHaveBeenCalledWith(
      'ios_auth_post',
      expect.objectContaining({
        request: expect.objectContaining({
          endpoint: 'refreshToken',
          bodyJson: JSON.stringify({ refreshToken: 'refresh-1' })
        })
      })
    )
    expect(storage.get('ACCESS_TOKEN')).toBe('restored-access')
    expect(storage.get('REFRESH_TOKEN')).toBe('refresh-2')
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

  it('rejects a pending authentication request when its deadline expires', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockImplementationOnce(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          ;(init?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'))
          })
        })
    )

    const { default: Http } = await import('../http')
    try {
      const request = expect(
        Http('/api/auth/v1/login', {
          method: 'POST',
          body: { email: 'demo@example.com' },
          noRetry: true,
          timeoutMs: 15000
        })
      ).rejects.toMatchObject({
        type: ErrorType.Network,
        message: '请求超时，请稍后重试'
      })

      await vi.advanceTimersByTimeAsync(15000)
      await request
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a pending iOS native authentication request when its deadline expires', async () => {
    vi.useFakeTimers()
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockImplementationOnce(() => new Promise(() => {}))

    const { default: Http } = await import('../http')
    try {
      const request = expect(
        Http('https://api.starlight.host/api/auth/v1/login', {
          method: 'POST',
          body: { email: 'demo@example.com' },
          noRetry: true,
          timeoutMs: 15000
        })
      ).rejects.toMatchObject({
        type: ErrorType.Network,
        message: '请求超时，请稍后重试'
      })

      await vi.advanceTimersByTimeAsync(15000)
      await request
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses the buffered native command for canonical iOS authentication', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': ['application/json'] },
      bodyText: JSON.stringify({
        status: 200,
        data: { content: { accessToken: 'native-access' }, success: true, code: 200 }
      })
    })

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).resolves.toMatchObject({ status: 200 })
    expect(tauriRuntimeState.invoke).toHaveBeenCalledWith(
      'ios_auth_post',
      expect.objectContaining({
        request: expect.objectContaining({
          endpoint: 'login',
          bodyJson: JSON.stringify({ email: 'demo@example.com' })
        })
      })
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('includes the request identifier when iOS native authentication receives HTTP 403', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 403,
      headers: { 'content-type': ['text/plain'], 'x-request-id': ['ios-403-request'] },
      bodyText: 'Forbidden'
    })

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/verifyCode', {
        method: 'POST',
        body: { email: 'demo@example.com', type: 'login' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Server,
      code: 403,
      message: 'Forbidden（请求编号：ios-403-request）'
    })
  })

  it('uses the buffered native command for the canonical iOS verification-code request', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': ['application/json'] },
      bodyText: JSON.stringify({ status: 200, data: { content: {}, success: true, code: 200 } })
    })

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/verifyCode', {
        method: 'POST',
        body: { email: 'demo@example.com', type: 'login' },
        noRetry: true
      })
    ).resolves.toMatchObject({ status: 200 })
    expect(tauriRuntimeState.invoke).toHaveBeenCalledWith(
      'ios_auth_post',
      expect.objectContaining({ request: expect.objectContaining({ endpoint: 'verifyCode' }) })
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uses the buffered native command for the canonical iOS QR scan confirmation request', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': ['application/json'] },
      bodyText: JSON.stringify({ status: 200, data: { content: {}, success: true, code: 200 } })
    })

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/qrcode/scan', {
        method: 'POST',
        body: { code: 'desktop-qr-code' },
        noRetry: true
      })
    ).resolves.toMatchObject({ status: 200 })
    expect(tauriRuntimeState.invoke).toHaveBeenCalledWith(
      'ios_auth_post',
      expect.objectContaining({ request: expect.objectContaining({ endpoint: 'qrScan' }) })
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uses the buffered native command for canonical iOS QR confirm and cancel requests', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke
      .mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': ['application/json'] },
        bodyText: JSON.stringify({ status: 200, data: { content: {}, success: true, code: 200 } })
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': ['application/json'] },
        bodyText: JSON.stringify({ status: 200, data: { content: {}, success: true, code: 200 } })
      })

    const { default: Http } = await import('../http')

    await Http('https://api.starlight.host/api/auth/v1/qrcode/confirm', {
      method: 'POST',
      body: { code: 'desktop-qr-code' },
      noRetry: true
    })
    await Http('https://api.starlight.host/api/auth/v1/qrcode/cancel', {
      method: 'POST',
      body: { code: 'desktop-qr-code' },
      noRetry: true
    })

    expect(tauriRuntimeState.invoke).toHaveBeenNthCalledWith(
      1,
      'ios_auth_post',
      expect.objectContaining({ request: expect.objectContaining({ endpoint: 'qrConfirm' }) })
    )
    expect(tauriRuntimeState.invoke).toHaveBeenNthCalledWith(
      2,
      'ios_auth_post',
      expect.objectContaining({ request: expect.objectContaining({ endpoint: 'qrCancel' }) })
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uses the buffered native command when a canonical iOS auth request includes query parameters', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    tauriRuntimeState.invoke.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': ['application/json'] },
      bodyText: JSON.stringify({ status: 200, data: { content: {}, success: true, code: 200 } })
    })

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/verifyCode', {
        method: 'POST',
        query: { source: 'mobile' },
        body: { email: 'demo@example.com', type: 'login' },
        noRetry: true
      })
    ).resolves.toMatchObject({ status: 200 })
    expect(tauriRuntimeState.invoke).toHaveBeenCalledWith(
      'ios_auth_post',
      expect.objectContaining({ request: expect.objectContaining({ endpoint: 'verifyCode' }) })
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not use native HTTP outside iOS for a failed login request', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Network failure'))

    const { default: Http } = await import('../http')

    await expect(
      Http('https://api.starlight.host/api/auth/v1/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Network,
      message: '网络异常'
    })
    expect(tauriRuntimeState.fetch).not.toHaveBeenCalled()
  })

  it('does not use native HTTP for a non-canonical iOS login-like request', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Load failed'))

    const { default: Http } = await import('../http')

    await expect(
      Http('https://untrusted.example/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Network,
      message: '网络异常'
    })
    expect(tauriRuntimeState.fetch).not.toHaveBeenCalled()
  })

  it('does not use native HTTP for a cancelled iOS login request', async () => {
    tauriRuntimeState.isTauri.mockReturnValue(true)
    tauriRuntimeState.platform.mockReturnValue('ios')
    const abort = new AbortController()
    abort.abort()
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Load failed'))

    const { default: Http } = await import('../http')

    await expect(
      Http(
        'https://api.starlight.host/api/auth/v1/login',
        { method: 'POST', body: { email: 'demo@example.com' }, noRetry: true },
        false,
        abort
      )
    ).rejects.toMatchObject({
      type: ErrorType.Network,
      message: '请求已取消'
    })
    expect(tauriRuntimeState.fetch).not.toHaveBeenCalled()
  })

  it('does not refresh a session after a login HTTP 401 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ status: 401, data: { message: '邮箱或密码错误', success: false, code: 40001 } })
    } as Response)

    const { default: Http } = await import('../http')

    await expect(
      Http('http://127.0.0.1:6670/api/auth/v1/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Server,
      message: '邮箱或密码错误'
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:6670/api/auth/v1/login',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('surfaces a bodyless login HTTP 401 response without refreshing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      text: async () => '',
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input')
      }
    } as unknown as Response)

    const { default: Http } = await import('../http')

    await expect(
      Http('http://127.0.0.1:6670/api/auth/v1/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Server,
      code: 401,
      message: 'HTTP error! status: 401'
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not refresh a session after a login business 40001 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ status: 200, data: { message: '登录状态无效', success: false, code: 40001 } })
    } as Response)

    const { default: Http } = await import('../http')

    await expect(
      Http('http://127.0.0.1:6670/api/auth/v1/login', {
        method: 'POST',
        body: { email: 'demo@example.com' },
        noRetry: true
      })
    ).rejects.toMatchObject({
      type: ErrorType.Server,
      message: '登录状态无效'
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('refreshes and retries a protected request after an HTTP 401 response', async () => {
    storage.set('ACCESS_TOKEN', createJwt(60 * 60 * 1000))
    storage.set('REFRESH_TOKEN', 'refresh-1')
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ status: 401, data: { message: 'expired', success: false, code: 40001 } })
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
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ status: 200, data: { content: { ok: true }, success: true, code: 200 } })
      } as Response)

    const { default: Http } = await import('../http')

    await expect(Http('http://127.0.0.1:6670/api/metrics/v1/layout', { method: 'GET' })).resolves.toMatchObject({
      status: 200
    })
    expect(fetch).toHaveBeenCalledTimes(3)
    const retriedRequest = vi.mocked(fetch).mock.calls[2][1] as RequestInit
    expect((retriedRequest.headers as Headers).get('Authorization')).toBe('Bearer new-access')
  })

  it('releases protected requests when token refresh exceeds its deadline', async () => {
    vi.useFakeTimers()
    storage.set('ACCESS_TOKEN', createJwt(60 * 1000))
    storage.set('REFRESH_TOKEN', 'refresh-1')
    vi.mocked(fetch).mockImplementationOnce(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          ;(init?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'))
          })
        })
    )

    const { default: Http } = await import('../http')
    try {
      const request = expect(
        Http('http://127.0.0.1:6670/api/metrics/v1/layout', { method: 'GET' })
      ).rejects.toMatchObject({
        type: ErrorType.Network,
        message: '请求超时，请稍后重试'
      })

      await vi.advanceTimersByTimeAsync(30000)
      await request
      expect(requestQueueState.clear).toHaveBeenCalledTimes(1)
      expect(storage.get('REFRESH_TOKEN')).toBe('refresh-1')
    } finally {
      vi.useRealTimers()
    }
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
