import { defineComponent, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NEmpty, NGrid, NGridItem, NSpin, NStatistic, NTag } from 'naive-ui'
import { fetchServiceDetailSummary } from '@/api'

import type { ServiceItem } from '@/types/monitor'
import './ServiceDetailV2.scss'

export default defineComponent({
  name: 'MobileServiceDetailV2',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const serviceId = String(route.params.serviceId || '')
    const loading = ref(false)
    const service = ref<ServiceItem | null>(null)
    const summary = ref<{
      cpu: number | null
      memory: number | null
      qps: number | null
      responseTime: number | null
      errorRate: number | null
      activeConnections: number | null
      instances: number | null
    }>({
      cpu: null,
      memory: null,
      qps: null,
      responseTime: null,
      errorRate: null,
      activeConnections: null,
      instances: null
    })

    const loadServiceDetail = async () => {
      loading.value = true
      try {
        const detailRes = await fetchServiceDetailSummary(serviceId)
        const identity = detailRes?.identity
        const detailSummary = detailRes?.summary

        service.value = identity
          ? {
              id: identity.id,
              name: identity.name,
              owner: identity.owner,
              region: identity.region,
              version: detailSummary?.version ?? identity.runtime,
              tags: identity.tags || [],
              health: identity.healthStatus,
              status:
                identity.healthStatus === 'healthy'
                  ? 'running'
                  : identity.healthStatus === 'unknown'
                    ? 'unknown'
                    : 'error',
              instances: detailSummary?.instances ?? null,
              qps: detailSummary?.qps ?? null,
              latency: detailSummary?.responseTime ?? null,
              errorRate: detailSummary?.errorRate ?? null,
              lastUpdate: new Date().toISOString()
            }
          : null
        summary.value = {
          cpu: detailSummary?.cpu ?? null,
          memory: detailSummary?.memory ?? null,
          qps: detailSummary?.qps ?? null,
          responseTime: detailSummary?.responseTime ?? null,
          errorRate: detailSummary?.errorRate ?? null,
          activeConnections: detailSummary?.activeConnections ?? null,
          instances: detailSummary?.instances ?? null
        }
      } finally {
        loading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    onMounted(loadServiceDetail)

    return () => (
      <div class="mobile-service-detail-v2">
        <div class="mobile-service-detail-v2__header">
          <div>
            <h2 class="mobile-service-detail-v2__title">服务详情</h2>
            <div class="mobile-service-detail-v2__subtitle">移动端 service-first 摘要详情</div>
          </div>
          <NButton size="small" secondary type="primary" onClick={loadServiceDetail}>
            刷新
          </NButton>
        </div>

        {loading.value ? (
          <div class="mobile-service-detail-v2__loading">
            <NSpin size="large" />
          </div>
        ) : !service.value ? (
          <NEmpty description="未找到对应服务" class="mobile-service-detail-v2__empty-state" />
        ) : (
          <>
            <NCard size="small" bordered={false} class="mobile-service-detail-v2__identity">
              <div class="mobile-service-detail-v2__identity-content">
                <div class="mobile-service-detail-v2__identity-main">
                  <div class="mobile-service-detail-v2__identity-title">{service.value.name}</div>
                  <div class="mobile-service-detail-v2__identity-meta">
                    Owner: {service.value.owner || '-'} · 区域: {service.value.region || '-'}
                  </div>
                  <div class="mobile-service-detail-v2__identity-submeta">
                    版本: {service.value.version || '-'} · 实例数: {displayMetric(summary.value.instances)}
                  </div>
                </div>
                <NTag
                  size="small"
                  bordered={false}
                  type={
                    service.value.health === 'healthy'
                      ? 'success'
                      : service.value.health === 'warning'
                        ? 'warning'
                        : service.value.health === 'unknown'
                          ? 'default'
                          : 'error'
                  }>
                  {service.value.health === 'healthy'
                    ? '健康'
                    : service.value.health === 'warning'
                      ? '关注'
                      : service.value.health === 'unknown'
                        ? '未知'
                        : '异常'}
                </NTag>
              </div>
            </NCard>

            <NGrid cols={2} xGap={12} yGap={12} class="mobile-service-detail-v2__stats-grid">
              {(
                [
                  { label: 'QPS', value: displayMetric(summary.value.qps) },
                  { label: '响应时间', value: displayMetric(summary.value.responseTime, 'ms') },
                  { label: '错误率', value: displayMetric(summary.value.errorRate, '%') },
                  { label: '活跃连接', value: displayMetric(summary.value.activeConnections) }
                ] as Array<{ label: string; value: string | number }>
              ).map((item) => (
                <NGridItem key={item.label}>
                  <NCard size="small" bordered={false} class="mobile-service-detail-v2__stat-card">
                    <NStatistic label={item.label} value={item.value} />
                  </NCard>
                </NGridItem>
              ))}
            </NGrid>

            <NCard size="small" bordered={false} class="mobile-service-detail-v2__runtime-card" title="运行摘要">
              <div class="mobile-service-detail-v2__runtime-grid">
                <div class="mobile-service-detail-v2__runtime-block">
                  <div class="mobile-service-detail-v2__runtime-label">CPU</div>
                  <div class="mobile-service-detail-v2__runtime-value">{displayMetric(summary.value.cpu, '%')}</div>
                </div>
                <div class="mobile-service-detail-v2__runtime-block">
                  <div class="mobile-service-detail-v2__runtime-label">内存</div>
                  <div class="mobile-service-detail-v2__runtime-value">{displayMetric(summary.value.memory, '%')}</div>
                </div>
              </div>
            </NCard>
          </>
        )}

        <div class="mobile-service-detail-v2__footer">
          <NButton block onClick={() => router.push('/mobile/services-v2')}>
            返回服务目录
          </NButton>
        </div>
      </div>
    )
  }
})
