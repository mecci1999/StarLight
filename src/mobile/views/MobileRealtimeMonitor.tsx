import { defineComponent, ref, onActivated, onDeactivated, onUnmounted, computed, type CSSProperties } from 'vue'
import { MobileCard, MobileButton, MobileEmpty, MobileLoading, MobileTag, MobileSelect } from '@/mobile/ui'
import {
  PhArrowsClockwise,
  PhComputerTower,
  PhWarningCircle,
  PhGauge,
  PhClock,
  PhPlay,
  PhPause,
  PhCpu,
  PhMemory
} from '@phosphor-icons/vue'
import api from '@/api'
import LineChart from '@/components/charts/LineChart'
import type { MetricPoint } from '@/types/monitor'
import type { MetricsDatasetScope } from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './MobileRealtimeMonitor.scss'

type TimeRangeKey = '15m' | '1h' | '4h' | '1d' | '2d' | '7d'

const TIME_RANGES: { key: TimeRangeKey; label: string }[] = [
  { key: '15m', label: '15m' },
  { key: '1h', label: '1h' },
  { key: '4h', label: '4h' },
  { key: '1d', label: '1d' },
  { key: '7d', label: '7d' }
]

type StatusLevel = 'healthy' | 'warning' | 'critical' | 'unknown'
type CssCustomProperties = CSSProperties & Record<`--${string}`, string | number>

const LIVE_POLL_INTERVAL_MS = 30_000

const statusColor = (s: StatusLevel) => {
  switch (s) {
    case 'healthy':
      return 'var(--color-success-6)'
    case 'warning':
      return 'var(--color-warning-6)'
    case 'critical':
      return 'var(--color-danger-6)'
    default:
      return 'var(--color-text-3)'
  }
}

const statusLabel = (s: StatusLevel) => {
  switch (s) {
    case 'healthy':
      return '正常'
    case 'warning':
      return '警告'
    case 'critical':
      return '严重'
    default:
      return '未知'
  }
}

