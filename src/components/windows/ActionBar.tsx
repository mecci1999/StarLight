import { type } from '@tauri-apps/plugin-os'
import { useAlwaysOnTopStore } from '@/store/alwaysOnTop'
import { useSettingStore } from '@/store/setting'
import { useWindow } from '@/hooks/useWindow'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export default defineComponent({
  name: 'ActionBar',
  setup() {
    const {
      minW = true,
      maxW = true,
      closeW = true,
      shrink = true,
      shrinkStatus = true,
      topWinLable
    } = defineProps<{
      minW?: boolean
      maxW?: boolean
      closeW?: boolean
      shrink?: boolean
      topWinLable?: string
      currentLable?: string
      shrinkStatus?: boolean
    }>()

    const appWindow = WebviewWindow.getCurrent()
    const { getWindowTop, setWindowTop } = useAlwaysOnTopStore()
    const settingStore = useSettingStore()
    const { tips, escClose } = storeToRefs(settingStore)
    const { resizeWindow } = useWindow()

    const state = reactive({
      windowMaxmized: false, // 窗口是否最大化
      osType: '', // 系统类型
      // 提示信息
      tipsRef: {
        type: tips.value.type,
        notTips: tips.value.notTips,
        show: false
      }
    })

    // 判断是兼容的系统
    const isCompatibility = computed(() => type() === 'windows' || type() === 'linux')

    // 窗口是否置顶状态
    const alwaysOnTopStatus = computed(() => {
      if (topWinLable === void 0) return false

      return getWindowTop(topWinLable)
    })

    // 窗口置顶
    watchEffect(() => {
      state.tipsRef.type = tips.value.type
      if (alwaysOnTopStatus.value) {
        appWindow.setAlwaysOnTop(alwaysOnTopStatus.value as boolean)
      }
    })

    /**
     * 判断当前是否为全屏
     */
    const handleResize = () => {
      appWindow.isMaximizable().then((res) => {
        state.windowMaxmized = res
      })
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      state.osType = type()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return () => <div class="action-bar" data-tauri-drag-region></div>
  }
})
