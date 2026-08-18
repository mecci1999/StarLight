import { Webview } from '@tauri-apps/api/webview'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { type } from '@tauri-apps/plugin-os'
import type { Router } from 'vue-router'
import { getMicroAppRuntimeTicket } from '@/api/microApps'
import url from '@/api/url'
import { buildMicroAppRuntimeUrl, getInstalledMicroApp, type InstalledMicroApp } from './localMicroAppStore'
import {
  isMicroAppHostWindowLabelForApp,
  isMicroAppWebviewLabelForApp,
  microAppHostWindowLabel
} from '../pages/microAppWebviewLabel'

const isTauriRuntime = () => Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)

export const closeMicroAppWebviewsForApp = async (appId: string, exceptLabel?: string) => {
  if (!isTauriRuntime()) return
  const windows = await WebviewWindow.getAll()
  await Promise.all(
    windows
      .filter(
        (webviewWindow) =>
          webviewWindow.label !== exceptLabel &&
          (isMicroAppHostWindowLabelForApp(webviewWindow.label, appId) ||
            isMicroAppWebviewLabelForApp(webviewWindow.label, appId))
      )
      .map((webviewWindow) => webviewWindow.close().catch(() => undefined))
  )
  const webviews = await Webview.getAll()
  await Promise.all(
    webviews
      .filter((webview) => webview.label !== exceptLabel && isMicroAppWebviewLabelForApp(webview.label, appId))
      .map((webview) => webview.close().catch(() => undefined))
  )
}

const focusExistingWindow = async (label: string) => {
  const existing = await WebviewWindow.getByLabel(label)
  if (!existing) return false
  if (!(await existing.isVisible())) await existing.show()
  if (await existing.isMinimized()) await existing.unminimize()
  await existing.setFocus()
  return true
}

const createMicroAppWindow = async (app: InstalledMicroApp, runtimeUrl: string) => {
  const label = microAppHostWindowLabel(app.appId, app.version)
  if (await focusExistingWindow(label)) return

  await closeMicroAppWebviewsForApp(app.appId)
  const title = app.manifest.name || app.appId
  const osType = type()
  const isMacOS = osType === 'macos'
  const query = new URLSearchParams({
    appId: app.appId,
    version: app.version,
    title,
    runtimeUrl,
    ...(app.manifest.icon ? { icon: app.manifest.icon } : {})
  })
  const webviewWindow = new WebviewWindow(label, {
    url: `/micro-app-window?${query.toString()}`,
    title,
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    center: true,
    resizable: true,
    decorations: isMacOS,
    titleBarStyle: isMacOS ? 'overlay' : undefined,
    hiddenTitle: isMacOS,
    transparent: !isMacOS,
    visible: false,
    focus: true,
    backgroundColor: '#f5f5f3'
  })

  await new Promise<void>((resolve, reject) => {
    void webviewWindow.once('tauri://created', async () => {
      await webviewWindow.show()
      await webviewWindow.setFocus()
      resolve()
    })
    void webviewWindow.once<string>('tauri://error', (event) => {
      reject(new Error(typeof event.payload === 'string' && event.payload ? event.payload : '微应用独立窗口创建失败'))
    })
  })
}

export const openInstalledMicroApp = async (options: {
  app: InstalledMicroApp
  router: Router
  openInNewWindow: boolean
}) => {
  const { app, router, openInNewWindow } = options
  if (!openInNewWindow || !isTauriRuntime()) {
    await router.push({
      path: `/home/micro-apps/${app.appId}`,
      query: {
        app: app.appId,
        version: app.version,
        title: app.manifest.name || app.appId,
        ...(app.manifest.icon ? { icon: app.manifest.icon } : {})
      }
    })
    return
  }

  const installedApp = await getInstalledMicroApp(app.appId)
  if (!installedApp || installedApp.version !== app.version) throw new Error('微应用本地安装内容不存在，请重新下载')
  const runtimePayload = await getMicroAppRuntimeTicket({ appId: installedApp.appId, version: installedApp.version })
  const runtimeUrl = await buildMicroAppRuntimeUrl(installedApp, {
    ...(runtimePayload as Record<string, unknown>),
    endpoints: {
      exchangeSession: url.microAppExchangeSession,
      scopedApi: url.microAppScopedApi
    }
  })
  await createMicroAppWindow(installedApp, runtimeUrl)
}
