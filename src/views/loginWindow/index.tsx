import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useWindow } from '@/hooks/useWindow'

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

    return () => <div>登录页面</div>
  }
})
