import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useWindow } from '@/hooks/useWindow'
import WindowActionBar from '@/components/WindowActionBar'
import LoginContent from './content/index'
import { useNetwork } from '@vueuse/core'
import './index.scss'

export default defineComponent({
  name: 'LoginWindow',
  setup(props, { slots }) {
    const { createWebviewWindow } = useWindow()
    /** 网络连接是否正常 */
    const { isOnline } = useNetwork()

    const state = reactive({
      mode: 'e'
    })

    const openHomeWindow = async () => {
      await createWebviewWindow('StarLight', 'home', 1080, 720, 'login', true)
    }

    onMounted(async () => {
      await getCurrentWebviewWindow().show()
    })

    return () => (
      <main class={'login-window bg-[--color-bg-1] size-full rounded-8px select-none'} data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={false} shrink={false} />
        {/*  登录窗口主体 */}
        <section class={'login-window__container'}>
          {/* 登录组件 */}
          <LoginContent />
        </section>
      </main>
    )
  }
})
