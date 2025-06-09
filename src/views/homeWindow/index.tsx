import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useWindow } from '@/hooks/useWindow'
import WindowActionBar from '@/components/WindowActionBar'
import { useNetwork } from '@vueuse/core'
import './index.scss'

export default defineComponent({
  name: 'HomeWindow',
  setup(props, { slots }) {
    onMounted(async () => {
      await getCurrentWebviewWindow().show()
    })

    return () => (
      <main class={'home-window bg-[--color-bg-1] size-full rounded-8px select-none'} data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={false} shrink={false} />
        {/*  登录窗口主体 */}
        <section class={'home-window__container'}>
          {/* 登录组件 */}
          {/* <LoginContent /> */}
        </section>
      </main>
    )
  }
})
