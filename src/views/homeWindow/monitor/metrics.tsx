import {
  NCard,
  NGrid,
  NGridItem,
  NSelect,
  NDatePicker,
  NSpace,
  NButton,
  NTabs,
  NTabPane,
  NSpin,
  NEmpty
} from 'naive-ui'
import { ref, onMounted, computed, defineComponent } from 'vue'
import { getAppKeys, queryMetrics } from '@/api'
import type { MetricsBundle } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { StatsChartOutline } from '@vicons/ionicons5'
import LineChart from '@/components/charts/LineChart'

export default defineComponent({
  name: 'MetricsAnalysis',
  setup() {
    const selectedAppKey = ref<string | null>(null)
    const dateRange = ref<[number, number] | null>(null)
    const activeTab = ref('trend')
    const loading = ref(false)
    const metrics = ref<MetricsBundle | null>(null)
    const appKeys = ref<any[]>([])

    const serviceOptions = computed(() => {
      return appKeys.value.map((app) => ({
        label: app.name || app.keyName,
        value: app.appKey // Use appKey as the value
      }))
    })

    const fetchAppKeys = async () => {
      try {
        const res = await getAppKeys()
        if (res && Array.isArray((res as any).appKeys)) {
          appKeys.value = (res as any).appKeys
        } else if (Array.isArray(res)) {
          appKeys.value = res
        }

        if (appKeys.value.length > 0 && !selectedAppKey.value) {
          selectedAppKey.value = appKeys.value[0].appKey
          loadMetrics()
        }
      } catch (error) {
        console.error('Failed to fetch app keys:', error)
      }
    }

    const loadMetrics = async () => {
      if (!selectedAppKey.value) return

      loading.value = true
      try {
        const endTime = dateRange.value?.[1] || Date.now()
        const startTime = dateRange.value?.[0] || endTime - 3600 * 1000 // Default 1 hour

        const res = await queryMetrics({
          appKey: selectedAppKey.value,
          timeRange: {
            start: startTime,
            end: endTime
          },
          step: '1m',
          metrics: ['cpu', 'memory', 'qps', 'responseTime']
        })

        // Transform backend response to MetricsBundle
        // TODO: Implement actual transformation logic based on backend response structure
        if (res) {
          metrics.value = res as any
        }
      } catch (error) {
        console.error('Failed to load metrics:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchAppKeys()
    })

    return () => (
      <div class="p-24px h-full overflow-auto bg-gray-50/50">
        <SectionHeader
          title="Metrics Analysis"
          subtitle="Historical trends, heatmaps, and comparative analysis"
          icon={StatsChartOutline}
        />

        {/* Control Panel */}
        <NCard class="mb-16px shadow-sm rounded-lg" bordered={false}>
          <NSpace>
            <NSelect
              v-model:value={selectedAppKey.value}
              options={serviceOptions.value}
              style={{ width: '200px' }}
              placeholder="Select Application"
              disabled={appKeys.value.length === 0}
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary" onClick={loadMetrics} disabled={!selectedAppKey.value}>
              Query
            </NButton>
            <NButton>Export</NButton>
          </NSpace>
        </NCard>

        {/* Charts Area */}
        <NCard bordered={false} class="shadow-sm rounded-lg">
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : null}

          {!loading.value && !metrics.value && (
            <NEmpty description="No data available. Please select an application and query." class="py-40px" />
          )}

          {metrics.value ? (
            <NTabs v-model:value={activeTab.value} type="line">
              <NTabPane name="trend" tab="Trend Analysis">
                <NGrid cols={1} yGap={16}>
                  <NGridItem>
                    <NCard
                      title="CPU Usage Trend"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      <LineChart data={metrics.value.cpu} title="" color="#18a058" height="300px" area />
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="Response Time Trend"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      <LineChart data={metrics.value.responseTime} title="" color="#2080f0" height="300px" />
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="QPS Trend"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      <LineChart data={metrics.value.qps} title="" color="#f0a020" height="300px" area />
                    </NCard>
                  </NGridItem>
                </NGrid>
              </NTabPane>
            </NTabs>
          ) : null}
        </NCard>
      </div>
    )
  }
})
