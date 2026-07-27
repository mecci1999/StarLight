import { defineComponent, ref, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MobileButton, MobileCard, MobileEmpty, MobileLoading, MobileTag } from '@/mobile/ui'
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

    onActivated(loadServiceDetail)

    return () => (
      <div class="mobile-service-detail-v2">
        <div class="mobile-service-detail-v2__header">
          <div>
            <h2 class="mobile-service-detail-v2__title">服务详情</h2>
            <div class="mobile-service-detail-v2__subtitle">移动端 service-first 摘要详情</div>
          </div>
          <MobileButton size="small" type="ghost" class="mobile-service-detail-v2__refresh" onClick={loadServiceDetail}>
            刷新
          </MobileButton>
        </div>

        {loading.value ? (
          <div class="mobile-service-detail-v2__loading">
            <MobileLoading size="32px" />
          </div>
        ) : !service.value ? (
          <div class="mobile-service-detail-v2__state">
            <MobileEmpty description="未找到对应服务" />
          </div>
        ) : (
          <>
            <MobileCard size="small" bordered={false} class="mobile-service-detail-v2__identity">
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
                <MobileTag
                  size="small"
                  type={
                    service.value.health === 'healthy'
                      ? 'success'
                      : service.value.health === 'warning'
                        ? 'warning'
                        : service.value.health === 'unknown'
                          ? 'default'
                          : 'danger'
                  }>
                  {service.value.health === 'healthy'
                    ? '健康'
                    : service.value.health === 'warning'
                      ? '关注'
                      : service.value.health === 'unknown'
                        ? '未知'
                        : '异常'}
                </MobileTag>
              </div>
            </MobileCard>

            <div class="mobile-service-detail-v2__stats-grid">
              {(
                [
                  { label: 'QPS', value: displayMetric(summary.value.qps) },
                  { label: '响应时间', value: displayMetric(summary.value.responseTime, 'ms') },
                  { label: '错误率', value: displayMetric(summary.value.errorRate, '%') },
                  { label: '活跃连接', value: displayMetric(summary.value.activeConnections) }
                ] as Array<{ label: string; value: string | number }>
              ).map((item) => (
                <MobileCard key={item.label} size="small" bordered={false} class="mobile-service-detail-v2__stat-card">
                  <div class="mobile-service-detail-v2__stat-label">{item.label}</div>
                  <div class="mobile-service-detail-v2__stat-value">{item.value}</div>
                </MobileCard>
              ))}
            </div>

            <MobileCard size="small" bordered={false} class="mobile-service-detail-v2__runtime-card">
              <h3 class="mobile-service-detail-v2__runtime-title">运行摘要</h3>
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
            </MobileCard>
          </>
        )}

        <div class="mobile-service-detail-v2__footer">
          <MobileButton block onClick={() => router.push('/mobile/services-v2')}>
            返回服务目录
          </MobileButton>
        </div>
      </div>
    )
  }
})
