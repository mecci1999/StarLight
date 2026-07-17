import { defineComponent, ref, onMounted, onUnmounted, computed, h } from 'vue'
import { NCard, NButton, NEmpty, NSpin, NTag, NSelect, NProgress, NIcon, NStatistic, NGrid, NGridItem } from 'naive-ui'
import {
  PhArrowsClockwise,
  PhActivity,
  PhComputerTower,
  PhWarningCircle,
  PhGauge,
  PhCloudCheck,
  PhCloudSlash,
  PhClock
} from '@phosphor-icons/vue'
import api from '@/api'
import LineChart from '@/components/charts/LineChart'
import type { MetricPoint } from '@/types/monitor'
import type { MetricsDatasetScope } from '@/api'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './MobileRealtimeMonitor.scss'

type TimeRangeKey = '15m' | '1h' | '4h' | '1d' | '2d' | '7d'

const TIME_RANGE_OPTIONS: { label: string; value: TimeRangeKey }[] = [
  { label: '15分钟', value: '15m' },
  { label: '1小时', value: '1h' },
  { label: '4小时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '2天', value: '2d' },
  { label: '7天', value: '7d' }
]

export default defineComponent({
  name: 'MobileRealtimeMonitor',
  setup() {
    const timeStore = useTimeStore()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const selectedService = ref<string | null>(null)
    const refreshTimer = ref<ReturnType<typeof setInterval> | null>(null)
    const loading = ref(false)
    const loadError = ref('')
    const isLive = ref(true)
    const timeRange = ref<TimeRangeKey>('1h')
    const appKeys = ref<{ appKey: string; name: string; keyName: string }[]>([])
    const serviceOptionsError = ref(false)

    const realtimeData = ref<{
      cpu: number | null
      memory: number | null
      qps: number | null
      responseTime: number | null
      errorRate: number | null
      activeConnections: number | null
    }>({
      cpu: null,
      memory: null,
      qps: null,
      responseTime: null,
      errorRate: null,
      activeConnections: null
    })

    const realtimeSeries = ref<{
      cpu: MetricPoint[]
      memory: MetricPoint[]
      responseTime: MetricPoint[]
    } | null>(null)

    const systemStatus = ref<
      Array<{
        name: string
        status: 'healthy' | 'warning' | 'critical' | 'unknown'
        value: number | null
        unit: string
      }>
    >([])

    // ── Computed ─────────────────────────────

    const serviceOptions = computed(() =>
      appKeys.value.map((app) => ({
        label: app.name || app.keyName || app.appKey,
        value: app.appKey
      }))
    )

    const getPrimarySeries = (groups: Array<{ data: MetricPoint[] }> | undefined): MetricPoint[] =>
      Array.isArray(groups) && groups.length > 0 ? groups[0].data || [] : []

    // ── Data Fetching ────────────────────────

    const fetchServiceOptions = async () => {
      try {
        const res = await api.metrics.fetchCatalogServices({
          page: 1,
          pageSize: 200,
          scope: datasetScope.value
        })
        const items = res?.items || []
        appKeys.value = items.map((item: any) => ({
          appKey: item.identity?.id,
          name: item.identity?.name,
          keyName: item.identity?.name
        }))

        if (appKeys.value.length > 0 && !selectedService.value) {
          selectedService.value = appKeys.value[0].appKey
          updateRealtimeData()
        } else if (selectedService.value) {
          updateRealtimeData()
        }
        serviceOptionsError.value = false
      } catch (error) {
        console.error('Failed to fetch catalog services:', error)
        appKeys.value = []
        serviceOptionsError.value = true
      }
    }

    const updateRealtimeData = async () => {
      if (!selectedService.value) return

      loading.value = true
      loadError.value = ''
      try {
        const [detail, runtime, incidents, metricsAnalysis] = await Promise.all([
          api.metrics.fetchServiceDetailSummary(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchServiceRuntime(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchOverviewIncidents({
            timeRange: `-${timeRange.value}`,
            scope: datasetScope.value
          }),
          api.metrics.fetchMetricsExplorer({
            serviceId: selectedService.value,
            scope: datasetScope.value
          })
        ])

        const summary = detail?.summary || {}
        realtimeData.value = {
          cpu: summary.cpu ?? null,
          memory: summary.memory ?? null,
          qps: summary.qps ?? null,
          responseTime: summary.responseTime ?? null,
          errorRate: summary.errorRate ?? null,
          activeConnections: summary.activeConnections ?? null
        }

        realtimeSeries.value = {
          cpu: getPrimarySeries(metricsAnalysis?.series?.cpu),
          memory: getPrimarySeries(metricsAnalysis?.series?.memory),
          responseTime: getPrimarySeries(metricsAnalysis?.series?.responseTime)
        }

        const hasIncidentData = Array.isArray(incidents)
        const relevantIncidents = hasIncidentData
          ? incidents.filter((item: any) => !item.serviceId || item.serviceId === selectedService.value)
          : []

        systemStatus.value = [
          {
            name: '实例运行',
            status: Array.isArray(runtime?.instances) && runtime.instances.length > 0 ? 'healthy' : 'unknown',
            value: Array.isArray(runtime?.instances) ? runtime.instances.length : null,
            unit: 'instances'
          },
          {
            name: 'Metrics 采集',
            status: runtime?.ingestStatus?.metrics === true ? 'healthy' : 'unknown',
            value: runtime?.ingestStatus?.metrics === true ? 1 : null,
            unit: 'ok'
          },
          {
            name: 'Logs 采集',
            status: runtime?.ingestStatus?.logs === true ? 'healthy' : 'unknown',
            value: runtime?.ingestStatus?.logs === true ? 1 : null,
            unit: 'ok'
          },
          {
            name: '活跃事件',
            status: hasIncidentData ? (relevantIncidents.length > 0 ? 'critical' : 'healthy') : 'unknown',
            value: hasIncidentData ? relevantIncidents.length : null,
            unit: 'count'
          }
        ]
      } catch (error) {
        console.error('Failed to update realtime data:', error)
        realtimeSeries.value = null
        systemStatus.value = []
        realtimeData.value = {
          cpu: null,
          memory: null,
          qps: null,
          responseTime: null,
          errorRate: null,
          activeConnections: null
        }
        loadError.value = '实时监控数据加载失败，请检查服务状态或稍后重试。'
      } finally {
        loading.value = false
      }
    }

    // ── Live Mode ────────────────────────────

    const startLiveRefresh = () => {
      stopLiveRefresh()
      refreshTimer.value = setInterval(updateRealtimeData, 5000)
    }

    const stopLiveRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    const toggleLive = () => {
      isLive.value = !isLive.value
      if (isLive.value) {
        updateRealtimeData()
        startLiveRefresh()
      } else {
        stopLiveRefresh()
      }
    }

    const handleRefresh = () => {
      updateRealtimeData()
    }

    const handleTimeRangeChange = (value: TimeRangeKey) => {
      timeRange.value = value
      timeStore.setTimeRange(value)
      updateRealtimeData()
    }

    const handleServiceChange = (value: string) => {
      selectedService.value = value
      updateRealtimeData()
    }

    // ── Watchers ─────────────────────────────

    onMounted(() => {
      fetchServiceOptions()
      if (isLive.value) {
        startLiveRefresh()
      }
    })

    onUnmounted(() => {
      stopLiveRefresh()
    })

    // ── Display Helpers ──────────────────────

    const getCpuStatus = (cpu: number): 'success' | 'warning' | 'error' => {
      if (cpu > 80) return 'error'
      if (cpu > 60) return 'warning'
      return 'success'
    }

    const getMemoryStatus = (memory: number): 'success' | 'warning' | 'error' => {
      if (memory > 80) return 'error'
      if (memory > 60) return 'warning'
      return 'success'
    }

    const displayMetric = (value: number | null | undefined, suffix = '', digits?: number): string => {
      if (typeof value !== 'number') return '未知'
      if (typeof digits === 'number') return `${value.toFixed(digits)}${suffix}`
      return `${value}${suffix}`
    }

    const getStatusTagType = (
      status: 'healthy' | 'warning' | 'critical' | 'unknown'
    ): 'success' | 'warning' | 'error' | 'default' => {
      switch (status) {
        case 'healthy':
          return 'success'
        case 'warning':
          return 'warning'
        case 'critical':
          return 'error'
        default:
          return 'default'
      }
    }

    const getStatusIcon = (status: 'healthy' | 'warning' | 'critical' | 'unknown') => {
      if (status === 'healthy') return PhCloudCheck
      if (status === 'critical') return PhWarningCircle
      return PhCloudSlash
    }

    const getErrorRateColor = computed(() => {
      if (typeof realtimeData.value.errorRate !== 'number') return 'var(--color-text-3)'
      return realtimeData.value.errorRate > 1 ? 'var(--color-danger-6)' : 'var(--color-success-6)'
    })

    const getResponseTimeColor = computed(() => {
      if (typeof realtimeData.value.responseTime !== 'number') return 'var(--color-text-3)'
      if (realtimeData.value.responseTime > 150) return 'var(--color-danger-6)'
      if (realtimeData.value.responseTime > 100) return 'var(--color-warning-6)'
      return 'var(--color-success-6)'
    })

    // ── Render ───────────────────────────────

    return () => (
      <div class="mobile-realtime-monitor">
        {/* Header */}
        <div class="mobile-realtime-monitor__header">
          <div>
            <h2 class="mobile-realtime-monitor__title">实时监控</h2>
          </div>
          <div class="mobile-realtime-monitor__header-actions">
            <NButton
              size="small"
              type={isLive.value ? 'primary' : 'default'}
              secondary={!isLive.value}
              onClick={toggleLive}>
              {{
                default: () => (isLive.value ? '实时' : '暂停'),
                icon: () => (
                  <NIcon size={16}>
                    <PhActivity />
                  </NIcon>
                )
              }}
            </NButton>
            <NButton size="small" secondary type="primary" onClick={handleRefresh}>
              <NIcon size={16}>
                <PhArrowsClockwise />
              </NIcon>
            </NButton>
          </div>
        </div>

        {/* Service Selector */}
        <div class="mobile-realtime-monitor__service-select">
          <NSelect
            v-model:value={selectedService.value}
            options={serviceOptions.value}
            placeholder="选择服务"
            filterable
            clearable
            size="small"
            onUpdateValue={handleServiceChange}
          />
        </div>

        {/* Time Range */}
        <div class="mobile-realtime-monitor__time-range">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <NButton
              key={opt.value}
              size="tiny"
              type={timeRange.value === opt.value ? 'primary' : 'default'}
              secondary={timeRange.value !== opt.value}
              onClick={() => handleTimeRangeChange(opt.value)}>
              {opt.label}
            </NButton>
          ))}
        </div>

        {/* Loading State */}
        {loading.value && !realtimeData.value.cpu && !loadError.value ? (
          <div class="mobile-realtime-monitor__loading">
            <NSpin size="large" />
          </div>
        ) : null}

        {/* Empty / Error States */}
        {!selectedService.value && serviceOptionsError.value && !loading.value ? (
          <div class="mobile-realtime-monitor__empty-state">
            <NEmpty description="服务列表暂时不可用，请稍后重试">
              {{
                extra: () => (
                  <NButton type="primary" secondary size="small" onClick={fetchServiceOptions}>
                    重试加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        ) : !selectedService.value && !loading.value ? (
          <div class="mobile-realtime-monitor__empty-state">
            <NEmpty description="请选择服务查看数据" />
          </div>
        ) : loadError.value && !loading.value ? (
          <div class="mobile-realtime-monitor__empty-state">
            <NEmpty description={loadError.value}>
              {{
                extra: () => (
                  <NButton type="primary" secondary size="small" onClick={updateRealtimeData}>
                    重试加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        ) : null}

        {/* Content */}
        {selectedService.value && !loadError.value ? (
          <>
            {/* KPI Gauge Cards */}
            <div class="mobile-realtime-monitor__gauges">
              <NGrid cols={2} xGap={8} yGap={8}>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__gauge-card">
                    <div class="mobile-realtime-monitor__gauge-card-content">
                      <div class="mobile-realtime-monitor__gauge-label">CPU 使用率</div>
                      {typeof realtimeData.value.cpu === 'number' ? (
                        <NProgress
                          type="circle"
                          percentage={realtimeData.value.cpu}
                          status={getCpuStatus(realtimeData.value.cpu)}
                          strokeWidth={10}
                          railColor="var(--color-fill-2)"
                          style={{ width: '100px', margin: '12px auto' }}
                        />
                      ) : (
                        <div class="mobile-realtime-monitor__gauge-placeholder">未知</div>
                      )}
                      <div class="mobile-realtime-monitor__gauge-value">
                        {displayMetric(realtimeData.value.cpu, '%', 1)}
                      </div>
                    </div>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__gauge-card">
                    <div class="mobile-realtime-monitor__gauge-card-content">
                      <div class="mobile-realtime-monitor__gauge-label">内存使用率</div>
                      {typeof realtimeData.value.memory === 'number' ? (
                        <NProgress
                          type="circle"
                          percentage={realtimeData.value.memory}
                          status={getMemoryStatus(realtimeData.value.memory)}
                          strokeWidth={10}
                          railColor="var(--color-fill-2)"
                          style={{ width: '100px', margin: '12px auto' }}
                        />
                      ) : (
                        <div class="mobile-realtime-monitor__gauge-placeholder">未知</div>
                      )}
                      <div class="mobile-realtime-monitor__gauge-value">
                        {displayMetric(realtimeData.value.memory, '%', 1)}
                      </div>
                    </div>
                  </NCard>
                </NGridItem>
              </NGrid>
            </div>

            {/* KPI Stat Cards */}
            <div class="mobile-realtime-monitor__stats">
              <NGrid cols={2} xGap={8} yGap={8}>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__stat-card">
                    <div class="mobile-realtime-monitor__stat-icon mobile-realtime-monitor__stat-icon--qps">
                      <NIcon size={18}>
                        <PhGauge />
                      </NIcon>
                    </div>
                    <NStatistic
                      label="QPS"
                      value={
                        typeof realtimeData.value.qps === 'number' ? realtimeData.value.qps.toLocaleString() : '未知'
                      }
                    />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__stat-card">
                    <div class="mobile-realtime-monitor__stat-icon mobile-realtime-monitor__stat-icon--latency">
                      <NIcon size={18}>
                        <PhClock />
                      </NIcon>
                    </div>
                    <NStatistic
                      label="响应时间"
                      value={displayMetric(realtimeData.value.responseTime, 'ms', 0)}
                      style={{ color: getResponseTimeColor.value }}
                    />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__stat-card">
                    <div class="mobile-realtime-monitor__stat-icon mobile-realtime-monitor__stat-icon--error">
                      <NIcon size={18}>
                        <PhWarningCircle />
                      </NIcon>
                    </div>
                    <NStatistic
                      label="错误率"
                      value={displayMetric(realtimeData.value.errorRate, '%', 2)}
                      style={{ color: getErrorRateColor.value }}
                    />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard bordered={false} size="small" class="mobile-realtime-monitor__stat-card">
                    <div class="mobile-realtime-monitor__stat-icon mobile-realtime-monitor__stat-icon--connections">
                      <NIcon size={18}>
                        <PhComputerTower />
                      </NIcon>
                    </div>
                    <NStatistic
                      label="活跃连接"
                      value={
                        typeof realtimeData.value.activeConnections === 'number'
                          ? realtimeData.value.activeConnections.toLocaleString()
                          : '未知'
                      }
                    />
                  </NCard>
                </NGridItem>
              </NGrid>
            </div>

            {/* Trend Charts */}
            {realtimeSeries.value ? (
              <div class="mobile-realtime-monitor__charts">
                <NCard bordered={false} size="small" class="mobile-realtime-monitor__chart-card" title="CPU 实时趋势">
                  <LineChart
                    data={realtimeSeries.value.cpu}
                    title=""
                    height="180px"
                    area
                    variant="monitor"
                    yAxisUnit="%"
                    yAxisMax={100}
                  />
                </NCard>

                <NCard bordered={false} size="small" class="mobile-realtime-monitor__chart-card" title="内存实时趋势">
                  <LineChart
                    data={realtimeSeries.value.memory}
                    title=""
                    height="180px"
                    area
                    variant="monitor"
                    yAxisUnit="%"
                    yAxisMax={100}
                  />
                </NCard>

                <NCard bordered={false} size="small" class="mobile-realtime-monitor__chart-card" title="响应时间趋势">
                  <LineChart
                    data={realtimeSeries.value.responseTime}
                    title=""
                    height="180px"
                    variant="monitor"
                    yAxisUnit="ms"
                  />
                </NCard>
              </div>
            ) : null}

            {/* System Status */}
            <NCard bordered={false} size="small" class="mobile-realtime-monitor__system-card" title="系统状态">
              {systemStatus.value.length > 0 ? (
                <div class="mobile-realtime-monitor__system-tags">
                  {systemStatus.value.map((item) => (
                    <NTag key={item.name} type={getStatusTagType(item.status)} bordered={false} round>
                      {{
                        icon: () => <NIcon size={16}>{h(getStatusIcon(item.status))}</NIcon>,
                        default: () =>
                          `${item.name}: ${
                            item.status === 'healthy'
                              ? '正常'
                              : item.status === 'critical'
                                ? '告警'
                                : item.status === 'warning'
                                  ? '警告'
                                  : '未知'
                          }`
                      }}
                    </NTag>
                  ))}
                </div>
              ) : (
                <NEmpty description="暂无系统状态数据" />
              )}
            </NCard>
          </>
        ) : null}
      </div>
    )
  }
})
