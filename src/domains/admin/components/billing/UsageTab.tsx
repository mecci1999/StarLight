import { defineComponent, ref, onMounted } from 'vue'
import { NGrid, NGridItem, NCard, NStatistic, NProgress } from 'naive-ui'
import BaseChart from '@/components/charts/BaseChart'
import * as api from '@/api/subscription'
import { graphic } from 'echarts/core'
import './UsageTab.scss'

export default defineComponent({
  name: 'BillingUsage',
  setup() {
    const usage = ref<any>(null)
    const chartOption = ref<any>(null)

    const fetchUsage = async () => {
      try {
        const [res, history] = await Promise.all([
          api.getUsageSummary(),
          api.getQuotaHistory({ quotaType: 'maxMetricsPerMonth', timeRange: '7d', limit: 100 })
        ])
        usage.value = res

        const historyItems = history?.history || []
        const dates = historyItems.map((item) => item.timestamp)
        const values = historyItems.map((item) => item.current)

        chartOption.value = {
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', boundaryGap: false, data: dates },
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
              data: values
            }
          ]
        }
      } catch (e) {
        console.error('Failed to fetch usage', e)
      }
    }

    const displayUsage = (value: number | null | undefined) =>
      typeof value === 'number' ? value.toLocaleString() : '未知'

    onMounted(fetchUsage)

    return () => (
      <div class="billing-usage-tab billing-usage-tab__stack">
        <NGrid x-gap={12} cols={3}>
          <NGridItem>
            <NCard>
              <NStatistic label="月度请求量">
                {{
                  default: () =>
                    displayUsage(usage.value?.quotas?.find((item: any) => item.type === 'maxMetricsPerMonth')?.current)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="资源使用">
                {{
                  default: () => {
                    const quota = usage.value?.quotas?.find((item: any) => item.type === 'maxCustomSchemas')
                    return quota ? `${displayUsage(quota.current)} / ${displayUsage(quota.total)}` : '未知'
                  }
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="活跃 API Key">
                {{
                  default: () =>
                    displayUsage(usage.value?.quotas?.find((item: any) => item.type === 'maxAppKeys')?.current)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard title="Usage Trend (Last 7 Days)">
          <div class="billing-usage-tab__chart">{chartOption.value && <BaseChart option={chartOption.value} />}</div>
        </NCard>
      </div>
    )
  }
})
