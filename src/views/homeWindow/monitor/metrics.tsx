import { NCard, NGrid, NGridItem, NSelect, NDatePicker, NSpace, NButton, NTabs, NTabPane, NSpin } from 'naive-ui'
import { ref, onMounted } from 'vue'
import { fetchMetrics } from '@/mock/api'
import type { MetricsBundle } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { StatsChartOutline } from '@vicons/ionicons5'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'

export default defineComponent({
  name: 'MetricsAnalysis',
  setup() {
    const selectedService = ref('user-service')
    const dateRange = ref<[number, number] | null>(null)
    const activeTab = ref('trend')
    const loading = ref(false)
    const metrics = ref<MetricsBundle | null>(null)

    const serviceOptions = [
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    const loadMetrics = async () => {
      loading.value = true
      metrics.value = await fetchMetrics({ serviceId: selectedService.value })
      loading.value = false
    }
    onMounted(loadMetrics)

    return () => (
      <div class="p-24px h-full overflow-auto">
        <SectionHeader
          title="Metrics Analysis"
          subtitle="Historical trends, heatmaps, and comparative analysis"
          icon={StatsChartOutline}
        />

        {/* Control Panel */}
        <NCard class="mb-16px">
          <NSpace>
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions}
              style={{ width: '200px' }}
              placeholder="Select Service"
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary" onClick={loadMetrics}>
              Query
            </NButton>
            <NButton>Export</NButton>
          </NSpace>
        </NCard>

        {/* Charts Area */}
        <NCard>
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : null}
          <NTabs v-model:value={activeTab.value} type="line">
            <NTabPane name="trend" tab="Trend Analysis">
              <NGrid cols={1} yGap={16}>
                <NGridItem>
                  <NCard title="CPU Usage Trend" contentStyle={{ padding: 0 }}>
                    {metrics.value ? (
                      <LineChart data={metrics.value.cpu} title="" color="#18a058" height="300px" area />
                    ) : null}
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="Response Time Trend" contentStyle={{ padding: 0 }}>
                    {metrics.value ? (
                      <LineChart data={metrics.value.responseTime} title="" color="#2080f0" height="300px" />
                    ) : null}
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="QPS Trend" contentStyle={{ padding: 0 }}>
                    {metrics.value ? (
                      <LineChart data={metrics.value.qps} title="" color="#f0a020" height="300px" area />
                    ) : null}
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>

            <NTabPane name="heatmap" tab="Heatmap">
              <div class="p-16px text-center text-gray-500">
                Heatmap visualization is under development (Requires specialized ECharts heatmap configuration)
              </div>
            </NTabPane>

            <NTabPane name="comparison" tab="Comparison">
              <NGrid cols={1} yGap={16}>
                <NGridItem>
                  <NCard title="Service Comparison" contentStyle={{ padding: 0 }}>
                    {metrics.value ? (
                      <BarChart
                        data={metrics.value.comparison || []}
                        title="Average Resource Usage"
                        color="#18a058"
                        height="400px"
                      />
                    ) : null}
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
    )
  }
})
