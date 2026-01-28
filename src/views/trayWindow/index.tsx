import { defineComponent, onMounted } from 'vue'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

export default defineComponent({
  name: 'TrayWindow',
  setup() {
    onMounted(async () => {
      const win = getCurrentWebviewWindow()
      // 强制隐藏托盘窗口，防止自动显示
      await win.hide()
    })

    return () => (
      <div class="tray-window flex flex-col items-center justify-center h-full bg-white text-xs border border-gray-200 rounded shadow-lg overflow-hidden select-none">
        <div class="p-2 hover:bg-gray-100 cursor-pointer w-full text-center transition-colors">打开主界面</div>
        <div class="h-[1px] bg-gray-100 w-full"></div>
        <div class="p-2 hover:bg-gray-100 cursor-pointer w-full text-center transition-colors text-red-500">退出</div>
      </div>
    )
  }
})
