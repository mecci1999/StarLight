import { defineComponent, ref, onActivated, h } from 'vue'
import {
  MobileButton,
  MobileCard,
  MobileTag,
  MobileEmpty,
  MobileLoading,
  MobileList,
  MobileListItem,
  MobileStatistic
} from '@/mobile/ui'
import { PhActivity, PhClock, PhWarning } from '@phosphor-icons/vue'
import { fetchAlerts, fetchOverviewSummary, type MetricsDatasetScope } from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import { useActivationRefresh } from '@/mobile/hooks/useActivationRefresh'
import './Home.scss'

export default defineComponent({
  name: 'MobileHome',
  setup() {
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const stats = ref<any>({ totalRequests: null, p95Latency: null, alerts: [] })
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
          alerts: Array.isArray(alertsRes) ? alertsRes.slice(0, 5) : []
        }
        loadError.value = false
      } catch {
        loadError.value = true
      } finally {
        loading.value = false
      }
    }

    const shouldRefreshOnActivation = useActivationRefresh(30_000)

    const displayMetric = (v: number | null | undefined, s = '') => (typeof v === 'number' ? `${v}${s}` : '--')

    onActivated(() => {
      if (shouldRefreshOnActivation()) void loadData()
    })

    return () => (
      <div class="mobile-home">
        <div class="mobile-home__header">
          <h1 class="mobile-home__title">星光概览</h1>
          <MobileTag type="info" size="small" plain>
            实时视图
          </MobileTag>
        </div>

        {loading.value ? (
          <div class="mobile-home__loading">
            <MobileLoading size="36px" />
          </div>
        ) : loadError.value ? (
          <div class="mobile-home__error">
            <MobileEmpty description="数据加载失败" />
            <MobileButton size="small" type="primary" onClick={loadData}>
              重试
            </MobileButton>
          </div>
        ) : (
          <>
            <div
              style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--spacing-3)"
              class="mobile-home__metrics">
              <MobileCard size="small" bordered={false} class="mobile-home__metric-card">
                <div class="mobile-home__metric-icon mobile-home__metric-icon--blue">{h(PhActivity, { size: 20 })}</div>
                <MobileStatistic label="请求总量" value={displayMetric(stats.value.totalRequests)} />
              </MobileCard>
              <MobileCard size="small" bordered={false} class="mobile-home__metric-card">
                <div class="mobile-home__metric-icon mobile-home__metric-icon--orange">{h(PhClock, { size: 20 })}</div>
                <MobileStatistic label="P95 延迟" value={displayMetric(stats.value.p95Latency, 'ms')} />
              </MobileCard>
            </div>

            <div class="mobile-home__section-title">活跃告警</div>
            <MobileCard size="small" bordered={false} class="mobile-home__alerts-card">
              {stats.value.alerts?.length > 0 ? (
                <MobileList>
                  {stats.value.alerts.map((alert: any) => (
                    <MobileListItem key={alert.id} title={alert.service} label={alert.message}>
                      {{
                        icon: () => (
                          <div class={['mobile-home__alert-dot', `mobile-home__alert-dot--${alert.level}`]} />
                        ),
                        extra: () => (
                          <MobileTag type={alert.level === 'critical' ? 'danger' : 'warning'} size="small" plain>
                            {alert.level}
                          </MobileTag>
                        )
                      }}
                    </MobileListItem>
                  ))}
                </MobileList>
              ) : (
                <MobileEmpty description="暂无活跃告警" />
              )}
            </MobileCard>
          </>
        )}
      </div>
    )
  }
})
