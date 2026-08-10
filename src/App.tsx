import NaiveProvider from '@/components/common/NaiveProvider'
import { NSpin } from 'naive-ui'
import { RouterView, useRouter } from 'vue-router'
import { emit, listen } from '@tauri-apps/api/event'
import { type } from '@tauri-apps/plugin-os'
import { useSettingStore } from '@/store/setting'
import { StoresEnum, ThemeEnum } from '@/types/enums'
import {
  clearStoredAuthSession,
  getStoredUserInfo,
  persistAuthTokens,
  resolveAuthLandingRoute
} from '@/services/authSession'
import { restoreAuthSession } from '@/services/http'

import { useTauriListener } from '@/hooks/useTauriListener'

export default defineComponent({
  name: 'App',
  setup() {
    // const appWindow = WebviewWindow.getCurrent()
    const settingStore = useSettingStore()
    const router = useRouter()
    const { page } = storeToRefs(settingStore)
    const tauriListener = useTauriListener()
    const sessionRestored = ref(false)

    // 是否桌面端
    const isDesktop = computed(() => {
      try {
        return type() === 'windows' || type() === 'linux' || type() === 'macos'
      } catch (error) {
        return false
      }
    })

    /** 禁止图片以及输入框的拖拽 */
    const preventDrag = (e: MouseEvent) => {
      const event = e.target as HTMLElement
      // 检查目标元素是否是<img>元素
      if (event.nodeName.toLowerCase() === 'img' || event.nodeName.toLowerCase() === 'input') {
        e.preventDefault()
      }
    }

    /** 控制阴影 */
    watch(
      () => page.value.shadow,
      (val) => {
        document.documentElement.style.setProperty('--shadow-enabled', val ? '0' : '1')
      },
      { immediate: true }
    )

    /** 控制高斯模糊 */
    watch(
      () => page.value.blur,
      (val) => {
        document.documentElement.setAttribute('data-blur', val ? '1' : '0')
      },
      { immediate: true }
    )

    /** 控制字体样式 */
    watch(
      () => page.value.fonts,
      (val) => {
        document.documentElement.style.setProperty('--font-family', val)
      },
      { immediate: true }
    )

    /** 控制变化主题 */
    // watch(
    //   () => themes.value.versatile,
    //   async (val, oldVal) => {
    //     await import(`@/styles/scss/theme/${val}.scss`)
    //     // 然后给最顶层的div设置val的类样式
    //     const app = document.querySelector('#app')?.classList as DOMTokenList
    //     app.remove(oldVal as string)
    //     await nextTick(() => {
    //       app.add(val)
    //     })
    //   },
    //   { immediate: true }
    // )

    /** 重新登录处理 */
    const handleReLogin = () => {
      clearStoredAuthSession()
      router.replace(isDesktop.value ? '/login' : '/mobile/login')
    }

    onMounted(async () => {
      console.log('[App] mounted, location:', location.href, 'pathname:', location.pathname)
      console.log('[App] viewport:', window.innerWidth, 'x', window.innerHeight)
      console.log('[App] html height:', getComputedStyle(document.documentElement).height)
      console.log('[App] body height:', getComputedStyle(document.body).height)
      console.log('[App] #app height:', getComputedStyle(document.getElementById('app')!).height)
      // 判断是否是桌面端，桌面端需要调整样式
      isDesktop.value && (await import('@/styles/desktop.scss'))
      // 判断localStorage中是否有设置主题
      if (!localStorage.getItem(StoresEnum.SETTING)) {
        settingStore.initTheme(ThemeEnum.OS)
      }
      window.addEventListener('dragstart', preventDrag)
      window.addEventListener('needReLogin', handleReLogin)
      tauriListener.addListener(
        listen('auth-token', (event) => {
          if (typeof localStorage === 'undefined') return
          const payload = event.payload as { accessToken?: string; refreshToken?: string }
          if (payload?.accessToken || payload?.refreshToken) {
            persistAuthTokens(payload)
          }
        })
      )
      // Restore the short-lived access token before the application starts its
      // normal authenticated traffic. A temporary network error preserves the
      // three-day refresh session and is retried by ordinary request handling.
      const restored = await restoreAuthSession()
      const storedUser = getStoredUserInfo()
      if (restored && !isDesktop.value && router.currentRoute.value.name === 'mobile-login') {
        await router.replace({ name: resolveAuthLandingRoute(false, storedUser) })
      }
      sessionRestored.value = true
      emit('auth-token-request')
      /** 开发环境不禁止 */
      if (process.env.NODE_ENV !== 'development') {
        /** 禁用浏览器默认的快捷键 */
        window.addEventListener('keydown', (e) => {
          // 排除ctrl+c ctrl+v ctrl+enter
          if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'Enter')) return
          if (e.ctrlKey || e.metaKey || e.altKey) {
            e.preventDefault()
          }
        })
        /** 禁止右键菜单 */
        window.addEventListener('contextmenu', (e) => e.preventDefault(), false)
      }
    })

    onUnmounted(() => {
      window.removeEventListener('contextmenu', (e) => e.preventDefault(), false)
      window.removeEventListener('needReLogin', handleReLogin)
      window.removeEventListener('dragstart', preventDrag)
    })

    return () => (
      <NaiveProvider messageMax={3} notificMax={3}>
        <div id={'app-container'}>
          {sessionRestored.value ? (
            <RouterView />
          ) : (
            <div class="flex-center h-full" role="status" aria-label="正在恢复登录状态">
              <NSpin size="medium" />
            </div>
          )}
        </div>
      </NaiveProvider>
    )
  }
})