export default defineComponent({
  name: 'MobileRealtimeMonitor',
  setup() {
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const selectedService = ref<string | null>(null)
    const loading = ref(false)
    const loadError = ref('')
    const isLive = ref(true)
    const timeRange = ref<TimeRangeKey>('1h')
    const services = ref<{ id: string; name: string }[]>([])

    const metrics = ref({
      cpu: null as number | null,
      memory: null as number | null,
      qps: null as number | null,
      latency: null as number | null,
      errorRate: null as number | null,
      connections: null as number | null
    })

    const trends = ref<{ cpu: MetricPoint[]; memory: MetricPoint[]; latency: MetricPoint[] }>({
      cpu: [],
      memory: [],
      latency: []
    })

    const healthItems = ref<{ label: string; status: StatusLevel; detail: string }[]>([])

    let refreshTimer: ReturnType<typeof setInterval> | null = null
    let isActive = false
    let fetchInFlight = false
    let fetchGeneration = 0
    let servicesGeneration = 0

    const selectedServiceName = computed(
      () => services.value.find((s) => s.id === selectedService.value)?.name || selectedService.value || '选择服务'
    )

    const cpuLevel = computed<StatusLevel>(() => {
      const v = metrics.value.cpu
      if (v === null) return 'unknown'
      return v > 80 ? 'critical' : v > 60 ? 'warning' : 'healthy'
    })
    const memLevel = computed<StatusLevel>(() => {
      const v = metrics.value.memory
      if (v === null) return 'unknown'
      return v > 80 ? 'critical' : v > 60 ? 'warning' : 'healthy'
    })
    const latencyLevel = computed<StatusLevel>(() => {
      const v = metrics.value.latency
      if (v === null) return 'unknown'
      return v > 150 ? 'critical' : v > 100 ? 'warning' : 'healthy'
    })
    const errorLevel = computed<StatusLevel>(() => {
      const v = metrics.value.errorRate
      if (v === null) return 'unknown'
      return v > 1 ? 'critical' : v > 0.5 ? 'warning' : 'healthy'
    })

    const fetchServices = async () => {
      const generation = ++servicesGeneration
      try {
        const res = await api.metrics.fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        if (!isActive || generation !== servicesGeneration) return
        services.value = (res?.items || []).map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name
        }))
        if (services.value.length && !selectedService.value) {
          selectedService.value = services.value[0].id
        }
      } catch {
        if (isActive && generation === servicesGeneration) services.value = []
      }
    }

    const fetchData = async () => {
      if (!selectedService.value || fetchInFlight) return
      const generation = ++fetchGeneration
      fetchInFlight = true
      loading.value = true
      loadError.value = ''
      try {
        const [detail, runtime, incidents, metricsAnalysis] = await Promise.all([
          api.metrics.fetchServiceDetailSummary(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchServiceRuntime(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchOverviewIncidents({ timeRange: `-${timeRange.value}`, scope: datasetScope.value }),
          api.metrics.fetchMetricsExplorer({ serviceId: selectedService.value, scope: datasetScope.value })
        ])
        if (!isActive || generation !== fetchGeneration) return
        const s = detail?.summary || {}
        metrics.value = {
          cpu: s.cpu ?? null,
          memory: s.memory ?? null,
          qps: s.qps ?? null,
          latency: s.responseTime ?? null,
          errorRate: s.errorRate ?? null,
          connections: s.activeConnections ?? null
        }
        const getSeries = (g: any) => g?.[0]?.data || []
        trends.value = {
          cpu: getSeries(metricsAnalysis?.series?.cpu),
          memory: getSeries(metricsAnalysis?.series?.memory),
          latency: getSeries(metricsAnalysis?.series?.responseTime)
        }
        const incidentCount = Array.isArray(incidents)
          ? incidents.filter((i: any) => !i.serviceId || i.serviceId === selectedService.value).length
          : 0
        healthItems.value = [
          {
            label: '实例',
            status: runtime?.instances?.length ? 'healthy' : 'unknown',
            detail: `${runtime?.instances?.length || 0} 个`
          },
          {
            label: 'Metrics',
            status: runtime?.ingestStatus?.metrics ? 'healthy' : 'unknown',
            detail: runtime?.ingestStatus?.metrics ? '正常采集' : '无数据'
          },
          {
            label: 'Logs',
            status: runtime?.ingestStatus?.logs ? 'healthy' : 'unknown',
            detail: runtime?.ingestStatus?.logs ? '正常采集' : '无数据'
          },
          { label: '事件', status: incidentCount > 0 ? 'critical' : 'healthy', detail: `${incidentCount} 活跃` }
        ]
      } catch {
        if (!isActive || generation !== fetchGeneration) return
        loadError.value = '数据加载失败'
        metrics.value = { cpu: null, memory: null, qps: null, latency: null, errorRate: null, connections: null }
        trends.value = { cpu: [], memory: [], latency: [] }
        healthItems.value = []
      } finally {
        fetchInFlight = false
        loading.value = false
      }
    }

    const stopPolling = () => {
      fetchGeneration += 1
      servicesGeneration += 1
      if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
    }

    const startPolling = () => {
      stopPolling()
      if (isLive.value && isActive) refreshTimer = setInterval(fetchData, LIVE_POLL_INTERVAL_MS)
    }

    const toggleLive = () => {
      isLive.value = !isLive.value
      if (isLive.value) {
        fetchData()
        startPolling()
      } else stopPolling()
    }

    onActivated(async () => {
      isActive = true
      await fetchServices()
      if (!isActive) return
      if (selectedService.value) await fetchData()
      if (!isActive) return
      startPolling()
    })
    onDeactivated(() => {
      isActive = false
      stopPolling()
    })
    onUnmounted(() => {
      isActive = false
      stopPolling()
    })

    const fmt = (v: number | null, s = '', d?: number) =>
      typeof v === 'number' ? (d !== undefined ? v.toFixed(d) + s : v + s) : '--'

    return () => (
      <div class="realtime">
        <div class="realtime__header">
          <div>
            <h2 class="realtime__title">实时监控</h2>
            <p class="realtime__subtitle">{selectedServiceName.value}</p>
          </div>
          <div class="realtime__header-actions">
            <MobileButton
              size="small"
              type={isLive.value ? 'primary' : 'default'}
              onClick={toggleLive}
              class={isLive.value ? 'realtime__live-btn is-live' : 'realtime__live-btn'}
              icon={() => (isLive.value ? <PhPause size={14} /> : <PhPlay size={14} />)}>
              {isLive.value ? '实时' : '暂停'}
            </MobileButton>
            <MobileButton
              size="small"
              type="ghost"
              onClick={fetchData}
              class="realtime__refresh-btn"
              aria-label="刷新数据"
              icon={() => <PhArrowsClockwise size={16} />}
            />
          </div>
        </div>

        <div class="realtime__controls">
          <MobileSelect
            modelValue={selectedService.value ?? ''}
            onUpdate:modelValue={(v) => {
              selectedService.value = v
              fetchData()
            }}
            options={services.value.map((s) => ({ label: s.name, value: s.id }))}
            placeholder="选择服务"
          />
          <div class="realtime__time-chips">
            {TIME_RANGES.map((r) => (
              <MobileButton
                key={r.key}
                size="small"
                type={timeRange.value === r.key ? 'primary' : 'ghost'}
                onClick={() => {
                  timeRange.value = r.key
                  fetchData()
                }}>
                {r.label}
              </MobileButton>
            ))}
          </div>
        </div>

        {loading.value && !metrics.value.cpu ? (
          <div class="realtime__loading">
            <MobileLoading loading={loading.value} size="48px" />
          </div>
        ) : loadError.value ? (
          <div class="realtime__error">
            <MobileEmpty description={loadError.value}>
              <MobileButton size="small" onClick={fetchData}>
                重试
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : !selectedService.value ? (
          <div class="realtime__error">
            <MobileEmpty description="请选择服务查看实时数据" />
          </div>
        ) : (
          <>
            {/* Hero gauges */}
            <div class="realtime__gauges">
              <div class="realtime__gauge">
                <div
                  class="realtime__gauge-ring"
                  style={
                    {
                      '--pct': `${metrics.value.cpu ?? 0}`,
                      '--color': statusColor(cpuLevel.value)
                    } satisfies CssCustomProperties
                  }>
                  <svg viewBox="0 0 120 120" class="realtime__gauge-svg">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-fill-2)" stroke-width="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray={`${((metrics.value.cpu ?? 0) / 100) * 327} 327`}
                      transform="rotate(-90 60 60)"
                      class="realtime__gauge-arc"
                    />
                  </svg>
                  <div class="realtime__gauge-center">
                    <span class="realtime__gauge-value">{fmt(metrics.value.cpu, '', 1)}</span>
                    <span class="realtime__gauge-unit">%</span>
                  </div>
                </div>
                <div class="realtime__gauge-label">
                  {h(PhCpu, { size: 14 })}
                  <span>CPU</span>
                </div>
              </div>
              <div class="realtime__gauge">
                <div
                  class="realtime__gauge-ring"
                  style={
                    {
                      '--pct': `${metrics.value.memory ?? 0}`,
                      '--color': statusColor(memLevel.value)
                    } satisfies CssCustomProperties
                  }>
                  <svg viewBox="0 0 120 120" class="realtime__gauge-svg">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-fill-2)" stroke-width="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray={`${((metrics.value.memory ?? 0) / 100) * 327} 327`}
                      transform="rotate(-90 60 60)"
                      class="realtime__gauge-arc"
                    />
                  </svg>
                  <div class="realtime__gauge-center">
                    <span class="realtime__gauge-value">{fmt(metrics.value.memory, '', 1)}</span>
                    <span class="realtime__gauge-unit">%</span>
                  </div>
                </div>
                <div class="realtime__gauge-label">
                  {h(PhMemory, { size: 14 })}
                  <span>内存</span>
                </div>
              </div>
            </div>

            {/* Metric pills */}
            <div class="realtime__pills">
              <div class="realtime__pill">
                <div class={['realtime__pill-icon', `realtime__pill-icon--${errorLevel.value}`]}>
                  {h(PhWarningCircle, { size: 16 })}
                </div>
                <div class="realtime__pill-body">
                  <span class="realtime__pill-value">{fmt(metrics.value.errorRate, '%', 2)}</span>
                  <span class="realtime__pill-label">错误率</span>
                </div>
              </div>
              <div class="realtime__pill">
                <div class={['realtime__pill-icon', `realtime__pill-icon--${latencyLevel.value}`]}>
                  {h(PhClock, { size: 16 })}
                </div>
                <div class="realtime__pill-body">
                  <span class="realtime__pill-value">{fmt(metrics.value.latency, 'ms', 0)}</span>
                  <span class="realtime__pill-label">延迟</span>
                </div>
              </div>
              <div class="realtime__pill">
                <div class="realtime__pill-icon realtime__pill-icon--healthy">{h(PhGauge, { size: 16 })}</div>
                <div class="realtime__pill-body">
                  <span class="realtime__pill-value">{fmt(metrics.value.qps)}</span>
                  <span class="realtime__pill-label">QPS</span>
                </div>
              </div>
              <div class="realtime__pill">
                <div class="realtime__pill-icon realtime__pill-icon--healthy">{h(PhComputerTower, { size: 16 })}</div>
                <div class="realtime__pill-body">
                  <span class="realtime__pill-value">{fmt(metrics.value.connections)}</span>
                  <span class="realtime__pill-label">连接</span>
                </div>
              </div>
            </div>

            {/* Health status row */}
            <div class="realtime__health">
              {healthItems.value.map((item) => (
                <div key={item.label} class="realtime__health-item">
                  <div class={['realtime__health-dot', `realtime__health-dot--${item.status}`]} />
                  <span class="realtime__health-label">{item.label}</span>
                  <span class="realtime__health-detail">{item.detail}</span>
                </div>
              ))}
            </div>

            {/* Trend charts */}
            <div class="realtime__charts">
              <div class="realtime__chart">
                <MobileCard bordered={false} size="small" class="realtime__chart-card">
                  <div class="realtime__chart-head">
                    {h(PhCpu, { size: 14 })}
                    <span>CPU</span>
                    <MobileTag
                      size="small"
                      type={
                        cpuLevel.value === 'healthy' ? 'success' : cpuLevel.value === 'warning' ? 'warning' : 'danger'
                      }>
                      {statusLabel(cpuLevel.value)}
                    </MobileTag>
                  </div>
                  <LineChart
                    data={trends.value.cpu}
                    title=""
                    height="160px"
                    area
                    variant="monitor"
                    yAxisUnit="%"
                    yAxisMax={100}
                  />
                </MobileCard>
              </div>
              <div class="realtime__chart">
                <MobileCard bordered={false} size="small" class="realtime__chart-card">
                  <div class="realtime__chart-head">
                    {h(PhMemory, { size: 14 })}
                    <span>内存</span>
                    <MobileTag
                      size="small"
                      type={
                        memLevel.value === 'healthy' ? 'success' : memLevel.value === 'warning' ? 'warning' : 'danger'
                      }>
                      {statusLabel(memLevel.value)}
                    </MobileTag>
                  </div>
                  <LineChart
                    data={trends.value.memory}
                    title=""
                    height="160px"
                    area
                    variant="monitor"
                    yAxisUnit="%"
                    yAxisMax={100}
                  />
                </MobileCard>
              </div>
              <div class="realtime__chart">
                <MobileCard bordered={false} size="small" class="realtime__chart-card">
                  <div class="realtime__chart-head">
                    {h(PhClock, { size: 14 })}
                    <span>延迟</span>
                    <MobileTag
                      size="small"
                      type={
                        latencyLevel.value === 'healthy'
                          ? 'success'
                          : latencyLevel.value === 'warning'
                            ? 'warning'
                            : 'danger'
                      }>
                      {statusLabel(latencyLevel.value)}
                    </MobileTag>
                  </div>
                  <LineChart data={trends.value.latency} title="" height="160px" variant="monitor" yAxisUnit="ms" />
                </MobileCard>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
})
