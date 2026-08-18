import { Webview } from '@tauri-apps/api/webview'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { type } from '@tauri-apps/plugin-os'
import { NSpin } from 'naive-ui'
import WindowActionBar from '@/components/WindowActionBar'
import { closeMicroAppWebviewsForApp } from '../services/microAppLauncher'
import { microAppWebviewLabel } from './microAppWebviewLabel'
import './MicroAppWindowPage.scss'

const BAR_HEIGHT = 44
const isTauriRuntime = () => Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)

export default defineComponent({
  name: 'MicroAppWindowPage',
  setup() {
    const route = useRoute()
    const hostRef = ref<HTMLElement | null>(null)
    const activeWebview = ref<Webview | null>(null)
    const loading = ref(true)
    const errorText = ref('')
    const appId = computed(() => String(route.query.appId || ''))
    const version = computed(() => String(route.query.version || ''))
    const title = computed(() => String(route.query.title || appId.value || '微应用'))
    const icon = computed(() => String(route.query.icon || ''))
    const runtimeUrl = computed(() => String(route.query.runtimeUrl || ''))
    const isMacOS = computed(() => {
      try {
        return type() === 'macos'
      } catch {
        return false
      }
    })
    let resizeObserver: ResizeObserver | null = null
    let resizeFrame = 0

    const updateBounds = async () => {
      const host = hostRef.value
      const webview = activeWebview.value
      if (!host || !webview) return
      const rect = host.getBoundingClientRect()
      await Promise.all([
        webview.setPosition(new LogicalPosition(Math.round(rect.left), Math.round(rect.top))),
        webview.setSize(new LogicalSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height))))
      ])
    }

    const scheduleBoundsUpdate = () => {
      if (resizeFrame) return
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        void updateBounds()
      })
    }

    const closeWebview = async () => {
      const webview = activeWebview.value
      activeWebview.value = null
      if (webview) await webview.close().catch(() => undefined)
    }

    const boot = async () => {
      if (!isTauriRuntime()) {
        errorText.value = '请在星光桌面端中打开微应用独立窗口。'
        loading.value = false
        return
      }
      if (!appId.value || !version.value || !runtimeUrl.value) {
        errorText.value = '微应用独立窗口参数不完整。'
        loading.value = false
        return
      }

      try {
        await closeMicroAppWebviewsForApp(appId.value, getCurrentWindow().label)
        await nextTick()
        const host = hostRef.value
        if (!host) throw new Error('宿主区域未就绪')
        const rect = host.getBoundingClientRect()
        const webview = new Webview(getCurrentWindow(), microAppWebviewLabel(appId.value, version.value), {
          url: runtimeUrl.value,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
          focus: true,
          dragDropEnabled: false,
          backgroundColor: '#ffffff'
        })
        activeWebview.value = webview
        await webview.once('tauri://created', () => {
          loading.value = false
          scheduleBoundsUpdate()
        })
        await webview.once<string>('tauri://error', (event) => {
          errorText.value = typeof event.payload === 'string' && event.payload ? event.payload : '微应用加载失败。'
          loading.value = false
        })
      } catch (error) {
        console.error('Failed to create independent micro-app Webview:', error)
        errorText.value = '微应用加载失败，请关闭窗口后重试。'
        loading.value = false
      }
    }

    onMounted(() => {
      resizeObserver = new ResizeObserver(scheduleBoundsUpdate)
      if (hostRef.value) resizeObserver.observe(hostRef.value)
      window.addEventListener('resize', scheduleBoundsUpdate)
      void boot()
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', scheduleBoundsUpdate)
      void closeWebview()
    })

    return () => (
      <div class={['micro-app-window', { 'micro-app-window--macos': isMacOS.value }]}>
        <WindowActionBar maxW shrink={false} showSlot>
          <div class="micro-app-window__identity" data-tauri-drag-region>
            {icon.value ? (
              <img class="micro-app-window__icon" src={icon.value} alt="" />
            ) : (
              <span class="micro-app-window__icon-fallback" />
            )}
            <span class="micro-app-window__title">{title.value}</span>
          </div>
        </WindowActionBar>
        <main ref={hostRef} class="micro-app-window__content" style={{ '--micro-app-bar-height': `${BAR_HEIGHT}px` }}>
          {loading.value ? (
            <div class="micro-app-window__state" role="status" aria-label="正在加载微应用">
              <NSpin size="medium" />
            </div>
          ) : null}
          {errorText.value ? (
            <div class="micro-app-window__state micro-app-window__state--error">{errorText.value}</div>
          ) : null}
        </main>
      </div>
    )
  }
})
