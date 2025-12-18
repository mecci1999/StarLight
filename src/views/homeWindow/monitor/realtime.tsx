import { NCard, NGrid, NGridItem, NStatistic, NProgress, NSpace, NButton, NSelect, NSpin } from 'naive-ui'
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchRealtimeMetrics } from '@/mock/api'
import SectionHeader from '@/components/common/SectionHeader'
import { SpeedometerOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'RealtimeMonitor',
  setup() {
    const selectedService = ref('all')
    const refreshInterval = ref<NodeJS.Timeout | null>(null)
    const loading = ref(false)

    // 模拟实时数据
    const realtimeData = ref({
      cpu: 0,
      memory: 0,
      qps: 0,
      responseTime: 0,
      errorRate: 0,
      activeConnections: 0
    })

    const serviceOptions = [
      { label: '全部服务', value: 'all' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    // 模拟实时数据更新
    const updateRealtimeData = async () => {
      loading.value = true
      const data = await fetchRealtimeMetrics(selectedService.value === 'all' ? undefined : selectedService.value)
      realtimeData.value = data
      loading.value = false
    }

    onMounted(() => {
      // 每5秒更新一次数据
      updateRealtimeData()
      refreshInterval.value = setInterval(updateRealtimeData, 5000)
    })

    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
    })

    const getCpuStatus = (cpu: number) => {
      if (cpu > 80) return 'error'
      if (cpu > 60) return 'warning'
      return 'success'
    }

    const getMemoryStatus = (memory: number) => {
      if (memory > 80) return 'error'
      if (memory > 60) return 'warning'
      return 'success'
    }

    const getResponseTimeColor = (time: number) => {
      if (time > 150) return '#d03050'
      if (time > 100) return '#f0a020'
      return '#18a058'
    }

    return () => (
      <div class="p-24px h-full">
        <SectionHeader title="实时监控" subtitle="实时查看系统性能指标和运行状态" icon={SpeedometerOutline} />

        {/* 控制面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NSelect v-model:value={selectedService.value} options={serviceOptions} style={{ width: '200px' }} />
            <NButton type="primary" onClick={updateRealtimeData}>
              刷新数据
            </NButton>
            <NButton>导出报告</NButton>
          </NSpace>
        </NCard>

        {loading.value ? (
          <div class="py-40px flex items-center justify-center">
            <NSpin size="large" />
          </div>
        ) : null}
        <NGrid cols={3} xGap={16} class="mb-16px">
          <NGridItem>
            <NCard>
              <div class="text-center">
                <div class="text-14px text-[--color-text-3] mb-8px">CPU使用率</div>
                <NProgress
                  type="circle"
                  percentage={realtimeData.value.cpu}
                  status={getCpuStatus(realtimeData.value.cpu)}
                  strokeWidth={8}
                  style={{ width: '120px', margin: '0 auto' }}
                />
                <div class="text-24px font-600 mt-8px">{realtimeData.value.cpu}%</div>
              </div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <div class="text-center">
                <div class="text-14px text-[--color-text-3] mb-8px">内存使用率</div>
                <NProgress
                  type="circle"
                  percentage={realtimeData.value.memory}
                  status={getMemoryStatus(realtimeData.value.memory)}
                  strokeWidth={8}
                  style={{ width: '120px', margin: '0 auto' }}
                />
                <div class="text-24px font-600 mt-8px">{realtimeData.value.memory}%</div>
              </div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <div class="text-center">
                <div class="text-14px text-[--color-text-3] mb-8px">错误率</div>
                <div
                  class="text-48px font-600"
                  style={{ color: realtimeData.value.errorRate > 1 ? '#d03050' : '#18a058' }}>
                  {realtimeData.value.errorRate.toFixed(2)}%
                </div>
              </div>
            </NCard>
          </NGridItem>
        </NGrid>

        {/* 性能指标 */}
        <NGrid cols={3} xGap={16}>
          <NGridItem>
            <NCard>
              <NStatistic
                label="QPS (每秒请求数)"
                value={realtimeData.value.qps.toLocaleString()}
                style={{ fontSize: '24px', fontWeight: '600' }}
              />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic
                label="平均响应时间"
                value={`${realtimeData.value.responseTime}ms`}
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: getResponseTimeColor(realtimeData.value.responseTime)
                }}
              />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic
                label="活跃连接数"
                value={realtimeData.value.activeConnections.toLocaleString()}
                style={{ fontSize: '24px', fontWeight: '600' }}
              />
            </NCard>
          </NGridItem>
        </NGrid>
      </div>
    )
  }
})
