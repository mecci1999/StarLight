import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NTag, NButton, NSpin, NEmpty } from 'naive-ui'
import { useRouter } from 'vue-router'
import { fetchCatalogServices, fetchOverviewSummary } from '@/api'

import type { ServiceItem } from '@/types/monitor'
import './OverviewV2.scss'

export default defineComponent({
  name: 'MobileOverviewV2',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const services = ref<ServiceItem[]>([])
    const summary = ref<{
      serviceCount: number | null
      activeAlerts: number | null
      errorRate: number | null
      totalRequests: number | null
    }>({
      serviceCount: null,
      activeAlerts: null,
      errorRate: null,
      totalRequests: null
    })

    const loadData = async () => {
      loading.value = true
      try {
        const [catalogRes, summaryRes] = await Promise.all([
          fetchCatalogServices({ page: 1, pageSize: 50 }),
          fetchOverviewSummary()
        ])
        const items = catalogRes?.items || []
        services.value = items.map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name,
          owner: item.identity?.owner,
          region: item.identity?.region,
          version: item.identity?.runtime,
          tags: item.identity?.tags || [],
          health: item.identity?.healthStatus,
          status:
            item.identity?.healthStatus === 'healthy'
              ? 'running'
              : item.identity?.healthStatus === 'unknown'
                ? 'unknown'
                : 'error',
          qps: item.qps,
          latency: item.p95Latency,
          errorRate: item.errorRate,
          instances: item.instanceCount,
          lastDeploy: item.lastDeployAt
        }))
        const totals = summaryRes?.totals || {}
        summary.value = {
          serviceCount: totals.serviceCount ?? null,
          activeAlerts: totals.activeIncidents ?? null,
          errorRate: totals.errorRate ?? null,
          totalRequests: totals.totalRequests ?? null
        }
      } finally {
        loading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    onMounted(loadData)

    const topRiskServices = () =>
      [...services.value]
        .sort((a, b) => {
          const left =
            typeof a.errorRate === 'number' && typeof a.latency === 'number' ? a.errorRate + a.latency / 10 : -1
          const right =
            typeof b.errorRate === 'number' && typeof b.latency === 'number' ? b.errorRate + b.latency / 10 : -1
          return right - left
        })
        .slice(0, 4)

    return () => (
      <div class="mobile-overview-v2">
        <div class="mobile-overview-v2__header">
          <div>
            <h2 class="mobile-overview-v2__title">面板</h2>
            <div class="mobile-overview-v2__subtitle">移动端摘要视图</div>
          </div>
          <NButton size="small" secondary type="primary" onClick={loadData}>
            刷新
          </NButton>
        </div>

        {loading.value ? (
          <div class="mobile-overview-v2__loading">
            <NSpin size="large" />
          </div>
        ) : (
          <>
            <NGrid cols={2} xGap={12} yGap={12} class="mobile-overview-v2__stats-grid">
              <NGridItem>
                <NCard size="small" bordered={false} class="mobile-overview-v2__summary-card">
                  <NStatistic label="服务总数" value={displayMetric(summary.value.serviceCount)} />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" bordered={false} class="mobile-overview-v2__summary-card">
                  <NStatistic label="活跃告警" value={displayMetric(summary.value.activeAlerts)} />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" bordered={false} class="mobile-overview-v2__summary-card">
                  <NStatistic label="错误率" value={displayMetric(summary.value.errorRate, '%')} />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" bordered={false} class="mobile-overview-v2__summary-card">
                  <NStatistic label="请求总量" value={displayMetric(summary.value.totalRequests)} />
                </NCard>
              </NGridItem>
            </NGrid>

            <NCard size="small" bordered={false} class="mobile-overview-v2__risk-card" title="风险服务">
              {topRiskServices().length ? (
                <div class="mobile-overview-v2__risk-list">
                  {topRiskServices().map((service) => (
                    <div class="mobile-overview-v2__risk-item" key={service.id}>
                      <div>
                        <div class="mobile-overview-v2__risk-name">{service.name}</div>
                        <div class="mobile-overview-v2__risk-meta">
                          错误率 {service.errorRate ?? '未知'}
                          {typeof service.errorRate === 'number' ? '%' : ''} · 延迟 {service.latency ?? '未知'}
                          {typeof service.latency === 'number' ? 'ms' : ''}
                        </div>
                      </div>
                      <NTag
                        size="small"
                        bordered={false}
                        type={
                          service.health === 'healthy'
                            ? 'success'
                            : service.health === 'warning'
                              ? 'warning'
                              : service.health === 'unknown'
                                ? 'default'
                                : 'error'
                        }>
                        {service.health === 'healthy'
                          ? '健康'
                          : service.health === 'warning'
                            ? '关注'
                            : service.health === 'unknown'
                              ? '未知'
                              : '异常'}
                      </NTag>
                    </div>
                  ))}
                </div>
              ) : (
                <NEmpty description="暂无数据" class="mobile-overview-v2__empty-state" />
              )}
            </NCard>

            <div class="mobile-overview-v2__footer-actions">
              <NButton block secondary type="primary" onClick={() => router.push('/mobile/services-v2')}>
                查看服务目录
              </NButton>
              <NButton block onClick={() => router.push('/mobile/home')}>
                返回旧首页
              </NButton>
            </div>
          </>
        )}
      </div>
    )
  }
})
