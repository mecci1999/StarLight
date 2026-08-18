import { defineComponent, ref, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MobileButton, MobileCard, MobileEmpty, MobileLoading, MobileTag } from '@/mobile/ui'
import { fetchServiceDetailSummary } from '@/api'

import type { ServiceItem } from '@/types/monitor'
import { investigationQuery, parseInvestigationContext } from '@/mobile/hooks/investigationContext'
import './ServiceDetailV2.scss'

export default defineComponent({
  name: 'MobileServiceDetailV2',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const error = ref(false)
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
    let detailRequestId = 0

    const loadServiceDetail = async () => {
      const requestId = ++detailRequestId
      const serviceId = String(route.params.serviceId || '')

      // This view stays mounted in the mobile KeepAlive cache. Route watchers still
      // run after navigation, so never turn an unrelated route into serviceId="".
      if (route.name !== 'mobile-service-detail-v2' || !serviceId) return

      loading.value = true
      error.value = false
      try {
        const context = parseInvestigationContext(route.query)
        const detailRes = await fetchServiceDetailSummary(serviceId, {
          scope: 'system',
          ...(context.range ? { timeRange: `-${context.range}` } : {})
        })
        if (requestId !== detailRequestId) return
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
      } catch (loadError) {
        if (requestId !== detailRequestId) return
        console.error('Failed to load mobile service detail:', loadError)
        service.value = null
        error.value = true
      } finally {
        if (requestId === detailRequestId) loading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    onActivated(loadServiceDetail)
    watch(
      () => route.params.serviceId,
      () => void loadServiceDetail()
    )
    watch(
      () => route.query,
      () => void loadServiceDetail()
    )

    const investigate = (path: string, extras: { serviceName?: string } = {}) => {
      const context = parseInvestigationContext(route.query)
      const serviceId = String(route.params.serviceId || '')
      router.push({ path, query: investigationQuery({ ...context, serviceId, ...extras }) })
    }

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
        ) : error.value ? (
          <div class="mobile-service-detail-v2__state">
            <MobileEmpty description="服务详情加载失败，请检查网络后重试">
              <MobileButton size="small" type="primary" onClick={loadServiceDetail}>
                重试
              </MobileButton>
            </MobileEmpty>
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
            <div class="mobile-service-detail-v2__footer">
              <MobileButton size="small" onClick={() => investigate('/mobile/metrics-explorer')}>
                查看指标
              </MobileButton>
              <MobileButton size="small" onClick={() => investigate('/mobile/instance-monitor')}>
                查看实例
              </MobileButton>
              {service.value.name && (
                <>
                  <MobileButton
                    size="small"
                    onClick={() => investigate('/mobile/log-center', { serviceName: service.value?.name })}>
                    查看日志
                  </MobileButton>
                  <MobileButton
                    size="small"
                    onClick={() => investigate('/mobile/trace-explorer', { serviceName: service.value?.name })}>
                    查看链路
                  </MobileButton>
                </>
              )}
            </div>
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
