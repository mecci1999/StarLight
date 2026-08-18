// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getAllWindows: vi.fn(),
  getWindowByLabel: vi.fn(),
  windowConstructor: vi.fn(),
  getRuntimeTicket: vi.fn(),
  buildRuntimeUrl: vi.fn(),
  getInstalledApp: vi.fn()
}))
const osState = vi.hoisted(() => ({ value: 'windows' }))

vi.mock('@tauri-apps/api/webview', () => ({
  Webview: class {
    static getAll = mocks.getAll
  }
}))

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  WebviewWindow: class {
    static getByLabel = mocks.getWindowByLabel
    static getAll = mocks.getAllWindows
    show = vi.fn()
    setFocus = vi.fn()

    constructor(label: string, options: Record<string, unknown>) {
      mocks.windowConstructor(label, options)
    }

    async once(event: string, callback: () => void) {
      if (event === 'tauri://created') queueMicrotask(callback)
      return () => undefined
    }
  }
}))

vi.mock('@/api/microApps', () => ({
  getMicroAppRuntimeTicket: mocks.getRuntimeTicket
}))

vi.mock('@/api/url', () => ({
  default: {
    microAppExchangeSession: '/api/micro-app/session',
    microAppScopedApi: '/api/micro-app/scoped'
  }
}))

vi.mock('@tauri-apps/plugin-os', () => ({
  type: () => osState.value
}))

vi.mock('./localMicroAppStore', () => ({
  buildMicroAppRuntimeUrl: mocks.buildRuntimeUrl,
  getInstalledMicroApp: mocks.getInstalledApp
}))

import { openInstalledMicroApp } from './microAppLauncher'

const app = {
  appId: 'trails',
  version: '1.0.7',
  manifest: { appId: 'trails', version: '1.0.7', entry: 'index.html', name: '星迹创作后台' },
  packageSha256: 'sha256',
  installedAt: '2026-08-16T00:00:00.000Z',
  storage: 'appData' as const
}

describe('microAppLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    osState.value = 'windows'
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    mocks.getAll.mockResolvedValue([])
    mocks.getAllWindows.mockResolvedValue([])
    mocks.getWindowByLabel.mockResolvedValue(null)
    mocks.getInstalledApp.mockResolvedValue({ ...app, zipBase64: 'package' })
    mocks.getRuntimeTicket.mockResolvedValue({ ticket: 'runtime-ticket' })
    mocks.buildRuntimeUrl.mockResolvedValue('starlight-micro://localhost/trails/1.0.7/__runtime.html')
  })

  it('opens the installed app in the client route by default', async () => {
    const router = { push: vi.fn().mockResolvedValue(undefined) }

    await openInstalledMicroApp({ app, router: router as never, openInNewWindow: false })

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/home/micro-apps/trails', query: expect.objectContaining({ version: '1.0.7' }) })
    )
    expect(mocks.windowConstructor).not.toHaveBeenCalled()
  })

  it('builds a ticketed runtime and opens it in a reusable independent window', async () => {
    ;(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {}
    const router = { push: vi.fn() }

    await openInstalledMicroApp({ app, router: router as never, openInNewWindow: true })

    expect(mocks.getRuntimeTicket).toHaveBeenCalledWith({ appId: 'trails', version: '1.0.7' })
    expect(mocks.windowConstructor).toHaveBeenCalledWith(
      'micro_host_v1_747261696c73:312e302e37',
      expect.objectContaining({
        url: expect.stringContaining('/micro-app-window?'),
        title: '星迹创作后台',
        visible: false,
        resizable: true,
        decorations: false
      })
    )
    expect(router.push).not.toHaveBeenCalled()
  })

  it('uses native macOS window decorations for traffic-light controls', async () => {
    ;(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {}
    osState.value = 'macos'

    await openInstalledMicroApp({ app, router: { push: vi.fn() } as never, openInNewWindow: true })

    expect(mocks.windowConstructor).toHaveBeenCalledWith(
      'micro_host_v1_747261696c73:312e302e37',
      expect.objectContaining({
        decorations: true,
        titleBarStyle: 'overlay',
        hiddenTitle: true,
        transparent: false
      })
    )
  })
})
