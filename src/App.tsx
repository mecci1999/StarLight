import NaiveProvider from '@/components/common/NaiveProvider'
import { RouterView } from 'vue-router'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { type } from '@tauri-apps/plugin-os'
import { useSettingStore } from '@/store/setting'
import { StoresEnum, ThemeEnum } from '@/types/enums'

export default defineComponent({
  name: 'App',
  setup() {
    // const appWindow = WebviewWindow.getCurrent()
    const settingStore = useSettingStore()
    const { themes, page } = storeToRefs(settingStore)

    // 是否桌面端
    const isDesktop = computed(() => {
      return type() === 'windows' || type() === 'linux' || type() === 'macos'
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

    onMounted(async () => {
      // 判断是否是桌面端，桌面端需要调整样式
      isDesktop.value && (await import('@/styles/desktop.scss'))
      // 判断localStorage中是否有设置主题
      if (!localStorage.getItem(StoresEnum.SETTING)) {
        settingStore.initTheme(ThemeEnum.OS)
      }
      document.documentElement.dataset.theme = themes.value.content
      window.addEventListener('dragstart', preventDrag)
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
      window.removeEventListener('dragstart', preventDrag)
    })

    return () => (
      <NaiveProvider messageMax={3} notificMax={3}>
        <div id={'app-container'}>
          <RouterView />
        </div>
      </NaiveProvider>
    )
  }
})
