import { defineComponent, ref, onMounted } from 'vue'
import { NGrid, NGridItem, NCard, NStatistic, NProgress } from 'naive-ui'
import BaseChart from '@/components/charts/BaseChart'
import * as api from '@/api/subscription'
import { graphic } from 'echarts/core'

export default defineComponent({
  name: 'BillingUsage',
  setup() {
    const usage = ref<any>(null)
    const chartOption = ref<any>(null)

    const fetchUsage = async () => {
      try {
        const res = await api.getUsageStatistics()
        usage.value = res

        // Transform real data for chart if available
        // For now, if no historical data API, we keep empty or implement a new API
        const dates = []
        const values = []
        // if (res.history) {
        // ... map history
        // }

        chartOption.value = {
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', boundaryGap: false, data: [] },
          yAxis: { type: 'value' },
          series: [
            {
              name: 'Requests',
              type: 'line',
              smooth: true,
              lineStyle: { width: 0 },
              showSymbol: false,
              areaStyle: {
                opacity: 0.8,
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgb(128, 255, 165)' },
                  { offset: 1, color: 'rgb(1, 191, 236)' }
                ])
              },
              emphasis: { focus: 'series' },
              data: []
            }
          ]
        }
      } catch (e) {
        console.error('Failed to fetch usage', e)
      }
    }

    onMounted(fetchUsage)

    return () => (
      <div class="p-4 space-y-6">
        <NGrid x-gap={12} cols={3}>
          <NGridItem>
            <NCard>
              <NStatistic label="Monthly Requests">
                {{ default: () => usage.value?.metrics.monthly.toLocaleString() || '0' }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Storage Used">
                {{ default: () => (usage.value ? (usage.value.storage / 1024 / 1024).toFixed(2) + ' MB' : '0 MB') }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Active API Keys">{{ default: () => usage.value?.apiKeys || 0 }}</NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard title="Usage Trend (Last 7 Days)">
          <div class="h-[300px]">{chartOption.value && <BaseChart option={chartOption.value} />}</div>
        </NCard>
      </div>
    )
  }
})
