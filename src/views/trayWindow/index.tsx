import { defineComponent, onMounted } from 'vue'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import './index.scss'

export default defineComponent({
  name: 'TrayWindow',
  setup() {
    onMounted(async () => {
      const win = getCurrentWebviewWindow()
      // 强制隐藏托盘窗口，防止自动显示
      await win.hide()
    })

    return () => (
      <div class="tray-window">
        <div class="tray-window__item">打开主界面</div>
        <div class="tray-window__divider"></div>
        <div class="tray-window__item tray-window__item--danger">退出</div>
      </div>
    )
  }
})
