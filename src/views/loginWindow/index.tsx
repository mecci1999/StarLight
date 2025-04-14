import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useWindow } from '@/hooks/useWindow'
import WindowActionBar from '@/components/WindowActionBar'

export default defineComponent({
  name: 'LoginWindow',
  setup(props, { slots }) {
    const { createWebviewWindow } = useWindow()

    const openHomeWindow = async () => {
      await createWebviewWindow('StarLight', 'home', 960, 720, 'login', true)
    }

    onMounted(async () => {
      await getCurrentWebviewWindow().show()
    })

    return () => (
      <div class={'login-window bg-[--color-bg-1] size-full rounded-8px select-none'} data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={false} shrink={false} />
      </div>
    )
  }
})
