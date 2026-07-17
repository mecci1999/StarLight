import { defineComponent, ref, onMounted, onUnmounted, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { NTag, NButton, NSpin, NEmpty, NResult, NIcon, NStatistic, NInput, NCard, NGrid, NGridItem } from 'naive-ui'
import {
  PhComputerTower,
  PhActivity,
  PhWarning,
  PhCheckCircle,
  PhWarningCircle,
  PhGitBranch,
  PhFile,
  PhBell,
  PhStack,
  PhTrendUp,
  PhCloud,
  PhCpu,
  PhLightning,
  PhArrowsClockwise,
  PhMagnifyingGlass,
  PhXCircle,
  PhClock,
  PhPlayCircle,
  PhPauseCircle
} from '@phosphor-icons/vue'
import {
  fetchCatalogServices,
  fetchOverviewSummary,
  fetchOverviewTrends,
  fetchOverviewRiskServices,
  fetchOverviewIngestStatus,
  fetchOverviewIncidents,
  getDashboardState,
  queryMetricCards,
  type MetricsDatasetScope
} from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import { useTimeStore, type TimeRangeKey } from '@/store/useTimeStore'
import GaugeChart from '@/components/charts/GaugeChart'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import PieChart from '@/components/charts/PieChart'
import type {
  OverviewPanelDefinition,
  OverviewPanelWidget,
  OverviewWidgetKind,
  OverviewCapabilityKey,
  OverviewWidgetDisplayMetricKey,
  MetricSummaryConfig,
  TrendConfig,
  QuickPivotConfig,
  DarwinInfraSummaryConfig,
  DarwinInfraTrendConfig,
  OverviewTrendMetricKey
} from '@/domains/overview/panelModel'
import { normalizeWidgetTags, buildOverviewWidgetEditorState } from '@/domains/overview/panelModel'
import { buildOverviewCardsQueryRequest, mapQueryResultsByWidgetId } from '@/domains/overview/overviewRuntimeQueryModel'
import { normalizeQueryAlertRules, type CardData } from '@/domains/metrics/queryModel'
import { formatQueryNumberDisplay } from '@/domains/overview/queryNumberDisplay'
import ServiceHealthBadge from '@/shared/components/ServiceHealthBadge'
import './OverviewV2.scss'
import MobileHeaderToolbar from '@/mobile/components/MobileHeaderToolbar'

const PANEL_STATE_STORAGE_KEY = 'starlight_overview_panel_state_v5'
const AUTO_REFRESH_STORAGE_KEY = 'starlight_overview_mobile_auto_refresh_v1'

type OverviewAutoRefreshKey = 'off' | 'auto' | '15s' | '30s' | '1m' | '5m'

const overviewAutoRefreshOptions: Array<{ label: string; value: OverviewAutoRefreshKey }> = [
  { label: '关闭', value: 'off' },
  { label: '自动', value: 'auto' },
  { label: '15 秒', value: '15s' },
  { label: '30 秒', value: '30s' },
  { label: '1 分钟', value: '1m' },
  { label: '5 分钟', value: '5m' }
]

// ── Tag filter constants (mirrors desktop OverviewPage) ──
const widgetKindFilterTags: Record<OverviewWidgetKind, string[]> = {
  'query-card': ['自定义查询', '指标'],
  'metric-summary': ['指标', '摘要', '总览'],
  'risk-service': ['服务', '风险', '健康', '稳定性', '异常排查'],
  incident: ['告警', '事件', '稳定性', '异常排查'],
  'ingest-status': ['接入', '状态', '采集', '健康'],
  trend: ['指标', '趋势', '流量', '性能'],
  'quick-pivot': ['导航', '服务', '快捷入口'],
  'darwin-infra-summary': ['资源', '摘要', '资源水位', '容量'],
  'darwin-infra-trend': ['资源', '趋势', '资源水位', '容量'],
  'darwin-instance-table': ['资源', '实例', '资源水位', '容量']
}
const metricScenarioTags: Partial<Record<OverviewWidgetDisplayMetricKey, string[]>> = {
  requests: ['流量', '吞吐'],
  errors: ['稳定性', '错误', '异常排查'],
  latency: ['性能', '延迟'],
  'service-count': ['服务', '总览'],
  'healthy-services': ['健康', '服务'],
  'active-alerts': ['告警', '稳定性', '异常排查'],
  'total-requests': ['流量', '吞吐'],
  'error-rate': ['稳定性', '错误', '异常排查'],
  'p95-latency': ['性能', '延迟'],
  'ingest-success-rate': ['采集', '健康'],
  cpu: ['资源水位', 'CPU', '容量'],
  memory: ['资源水位', '内存', '容量']
}
const capabilityFilterTags: Record<OverviewCapabilityKey, string> = {
  metrics: '指标',
  logs: '日志',
  traces: '链路',
  alerts: '告警',
  serviceCatalog: '服务',
  ingestion: '接入'
}
const resolveWidgetScenarioMetricKeys = (widget: OverviewPanelWidget): OverviewWidgetDisplayMetricKey[] => {
  const editorMetrics = widget.editor?.displayedMetrics
  if (editorMetrics && editorMetrics.length) return editorMetrics as OverviewWidgetDisplayMetricKey[]
  if (widget.kind === 'metric-summary') return [(widget.config as MetricSummaryConfig).metricKey]
  if (widget.kind === 'trend') return [(widget.config as TrendConfig).metric]
  if (widget.kind === 'darwin-infra-summary') return [(widget.config as DarwinInfraSummaryConfig).metric]
  if (widget.kind === 'darwin-infra-trend') return [(widget.config as DarwinInfraTrendConfig).metric]
  if (widget.kind === 'darwin-instance-table') return ['cpu', 'memory']
  if (widget.kind === 'ingest-status') return ['ingest-success-rate']
  if (widget.kind === 'incident') return ['active-alerts']
  if (widget.kind === 'risk-service') return ['healthy-services', 'error-rate', 'p95-latency']
  return []
}
const resolveWidgetFilterTags = (widget: OverviewPanelWidget) =>
  normalizeWidgetTags([
    ...(widgetKindFilterTags[widget.kind] || []),
    ...resolveWidgetScenarioMetricKeys(widget).flatMap((metric) => metricScenarioTags[metric] || []),
    capabilityFilterTags[widget.capability],
    ...(widget.tags || [])
  ])

// ── Time range display labels ──
const TIME_RANGE_LABELS: Record<TimeRangeKey, string> = {
  '15m': '15分钟',
  '1h': '1小时',
  '4h': '4小时',
  '1d': '1天',
  '2d': '2天',
  '7d': '7天',
  custom: '自定义'
}

type TrendPoint = { timestamp: number; value: number }
type TrendSnapshot = { requests: TrendPoint[]; errors: TrendPoint[]; latency: TrendPoint[] }

export default defineComponent({
  name: 'MobileOverviewV2',
  setup() {
    const router = useRouter()
    const timeStore = useTimeStore()
    const loading = ref(true)
    const error = ref(false)
    const refreshing = ref(false)
    const timeAgo = ref('')

    const pullDistance = ref(0)
    const pullRefreshing = ref(false)
    let pullStartY = 0
    let pullTracking = false

    // ── Control panel state ──
    const activeTimeRange = ref<TimeRangeKey>(timeStore.timeRange)
    const liveMode = ref(timeStore.isLive)
    const serviceSearch = ref('')
    const activeServiceFilter = ref('')
    const activeTagFilter = ref('')
    const showControlPanel = ref(false)

    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const panels = ref<OverviewPanelDefinition[]>([])
    const activePanelId = ref('user-overview')
    const services = ref<any[]>([])
    const summary = ref<Record<string, number | null>>({})
    const trendsByGroup = ref<Record<string, TrendSnapshot>>({
      overall: { requests: [], errors: [], latency: [] }
    })
    const riskServices = ref<{ highRiskServices: any[]; recentDegradedServices: any[] }>({
      highRiskServices: [],
      recentDegradedServices: []
    })
    const ingestStatus = ref<any>(null)
    const incidents = ref<any[]>([])
    const queryWidgetResults = ref<Record<string, CardData | null>>({})
    const autoRefreshSetting = ref<OverviewAutoRefreshKey>('off')
    const autoRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)
    const autoRefreshFailureCount = ref(0)

    const formatLargeNumber = (v: number): string => {
      if (v >= 100000000) return `${(v / 100000000).toFixed(1)}亿`
      if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
      return v.toLocaleString()
    }

    const displayMetric = (v: number | null | undefined, s = '') =>
      typeof v === 'number' ? `${formatLargeNumber(v)}${s}` : '--'

    const formatTimeAgo = () => {
      const d = Date.now() - (lastRefreshAt || Date.now())
      return d < 60000
        ? '刚刚更新'
        : d < 3600000
          ? `${Math.floor(d / 60000)}分钟前更新`
          : `${Math.floor(d / 3600000)}小时前更新`
    }

    let lastRefreshAt = 0
    let refreshTimer: ReturnType<typeof setInterval> | null = null

    const currentPanel = computed(() => panels.value.find((p) => p.id === activePanelId.value) || panels.value[0])
    const currentWidgets = computed(() => currentPanel.value?.widgets || [])

    const widgetTagOptions = computed(() => {
      const tagCounts = new Map<string, number>()
      currentWidgets.value.forEach((widget) => {
        resolveWidgetFilterTags(widget).forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })
      return Array.from(tagCounts.entries())
        .sort(([aTag, aCount], [bTag, bCount]) => bCount - aCount || aTag.localeCompare(bTag))
        .map(([tag, count]) => ({ tag, count }))
    })

    const filteredWidgets = computed(() => {
      let widgets = currentWidgets.value
      if (activeTagFilter.value) {
        widgets = widgets.filter((w) => resolveWidgetFilterTags(w).includes(activeTagFilter.value))
      }
      return widgets
    })

    const normalizeTrendSnapshot = (payload: any): TrendSnapshot => ({
      requests: Array.isArray(payload?.requests)
        ? payload.requests
        : Array.isArray(payload?.series?.requests)
          ? payload.series.requests
          : [],
      errors: Array.isArray(payload?.errors)
        ? payload.errors
        : Array.isArray(payload?.series?.errors)
          ? payload.series.errors
          : [],
      latency: Array.isArray(payload?.latency)
        ? payload.latency
        : Array.isArray(payload?.series?.latency)
          ? payload.series.latency
          : []
    })

    const getTrendValues = (metric: OverviewTrendMetricKey) => {
      const snapshot = trendsByGroup.value.overall
      return snapshot[metric] || []
    }

    const loadData = async () => {
      loading.value = true
      error.value = false
      try {
        await restorePanels()
        const visibleWidgets = filteredWidgets.value

        const needTrendOverall = visibleWidgets.some((w) => w.kind === 'trend' || w.kind === 'metric-summary')
        const needRisk = visibleWidgets.some((w) => w.kind === 'risk-service')
        const needIngest = visibleWidgets.some((w) => w.kind === 'ingest-status')
        const needIncidents = visibleWidgets.some((w) => w.kind === 'incident')

        const [catalogRes, summaryRes, trendsRes, riskRes, ingestRes, incidentsRes] = await Promise.all([
          fetchCatalogServices({ page: 1, pageSize: 100, scope: datasetScope.value }),
          fetchOverviewSummary({ scope: datasetScope.value }),
          needTrendOverall
            ? fetchOverviewTrends({ groupBy: 'overall', scope: datasetScope.value })
            : Promise.resolve(null),
          needRisk ? fetchOverviewRiskServices({ scope: datasetScope.value }) : Promise.resolve(null),
          needIngest ? fetchOverviewIngestStatus({ scope: datasetScope.value }) : Promise.resolve(null),
          needIncidents ? fetchOverviewIncidents({ scope: datasetScope.value }) : Promise.resolve([])
        ])

        services.value = (catalogRes?.items || []).map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name,
          owner: item.identity?.owner,
          region: item.identity?.region,
          tags: item.identity?.tags || [],
          health: item.identity?.healthStatus,
          qps: item.qps,
          latency: item.p95Latency,
          errorRate: item.errorRate,
          instances: item.instanceCount
        }))

        const totals = summaryRes?.totals || {}
        summary.value = {
          serviceCount: totals.serviceCount ?? null,
          healthyServices: totals.healthyServices ?? null,
          activeAlerts: totals.activeIncidents ?? null,
          totalRequests: totals.totalRequests ?? null,
          errorRate: totals.errorRate ?? null,
          p95Latency: totals.p95Latency ?? null,
          darwinCpu: totals.darwinCpu ?? null,
          darwinMemory: totals.darwinMemory ?? null
        }

        if (trendsRes) {
          trendsByGroup.value = { overall: normalizeTrendSnapshot(trendsRes) }
        }

        riskServices.value = {
          highRiskServices: Array.isArray(riskRes?.highRiskServices) ? riskRes.highRiskServices : [],
          recentDegradedServices: Array.isArray(riskRes?.recentDegradedServices) ? riskRes.recentDegradedServices : []
        }
        ingestStatus.value = ingestRes || null
        incidents.value = Array.isArray(incidentsRes) ? incidentsRes : incidentsRes?.items || []

        // Query card widgets
        const { requests, cards } = buildOverviewCardsQueryRequest({
          widgets: visibleWidgets,
          scope: datasetScope.value,
          scopedServiceName: activeServiceFilter.value || null,
          services: services.value,
          refreshGenerationId: `${Date.now()}`
        })
        if (cards.length) {
          const responses = await Promise.all(requests.map((req) => queryMetricCards(req)))
          queryWidgetResults.value = mapQueryResultsByWidgetId(responses.flatMap((r) => r?.items || []))
        }

        lastRefreshAt = Date.now()
        timeAgo.value = formatTimeAgo()
        autoRefreshFailureCount.value = 0
      } catch {
        error.value = true
        autoRefreshFailureCount.value += 1
      } finally {
        loading.value = false
        refreshing.value = false
      }
    }

    const restorePanels = async () => {
      try {
        const saved = await getDashboardState<{ panels: OverviewPanelDefinition[] }>(PANEL_STATE_STORAGE_KEY, {
          panels: []
        })
        panels.value = saved?.panels || []
      } catch {
        panels.value = []
      }
    }

    // ── Auto refresh ──
    const resolveAutoRefreshInterval = (): number | null => {
      if (autoRefreshFailureCount.value >= 3) return null
      switch (autoRefreshSetting.value) {
        case 'off':
          return null
        case '15s':
          return 15000
        case '30s':
          return 30000
        case '1m':
          return 60000
        case '5m':
          return 300000
        case 'auto':
          return 300000
        default:
          return null
      }
    }

    const stopAutoRefresh = () => {
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
        autoRefreshTimer.value = null
      }
    }

    const startAutoRefresh = () => {
      stopAutoRefresh()
      const interval = resolveAutoRefreshInterval()
      if (!interval) return

      autoRefreshTimer.value = setInterval(() => {
        timeStore.refreshTime()
        loadData()
      }, interval)
    }

    const persistAutoRefreshSetting = () => {
      try {
        localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, JSON.stringify({ autoRefresh: autoRefreshSetting.value }))
      } catch {}
    }

    const restoreAutoRefreshSetting = () => {
      try {
        const raw = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (overviewAutoRefreshOptions.some((o) => o.value === parsed.autoRefresh)) {
            autoRefreshSetting.value = parsed.autoRefresh
          }
        }
      } catch {}
    }

    const onAutoRefreshChange = (value: OverviewAutoRefreshKey) => {
      autoRefreshSetting.value = value
      autoRefreshFailureCount.value = 0
      persistAutoRefreshSetting()
      if (value !== 'off') {
        loadData()
      }
      startAutoRefresh()
    }
    const onTimeRangeChange = (range: TimeRangeKey) => {
      activeTimeRange.value = range
      timeStore.setTimeRange(range)
      refreshing.value = true
      loadData()
    }

    const onToggleLive = () => {
      liveMode.value = !liveMode.value
      timeStore.isLive = liveMode.value
    }

    // ── Control panel handlers ──

    const onServiceSearch = () => {
      activeServiceFilter.value = serviceSearch.value.trim()
      refreshing.value = true
      loadData()
    }

    const onClearServiceFilter = () => {
      serviceSearch.value = ''
      activeServiceFilter.value = ''
      refreshing.value = true
      loadData()
    }

    const onTagFilterSelect = (tag: string) => {
      activeTagFilter.value = tag
    }

    onMounted(() => {
      restoreAutoRefreshSetting()
      loadData()
      refreshTimer = setInterval(() => {
        timeAgo.value = formatTimeAgo()
      }, 30000)
      startAutoRefresh()
    })

    onUnmounted(() => {
      if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      stopAutoRefresh()
    })

    watch(
      () => timeStore.startTime,
      () => {
        if (liveMode.value && !loading.value) {
          refreshing.value = true
          loadData()
        }
      }
    )

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return
      pullStartY = e.touches[0].clientY
      pullTracking = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullTracking || pullRefreshing.value) return
      const delta = e.touches[0].clientY - pullStartY
      if (delta > 0) {
        pullDistance.value = Math.min(delta * 0.5, 80)
      }
    }

    const handleTouchEnd = async () => {
      if (!pullTracking) return
      pullTracking = false
      if (pullDistance.value >= 60) {
        pullRefreshing.value = true
        pullDistance.value = 60
        refreshing.value = true
        await loadData()
        pullRefreshing.value = false
      }
      pullDistance.value = 0
    }

    // ── Widget Renderers ──

    // ── Alert helpers (mirror desktop OverviewPage) ──
    const alertLevelMeta = {
      critical: { label: '严重', tagType: 'error' as const, color: 'var(--color-danger-6)' },
      warning: { label: '警告', tagType: 'warning' as const, color: 'var(--color-warning-6)' },
      info: { label: '提示', tagType: 'info' as const, color: 'var(--color-primary-6)' }
    }
    const alertLevelPriority: Record<string, number> = { critical: 3, warning: 2, info: 1 }

    const resolveQueryThresholdLines = (query: any) =>
      normalizeQueryAlertRules(query?.alert).map((rule: any) => ({
        value: rule.threshold,
        label: alertLevelMeta[rule.level]?.label || '阈值',
        unit: rule.unit || query?.display?.value?.unit || query?.display?.yAxis?.unit || '',
        level: rule.level,
        color: alertLevelMeta[rule.level]?.color
      }))

    const resolveNumberAlertLevel = (query: any, value: unknown): string | null => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null
      const matched = normalizeQueryAlertRules(query?.alert).filter((rule: any) => {
        if (!Number.isFinite(rule.threshold)) return false
        if (rule.operator === '>') return value > rule.threshold
        if (rule.operator === '>=') return value >= rule.threshold
        if (rule.operator === '<') return value < rule.threshold
        if (rule.operator === '<=') return value <= rule.threshold
        return value === rule.threshold
      })
      if (!matched.length) return null
      return matched.sort((a: any, b: any) => alertLevelPriority[b.level] - alertLevelPriority[a.level])[0].level
    }

    const renderWidgetAlertSummary = (widget: OverviewPanelWidget) => {
      if (widget.kind !== 'query-card') return null
      const query = (widget as any).config?.query
      const rules = normalizeQueryAlertRules(query?.alert)
      if (!rules.length) return null
      return (
        <div class="mobile-overview-v2__alert-summary">
          {rules.map((rule: any) => {
            const meta = alertLevelMeta[rule.level]
            const channels = rule.channels?.length ? rule.channels.join('、') : 'Email'
            return (
              <span class="mobile-overview-v2__alert-rule" key={`${rule.level}-${rule.threshold}`}>
                <NTag size="small" bordered={false} type={meta?.tagType || 'warning'}>
                  {meta?.label || rule.level}
                </NTag>
                <span>
                  {rule.operator} {rule.threshold}
                  {rule.unit || query?.display?.value?.unit || query?.display?.yAxis?.unit || ''}，持续{' '}
                  {rule.duration || 5} 分钟，通知 {channels}
                </span>
              </span>
            )
          })}
        </div>
      )
    }

    const renderWidgetBody = (widget: OverviewPanelWidget) => {
      switch (widget.kind) {
        case 'metric-summary':
          return renderMetricSummary(widget as OverviewPanelWidget<'metric-summary'>)
        case 'risk-service':
          return renderRiskService(widget as OverviewPanelWidget<'risk-service'>)
        case 'incident':
          return renderIncidentList(widget as OverviewPanelWidget<'incident'>)
        case 'ingest-status':
          return renderIngestStatus(widget as OverviewPanelWidget<'ingest-status'>)
        case 'trend':
          return renderTrendWidget(widget as OverviewPanelWidget<'trend'>)
        case 'quick-pivot':
          return renderQuickPivot(widget as OverviewPanelWidget<'quick-pivot'>)
        case 'query-card':
        case 'darwin-infra-summary':
        case 'darwin-infra-trend':
        case 'darwin-instance-table':
          return renderQueryDrivenWidget(widget)
        default:
          return <NEmpty description="暂不支持的卡片类型" class="mobile-overview-v2__empty-state" />
      }
    }

    const renderQueryDrivenWidget = (widget: OverviewPanelWidget) => {
      const data = queryWidgetResults.value[widget.id]
      const query = widget.kind === 'query-card' ? (widget as any).config?.query : null
      const thresholdLines = resolveQueryThresholdLines(query)

      const withAlertSummary = (content: any) => (
        <div class="mobile-overview-v2__query-card-body">
          {renderWidgetAlertSummary(widget)}
          {content}
        </div>
      )

      if (!data) {
        return withAlertSummary(<NEmpty description="暂无查询结果" class="mobile-overview-v2__empty-state" />)
      }

      if (data.kind === 'number') {
        const alertLevel = resolveNumberAlertLevel(query, data.value)
        const vis = widget.editor?.visualization || 'number'
        const numberDisplay =
          typeof data.value === 'number' ? formatQueryNumberDisplay(data.value, data.unit || '') : null
        return withAlertSummary(
          vis === 'donut' ? (
            <GaugeChart
              value={typeof data.value === 'number' ? data.value : 0}
              min={0}
              max={100}
              unit={data.unit || '%'}
              color="var(--color-primary-6)"
              height="180px"
              loading={loading.value}
            />
          ) : (
            <div class="mobile-overview-v2__number-card">
              <div
                class={[
                  'mobile-overview-v2__number-glow',
                  alertLevel ? `mobile-overview-v2__number-glow--${alertLevel}` : ''
                ]}
              />
              <div class="mobile-overview-v2__number-header">
                <span class="mobile-overview-v2__number-title">{widget.title}</span>
              </div>
              <div class="mobile-overview-v2__number-body">
                <div
                  class={[
                    'mobile-overview-v2__number-accent',
                    alertLevel ? `mobile-overview-v2__number-accent--${alertLevel}` : ''
                  ]}
                />
                <div class="mobile-overview-v2__number-content">
                  <strong
                    class={[
                      'mobile-overview-v2__number-value',
                      alertLevel ? `mobile-overview-v2__number-value--${alertLevel}` : ''
                    ]}>
                    {numberDisplay?.value ??
                      (typeof data.value === 'number' ? formatQueryNumberDisplay(data.value, '').value : '--')}
                  </strong>
                  {numberDisplay?.unit || data.unit ? (
                    <span class="mobile-overview-v2__number-unit">{numberDisplay?.unit || data.unit}</span>
                  ) : null}
                </div>
                {data.compare ? (
                  <div
                    class={[
                      'mobile-overview-v2__number-trend',
                      `mobile-overview-v2__number-trend--${data.compare.direction}`
                    ]}>
                    <svg class="mobile-overview-v2__number-trend-icon" viewBox="0 0 12 12" aria-hidden="true">
                      <path d={data.compare.direction === 'up' ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
                    </svg>
                    <span>{Math.abs(data.compare.percent ?? 0).toFixed(1)}%</span>
                  </div>
                ) : null}
              </div>
              <div class="mobile-overview-v2__number-meta">
                <span>{widget.kind.replace('-', ' ')}</span>
              </div>
            </div>
          )
        )
      }
      if (data.kind === 'timeseries') {
        const vis = widget.editor?.visualization || 'line'
        return withAlertSummary(
          vis === 'bar' ? (
            <BarChart
              data={(data.series?.[0]?.points || []).map((p: any) => ({
                name: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: p.value
              }))}
              height="200px"
              variant="monitor"
              thresholdLines={thresholdLines}
              loading={loading.value}
            />
          ) : (
            <LineChart
              series={(data.series || []).map((s: any) => ({ name: s.name, data: s.points }))}
              height="200px"
              variant="monitor"
              showLegend
              area={vis === 'line'}
              thresholdLines={thresholdLines}
              loading={loading.value}
            />
          )
        )
      }
      if (data.kind === 'distribution') {
        return withAlertSummary(
          widget.editor?.visualization === 'donut' ? (
            <PieChart data={data.items || []} height="200px" variant="monitor" />
          ) : (
            <BarChart data={data.items || []} height="200px" variant="monitor" loading={loading.value} />
          )
        )
      }
      if (data.kind === 'table') {
        return withAlertSummary(
          <div class="mobile-overview-v2__table-wrap">
            <table class="mobile-overview-v2__table">
              <thead>
                <tr>
                  {(data.columns || []).map((col: any) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((row: any, ri: number) => (
                  <tr key={ri}>
                    {(data.columns || []).map((col: any) => (
                      <td key={col.key}>{row[col.key] ?? '--'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return withAlertSummary(<NEmpty description="暂不支持的数据类型" class="mobile-overview-v2__empty-state" />)
    }

    const renderMetricSummary = (widget: OverviewPanelWidget<'metric-summary'>) => {
      const cfg = widget.config as MetricSummaryConfig
      const key = cfg.metricKey
      const labelMap: Record<string, string> = {
        'service-count': '服务总数',
        'healthy-services': '健康服务',
        'active-alerts': '活跃告警',
        'total-requests': '请求总量',
        'error-rate': '全局错误率',
        'p95-latency': 'P95 延迟',
        'ingest-success-rate': '采集成功率'
      }
      const iconMap: Record<string, any> = {
        'service-count': PhComputerTower,
        'healthy-services': PhLightning,
        'active-alerts': PhWarning,
        'total-requests': PhActivity,
        'error-rate': PhWarningCircle,
        'p95-latency': PhTrendUp,
        'ingest-success-rate': PhCheckCircle
      }
      const colorMap: Record<string, string> = {
        'service-count': 'var(--color-primary-6)',
        'healthy-services': 'var(--color-success-6)',
        'active-alerts': 'var(--color-warning-6)',
        'total-requests': 'var(--color-primary-6)',
        'error-rate': 'var(--color-danger-6)',
        'p95-latency': 'var(--color-warning-6)',
        'ingest-success-rate': 'var(--color-success-6)'
      }
      const unitMap: Record<string, string> = {
        'error-rate': '%',
        'p95-latency': 'ms',
        'ingest-success-rate': '%'
      }
      const value = summary.value[key] ?? null
      return (
        <div
          class="mobile-overview-v2__metric-item"
          style={{ '--metric-accent': colorMap[key] || 'var(--color-text-3)' }}>
          <div class="mobile-overview-v2__metric-label">
            <NIcon color={colorMap[key] || 'var(--color-text-3)'} size={14}>
              {h(iconMap[key] || PhActivity)}
            </NIcon>
            <span>{labelMap[key] || widget.title}</span>
          </div>
          <div class="mobile-overview-v2__metric-value">{displayMetric(value, unitMap[key] || '')}</div>
        </div>
      )
    }

    const renderRiskService = (_widget: OverviewPanelWidget<'risk-service'>) => {
      const items = riskServices.value.highRiskServices.length
        ? riskServices.value.highRiskServices.slice(0, 5)
        : riskServices.value.recentDegradedServices.slice(0, 5)
      return items.length ? (
        <div class="mobile-overview-v2__stack-list">
          {items.map((s: any, idx: number) => (
            <div
              class="mobile-overview-v2__risk-card"
              key={idx}
              onClick={() => router.push(`/mobile/service-detail-v2/${s.serviceId || s.id}`)}>
              <div>
                <div class="mobile-overview-v2__risk-title">{s.service || s.name}</div>
                <div class="mobile-overview-v2__risk-meta">
                  Health {s.healthStatus || 'unknown'} · 错误率 {displayMetric(s.errorRate, '%')} · 延迟{' '}
                  {displayMetric(s.latencyDelta, 'ms')}
                </div>
                <div class="mobile-overview-v2__risk-submeta">活跃事件 {displayMetric(s.activeIncidentCount)}</div>
              </div>
              <ServiceHealthBadge
                status={
                  s.healthStatus === 'healthy' ? 'healthy' : s.healthStatus === 'warning' ? 'degraded' : 'critical'
                }
                size="sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <NEmpty description="暂无风险服务" class="mobile-overview-v2__empty-state" />
      )
    }

    const renderIncidentList = (_widget: OverviewPanelWidget<'incident'>) => {
      const items = incidents.value.slice(0, 5)
      return items.length ? (
        <div class="mobile-overview-v2__stack-list">
          {items.map((inc: any, idx: number) => (
            <div
              class="mobile-overview-v2__incident-card"
              key={inc.id || idx}
              onClick={() => router.push(`/mobile/alerts-inbox/${inc.id}`)}>
              <div class="mobile-overview-v2__incident-header">
                <div>
                  <div class="mobile-overview-v2__risk-title">{inc.service || inc.title}</div>
                  <div class="mobile-overview-v2__risk-meta">{inc.message || inc.summary || '暂无摘要'}</div>
                </div>
                <ServiceHealthBadge
                  status={inc.level === 'critical' || inc.severity === 'critical' ? 'critical' : 'degraded'}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NEmpty description="暂无活跃事件" class="mobile-overview-v2__empty-state" />
      )
    }

    const renderIngestStatus = (_widget: OverviewPanelWidget<'ingest-status'>) => {
      if (!ingestStatus.value) return <NEmpty description="暂无采集状态" class="mobile-overview-v2__empty-state" />
      const statusColor = (h: string) =>
        h === 'healthy' ? 'var(--color-success-6)' : h === 'warning' ? 'var(--color-warning-6)' : 'var(--color-text-3)'
      const channels = [
        { key: 'metrics', label: 'Metrics', icon: PhActivity },
        { key: 'logs', label: 'Logs', icon: PhFile },
        { key: 'traces', label: 'Traces', icon: PhGitBranch }
      ]
      return (
        <div class="mobile-overview-v2__ingest-grid">
          {channels.map((ch) => {
            const val = ingestStatus.value?.[ch.key] || ingestStatus.value?.[ch.key]?.status
            const color = statusColor(String(val || ''))
            return (
              <div class="mobile-overview-v2__ingest-card" key={ch.key}>
                <div class="mobile-overview-v2__ingest-icon">
                  <NIcon color={color} size={18}>
                    {h(ch.icon)}
                  </NIcon>
                </div>
                <div class="mobile-overview-v2__ingest-value" style={{ color }}>
                  {val || '--'}
                </div>
                <div class="mobile-overview-v2__ingest-label">{ch.label}</div>
              </div>
            )
          })}
        </div>
      )
    }

    const renderTrendWidget = (widget: OverviewPanelWidget<'trend'>) => {
      const cfg = widget.config as TrendConfig
      const metric = cfg.metric
      const groupBy = (cfg as any).groupBy || 'overall'
      const values = getTrendValues(metric)
      const data = values.map((p: TrendPoint) => ({ timestamp: p.timestamp, value: p.value }))
      const color =
        metric === 'errors' ? 'var(--color-danger-6)' : metric === 'latency' ? '#722ed1' : 'var(--color-primary-6)'
      return data.length ? (
        <div>
          <div class="mobile-overview-v2__trend-tags">
            <NTag size="small" bordered={false}>
              {groupBy}
            </NTag>
          </div>
          <LineChart
            title={widget.title}
            data={data}
            color={color}
            height="200px"
            variant="monitor"
            area={metric === 'requests'}
            loading={loading.value}
          />
        </div>
      ) : (
        <NEmpty description="暂无趋势数据" class="mobile-overview-v2__empty-state" />
      )
    }

    const renderQuickPivot = (widget: OverviewPanelWidget<'quick-pivot'>) => {
      const cfg = widget.config as QuickPivotConfig
      const links = cfg.links || [
        { key: 'services' as const },
        { key: 'alerts' as const },
        { key: 'traces' as const },
        { key: 'logs' as const },
        { key: 'topology' as const }
      ]
      const routeMap: Record<string, string> = {
        services: '/mobile/services-v2',
        alerts: '/mobile/alerts-inbox',
        traces: '/mobile/trace-explorer',
        logs: '/mobile/log-center',
        topology: '/mobile/services-v2',
        'admin-ingestion': '/mobile/instance-monitor'
      }
      const labelMap: Record<string, string> = {
        services: '服务目录',
        alerts: '告警',
        traces: '链路',
        logs: '日志',
        topology: '拓扑',
        'admin-ingestion': '接入'
      }
      const iconMap: Record<string, any> = {
        services: PhStack,
        alerts: PhBell,
        traces: PhGitBranch,
        logs: PhFile,
        topology: PhGitBranch,
        'admin-ingestion': PhComputerTower
      }
      return (
        <div class="mobile-overview-v2__pivot-grid">
          {links
            .filter((l: any) => l.visible !== false)
            .map((entry: any) => (
              <NButton
                key={entry.key}
                block
                secondary
                size="small"
                onClick={() => {
                  const path = routeMap[entry.key]
                  if (path) router.push(path)
                }}>
                <NIcon>{h(iconMap[entry.key] || PhStack)}</NIcon>
                <span class="mobile-overview-v2__pivot-label">{labelMap[entry.key] || entry.key}</span>
              </NButton>
            ))}
        </div>
      )
    }

    // ── Render ──

    return () => (
      <div
        class="mobile-overview-v2"
        onTouchstart={handleTouchStart}
        onTouchmove={handleTouchMove}
        onTouchend={handleTouchEnd}>
        <MobileHeaderToolbar />
        <div
          class="mobile-overview-v2__pull-indicator"
          style={{
            height: `${pullDistance.value}px`,
            opacity: pullDistance.value / 60
          }}>
          <NSpin size={pullRefreshing.value ? 18 : 14} show={pullRefreshing.value || pullDistance.value > 10} />
          <span class="mobile-overview-v2__pull-text">
            {pullRefreshing.value ? '刷新中…' : pullDistance.value >= 60 ? '松开刷新' : '下拉刷新'}
          </span>
        </div>
        <div class="mobile-overview-v2__header">
          <h2 class="mobile-overview-v2__title">看板</h2>
          <div class="mobile-overview-v2__header-right">
            <span class="mobile-overview-v2__time">{timeAgo.value}</span>
            <NButton
              size="tiny"
              secondary
              type="primary"
              loading={refreshing.value}
              onClick={() => {
                refreshing.value = true
                loadData()
              }}>
              <NIcon size={16}>
                <PhArrowsClockwise />
              </NIcon>
            </NButton>
          </div>
        </div>

        {loading.value && !refreshing.value ? (
          <div class="mobile-overview-v2__loading">
            <NSpin size="large" />
          </div>
        ) : error.value ? (
          <NResult
            status="500"
            title="数据加载失败"
            description="请检查网络连接后重试"
            class="mobile-overview-v2__error">
            {{
              footer: () => (
                <NButton
                  type="primary"
                  size="small"
                  onClick={() => {
                    refreshing.value = true
                    loadData()
                  }}>
                  重新加载
                </NButton>
              )
            }}
          </NResult>
        ) : (
          <>
            {/* ── Control Panel ── */}
            <div class="mobile-overview-v2__control-panel">
              <div
                class="mobile-overview-v2__control-toggle"
                onClick={() => (showControlPanel.value = !showControlPanel.value)}>
                <NIcon size={16}>
                  <PhClock />
                </NIcon>
                <span>筛选控制</span>
                <span class={['mobile-overview-v2__control-arrow', showControlPanel.value && 'is-open']}>▾</span>
              </div>

              {showControlPanel.value && (
                <div class="mobile-overview-v2__control-body">
                  {/* Time Range Selector */}
                  <div class="mobile-overview-v2__control-section">
                    <div class="mobile-overview-v2__control-label">时间范围</div>
                    <div class="mobile-overview-v2__time-range-row">
                      {(['15m', '1h', '4h', '1d', '2d', '7d'] as TimeRangeKey[]).map((range) => (
                        <NButton
                          key={range}
                          size="tiny"
                          round
                          type={activeTimeRange.value === range ? 'primary' : 'default'}
                          ghost={activeTimeRange.value !== range}
                          onClick={() => onTimeRangeChange(range)}>
                          {TIME_RANGE_LABELS[range]}
                        </NButton>
                      ))}
                      <NButton
                        size="tiny"
                        round
                        type={liveMode.value ? 'success' : 'default'}
                        ghost={!liveMode.value}
                        onClick={onToggleLive}>
                        <NIcon size={14}>{liveMode.value ? <PhPauseCircle /> : <PhPlayCircle />}</NIcon>
                        <span style={{ marginLeft: '4px' }}>Live</span>
                      </NButton>
                    </div>
                  </div>

                  {/* Auto Refresh */}
                  <div class="mobile-overview-v2__control-section">
                    <div class="mobile-overview-v2__control-label">自动刷新</div>
                    <div class="mobile-overview-v2__time-range-row">
                      {overviewAutoRefreshOptions.map((opt) => (
                        <NButton
                          key={opt.value}
                          size="tiny"
                          round
                          type={autoRefreshSetting.value === opt.value ? 'primary' : 'default'}
                          ghost={autoRefreshSetting.value !== opt.value}
                          onClick={() => onAutoRefreshChange(opt.value)}>
                          {opt.label}
                        </NButton>
                      ))}
                    </div>
                    {autoRefreshFailureCount.value >= 3 && (
                      <div style="color: var(--color-warning-6); font-size: 12px; margin-top: 4px;">
                        连续刷新失败，已暂停自动刷新
                      </div>
                    )}
                  </div>

                  {/* Service Search */}
                  <div class="mobile-overview-v2__control-section">
                    <div class="mobile-overview-v2__control-label">服务筛选</div>
                    <div class="mobile-overview-v2__service-search-row">
                      <NInput
                        value={serviceSearch.value}
                        placeholder="输入服务名称搜索…"
                        size="small"
                        clearable
                        onUpdate:value={(v: string) => (serviceSearch.value = v)}
                        onKeydown={(e: KeyboardEvent) => {
                          if (e.key === 'Enter') onServiceSearch()
                        }}>
                        {{
                          prefix: () => (
                            <NIcon size={14}>
                              <PhMagnifyingGlass />
                            </NIcon>
                          )
                        }}
                      </NInput>
                      <NButton size="small" type="primary" secondary onClick={onServiceSearch}>
                        搜索
                      </NButton>
                    </div>
                    {activeServiceFilter.value && (
                      <div class="mobile-overview-v2__service-indicator">
                        <span>
                          当前服务: <strong>{activeServiceFilter.value}</strong>
                        </span>
                        <NButton size="tiny" quaternary type="error" onClick={onClearServiceFilter}>
                          <NIcon size={12}>
                            <PhXCircle />
                          </NIcon>
                          <span style={{ marginLeft: '2px' }}>清除</span>
                        </NButton>
                      </div>
                    )}
                  </div>

                  {/* Tag Filter Chips */}
                  {widgetTagOptions.value.length > 0 && (
                    <div class="mobile-overview-v2__control-section">
                      <div class="mobile-overview-v2__control-label">
                        卡片分类
                        <NTag size="tiny" bordered={false} type="info" style={{ marginLeft: '6px' }}>
                          {filteredWidgets.value.length}
                        </NTag>
                      </div>
                      <div class="mobile-overview-v2__tag-chip-scroll">
                        <NButton
                          size="tiny"
                          round
                          type={!activeTagFilter.value ? 'primary' : 'default'}
                          ghost={!!activeTagFilter.value}
                          onClick={() => onTagFilterSelect('')}>
                          全部
                        </NButton>
                        {widgetTagOptions.value.map(({ tag, count }) => (
                          <NButton
                            key={tag}
                            size="tiny"
                            round
                            type={activeTagFilter.value === tag ? 'primary' : 'default'}
                            ghost={activeTagFilter.value !== tag}
                            onClick={() => onTagFilterSelect(tag)}>
                            {tag} ({count})
                          </NButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KPI 指标摘要 */}
            <NCard bordered={false} size="small" class="mobile-overview-v2__summary-card">
              <NGrid cols={2} xGap={12} yGap={14}>
                {[
                  {
                    key: 'serviceCount',
                    icon: PhComputerTower,
                    label: '服务总数',
                    extra: `健康 ${displayMetric(summary.value.healthyServices)}`,
                    color: 'var(--color-primary-6)'
                  },
                  {
                    key: 'activeAlerts',
                    icon: PhWarning,
                    label: '活跃告警',
                    extra: null,
                    color: 'var(--color-warning-6)'
                  },
                  {
                    key: 'totalRequests',
                    icon: PhActivity,
                    label: '请求总量',
                    extra: null,
                    color: 'var(--color-primary-6)'
                  },
                  {
                    key: 'errorRate',
                    icon: PhWarningCircle,
                    label: '全局错误率',
                    extra: null,
                    unit: '%',
                    color: 'var(--color-danger-6)'
                  },
                  {
                    key: 'p95Latency',
                    icon: PhTrendUp,
                    label: 'P95 延迟',
                    extra: null,
                    unit: 'ms',
                    color: 'var(--color-warning-6)'
                  },
                  {
                    key: 'darwinCpu',
                    icon: PhCpu,
                    label: '系统负载',
                    extra: null,
                    unit: '%',
                    color: 'var(--color-primary-6)'
                  }
                ].map((item) => (
                  <NGridItem key={item.key}>
                    <div class="mobile-overview-v2__metric-card">
                      <div class="mobile-overview-v2__metric-label">
                        <NIcon color={item.color} size={14}>
                          {h(item.icon)}
                        </NIcon>
                        <span>{item.label}</span>
                      </div>
                      <div class="mobile-overview-v2__metric-value">
                        {displayMetric(summary.value[item.key], (item as any).unit || '')}
                      </div>
                      {item.extra && <div class="mobile-overview-v2__metric-subtitle">{item.extra}</div>}
                    </div>
                  </NGridItem>
                ))}
              </NGrid>
            </NCard>

            {/* Darwin 资源仪表盘 */}
            {(summary.value.darwinCpu !== null || summary.value.darwinMemory !== null) && (
              <div class="mobile-overview-v2__section">
                <div class="mobile-overview-v2__section-title">Darwin 资源</div>
                <div class="mobile-overview-v2__darwin-grid">
                  {summary.value.darwinCpu !== null && (
                    <div class="mobile-overview-v2__darwin-card">
                      <div class="mobile-overview-v2__darwin-label">
                        <NIcon color="var(--color-primary-6)" size={14}>
                          <PhCpu />
                        </NIcon>
                        <span>CPU</span>
                      </div>
                      <GaugeChart
                        value={summary.value.darwinCpu!}
                        min={0}
                        max={100}
                        unit="%"
                        color="var(--color-primary-6)"
                        height="160px"
                        loading={loading.value}
                      />
                    </div>
                  )}
                  {summary.value.darwinMemory !== null && (
                    <div class="mobile-overview-v2__darwin-card">
                      <div class="mobile-overview-v2__darwin-label">
                        <NIcon color="var(--color-warning-6)" size={14}>
                          <PhCloud />
                        </NIcon>
                        <span>内存</span>
                      </div>
                      <GaugeChart
                        value={summary.value.darwinMemory!}
                        min={0}
                        max={100}
                        unit="%"
                        color="var(--color-warning-6)"
                        height="160px"
                        loading={loading.value}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel Widgets */}
            {filteredWidgets.value.length > 0 ? (
              <>
                <div class="mobile-overview-v2__section">
                  <div class="mobile-overview-v2__section-title">
                    {currentPanel.value?.name || 'Widgets'}
                    <NTag size="tiny" bordered={false} type="info" style={{ marginLeft: '8px' }}>
                      {filteredWidgets.value.length} 个
                    </NTag>
                  </div>
                </div>
                <div class="mobile-overview-v2__widget-list">
                  {filteredWidgets.value.map((widget) => (
                    <div class="mobile-overview-v2__widget-card" key={widget.id}>
                      <div class="mobile-overview-v2__widget-card-header">
                        <span class="mobile-overview-v2__widget-card-title">{widget.title}</span>
                        <NTag size="tiny" bordered={false} type="default">
                          {widget.kind}
                        </NTag>
                      </div>
                      <div class="mobile-overview-v2__widget-card-body">{renderWidgetBody(widget)}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div class="mobile-overview-v2__section">
                <NEmpty
                  description="当前面板暂无卡片，请在桌面端添加卡片后查看。"
                  class="mobile-overview-v2__empty-state"
                />
              </div>
            )}

            {/* 快捷入口 */}
            <NCard bordered={false} size="small" class="mobile-overview-v2__summary-card">
              <div class="mobile-overview-v2__pivot-grid">
                {[
                  { key: 'services', icon: PhStack, label: '服务目录', path: '/mobile/services-v2' },
                  { key: 'alerts', icon: PhBell, label: '告警', path: '/mobile/alerts-inbox' },
                  { key: 'traces', icon: PhGitBranch, label: '链路', path: '/mobile/trace-explorer' },
                  { key: 'logs', icon: PhFile, label: '日志', path: '/mobile/log-center' },
                  { key: 'instance', icon: PhComputerTower, label: '实例', path: '/mobile/instance-monitor' },
                  { key: 'rules', icon: PhWarningCircle, label: '规则', path: '/mobile/alert-rules' }
                ].map((item) => (
                  <NButton class="mobile-overview-v2__pivot-btn" size="large" onClick={() => router.push(item.path)}>
                    <NIcon size={20}>{h(item.icon)}</NIcon>
                    <span class="mobile-overview-v2__pivot-label">{item.label}</span>
                  </NButton>
                ))}
              </div>
            </NCard>
          </>
        )}
      </div>
    )
  }
})
