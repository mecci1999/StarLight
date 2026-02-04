import { NCard, NGrid, NGridItem, NStatistic, NProgress, NSpace, NButton, NSelect, NSpin, NEmpty } from 'naive-ui'
import { ref, onMounted, onUnmounted, defineComponent, computed, watch } from 'vue'
import api from '@/api'
import SectionHeader from '@/components/common/SectionHeader'
import { SpeedometerOutline } from '@vicons/ionicons5'
import { useTimeStore } from '@/store/useTimeStore'

export default defineComponent({
  name: 'RealtimeMonitor',
  setup() {
    const timeStore = useTimeStore()
    const selectedService = ref<string | null>(null)
    const refreshInterval = ref<NodeJS.Timeout | null>(null)
    const loading = ref(false)
    const appKeys = ref<any[]>([])

    const realtimeData = ref({
      cpu: 0,
      memory: 0,
      qps: 0,
      responseTime: 0,
      errorRate: 0,
      activeConnections: 0
    })

    const serviceOptions = computed(() => {
      return appKeys.value.map((app) => ({
        label: app.name || app.keyName,
        value: app.appKey
      }))
    })

    const fetchAppKeys = async () => {
      try {
        const res = await api.metrics.getAppKeys()
        if (res && Array.isArray((res as any).appKeys)) {
          appKeys.value = (res as any).appKeys
        } else if (Array.isArray(res)) {
          appKeys.value = res
        }

        if (appKeys.value.length > 0 && !selectedService.value) {
          selectedService.value = appKeys.value[0].appKey
          updateRealtimeData()
        }
      } catch (error) {
        console.error('Failed to fetch app keys:', error)
      }
    }

    const updateRealtimeData = async () => {
      if (!selectedService.value) return

      loading.value = true
      try {
        // Use timeStore range
        const endTime = timeStore.endTime
        const startTime = timeStore.startTime

        // If in live mode, ensure we are fetching strictly up to now if needed,
        // but store handles that usually.
        // Note: queryMetrics might return empty if range is in future, but store handles that.

        const metrics = await api.metrics.queryMetrics({
          appKey: selectedService.value,
          startTime,
          endTime,
          step: '1m',
          metrics: ['cpu', 'memory', 'qps', 'responseTime', 'errorRate', 'connections']
        })

        // Get the latest value from the series (or average if we wanted, but keeping last value logic for now)
        // If viewing history, "Last Value" means "Value at end of selected range".
        const getLastValue = (metricName: string) => {
          const series = (metrics as any)[metricName]
          if (series && Array.isArray(series) && series.length > 0) {
            return series[series.length - 1].value || 0
          }
          return 0
        }

        realtimeData.value = {
          cpu: getLastValue('cpu'),
          memory: getLastValue('memory'),
          qps: getLastValue('qps'),
          responseTime: getLastValue('responseTime'),
          errorRate: getLastValue('errorRate'),
          activeConnections: getLastValue('connections')
        }
      } catch (error) {
        console.error('Failed to update realtime data:', error)
      } finally {
        loading.value = false
      }
    }

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => {
        updateRealtimeData()
      }
    )

    watch(
      () => timeStore.isLive,
      (val) => {
        if (val) {
          updateRealtimeData()
          refreshInterval.value = setInterval(updateRealtimeData, 5000)
        } else {
          if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
            refreshInterval.value = null
          }
        }
      }
    )

    onMounted(() => {
      fetchAppKeys()
      if (timeStore.isLive) {
        refreshInterval.value = setInterval(updateRealtimeData, 5000)
      }
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
      if (time > 150) return 'var(--color-danger-6)'
      if (time > 100) return 'var(--color-warning-6)'
      return 'var(--color-success-6)'
    }

    return () => (
      <div class="p-24px h-full overflow-auto bg-[--color-bg-1]">
        <SectionHeader
          title="Infrastructure Overview"
          subtitle="System performance and health status metrics."
          icon={SpeedometerOutline}
        />

        {/* Control Panel */}
        <NCard class="mb-16px shadow-sm rounded-lg" bordered={false}>
          <NSpace>
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions.value}
              style={{ width: '200px' }}
              placeholder="Select Service"
              disabled={appKeys.value.length === 0}
              onUpdateValue={updateRealtimeData}
            />
            <NButton type="primary" onClick={updateRealtimeData} disabled={!selectedService.value}>
              Refresh
            </NButton>
            <NButton>Export Report</NButton>
          </NSpace>
        </NCard>

        {loading.value && !realtimeData.value.cpu ? (
          <div class="py-40px flex items-center justify-center">
            <NSpin size="large" />
          </div>
        ) : null}

        {!selectedService.value && !loading.value ? (
          <NEmpty description="Please select a service to view data" class="py-40px" />
        ) : (
          <>
            <NGrid cols={3} xGap={16} class="mb-16px">
              <NGridItem>
                <NCard
                  bordered={false}
                  class="shadow-sm rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-[--color-bg-1] to-[--color-fill-1]">
                  <div class="text-center">
                    <div class="text-14px text-[--color-text-3] mb-8px font-medium uppercase tracking-wide">
                      CPU Usage
                    </div>
                    <NProgress
                      type="circle"
                      percentage={realtimeData.value.cpu}
                      status={getCpuStatus(realtimeData.value.cpu)}
                      strokeWidth={8}
                      railColor="rgba(0,0,0,0.05)"
                      style={{ width: '120px', margin: '16px auto' }}
                    />
                    <div class="text-24px font-bold mt-8px text-[--color-text-1] font-mono">
                      {realtimeData.value.cpu.toFixed(1)}%
                    </div>
                  </div>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard
                  bordered={false}
                  class="shadow-sm rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-[--color-bg-1] to-[--color-fill-1]">
                  <div class="text-center">
                    <div class="text-14px text-[--color-text-3] mb-8px font-medium uppercase tracking-wide">
                      Memory Usage
                    </div>
                    <NProgress
                      type="circle"
                      percentage={realtimeData.value.memory}
                      status={getMemoryStatus(realtimeData.value.memory)}
                      strokeWidth={8}
                      railColor="rgba(0,0,0,0.05)"
                      style={{ width: '120px', margin: '16px auto' }}
                    />
                    <div class="text-24px font-bold mt-8px text-[--color-text-1] font-mono">
                      {realtimeData.value.memory.toFixed(1)}%
                    </div>
                  </div>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard
                  bordered={false}
                  class="shadow-sm rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-[--color-bg-1] to-[--color-fill-1]">
                  <div class="text-center h-full flex flex-col justify-center">
                    <div class="text-14px text-[--color-text-3] mb-16px font-medium uppercase tracking-wide">
                      Error Rate
                    </div>
                    <div
                      class="text-56px font-bold font-mono tracking-tighter"
                      style={{
                        color: realtimeData.value.errorRate > 1 ? 'var(--color-danger-6)' : 'var(--color-success-6)',
                        textShadow:
                          realtimeData.value.errorRate > 1
                            ? '0 4px 12px rgba(245, 108, 108, 0.2)'
                            : '0 4px 12px rgba(103, 194, 58, 0.2)'
                      }}>
                      {realtimeData.value.errorRate.toFixed(2)}%
                    </div>
                    <div class="text-12px text-[--color-text-4] mt-8px bg-[--color-fill-2] self-center px-2 py-1 rounded-full">
                      Last Value
                    </div>
                  </div>
                </NCard>
              </NGridItem>
            </NGrid>

            {/* Performance Metrics */}
            <NGrid cols={3} xGap={16}>
              <NGridItem>
                <NCard>
                  <NStatistic
                    label="QPS (Req/sec)"
                    value={realtimeData.value.qps.toLocaleString()}
                    style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }}
                  />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard>
                  <NStatistic
                    label="Avg Response Time"
                    value={`${realtimeData.value.responseTime.toFixed(0)}ms`}
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
                    label="Active Connections"
                    value={realtimeData.value.activeConnections.toLocaleString()}
                    style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }}
                  />
                </NCard>
              </NGridItem>
            </NGrid>
          </>
        )}
      </div>
    )
  }
})
