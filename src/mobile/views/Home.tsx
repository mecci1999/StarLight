import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NStatistic, NGrid, NGridItem, NIcon, NList, NListItem, NThing, NTag, NSpace, NButton } from 'naive-ui'
import { PulseOutline, TimeOutline, ServerOutline, WarningOutline } from '@vicons/ionicons5'
import { fetchAlerts, fetchOverviewSummary, type MetricsDatasetScope } from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'

export default defineComponent({
  name: 'MobileHome',
  setup() {
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const stats = ref<any>({
      totalRequests: null,
      p95Latency: null,
      activeInstances: null,
      alerts: []
    })
    const loading = ref(true)
    const loadError = ref(false)

    const loadData = async () => {
      try {
        loading.value = true
        const [overviewRes, alertsRes] = await Promise.all([
          fetchOverviewSummary({ scope: datasetScope.value }),
          fetchAlerts({ status: 'active', scope: datasetScope.value })
        ])
        const totals = overviewRes?.totals || {}
        stats.value = {
          totalRequests: totals.totalRequests ?? null,
          p95Latency: totals.p95Latency ?? null,
          activeInstances: null,
          alerts: Array.isArray(alertsRes) ? alertsRes.slice(0, 5) : []
        }
        loadError.value = false
      } catch (error) {
        console.error('Failed to load mobile home data:', error)
        stats.value = {
          totalRequests: null,
          p95Latency: null,
          activeInstances: null,
          alerts: []
        }
        loadError.value = true
      } finally {
        loading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    onMounted(() => {
      loadData()
    })

    return () => (
      <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-1)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: '0', fontSize: '20px', color: 'var(--color-text-1)' }}>星光移动端</h2>
          <NSpace>
            <NTag type="info" size="small" bordered={false}>
              实时视图
            </NTag>
          </NSpace>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <NSpace>
            <NButton type="primary" secondary onClick={() => window.location.assign('/mobile/overview-v2')}>
              新版概览
            </NButton>
            <NButton secondary onClick={() => window.location.assign('/mobile/services-v2')}>
              新版服务
            </NButton>
          </NSpace>
        </div>

        {loadError.value ? (
          <NCard size="small" style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--color-text-3)' }}>移动端数据暂时不可用，请稍后重试。</div>
          </NCard>
        ) : null}

        <NGrid cols={2} xGap={12} yGap={12}>
          <NGridItem>
            <NCard size="small">
              <NStatistic label="请求总量">
                {{
                  prefix: () => <NIcon component={PulseOutline} color="#165dff" />,
                  default: () => displayMetric(stats.value.totalRequests)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small">
              <NStatistic label="P95 延迟 (ms)">
                {{
                  prefix: () => <NIcon component={TimeOutline} color="#ff7d00" />,
                  default: () => displayMetric(stats.value.p95Latency, 'ms')
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard size="small">
              <NStatistic label="Active Instances">
                {{
                  prefix: () => <NIcon component={ServerOutline} color="#00b42a" />,
                  default: () => displayMetric(stats.value.activeInstances)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '16px', color: '#666' }}>Active Alerts</h3>

        <NCard size="small">
          <NList>
            {stats.value.alerts?.map((alert: any) => (
              <NListItem key={alert.id}>
                <NThing title={alert.service}>
                  {{
                    'header-extra': () => (
                      <NTag type={alert.level === 'critical' ? 'error' : 'warning'} size="small">
                        {alert.level}
                      </NTag>
                    ),
                    description: () => alert.message,
                    avatar: () => (
                      <NIcon component={WarningOutline} color={alert.level === 'critical' ? '#d03050' : '#f0a020'} />
                    )
                  }}
                </NThing>
              </NListItem>
            ))}
          </NList>
        </NCard>
      </div>
    )
  }
})
