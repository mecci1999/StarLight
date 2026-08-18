import { defineComponent, ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Webview } from '@tauri-apps/api/webview'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { NEmpty, NSpin, useMessage } from 'naive-ui'
import { getMicroAppRuntimeTicket } from '@/api/microApps'
import url from '@/api/url'
import {
  buildMicroAppRuntimeUrl,
  clearMicroAppPreviewRecord,
  getInstalledMicroApp,
  getMicroAppPreviewRecord
} from '../services/localMicroAppStore'
import { microAppWebviewLabel } from './microAppWebviewLabel'
import { closeMicroAppWebviewsForApp } from '../services/microAppLauncher'
import './MicroAppRuntimePage.scss'

const isTauriRuntime = () => Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
const FLOATING_LAYER_SELECTOR = ['.n-message-container', '.n-popover', '.n-dropdown-menu'].join(',')
const FLOATING_LAYER_GAP = 8
const MIN_WEBVIEW_HEIGHT = 160

type WebviewBounds = { x: number; y: number; width: number; height: number }

const isVisibleFloatingLayer = (element: Element) => {
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

const elementTouchesFloatingLayer = (node: Node) =>
  node instanceof Element &&
  (node.matches(FLOATING_LAYER_SELECTOR) || Boolean(node.querySelector(FLOATING_LAYER_SELECTOR)))

const mutationTouchesFloatingLayer = (mutations: MutationRecord[]) =>
  mutations.some(
    (mutation) =>
      (mutation.target instanceof Element &&
        (mutation.target.matches(FLOATING_LAYER_SELECTOR) ||
          Boolean(mutation.target.closest(FLOATING_LAYER_SELECTOR)))) ||
      Array.from(mutation.addedNodes).some(elementTouchesFloatingLayer) ||
      Array.from(mutation.removedNodes).some(elementTouchesFloatingLayer)
  )

export default defineComponent({
  name: 'MicroAppRuntimePage',
  setup() {
    const route = useRoute()
    const message = useMessage()
    const hostRef = ref<HTMLElement | null>(null)
    const loading = ref(false)
    const errorText = ref('')
    const runtimeUrl = ref('')
    const activeWebview = ref<Webview | null>(null)
    const previewKey = computed(() => String(route.query.previewKey || ''))
    const appId = computed(() => String(route.params.appId || ''))
    let resizeObserver: ResizeObserver | null = null
    let floatingLayerObserver: MutationObserver | null = null
    let boundsUpdateFrame = 0
    let lastBounds: WebviewBounds | null = null
    let lifecycleGeneration = 0
    let wasDeactivated = false

    const updateWebviewBounds = async () => {
      const host = hostRef.value
      const webview = activeWebview.value
      if (!host || !webview) return
      const rect = host.getBoundingClientRect()
      const floatingLayerBottom = Array.from(document.querySelectorAll(FLOATING_LAYER_SELECTOR)).reduce(
        (bottom, element) => {
          if (!isVisibleFloatingLayer(element)) return bottom
          const layerRect = element.getBoundingClientRect()
          const overlapsHostHorizontally = layerRect.right > rect.left && layerRect.left < rect.right
          const overlapsHostVertically = layerRect.bottom > rect.top && layerRect.top < rect.bottom
          return overlapsHostHorizontally && overlapsHostVertically ? Math.max(bottom, layerRect.bottom) : bottom
        },
        rect.top
      )
      const maxTop = Math.max(rect.top, rect.bottom - MIN_WEBVIEW_HEIGHT)
      const top = Math.min(Math.max(rect.top, floatingLayerBottom + FLOATING_LAYER_GAP), maxTop)
      const nextBounds: WebviewBounds = {
        x: Math.round(rect.left),
        y: Math.round(top),
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.bottom - top))
      }
      const previousBounds = lastBounds
      if (
        previousBounds &&
        previousBounds.x === nextBounds.x &&
        previousBounds.y === nextBounds.y &&
        previousBounds.width === nextBounds.width &&
        previousBounds.height === nextBounds.height
      ) {
        return
      }
      lastBounds = nextBounds
      const updates: Promise<void>[] = []
      if (!previousBounds || previousBounds.x !== nextBounds.x || previousBounds.y !== nextBounds.y) {
        updates.push(webview.setPosition(new LogicalPosition(nextBounds.x, nextBounds.y)))
      }
      if (!previousBounds || previousBounds.width !== nextBounds.width || previousBounds.height !== nextBounds.height) {
        updates.push(webview.setSize(new LogicalSize(nextBounds.width, nextBounds.height)))
      }
      await Promise.all(updates)
    }

    const scheduleWebviewBoundsUpdate = () => {
      if (boundsUpdateFrame) return
      boundsUpdateFrame = window.requestAnimationFrame(() => {
        boundsUpdateFrame = 0
        void updateWebviewBounds()
      })
    }

    const closeWebview = async () => {
      const webview = activeWebview.value
      activeWebview.value = null
      lastBounds = null
      if (webview) await webview.close().catch(() => undefined)
    }

    const mountWebview = async (nextUrl: string, generation: number) => {
      if (!isTauriRuntime()) {
        errorText.value = '当前环境不支持原生 Webview，请在 StarLight 桌面端中打开微应用。'
        return
      }

      await closeWebview()
      await nextTick()
      if (generation !== lifecycleGeneration) return
      const host = hostRef.value
      if (!host) return
      const rect = host.getBoundingClientRect()
      const url = new URL(nextUrl)
      const [runtimeAppId, runtimeVersion] = url.pathname.split('/').filter(Boolean)
      if (!runtimeAppId || !runtimeVersion) throw new Error('微应用运行地址缺少包身份')
      const label = microAppWebviewLabel(runtimeAppId, runtimeVersion)
      await closeMicroAppWebviewsForApp(runtimeAppId)
      if (generation !== lifecycleGeneration) return

      const webview = new Webview(getCurrentWindow(), label, {
        url: nextUrl,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
        focus: true,
        incognito: Boolean(previewKey.value),
        dragDropEnabled: false,
        backgroundColor: '#ffffff'
      })
      activeWebview.value = webview
      await webview.once('tauri://created', () => {
        scheduleWebviewBoundsUpdate()
      })
      await webview.once<string>('tauri://error', (event) => {
        const reason = typeof event.payload === 'string' && event.payload ? `：${event.payload}` : ''
        errorText.value = `微应用 Webview 创建失败${reason}`
        console.error('Micro app Webview creation failed:', event.payload)
      })
    }

    const boot = async () => {
      const generation = ++lifecycleGeneration
      loading.value = true
      errorText.value = ''
      try {
        if (previewKey.value) {
          const previewRecord = getMicroAppPreviewRecord(previewKey.value)
          if (!previewRecord) {
            errorText.value = '预览内容已失效，请回到微应用页面重新预览。'
            return
          }
          runtimeUrl.value = previewRecord.runtimeUrl
          await mountWebview(previewRecord.runtimeUrl, generation)
          return
        }

        const localApp = await getInstalledMicroApp(appId.value)
        if (generation !== lifecycleGeneration) return
        if (!localApp) {
          errorText.value = '该微应用尚未下载到本地，请先回到微应用列表下载。'
          return
        }
        const runtimePayload = await getMicroAppRuntimeTicket({ appId: localApp.appId, version: localApp.version })
        if (generation !== lifecycleGeneration) return
        const payloadWithEndpoints = {
          ...(runtimePayload as Record<string, unknown>),
          endpoints: {
            exchangeSession: url.microAppExchangeSession,
            scopedApi: url.microAppScopedApi
          }
        }
        runtimeUrl.value = await buildMicroAppRuntimeUrl(localApp, payloadWithEndpoints)
        if (generation !== lifecycleGeneration) return
        await mountWebview(runtimeUrl.value, generation)
      } catch (error) {
        if (generation !== lifecycleGeneration) return
        console.error('Failed to boot micro app:', error)
        errorText.value = '微应用 Webview 加载失败，请确认包内容和访问权限。'
        message.error(errorText.value)
      } finally {
        if (generation === lifecycleGeneration) loading.value = false
      }
    }

    onMounted(() => {
      resizeObserver = new ResizeObserver(scheduleWebviewBoundsUpdate)
      if (hostRef.value) resizeObserver.observe(hostRef.value)
      floatingLayerObserver = new MutationObserver((mutations) => {
        if (mutationTouchesFloatingLayer(mutations)) scheduleWebviewBoundsUpdate()
      })
      floatingLayerObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true
      })
      window.addEventListener('resize', scheduleWebviewBoundsUpdate)
      window.addEventListener('scroll', scheduleWebviewBoundsUpdate, true)
      document.addEventListener('click', scheduleWebviewBoundsUpdate, true)
      document.addEventListener('keydown', scheduleWebviewBoundsUpdate, true)
      void boot()
    })

    onActivated(() => {
      if (!wasDeactivated) return
      wasDeactivated = false
      void boot()
    })

    onDeactivated(() => {
      wasDeactivated = true
      lifecycleGeneration += 1
      if (boundsUpdateFrame) window.cancelAnimationFrame(boundsUpdateFrame)
      boundsUpdateFrame = 0
      void closeWebview()
    })

    onBeforeUnmount(() => {
      lifecycleGeneration += 1
      resizeObserver?.disconnect()
      floatingLayerObserver?.disconnect()
      if (boundsUpdateFrame) window.cancelAnimationFrame(boundsUpdateFrame)
      window.removeEventListener('resize', scheduleWebviewBoundsUpdate)
      window.removeEventListener('scroll', scheduleWebviewBoundsUpdate, true)
      document.removeEventListener('click', scheduleWebviewBoundsUpdate, true)
      document.removeEventListener('keydown', scheduleWebviewBoundsUpdate, true)
      if (previewKey.value) clearMicroAppPreviewRecord(previewKey.value)
      void closeWebview()
    })

    return () => (
      <div class="micro-app-runtime" ref={hostRef}>
        {loading.value && (
          <div class="micro-app-runtime__state">
            <NSpin size="large" />
          </div>
        )}
        {errorText.value && (
          <div class="micro-app-runtime__state">
            <NEmpty description={errorText.value} />
          </div>
        )}
      </div>
    )
  }
})
