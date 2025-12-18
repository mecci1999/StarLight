import { NCard, NSpin, NEmpty, NTag } from 'naive-ui'
import { ref, onMounted } from 'vue'
import { fetchTopology } from '@/mock/api'
import type { TopologyData } from '@/types/monitor'
import TopologyChart from '@/components/charts/TopologyChart'

export default defineComponent({
  name: 'ServiceTopology',
  setup() {
    const loading = ref(true)
    const topologyData = ref<TopologyData | null>(null)

    onMounted(async () => {
      topologyData.value = await fetchTopology()
      loading.value = false
    })

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">Service Topology</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">Visualizing service dependencies and call chains.</p>
        </div>

        <NCard class="h-[calc(100%-80px)]" contentStyle={{ padding: 0 }}>
          {loading.value ? (
            <div class="flex items-center justify-center h-full">
              <NSpin size="large">
                <div class="text-center">
                  <div class="text-16px text-[--color-text-2] mt-16px">Loading topology...</div>
                </div>
              </NSpin>
            </div>
          ) : (
            <div class="h-full w-full">
              {topologyData.value && topologyData.value.nodes.length ? (
                <TopologyChart data={topologyData.value} height="100%" />
              ) : (
                <NEmpty description="No Topology Data">
                  <div class="text-14px text-[--color-text-3] mt-16px">Ensure service registry is active.</div>
                </NEmpty>
              )}
            </div>
          )}
        </NCard>
      </div>
    )
  }
})
