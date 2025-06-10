import { NCard, NGrid, NGridItem, NSpin, NEmpty } from 'naive-ui'
import { ref, onMounted } from 'vue'

export default defineComponent({
  name: 'ServiceTopology',
  setup() {
    const loading = ref(true)
    const topologyData = ref(null)

    onMounted(() => {
      // 模拟加载数据
      setTimeout(() => {
        loading.value = false
      }, 1000)
    })

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">服务拓扑图</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">可视化展示微服务之间的依赖关系和调用链路</p>
        </div>

        <NCard class="h-[calc(100%-80px)]">
          {loading.value ? (
            <div class="flex items-center justify-center h-full">
              <NSpin size="large">
                <div class="text-center">
                  <div class="text-16px text-[--color-text-2] mt-16px">正在加载服务拓扑图...</div>
                </div>
              </NSpin>
            </div>
          ) : (
            <div class="h-full flex items-center justify-center">
              <NEmpty description="暂无服务拓扑数据">
                <div class="text-14px text-[--color-text-3] mt-16px">请确保已配置服务注册中心并有服务正在运行</div>
              </NEmpty>
            </div>
          )}
        </NCard>
      </div>
    )
  }
})
