import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification'
import { Suspense, KeepAlive } from 'vue'
import WindowActionBar from '@/components/WindowActionBar'

export default defineComponent({
  name: 'Layout',
  setup(props, { slots }) {
    const loadingPercentage = ref(10)
    const loadingText = ref('正在加载应用...')

    const AsyncLeft = defineAsyncComponent({
      loader: async () => {
        loadingText.value = '正在加载左侧菜单...'
        const comp = await import('@/layout/left/index')
        loadingPercentage.value = 50
        return comp
      },
      delay: 600,
      timeout: 3000
    })

    const AsyncContainer = defineAsyncComponent({
      loader: async () => {
        loadingText.value = '正在加载内容面板...'
        const comp = await import('@/layout/container/index')
        loadingPercentage.value = 100

        // 在组件加载完成后，使用nextTick等待DOM更新
        nextTick(() => {})

        return comp
      },
      delay: 600,
      timeout: 3000
    })

    onMounted(async () => {
      await getCurrentWebviewWindow().show()

      let permissionGranted = await isPermissionGranted()

      // 如果没有授权，则请求授权系统通知
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }
    })

    return () => (
      <div
        id="layout"
        class="bg-[--color-bg-1] rounded-[var(--border-radius-large)] select-none size-full"
        data-tauri-drag-region>
        <Suspense>
          {{
            default: () => (
              <div class="flex size-full">
                {/* 使用keep-alive包裹异步组件 */}
                <KeepAlive>
                  <AsyncLeft />
                </KeepAlive>
                {/* 使用keep-alive包裹异步组件 */}
                <KeepAlive>
                  <AsyncContainer />
                </KeepAlive>
              </div>
            ),
            fallback: () => (
              <div class="flex items-center justify-center size-full">
                <LoadingSpinner loadingText={loadingText.value} percentage={loadingPercentage.value} />
              </div>
            )
          }}
        </Suspense>
      </div>
    )
  }
})
