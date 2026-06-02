import { computed, defineComponent, ref, onMounted } from 'vue'
import { NCard, NProgress, NSpin, NTag } from 'naive-ui'
import BaseChart from '@/components/charts/BaseChart'
import * as api from '@/api/subscription'
import './UsageTab.scss'

type UsageQuota = {
  type: string
  current: number
  total: number
}

const quotaLabels: Record<string, string> = {
  maxMetricsPerMonth: '月度指标写入',
  maxCustomSchemas: '自定义 Schema',
  maxAppKeys: '活跃 API Key'
}

const displayUsage = (value: number | null | undefined) => (typeof value === 'number' ? value.toLocaleString() : '未知')

const getQuotaPercent = (quota?: UsageQuota) => {
  if (!quota || !quota.total) return 0
  return Math.min(Math.round((quota.current / quota.total) * 100), 100)
}

export default defineComponent({
  name: 'BillingUsage',
  setup() {
    const loading = ref(false)
    const historyUnavailable = ref(false)
    const usage = ref<api.SubscriptionUsageSummary | null>(null)
    const chartOption = ref<any>(null)

    const quotas = computed<UsageQuota[]>(() => usage.value?.quotas || [])
    const primaryQuota = computed(() => quotas.value.find((item) => item.type === 'maxMetricsPerMonth'))
    const schemaQuota = computed(() => quotas.value.find((item) => item.type === 'maxCustomSchemas'))
    const apiKeyQuota = computed(() => quotas.value.find((item) => item.type === 'maxAppKeys'))
    const planSummary = computed(() => usage.value?.summary || null)

    const fetchUsage = async () => {
      loading.value = true
      historyUnavailable.value = false
      try {
        const summary = await api.getUsageSummary()
        usage.value = summary

        const history = await api
          .getQuotaHistory({ quotaType: 'maxMetricsPerMonth', timeRange: '7d', limit: 100 })
          .catch((error) => {
            console.error('Failed to fetch quota history:', error)
            historyUnavailable.value = true
            return { history: [] }
          })

        const historyItems = history?.history || []
        const dates = historyItems.map((item) => item.timestamp?.slice(5, 16) || item.timestamp)
        const values = historyItems.map((item) => item.current)

        chartOption.value = {
          color: ['#165dff'],
          tooltip: { trigger: 'axis' },
          grid: { left: 36, right: 20, top: 28, bottom: 28 },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLine: { lineStyle: { color: '#e5e6eb' } },
            axisTick: { show: false }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f2f3f5' } }
          },
          series: [
            {
              name: '月度指标写入',
              type: 'line',
              smooth: true,
              lineStyle: { width: 2 },
              showSymbol: false,
              areaStyle: { opacity: 0.08, color: '#165dff' },
              emphasis: { focus: 'series' },
              data: values
            }
          ]
        }
      } catch (e) {
        console.error('Failed to fetch usage', e)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchUsage)

    const renderQuotaCard = (quota: UsageQuota | undefined, fallbackType: string) => {
      const label = quotaLabels[quota?.type || fallbackType] || quota?.type || fallbackType
      const percent = getQuotaPercent(quota)

      return (
        <NCard bordered={false} class="billing-usage-tab__quota-card">
          <div class="billing-usage-tab__quota-head">
            <span>{label}</span>
            <NTag size="small" bordered={false} type={percent >= 85 ? 'warning' : 'success'}>
              {percent}%
            </NTag>
          </div>
          <strong>{quota ? `${displayUsage(quota.current)} / ${displayUsage(quota.total)}` : '未知'}</strong>
          <NProgress percentage={percent} showIndicator={false} status={percent >= 85 ? 'warning' : 'success'} />
        </NCard>
      )
    }

    return () => (
      <div class="billing-usage-tab">
        <div class="billing-usage-tab__section-head">
          <div>
            <h3>使用概览</h3>
            <p>确认当前套餐、核心配额和最近 7 天指标写入趋势。</p>
          </div>
          <NTag bordered={false} type="info">
            {planSummary.value?.planDisplayName || planSummary.value?.planName || '当前套餐'}
          </NTag>
        </div>

        {loading.value && !usage.value ? (
          <div class="billing-usage-tab__loading">
            <NSpin />
          </div>
        ) : (
          <>
            <div class="billing-usage-tab__quota-grid">
              {renderQuotaCard(primaryQuota.value, 'maxMetricsPerMonth')}
              {renderQuotaCard(schemaQuota.value, 'maxCustomSchemas')}
              {renderQuotaCard(apiKeyQuota.value, 'maxAppKeys')}
            </div>

            <NCard bordered={false} class="billing-usage-tab__chart-card">
              <div class="billing-usage-tab__section-head billing-usage-tab__section-head--compact">
                <div>
                  <h3>最近 7 天趋势</h3>
                  <p>用于判断是否需要升级套餐或调整采集策略。</p>
                </div>
                <span>到期时间：{planSummary.value?.expiresAt || '—'}</span>
              </div>
              <div class="billing-usage-tab__chart">
                {historyUnavailable.value ? (
                  <div class="billing-usage-tab__chart-empty">趋势数据暂时不可用，配额概览仍可正常查看。</div>
                ) : (
                  chartOption.value && <BaseChart option={chartOption.value} />
                )}
              </div>
            </NCard>
          </>
        )}
      </div>
    )
  }
})
