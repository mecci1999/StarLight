import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useWindow } from '@/hooks/useWindow'
import WindowActionBar from '@/components/WindowActionBar'
import LoginContent from './content/index'
import { useNetwork } from '@vueuse/core'
import './index.scss'

export default defineComponent({
  name: 'LoginWindow',
  setup(props, { slots }) {
    onMounted(async () => {
      try {
        const win = getCurrentWebviewWindow()
        await win.show()
        await win.setFocus()
      } catch (e) {
        console.warn('Failed to show window:', e)
      }
    })

    return () => (
      <main class="login-window" data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={false} shrink={false} plain />
        {/*  登录窗口主体 */}
        <section class={'login-window__container'}>
          {/* 登录组件 */}
          <LoginContent />
        </section>
      </main>
    )
  }
})
