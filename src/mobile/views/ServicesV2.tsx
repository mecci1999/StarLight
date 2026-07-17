import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NButton, NEmpty, NSpin, NTag } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { fetchCatalogServices } from '@/api'

import type { ServiceItem } from '@/types/monitor'
import './ServicesV2.scss'

export default defineComponent({
  name: 'MobileServicesV2',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const services = ref<ServiceItem[]>([])

    const loadServices = async (keyword?: string) => {
      loading.value = true
      try {
        const params: any = { page: 1, pageSize: 50, scope: 'system' }
        if (keyword) params.keyword = keyword
        const res = await fetchCatalogServices(params)
        const items = res?.items || []
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
      } finally {
        loading.value = false
      }
    }

    onMounted(() => loadServices(route.query.keyword as string))

    return () => (
      <div class="mobile-services-v2">
        <div class="mobile-services-v2__header">
          <div>
            <h2 class="mobile-services-v2__title">服务目录</h2>
            <div class="mobile-services-v2__subtitle">移动端摘要列表</div>
          </div>
          <NButton size="small" secondary type="primary" onClick={() => loadServices()}>
            刷新
          </NButton>
        </div>

        {loading.value ? (
          <div class="mobile-services-v2__loading">
            <NSpin size="large" />
          </div>
        ) : services.value.length ? (
          <div class="mobile-services-v2__list">
            {services.value.map((service) => (
              <NCard key={service.id} size="small" bordered={false} class="mobile-services-v2__card">
                <div class="mobile-services-v2__card-content">
                  <div class="mobile-services-v2__card-main">
                    <div class="mobile-services-v2__card-title">{service.name}</div>
                    <div class="mobile-services-v2__card-meta">
                      Owner: {service.owner || '-'} · 区域: {service.region || '-'}
                    </div>
                    <div class="mobile-services-v2__card-stats">
                      QPS {service.qps ?? '未知'}
                      {typeof service.qps === 'number' ? '' : ''} · 延迟 {service.latency ?? '未知'}
                      {typeof service.latency === 'number' ? 'ms' : ''} · 错误率 {service.errorRate ?? '未知'}
                      {typeof service.errorRate === 'number' ? '%' : ''}
                    </div>
                  </div>
                  <div class="mobile-services-v2__card-actions">
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
                    <NButton
                      size="tiny"
                      secondary
                      type="primary"
                      onClick={() => router.push(`/mobile/service-detail-v2/${service.id}`)}>
                      详情
                    </NButton>
                  </div>
                </div>
              </NCard>
            ))}
          </div>
        ) : (
          <NEmpty description="暂无服务数据" class="mobile-services-v2__empty-state" />
        )}

        <div class="mobile-services-v2__footer">
          <NButton block onClick={() => router.push('/mobile/overview-v2')}>
            返回概览
          </NButton>
        </div>
      </div>
    )
  }
})
