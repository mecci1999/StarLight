import { defineComponent, ref, onActivated } from 'vue'
import { MobileButton, MobileCard, MobileEmpty, MobileLoading, MobileTag } from '@/mobile/ui'
import { useRouter, useRoute } from 'vue-router'
import { fetchCatalogServices } from '@/api'
import { useActivationRefresh } from '@/mobile/hooks/useActivationRefresh'

import type { ServiceItem } from '@/types/monitor'
import './ServicesV2.scss'

export default defineComponent({
  name: 'MobileServicesV2',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const loadingMore = ref(false)
    const loadMoreError = ref(false)
    const error = ref(false)
    const services = ref<ServiceItem[]>([])
    const page = ref(1)
    const total = ref(0)
    const hasMore = computed(() => services.value.length < total.value)
    const pageSize = 50
    const shouldRefreshOnActivation = useActivationRefresh(30_000, {
      contextKey: () => String(route.query.keyword || '')
    })

    const mapServices = (items: any[]): ServiceItem[] =>
      items.map((item: any) => ({
        id: item.identity?.id,
        name: item.identity?.displayName || item.identity?.name,
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
        lastDeploy: item.lastDeployAt,
        lastUpdate: item.lastUpdate || item.lastDeployAt || new Date().toISOString()
      }))

    const loadServices = async (keyword?: string) => {
      loading.value = true
      error.value = false
      loadMoreError.value = false
      try {
        const params: any = { page: 1, pageSize, scope: 'system' }
        if (keyword) params.keyword = keyword
        const res = await fetchCatalogServices(params)
        const items = res?.items || []
        services.value = mapServices(items)
        page.value = 1
        total.value = typeof res?.total === 'number' ? res.total : items.length
      } catch (loadError) {
        console.error('Failed to load mobile services:', loadError)
        services.value = []
        error.value = true
      } finally {
        loading.value = false
      }
    }

    const loadMore = async () => {
      if (loadingMore.value || !hasMore.value) return
      loadingMore.value = true
      loadMoreError.value = false
      try {
        const nextPage = page.value + 1
        const res = await fetchCatalogServices({
          page: nextPage,
          pageSize,
          scope: 'system',
          keyword: route.query.keyword as string | undefined
        })
        const existingIds = new Set(services.value.map((service) => service.id))
        const incoming = mapServices(res?.items || []).filter((service) => !existingIds.has(service.id))
        services.value = [...services.value, ...incoming]
        page.value = nextPage
        total.value = typeof res?.total === 'number' ? res.total : services.value.length
      } catch (loadError) {
        console.error('Failed to load more mobile services:', loadError)
        loadMoreError.value = true
      } finally {
        loadingMore.value = false
      }
    }

    const refresh = () => loadServices(route.query.keyword as string)

    onActivated(() => {
      if (shouldRefreshOnActivation()) refresh()
    })

    return () => (
      <div class="mobile-services-v2">
        <div class="mobile-services-v2__header">
          <div>
            <h2 class="mobile-services-v2__title">服务目录</h2>
            <div class="mobile-services-v2__subtitle">移动端摘要列表</div>
          </div>
          <MobileButton size="small" type="ghost" class="mobile-services-v2__refresh" onClick={refresh}>
            刷新
          </MobileButton>
        </div>

        {loading.value ? (
          <div class="mobile-services-v2__loading">
            <MobileLoading size="32px" />
          </div>
        ) : error.value ? (
          <div class="mobile-services-v2__state">
            <MobileEmpty description="服务目录加载失败，请检查网络后重试">
              <MobileButton size="small" type="primary" onClick={refresh}>
                重试
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : services.value.length ? (
          <>
            <div class="mobile-services-v2__list">
              {services.value.map((service) => (
                <MobileCard key={service.id} size="small" bordered={false} class="mobile-services-v2__card">
                  <div class="mobile-services-v2__card-content">
                    <div class="mobile-services-v2__card-main">
                      <div class="mobile-services-v2__card-title">{service.name}</div>
                      <div
                        class="mobile-services-v2__card-meta"
                        title={`Owner: ${service.owner || '-'} · 区域: ${service.region || '-'}`}>
                        Owner: {service.owner || '-'} · 区域: {service.region || '-'}
                      </div>
                      <div
                        class="mobile-services-v2__card-stats"
                        title={`QPS ${service.qps ?? '未知'} · 延迟 ${service.latency ?? '未知'}${typeof service.latency === 'number' ? 'ms' : ''} · 错误率 ${service.errorRate ?? '未知'}${typeof service.errorRate === 'number' ? '%' : ''}`}>
                        QPS {service.qps ?? '未知'}
                        {typeof service.qps === 'number' ? '' : ''} · 延迟 {service.latency ?? '未知'}
                        {typeof service.latency === 'number' ? 'ms' : ''} · 错误率 {service.errorRate ?? '未知'}
                        {typeof service.errorRate === 'number' ? '%' : ''}
                      </div>
                    </div>
                    <div class="mobile-services-v2__card-actions">
                      <MobileTag
                        size="small"
                        type={
                          service.health === 'healthy'
                            ? 'success'
                            : service.health === 'warning'
                              ? 'warning'
                              : service.health === 'unknown'
                                ? 'default'
                                : 'danger'
                        }>
                        {service.health === 'healthy'
                          ? '健康'
                          : service.health === 'warning'
                            ? '关注'
                            : service.health === 'unknown'
                              ? '未知'
                              : '异常'}
                      </MobileTag>
                      <MobileButton
                        size="small"
                        type="ghost"
                        class="mobile-services-v2__detail-button"
                        onClick={() => router.push(`/mobile/service-detail-v2/${service.id}`)}>
                        详情
                      </MobileButton>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
            {hasMore.value && (
              <div class="mobile-services-v2__load-more">
                <MobileButton type="primary" loading={loadingMore.value} onClick={loadMore}>
                  加载更多服务 ({services.value.length}/{total.value})
                </MobileButton>
                {loadMoreError.value && <p class="mobile-services-v2__load-more-error">加载更多服务失败，请重试。</p>}
              </div>
            )}
          </>
        ) : (
          <div class="mobile-services-v2__state">
            <MobileEmpty description="暂无服务数据" />
          </div>
        )}

        <div class="mobile-services-v2__footer">
          <MobileButton block onClick={() => router.push('/mobile/overview-v2')}>
            返回概览
          </MobileButton>
        </div>
      </div>
    )
  }
})
