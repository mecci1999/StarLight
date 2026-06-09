import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NList,
  NListItem,
  NModal,
  NProgress,
  NSelect,
  NSpin,
  NStatistic,
  NSwitch,
  NTag,
  NThing,
  useMessage
} from 'naive-ui'
import {
  fetchCatalogServices,
  fetchMetricsSchema,
  fetchOverviewSummary,
  fetchOverviewTrends,
  fetchOverviewRiskServices,
  fetchOverviewIngestStatus,
  fetchOverviewIncidents,
  getDashboardState,
  previewMetricCard,
  compileMetricQuery,
  validateMetricQuery,
  queryMetricCards,
  saveDashboardState,
  type MetricsDatasetScope
} from '@/api'
import { saveAlertRule, updateAlertRule } from '@/api/alerts'
import type { AlertRuleItem, MetricsAnalysisData, ServiceInstance, ServiceItem } from '@/types/monitor'
import PageHeader from '@/shared/layout/PageHeader'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import ServiceHealthBadge from '@/shared/components/ServiceHealthBadge'
import ResultTable from '@/shared/components/ResultTable'
import PanelToolbar from '@/domains/overview/components/PanelToolbar'
import PanelWidgetCard from '@/domains/overview/components/PanelWidgetCard'
import OverviewAnalyticsWidgetEditor from '@/domains/overview/components/OverviewAnalyticsWidgetEditor'
import {
  applyVisibleOrderToPanelWidgets,
  reorderVisibleWidgetIds,
  type OverviewReorderPlacement
} from '@/domains/overview/overviewWidgetReorder'
import { useTimeStore, type TimeRangeKey } from '@/store/useTimeStore'
import GaugeChart from '@/components/charts/GaugeChart'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import PieChart from '@/components/charts/PieChart'
import { getPreferredMetricsDatasetScope, getStoredUserInfo } from '@/services/authSession'
import { canAccessMetricsDatasetScope, canUseMetricsSourceKind } from '@/services/authSession'
import {
  filterMetricsCatalog,
  loadMetricsCatalogFallback,
  type MetricsCatalogFilters,
  type MetricsCatalogSchemaItem,
  type MetricsCatalogSourceMode
} from '@/domains/metrics/catalogModel'
import {
  buildOverviewWidgetEditorState,
  buildShippedOverviewPanels,
  buildWidgetDraft,
  canWidgetUseSmallSize,
  cloneOverviewPanels,
  createUserPanelDefinition,
  type DarwinInfraMetricKey,
  type DarwinInfraSummaryConfig,
  type DarwinInfraTrendConfig,
  type DarwinInstanceTableConfig,
  getQuickPivotLabel,
  getAllowedWidgetVisualizations,
  getDefaultWidgetVisualization,
  normalizeOverviewWidget,
  normalizeWidgetTags,
  overviewWidgetCatalog,
  type IncidentConfig,
  type IngestStatusConfig,
  type MetricSummaryConfig,
  type OverviewCapabilityState,
  type OverviewCompareWindow,
  type OverviewIngestSource,
  type OverviewIncidentSource,
  type OverviewMetricKey,
  type OverviewPanelDefinition,
  type OverviewPanelWidget,
  type OverviewQuickPivotLinkKey,
  type OverviewSeverity,
  type OverviewWidgetQueryEditMode,
  type OverviewWidgetDisplayMetricKey,
  type OverviewWidgetEditorState,
  type OverviewWidgetEditorTimeRange,
  type OverviewWidgetTimeGranularity,
  type OverviewWidgetVisualization,
  type OverviewTrendGroupBy,
  type OverviewTrendMetricKey,
  type OverviewWidgetKind,
  type OverviewWidgetSize,
  type QuickPivotConfig,
  type OverviewCapabilityKey,
  type RiskServiceConfig,
  type TrendConfig
} from '@/domains/overview/panelModel'
import { parseQuerySpecJson } from '@/domains/overview/customDashboardPreviewModel'
import { buildOverviewWidgetQueryPreviewSpec } from '@/domains/overview/overviewWidgetQueryPreviewModel'
import { buildOverviewSnapshotFetchPlan } from '@/domains/overview/overviewSnapshotPlan'
import {
  buildOverviewCardsQueryRequest,
  createEmptyOverviewPanel,
  mapQueryResultsByWidgetId
} from '@/domains/overview/overviewRuntimeQueryModel'
import {
  normalizeQueryAlertRules,
  type CardData,
  type QueryAlertRule,
  type QuerySpec
} from '@/domains/metrics/queryModel'
import { formatQueryNumberDisplay, formatQueryNumberValue } from '@/domains/overview/queryNumberDisplay'
import './OverviewPage.scss'

type ScopeValue = { service: string | null }

type TrendPoint = { timestamp: number; value: number }
type TrendSnapshot = {
  requests: TrendPoint[]
  errors: TrendPoint[]
  latency: TrendPoint[]
}

type RiskServiceEntry = {
  serviceId?: string
  service?: string
  healthStatus?: string
  errorRate?: number
  latencyDelta?: number
  activeIncidentCount?: number
  lastAbnormalAt?: string | null
}

type CompareDirection = 'up' | 'down' | 'flat'
type KpiCard = {
  key: OverviewMetricKey
  label: string
  value: string | number | null
  baseline: string
  delta: string
  mom: string
  deltaDirection: CompareDirection
  route?: {
    path: string
    query: Record<string, string | undefined>
  }
}

type WidgetEditorMode = 'create' | 'update'
type WidgetEditorDraft = OverviewPanelWidget
type QueryWidgetConfig = OverviewPanelWidget<'query-card'>['config']
type OverviewAlertRuleDraft = Omit<AlertRuleItem, 'id'> & { id?: string }
type OverviewResultTableColumn = { title: string; key: string }
type OverviewResultTableRow = Record<string, unknown>
type OverviewAutoRefreshKey = 'off' | 'auto' | '15s' | '30s' | '1m' | '5m'
type PersistedOverviewAutoRefreshState = {
  autoRefresh: OverviewAutoRefreshKey
  updatedAt?: number
}
type OverviewMetricDiscoveryPreset = {
  key: string
  displayedMetrics: OverviewWidgetDisplayMetricKey[]
  label: string
  title: string
  description: string
  unit?: string
  recommendation: 'number' | 'line'
  configPatch:
    | Partial<MetricSummaryConfig>
    | Partial<TrendConfig>
    | Partial<DarwinInfraSummaryConfig>
    | Partial<DarwinInfraTrendConfig>
}

const PANEL_STATE_STORAGE_KEY = 'starlight_overview_panel_state_v5'
const DEFAULT_VIEW_STORAGE_KEY = 'starlight_overview_default_view_v5'
const AUTO_REFRESH_STORAGE_KEY = 'starlight_overview_auto_refresh_v1'
const DEFAULT_PANEL_ID = 'user-overview'
const DEFAULT_SCOPE: ScopeValue = { service: null }
const OVERVIEW_LOAD_DEDUPE_WINDOW_MS = 1500
const compareWindowOptions = [
  { label: '上一周期', value: 'previous-period' },
  { label: '最近 24 小时', value: '24h' },
  { label: '最近 7 天', value: '7d' }
]
const trendMetricOptions = [
  { label: '请求趋势', value: 'requests' },
  { label: '错误趋势', value: 'errors' },
  { label: '延迟趋势', value: 'latency' }
]
const trendGroupByOptions = [
  { label: 'Overall', value: 'overall' },
  { label: '按环境', value: 'env' },
  { label: '按团队', value: 'team' }
]
const trendAggregationOptions = [
  { label: 'sum', value: 'sum' },
  { label: 'avg', value: 'avg' },
  { label: 'p95', value: 'p95' },
  { label: 'rate', value: 'rate' }
]
const widgetSizeOptions: Array<{ label: string; value: OverviewWidgetSize }> = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' }
]
const overviewAutoRefreshOptions: Array<{ label: string; value: OverviewAutoRefreshKey }> = [
  { label: '关闭', value: 'off' },
  { label: '自动', value: 'auto' },
  { label: '15 秒', value: '15s' },
  { label: '30 秒', value: '30s' },
  { label: '1 分钟', value: '1m' },
  { label: '5 分钟', value: '5m' }
]
const isOverviewAutoRefreshKey = (value: string): value is OverviewAutoRefreshKey =>
  overviewAutoRefreshOptions.some((option) => option.value === value)
const editorGranularityOptions: Array<{ label: string; value: OverviewWidgetTimeGranularity }> = [
  { label: '小时', value: 'hour' },
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
]
const editorTimeRangeCatalog: Record<
  OverviewWidgetTimeGranularity,
  Array<{ label: string; value: OverviewWidgetEditorTimeRange }>
> = {
  hour: [
    { label: '最近 1 分钟', value: '1m' },
    { label: '最近 5 分钟', value: '5m' },
    { label: '最近 10 分钟', value: '10m' },
    { label: '最近 15 分钟', value: '15m' },
    { label: '最近 30 分钟', value: '30m' },
    { label: '最近 1 小时', value: '1h' },
    { label: '最近 4 小时', value: '4h' },
    { label: '最近 6 小时', value: '6h' },
    { label: '最近 12 小时', value: '12h' }
  ],
  day: [
    { label: '最近 1 天', value: '1d' },
    { label: '最近 2 天', value: '2d' },
    { label: '最近 7 天', value: '7d' }
  ],
  week: [
    { label: '最近 7 天', value: '7d' },
    { label: '最近 14 天', value: '14d' }
  ],
  month: [
    { label: '最近 14 天', value: '14d' },
    { label: '最近 30 天', value: '30d' }
  ]
}
const widgetVisualizationOptions: Record<OverviewWidgetVisualization, { label: string; description: string }> = {
  line: { label: '线图', description: '适合展示时序变化趋势。' },
  bar: { label: '柱图', description: '适合展示分段对比与时间切片。' },
  donut: { label: '环图', description: '适合展示当前指标占比。' },
  cumulative: { label: '累计图', description: '适合观察随时间累积的变化。' },
  table: { label: '表格', description: '适合查看明细与多指标对照。' },
  number: { label: '数值', description: '突出当前值与关键对比信息。' }
}
const comparisonEditorOptions: Array<{ label: string; value: OverviewCompareWindow; description: string }> = [
  { label: '环比上期', value: 'previous-period', description: '与上一等长周期进行对比。' },
  { label: '同比时间范围', value: 'same-period', description: '对照同类时间窗口查看趋势变化。' }
]
const queryCompareModeOptions: Array<{ label: string; value: 'previous-period' | 'previous-day' | 'previous-week' }> = [
  { label: '上一周期', value: 'previous-period' },
  { label: '昨天同一时间', value: 'previous-day' },
  { label: '上周同一时间', value: 'previous-week' }
]
const queryCompareDisplayOptions: Array<{ label: string; value: 'relative' | 'absolute' | 'both' }> = [
  { label: '百分比', value: 'relative' },
  { label: '绝对差值', value: 'absolute' },
  { label: '两者都显示', value: 'both' }
]
const queryCompareDirectionalityOptions: Array<{
  label: string
  value: 'increase_better' | 'decrease_better' | 'neutral'
}> = [
  { label: '上升更好', value: 'increase_better' },
  { label: '下降更好', value: 'decrease_better' },
  { label: '仅展示趋势', value: 'neutral' }
]
const queryDisplayUnitOptions = [
  { label: '百分比 (%)', value: '%' },
  { label: '毫秒 (ms)', value: 'ms' },
  { label: '请求数 (request)', value: 'request' },
  { label: '次数 (count)', value: 'count' },
  { label: '无单位', value: '' }
]
const queryAlertOperatorOptions = [
  { label: '大于 >', value: '>' as const },
  { label: '大于等于 >=', value: '>=' as const },
  { label: '小于 <', value: '<' as const },
  { label: '小于等于 <=', value: '<=' as const },
  { label: '等于 =', value: '=' as const }
]
const queryAlertLevelOptions = [
  { label: '警告', value: 'warning' as const },
  { label: '严重', value: 'critical' as const },
  { label: '提示', value: 'info' as const }
]
const queryAlertChannelOptions = [
  { label: 'Email', value: 'Email' },
  { label: 'Webhook', value: 'Webhook' },
  { label: '站内通知', value: 'InApp' }
]
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
const preferredWidgetTagOrder = [
  '总览',
  '健康',
  '性能',
  '延迟',
  '流量',
  '吞吐',
  '稳定性',
  '错误',
  '异常排查',
  '告警',
  '事件',
  '服务',
  '接入',
  '采集',
  '资源',
  '资源水位',
  '容量',
  '实例',
  'CPU',
  '内存',
  '指标',
  '趋势',
  '摘要',
  '自定义查询',
  '快捷入口',
  '导航',
  '状态',
  '风险',
  '日志',
  '链路'
]
const defaultWidgetTagCatalog = normalizeWidgetTags([
  ...preferredWidgetTagOrder,
  ...Object.values(widgetKindFilterTags).flat(),
  ...Object.values(metricScenarioTags).flatMap((tags) => tags || []),
  ...Object.values(capabilityFilterTags)
])
const resolveWidgetScenarioMetricKeys = (widget: OverviewPanelWidget): OverviewWidgetDisplayMetricKey[] => {
  const editorMetrics = buildOverviewWidgetEditorState(widget).displayedMetrics || []
  if (editorMetrics.length) return editorMetrics

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
const displayToggleLabels = {
  showTotal: { label: '合计', description: '显示所选指标的总量。' },
  showAverage: { label: '均值', description: '显示平均水平，便于快速判断波动。' },
  showPreviousPeriod: { label: '环比上期', description: '显示上一周期对比结果。' },
  showSamePeriod: { label: '同比时间范围', description: '显示同类时间窗口对比。' }
}
const widgetDisplayMetricMeta: Record<OverviewWidgetDisplayMetricKey, { label: string; color: string; unit?: string }> =
  {
    requests: { label: '请求趋势', color: '#165dff' },
    errors: { label: '错误趋势', color: '#f53f3f' },
    latency: { label: '延迟趋势', color: '#722ed1', unit: 'ms' },
    'service-count': { label: '服务总数', color: '#165dff' },
    'healthy-services': { label: '健康服务数', color: '#00b42a' },
    'active-alerts': { label: '活跃告警', color: '#f53f3f' },
    'total-requests': { label: '请求总量', color: '#165dff' },
    'error-rate': { label: '全局错误率', color: '#ff7d00', unit: '%' },
    'p95-latency': { label: 'P95 延迟', color: '#722ed1', unit: 'ms' },
    'ingest-success-rate': { label: 'Ingest 成功率', color: '#00b42a', unit: '%' },
    cpu: { label: 'CPU 使用率', color: 'var(--color-primary-6)', unit: '%' },
    memory: { label: '内存使用率', color: 'var(--color-success-6)', unit: '%' }
  }
const buildOverviewMetricDiscoveryPresets = (kind: OverviewWidgetKind): OverviewMetricDiscoveryPreset[] => {
  if (kind === 'metric-summary') {
    return [
      {
        key: 'service-count',
        displayedMetrics: ['service-count'],
        label: '服务总数',
        title: '服务总数',
        description: '展示当前范围内的服务总量。',
        recommendation: 'number',
        configPatch: { metricKey: 'service-count' }
      },
      {
        key: 'healthy-services',
        displayedMetrics: ['healthy-services'],
        label: '健康服务数',
        title: '健康服务数',
        description: '展示当前范围内的健康服务数量。',
        recommendation: 'number',
        configPatch: { metricKey: 'healthy-services' }
      },
      {
        key: 'active-alerts',
        displayedMetrics: ['active-alerts'],
        label: '活跃告警',
        title: '活跃告警',
        description: '展示当前范围内的活跃告警数量。',
        recommendation: 'number',
        configPatch: { metricKey: 'active-alerts' }
      },
      {
        key: 'total-requests',
        displayedMetrics: ['total-requests'],
        label: '请求总量',
        title: '请求总量',
        description: '展示当前范围内的请求总量，适合快速查看整体吞吐。',
        unit: 'request',
        recommendation: 'number',
        configPatch: { metricKey: 'total-requests' }
      },
      {
        key: 'error-rate',
        displayedMetrics: ['error-rate'],
        label: '全局错误率',
        title: '全局错误率',
        description: '展示当前范围内的整体错误率，适合快速定位异常。',
        unit: '%',
        recommendation: 'number',
        configPatch: { metricKey: 'error-rate' }
      },
      {
        key: 'p95-latency',
        displayedMetrics: ['p95-latency'],
        label: 'P95 延迟',
        title: 'P95 延迟',
        description: '展示当前范围内的 P95 延迟，适合观察性能风险。',
        unit: 'ms',
        recommendation: 'number',
        configPatch: { metricKey: 'p95-latency' }
      },
      {
        key: 'ingest-success-rate',
        displayedMetrics: ['ingest-success-rate'],
        label: 'Ingest 成功率',
        title: 'Ingest 成功率',
        description: '展示当前范围内的采集成功率。',
        unit: '%',
        recommendation: 'number',
        configPatch: { metricKey: 'ingest-success-rate' }
      }
    ]
  }

  if (kind === 'trend') {
    return [
      {
        key: 'requests',
        displayedMetrics: ['requests'],
        label: '请求趋势',
        title: '请求趋势',
        description: '按时间展示请求量变化趋势，适合观察流量波动。',
        unit: 'request',
        recommendation: 'line',
        configPatch: { metric: 'requests' }
      },
      {
        key: 'errors',
        displayedMetrics: ['errors'],
        label: '错误趋势',
        title: '错误趋势',
        description: '按时间展示错误量变化趋势，适合定位异常时间段。',
        unit: 'error',
        recommendation: 'line',
        configPatch: { metric: 'errors' }
      },
      {
        key: 'latency',
        displayedMetrics: ['latency'],
        label: '延迟趋势',
        title: '延迟趋势',
        description: '按时间展示延迟变化趋势，适合观察性能劣化。',
        unit: 'ms',
        recommendation: 'line',
        configPatch: { metric: 'latency' }
      }
    ]
  }

  if (kind === 'darwin-infra-summary') {
    return [
      {
        key: 'cpu',
        displayedMetrics: ['cpu'],
        label: 'CPU 使用率',
        title: 'CPU 使用率',
        description: '展示 Darwin 服务或全局视角下的 CPU 当前值。',
        unit: '%',
        recommendation: 'number',
        configPatch: { metric: 'cpu' }
      },
      {
        key: 'memory',
        displayedMetrics: ['memory'],
        label: '内存使用率',
        title: '内存使用率',
        description: '展示 Darwin 服务或全局视角下的内存当前值。',
        unit: '%',
        recommendation: 'number',
        configPatch: { metric: 'memory' }
      }
    ]
  }

  if (kind === 'darwin-infra-trend') {
    return [
      {
        key: 'cpu',
        displayedMetrics: ['cpu'],
        label: 'CPU 使用率',
        title: 'CPU 使用率趋势',
        description: '展示 Darwin 服务或全局视角下的 CPU 趋势变化。',
        unit: '%',
        recommendation: 'line',
        configPatch: { metric: 'cpu' }
      },
      {
        key: 'memory',
        displayedMetrics: ['memory'],
        label: '内存使用率',
        title: '内存使用率趋势',
        description: '展示 Darwin 服务或全局视角下的内存趋势变化。',
        unit: '%',
        recommendation: 'line',
        configPatch: { metric: 'memory' }
      }
    ]
  }

  return []
}
const severityOptions = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' }
]
const incidentSourceOptions = [
  { label: 'Metrics', value: 'metrics' },
  { label: 'Logs', value: 'logs' },
  { label: 'Traces', value: 'traces' },
  { label: 'Alerts', value: 'alerts' }
]
const ingestSourceOptions = [
  { label: 'Metrics', value: 'metrics' },
  { label: 'Logs', value: 'logs' },
  { label: 'Traces', value: 'traces' }
]
const quickPivotOptions = [
  { label: '服务目录', value: 'services' },
  { label: '服务拓扑', value: 'topology' },
  { label: 'Trace Explorer', value: 'traces' },
  { label: 'Logs Explorer', value: 'logs' },
  { label: 'Alert Inbox', value: 'alerts' },
  { label: '接入管理', value: 'admin-ingestion' }
]

type PersistedOverviewPanelState = {
  panels: OverviewPanelDefinition[]
  baselines: Record<string, OverviewPanelDefinition>
}

type PersistedOverviewDefaultView = {
  panelId: string
  timeRange: TimeRangeKey
  scope: ScopeValue
  datasetScope?: MetricsDatasetScope
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const normalizePanelEditable = (panel: OverviewPanelDefinition): OverviewPanelDefinition => ({
  ...panel,
  editable: panel.kind === 'user'
})

const buildDefaultPanelState = (): PersistedOverviewPanelState => {
  const shippedPanels = [createEmptyOverviewPanel()].map((panel) =>
    normalizePanelEditable({
      ...panel,
      widgets: panel.widgets.map((widget) => normalizeOverviewWidget(widget))
    })
  )
  return {
    panels: shippedPanels,
    baselines: Object.fromEntries(shippedPanels.map((panel) => [panel.id, cloneOverviewPanels(panel)])) as Record<
      string,
      OverviewPanelDefinition
    >
  }
}

const average = (values: number[]) => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const formatSignedValue = (value: number, unit = '', digits = 1) => {
  const fixed = Number(value.toFixed(digits))
  const sign = fixed > 0 ? '+' : ''
  return `${sign}${fixed}${unit}`
}

const buildTrendComparison = (values: number[], unit = '', inverse = false) => {
  if (values.length < 2) return '对比数据不足'
  const half = Math.max(1, Math.floor(values.length / 2))
  const baseline = average(values.slice(0, half))
  const current = average(values.slice(half))
  if (baseline === 0 && current === 0) return '较前序持平'
  if (baseline === 0) return `较前序新增 ${current.toFixed(unit ? 1 : 0)}${unit}`

  const delta = Number((((current - baseline) / baseline) * 100).toFixed(1))
  const direction = delta === 0 ? '持平' : delta > 0 ? (inverse ? '下降' : '上升') : inverse ? '上升' : '下降'
  return `较前序${direction} ${Math.abs(delta)}%`
}

const buildTrendMeta = (
  values: number[],
  unit = '',
  inverse = false
): { baseline: string; delta: string; mom: string; deltaDirection: CompareDirection } => {
  if (values.length < 2) {
    return {
      baseline: '对比数据不足',
      delta: '—',
      mom: '等待趋势',
      deltaDirection: 'flat'
    }
  }

  const half = Math.max(1, Math.floor(values.length / 2))
  const baseline = average(values.slice(0, half))
  const current = average(values.slice(half))
  const deltaValue = current - baseline

  return {
    baseline: `${baseline.toFixed(unit ? 1 : 0)}${unit}`,
    delta:
      baseline === 0 && current === 0
        ? '0'
        : baseline === 0
          ? `+${current.toFixed(unit ? 1 : 0)}${unit}`
          : formatSignedValue(deltaValue, unit, unit ? 1 : 0),
    mom: buildTrendComparison(values, unit, inverse).replace('较前序', ''),
    deltaDirection: deltaValue === 0 ? 'flat' : deltaValue > 0 ? 'up' : 'down'
  }
}

const deltaArrow = (direction: CompareDirection) => {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '→'
}

const toOverviewTimeRange = (range: TimeRangeKey) => (range === 'custom' ? undefined : `-${range}`)

const deltaColorClass = (direction: CompareDirection) => {
  if (direction === 'up') return 'overview-page__metric-delta--up'
  if (direction === 'down') return 'overview-page__metric-delta--down'
  return 'overview-page__metric-delta--flat'
}

const getRouteForQuickPivot = (key: OverviewQuickPivotLinkKey) => {
  switch (key) {
    case 'services':
      return '/home/services'
    case 'topology':
      return '/home/services/topology'
    case 'traces':
      return '/home/investigate/traces'
    case 'logs':
      return '/home/investigate/logs'
    case 'alerts':
      return '/home/alerts/inbox'
    case 'admin-ingestion':
      return '/home/admin/ingestion'
    default:
      return '/home/overview'
  }
}

const getQueryWidgetConfig = (widget: Pick<OverviewPanelWidget, 'kind' | 'config'>) =>
  widget.kind === 'query-card' ? (widget.config as QueryWidgetConfig) : null

const getQueryWidgetQuery = (widget: Pick<OverviewPanelWidget, 'kind' | 'config'>) =>
  getQueryWidgetConfig(widget)?.query

export default defineComponent({
  name: 'OverviewPageV2',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const restoredPanels = buildDefaultPanelState()
    const isAdminUser = computed(() => Boolean(getStoredUserInfo()?.isAdmin))
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())

    const scopeValue = ref<ScopeValue>({ ...DEFAULT_SCOPE })
    const loading = ref(false)
    const services = ref<ServiceItem[]>([])
    const summary = ref<{
      serviceCount: number | null
      healthyServices: number | null
      activeAlerts: number | null
      errorRate: number | null
      p95Latency: number | null
      totalRequests: number | null
    }>({
      serviceCount: null,
      healthyServices: null,
      activeAlerts: null,
      errorRate: null,
      p95Latency: null,
      totalRequests: null
    })
    const incidents = ref<any[]>([])
    const ingestStatus = ref<any | null>(null)
    const riskServices = ref({
      highRiskServices: [] as RiskServiceEntry[],
      recentDegradedServices: [] as RiskServiceEntry[]
    })
    const trendsByGroup = ref<Record<OverviewTrendGroupBy, TrendSnapshot>>({
      overall: { requests: [], errors: [], latency: [] },
      env: { requests: [], errors: [], latency: [] },
      team: { requests: [], errors: [], latency: [] }
    })
    const widgetTrendSnapshots = ref<Record<string, TrendSnapshot>>({})
    const widgetSummarySnapshots = ref<Record<OverviewWidgetEditorTimeRange, Record<string, any>>>(
      {} as Record<OverviewWidgetEditorTimeRange, Record<string, any>>
    )
    const queryWidgetResults = ref<Record<string, CardData | null>>({})
    const dataReady = ref({ catalog: false, summary: false, incidents: false, ingest: false })
    const metricsSchemaItems = ref<MetricsCatalogSchemaItem[]>([])
    const metricsSchemaSource = ref<MetricsCatalogSourceMode | 'unavailable'>('empty')
    const metricsSchemaFilters = ref<MetricsCatalogFilters>({
      keyword: '',
      type: '',
      unit: '',
      hasLabels: false,
      serviceId: ''
    })

    const panels = ref<OverviewPanelDefinition[]>(restoredPanels.panels)
    const panelBaselines = ref<Record<string, OverviewPanelDefinition>>(restoredPanels.baselines)
    const activePanelId = ref(DEFAULT_PANEL_ID)
    const editMode = ref(false)
    const isLargeScreenMode = ref(false)
    const showWidgetEditor = ref(false)
    const widgetEditorSaving = ref(false)
    const widgetEditorMode = ref<WidgetEditorMode>('create')
    const widgetEditorDraft = ref<WidgetEditorDraft>(buildWidgetDraft('metric-summary', []))
    const routePrefillApplied = ref(false)
    const useLegacyWidgetEditor = false
    const showPanelModal = ref(false)
    const editorPreviewLoading = ref(false)
    const editorPreviewData = ref<any>(null)
    const editorPreviewError = ref('')
    const editorDiscoveryKeyword = ref('')
    const editorAdvancedMode = ref(false)
    const editorCompiledScript = ref('')
    const editorRawQueryScript = ref('')
    const editorScriptLanguage = ref('queryspec-json')
    const editorScriptValidation = ref<{ valid: boolean; issues: string[]; supported: boolean } | null>(null)
    const editorScriptLoading = ref(false)
    const autoRefreshSetting = ref<OverviewAutoRefreshKey>('off')
    const autoRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)
    const autoRefreshFailureCount = ref(0)
    const pageVisible = ref(typeof document === 'undefined' ? true : document.visibilityState === 'visible')
    const panelModalMode = ref<'duplicate' | 'rename'>('duplicate')
    const panelName = ref('')
    const isRestoringOverviewState = ref(true)
    const widgetGridRef = ref<HTMLElement | null>(null)
    const widgetGridItemRefs = new Map<string, HTMLElement>()
    const widgetShellRefs = new Map<string, HTMLElement>()
    const overviewLoadState = {
      inFlightKey: '',
      inFlightPromise: null as Promise<void> | null,
      latestToken: 0,
      lastCompletedKey: '',
      lastCompletedAt: 0
    }
    const reorderState = ref<{
      pointerId: number
      dragId: string
      startX: number
      startY: number
      currentX: number
      currentY: number
      active: boolean
    } | null>(null)
    const reorderTarget = ref<{ targetId: string; placement: OverviewReorderPlacement } | null>(null)
    const largeScreenReadonlyHint = '大屏模式仅用于监控展示，请退出大屏模式后再进行编辑或配置操作'

    const showLargeScreenReadonlyPrompt = () => {
      message.warning(largeScreenReadonlyHint)
    }

    const enterLargeScreenMode = async () => {
      isLargeScreenMode.value = true
      editMode.value = false
      showWidgetEditor.value = false
      showPanelModal.value = false
      clearReorderState()

      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
      } catch (error) {
        console.warn('Failed to enter overview large-screen mode:', error)
      }
    }

    const exitLargeScreenMode = async () => {
      isLargeScreenMode.value = false
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      } catch (error) {
        console.warn('Failed to exit overview large-screen mode:', error)
      }
    }

    const toggleLargeScreenMode = () => {
      if (isLargeScreenMode.value) {
        exitLargeScreenMode()
      } else {
        enterLargeScreenMode()
      }
    }

    const restoreSavedDefaultView = async () => {
      try {
        const saved = await getDashboardState<PersistedOverviewDefaultView | null>(DEFAULT_VIEW_STORAGE_KEY, null)
        if (!saved) return false
        if (saved.panelId) activePanelId.value = saved.panelId
        if (saved.scope) scopeValue.value = saved.scope
        if (saved.timeRange) timeStore.setTimeRange(saved.timeRange)
        if (saved.datasetScope && !isAdminUser.value) datasetScope.value = saved.datasetScope
        return true
      } catch (error) {
        console.error('Failed to restore overview default view:', error)
        return false
      }
    }

    const canExecuteQuery = (query: QuerySpec) =>
      canAccessMetricsDatasetScope(query.scope, getStoredUserInfo()) &&
      canUseMetricsSourceKind((query.sourceKind || 'auto') as NonNullable<QuerySpec['sourceKind']>, getStoredUserInfo())

    const restorePanelState = async () => {
      try {
        const saved = await getDashboardState<PersistedOverviewPanelState | null>(PANEL_STATE_STORAGE_KEY, null)
        if (!saved?.panels?.length) return false
        const sanitizedPanels = saved.panels.map((panel) =>
          normalizePanelEditable({
            ...panel,
            widgets: (panel.widgets || [])
              .map((widget) => normalizeOverviewWidget(widget))
              .filter((widget) => {
                if (widget.kind !== 'query-card') return true
                const query = getQueryWidgetQuery(widget)
                return Boolean(query && canExecuteQuery(query))
              })
          })
        )

        if (!sanitizedPanels.length) return false

        const sanitizedBaselines = saved.baselines
          ? (Object.fromEntries(
              Object.entries(saved.baselines).map(([panelId, panel]) => [
                panelId,
                {
                  ...panel,
                  widgets: (panel.widgets || [])
                    .map((widget) => normalizeOverviewWidget(widget))
                    .filter((widget) => {
                      if (widget.kind !== 'query-card') return true
                      const query = getQueryWidgetQuery(widget)
                      return Boolean(query && canExecuteQuery(query))
                    })
                }
              ])
            ) as Record<string, OverviewPanelDefinition>)
          : {}

        panels.value = sanitizedPanels
        panelBaselines.value = sanitizedBaselines
        return true
      } catch (error) {
        console.error('Failed to restore overview panel state:', error)
        return false
      }
    }

    const restoreAutoRefreshState = async () => {
      try {
        const saved = await getDashboardState<PersistedOverviewAutoRefreshState | null>(AUTO_REFRESH_STORAGE_KEY, null)
        if (!saved || !isOverviewAutoRefreshKey(saved.autoRefresh)) return false
        autoRefreshSetting.value = saved.autoRefresh
        return true
      } catch (error) {
        console.error('Failed to restore overview auto-refresh state:', error)
        return false
      }
    }

    const currentPanel = computed(
      () => panels.value.find((panel) => panel.id === activePanelId.value) || panels.value[0]
    )
    const timeRangeOptions = computed(() => timeStore.timeOptions as Array<{ label: string; value: TimeRangeKey }>)
    const runtimeCapabilities = computed<OverviewCapabilityState[]>(() => [
      {
        key: 'metrics',
        label: 'Metrics',
        available: true,
        frontendReady: true,
        note: '支持查询驱动的指标卡片与资源视图。'
      },
      {
        key: 'serviceCatalog',
        label: 'Service Catalog',
        available: true,
        frontendReady: true,
        note: '支持风险服务与快捷入口卡片。'
      },
      {
        key: 'alerts',
        label: 'Alerts',
        available: true,
        frontendReady: true,
        note: '支持事件列表卡片。'
      },
      {
        key: 'ingestion',
        label: 'Ingestion',
        available: true,
        frontendReady: true,
        note: '支持接入状态卡片。'
      }
    ])
    const capabilityMap = computed(() => new Map(runtimeCapabilities.value.map((item) => [item.key, item])))
    const currentPanelEditable = computed(() => Boolean(currentPanel.value?.editable))
    const activeWidgetTag = ref('')

    const currentAvailableWidgets = computed(() =>
      (currentPanel.value?.widgets || []).filter((widget) => {
        const capability = capabilityMap.value.get(widget.capability)
        return Boolean(capability?.available && capability.frontendReady)
      })
    )

    const widgetTagOptions = computed(() => {
      const tagCounts = new Map<string, number>()
      currentAvailableWidgets.value.forEach((widget) => {
        resolveWidgetFilterTags(widget).forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })

      return Array.from(tagCounts.entries())
        .sort(
          ([leftTag, leftCount], [rightTag, rightCount]) => rightCount - leftCount || leftTag.localeCompare(rightTag)
        )
        .map(([tag, count]) => ({ tag, count }))
    })

    const widgetTagSelectOptions = computed(() => {
      const customTags = new Set(defaultWidgetTagCatalog)
      currentAvailableWidgets.value.forEach((widget) => {
        normalizeWidgetTags(widget.tags).forEach((tag) => customTags.add(tag))
      })
      return Array.from(customTags)
        .sort((leftTag, rightTag) => {
          const leftIndex = preferredWidgetTagOrder.indexOf(leftTag)
          const rightIndex = preferredWidgetTagOrder.indexOf(rightTag)
          if (leftIndex >= 0 || rightIndex >= 0) {
            if (leftIndex < 0) return 1
            if (rightIndex < 0) return -1
            return leftIndex - rightIndex
          }
          return leftTag.localeCompare(rightTag)
        })
        .map((tag) => ({
          label: tag,
          value: tag
        }))
    })

    const activeWidgetTagCount = computed(
      () => widgetTagOptions.value.find((option) => option.tag === activeWidgetTag.value)?.count || 0
    )

    const currentVisibleWidgets = computed(() => {
      if (!activeWidgetTag.value) return currentAvailableWidgets.value
      return currentAvailableWidgets.value.filter((widget) =>
        resolveWidgetFilterTags(widget).includes(activeWidgetTag.value)
      )
    })

    watch(widgetTagOptions, (options) => {
      if (!activeWidgetTag.value) return
      if (!options.some((option) => option.tag === activeWidgetTag.value)) {
        activeWidgetTag.value = ''
      }
    })
    const widgetEditorState = computed(() => buildOverviewWidgetEditorState(widgetEditorDraft.value))
    const recommendedAutoRefreshInterval = computed<number | null>(() => {
      switch (timeStore.timeRange) {
        case '15m':
        case '1h':
          return 15000
        case '4h':
        case '1d':
          return 60000
        case '2d':
          return 300000
        case '7d':
        case 'custom':
        default:
          return null
      }
    })
    const effectiveAutoRefreshInterval = computed<number | null>(() => {
      if (!timeStore.isLive || !pageVisible.value || autoRefreshFailureCount.value >= 3) return null
      if (autoRefreshSetting.value === 'off') return null
      if (autoRefreshSetting.value === 'auto') return recommendedAutoRefreshInterval.value
      if (autoRefreshSetting.value === '15s') return 15000
      if (autoRefreshSetting.value === '30s') return 30000
      if (autoRefreshSetting.value === '1m') return 60000
      return 300000
    })
    const autoRefreshHint = computed(() => {
      if (!timeStore.isLive) return '实时模式关闭后，自动刷新暂停。'
      if (!pageVisible.value) return '页面当前不可见，自动刷新已暂停。'
      if (autoRefreshFailureCount.value >= 3) return '连续刷新失败，自动刷新已暂停，请手动刷新后恢复。'
      if (autoRefreshSetting.value === 'off') return '自动刷新已关闭，可继续使用手动刷新。'
      if (autoRefreshSetting.value === 'auto' && !recommendedAutoRefreshInterval.value)
        return '当前时间范围较长，自动模式下已暂停自动刷新。'
      const interval = effectiveAutoRefreshInterval.value || recommendedAutoRefreshInterval.value
      if (!interval) return '当前不会自动刷新。'
      const label = interval >= 60000 ? `${interval / 60000} 分钟` : `${interval / 1000} 秒`
      return autoRefreshSetting.value === 'auto'
        ? `自动刷新将按建议频率每 ${label} 更新一次。`
        : `自动刷新已开启：每 ${label} 更新一次。`
    })
    const currentWidgetVisualizationOptions = computed(() =>
      getAllowedWidgetVisualizations(widgetEditorDraft.value.kind).map((value) => ({
        value,
        label: widgetVisualizationOptions[value].label,
        description: widgetVisualizationOptions[value].description
      }))
    )
    const currentWidgetTypeOptions = computed(() => widgetTypeOptions.value)
    const currentEditorTimeRangeOptions = computed(
      () => editorTimeRangeCatalog[widgetEditorState.value.timeGranularity]
    )
    const darwinMetricOptions = [
      { value: 'cpu' as OverviewWidgetDisplayMetricKey, label: 'CPU 使用率' },
      { value: 'memory' as OverviewWidgetDisplayMetricKey, label: '内存使用率' }
    ]
    const queryCardDraft = computed(() => (widgetEditorDraft.value.config as { query: QuerySpec }).query)
    const queryEditMode = computed(() => widgetEditorState.value.queryEditMode || 'form-builder')
    const queryStatementDraft = computed(
      () => parseQuerySpecJson(editorRawQueryScript.value).query || queryCardDraft.value
    )
    const darwinServiceOptions = computed(() =>
      services.value.map((service) => ({
        label: service.name,
        value: service.id
      }))
    )
    const queryScopeOptions = computed(() =>
      [
        { label: '用户接入', value: 'tenant' as const },
        { label: 'Darwin 系统', value: 'system' as const }
      ].filter((item) => canAccessMetricsDatasetScope(item.value, getStoredUserInfo()))
    )
    const querySourceKindOptions = computed(() =>
      [
        { label: '自动判断', value: 'auto' as const },
        { label: '用户接入指标', value: 'sdk' as const },
        { label: 'Darwin 系统指标', value: 'darwin-event' as const }
      ].filter((item) => canUseMetricsSourceKind(item.value, getStoredUserInfo()))
    )
    const queryAggregationOptions = [
      { label: '最新值', value: 'latest' as const },
      { label: '平均值', value: 'avg' as const },
      { label: '求和', value: 'sum' as const },
      { label: '最大值', value: 'max' as const },
      { label: 'P95', value: 'p95' as const }
    ]
    const overviewQueryVisualizationOptions = [
      { label: '数值卡', value: 'number' as const },
      { label: '折线图', value: 'line' as const },
      { label: '柱状图', value: 'bar' as const },
      { label: '环图', value: 'donut' as const },
      { label: '表格', value: 'table' as const }
    ]
    const querySubjectOptions = [
      { label: '全局系统', value: 'system' as const },
      { label: '指定服务', value: 'service' as const }
    ]
    const filteredMetricsSchemaItems = computed(() =>
      filterMetricsCatalog(metricsSchemaItems.value, {
        ...metricsSchemaFilters.value,
        serviceId: metricsSchemaFilters.value.serviceId || queryCardDraft.value.subject?.id || ''
      })
    )
    const selectedQueryMetricSchema = computed(
      () => filteredMetricsSchemaItems.value.find((item) => item.name === queryCardDraft.value.metricRef) || null
    )
    const queryMetricCatalogStats = computed(() => {
      const items = filteredMetricsSchemaItems.value
      const labelNames = new Set(items.flatMap((item) => item.labelNames))
      const sourceServices = new Set(items.flatMap((item) => item.sourceServices))
      return {
        total: items.length,
        system: items.filter((item) => item.scope.includes('system')).length,
        darwin: items.filter((item) => item.sourceKind === 'darwin-event' || item.sourceKind === 'mixed').length,
        labels: labelNames.size,
        services: sourceServices.size
      }
    })
    const queryMetricOptions = computed(() =>
      filteredMetricsSchemaItems.value.map((item) => ({
        label: `${item.name} · ${item.description}`,
        value: item.name
      }))
    )
    const queryAggregationOptionsResolved = computed(() => {
      if (!selectedQueryMetricSchema.value) return queryAggregationOptions
      return queryAggregationOptions.filter((option) =>
        selectedQueryMetricSchema.value?.allowedAggregations.includes(option.value)
      )
    })
    const queryVisualizationOptionsResolved = computed(() => {
      return overviewQueryVisualizationOptions
    })
    const currentEditorPrimaryMetric = computed<OverviewWidgetDisplayMetricKey | null>(() => {
      const displayedMetric = widgetEditorState.value.displayedMetrics[0]
      if (displayedMetric) return displayedMetric
      if (widgetEditorDraft.value.kind === 'metric-summary') {
        return (widgetEditorDraft.value.config as MetricSummaryConfig).metricKey as OverviewWidgetDisplayMetricKey
      }
      if (widgetEditorDraft.value.kind === 'trend') {
        return (widgetEditorDraft.value.config as TrendConfig).metric as OverviewWidgetDisplayMetricKey
      }
      return null
    })
    const currentEditorMetricOptions = computed(() => {
      const kind = widgetEditorDraft.value.kind
      if (kind === 'query-card') {
        return []
      }
      if (kind === 'metric-summary') {
        const baseOptions = [
          { value: 'service-count' as OverviewWidgetDisplayMetricKey, label: '服务总数' },
          { value: 'healthy-services' as OverviewWidgetDisplayMetricKey, label: '健康服务数' },
          { value: 'active-alerts' as OverviewWidgetDisplayMetricKey, label: '活跃告警' },
          { value: 'total-requests' as OverviewWidgetDisplayMetricKey, label: '请求总量' },
          { value: 'error-rate' as OverviewWidgetDisplayMetricKey, label: '全局错误率' },
          { value: 'p95-latency' as OverviewWidgetDisplayMetricKey, label: 'P95 延迟' },
          { value: 'ingest-success-rate' as OverviewWidgetDisplayMetricKey, label: 'Ingest 成功率' }
        ]
        const currentMetric = currentEditorPrimaryMetric.value
        if (
          currentMetric &&
          !baseOptions.some((option) => option.value === currentMetric) &&
          widgetDisplayMetricMeta[currentMetric]
        ) {
          return [{ value: currentMetric, label: widgetDisplayMetricMeta[currentMetric].label }, ...baseOptions]
        }
        return baseOptions
      }
      if (kind === 'trend') {
        return trendMetricOptions.map((item) => ({
          value: item.value as OverviewWidgetDisplayMetricKey,
          label: item.label
        }))
      }
      if (kind === 'risk-service') {
        return [
          { value: 'service-count' as OverviewWidgetDisplayMetricKey, label: '服务数量' },
          { value: 'error-rate' as OverviewWidgetDisplayMetricKey, label: '错误率' },
          { value: 'p95-latency' as OverviewWidgetDisplayMetricKey, label: '延迟变化' }
        ]
      }
      if (kind === 'ingest-status') {
        return [
          { value: 'ingest-success-rate' as OverviewWidgetDisplayMetricKey, label: '成功率' },
          { value: 'total-requests' as OverviewWidgetDisplayMetricKey, label: '采集总量' }
        ]
      }
      if (kind === 'incident') {
        return [{ value: 'active-alerts' as OverviewWidgetDisplayMetricKey, label: '活跃事件' }]
      }
      if (kind === 'quick-pivot') {
        return [{ value: 'service-count' as OverviewWidgetDisplayMetricKey, label: '可用入口' }]
      }
      if (kind === 'darwin-infra-summary' || kind === 'darwin-infra-trend') {
        return darwinMetricOptions
      }
      return []
    })
    const editorMetricDiscoveryEnabled = computed(() =>
      ['metric-summary', 'trend', 'darwin-infra-summary', 'darwin-infra-trend'].includes(widgetEditorDraft.value.kind)
    )
    const editorMetricDiscoveryPresets = computed(() =>
      buildOverviewMetricDiscoveryPresets(widgetEditorDraft.value.kind)
    )
    const filteredEditorMetricDiscoveryPresets = computed(() => {
      const keyword = editorDiscoveryKeyword.value.trim().toLowerCase()
      if (!keyword) return editorMetricDiscoveryPresets.value
      return editorMetricDiscoveryPresets.value.filter((item) =>
        [item.label, item.title, item.description, item.unit || ''].join(' ').toLowerCase().includes(keyword)
      )
    })
    const trendGroupsNeeded = computed<OverviewTrendGroupBy[]>(() => {
      const groups = new Set<OverviewTrendGroupBy>()
      currentVisibleWidgets.value.forEach((widget) => {
        if (widget.kind === 'trend') {
          const trendWidget = widget as OverviewPanelWidget<'trend'>
          groups.add((trendWidget.config.groupBy as OverviewTrendGroupBy | undefined) || 'overall')
        }
      })
      groups.add('overall')
      return Array.from(groups)
    })

    const saveDefaultView = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }

      saveDashboardState(DEFAULT_VIEW_STORAGE_KEY, {
        panelId: activePanelId.value,
        timeRange: timeStore.timeRange,
        scope: scopeValue.value,
        datasetScope: datasetScope.value
      })
        .then(() => {
          message.success('已保存默认视角')
        })
        .catch((error) => {
          console.error('Failed to persist default overview view:', error)
          message.error('保存默认视角失败')
        })
    }

    const updatePanels = (nextPanels: OverviewPanelDefinition[], nextBaselines = panelBaselines.value) => {
      const normalizedPanels = nextPanels.map((panel) => ({
        ...normalizePanelEditable(panel),
        widgets: panel.widgets.map((widget) => normalizeOverviewWidget(widget))
      }))
      const normalizedBaselines = Object.fromEntries(
        Object.entries(nextBaselines).map(([key, panel]) => [
          key,
          {
            ...normalizePanelEditable(panel),
            widgets: panel.widgets.map((widget) => normalizeOverviewWidget(widget))
          }
        ])
      ) as Record<string, OverviewPanelDefinition>

      panels.value = normalizedPanels
      panelBaselines.value = normalizedBaselines
      saveDashboardState(PANEL_STATE_STORAGE_KEY, {
        panels: normalizedPanels,
        baselines: normalizedBaselines
      }).catch((error) => {
        console.error('Failed to persist overview panel state:', error)
      })
    }

    const saveAutoRefreshState = (autoRefresh: OverviewAutoRefreshKey) => {
      saveDashboardState<PersistedOverviewAutoRefreshState>(AUTO_REFRESH_STORAGE_KEY, {
        autoRefresh,
        updatedAt: Date.now()
      }).catch((error) => {
        console.error('Failed to persist overview auto-refresh state:', error)
      })
    }

    const clearOverviewAutoRefresh = () => {
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
        autoRefreshTimer.value = null
      }
    }

    const handleOverviewVisibilityChange = () => {
      pageVisible.value = document.visibilityState === 'visible'
      if (pageVisible.value && effectiveAutoRefreshInterval.value) {
        timeStore.refreshTime()
        refreshOverviewQueryCardsOnly()
      }
    }

    const syncOverviewAutoRefresh = () => {
      clearOverviewAutoRefresh()
      const interval = effectiveAutoRefreshInterval.value
      if (!interval) return

      autoRefreshTimer.value = setInterval(() => {
        timeStore.refreshTime()
        refreshOverviewQueryCardsOnly()
      }, interval)
    }

    const getGlobalScopedServiceId = () => {
      if (!scopeValue.value.service) return ''
      return services.value.find((service) => service.name === scopeValue.value.service)?.id || ''
    }

    const getDarwinServiceTarget = (
      config: Pick<DarwinInfraSummaryConfig | DarwinInfraTrendConfig | DarwinInstanceTableConfig, 'serviceId'>
    ) => config.serviceId || getGlobalScopedServiceId() || ''

    const replaceCurrentPanel = (updater: (panel: OverviewPanelDefinition) => OverviewPanelDefinition) => {
      if (!currentPanel.value) return
      const nextPanels = panels.value.map((panel) =>
        panel.id === currentPanel.value.id ? updater(cloneValue(panel)) : panel
      )
      updatePanels(nextPanels)
    }

    const normalizeAccessibleQuery = (query: QuerySpec): QuerySpec => {
      const user = getStoredUserInfo()
      const nextScope = canAccessMetricsDatasetScope(query.scope, user)
        ? query.scope
        : getPreferredMetricsDatasetScope(user)
      const sourceKind = (query.sourceKind || 'auto') as NonNullable<QuerySpec['sourceKind']>
      const nextSourceKind = canUseMetricsSourceKind(sourceKind, user) ? sourceKind : 'auto'

      return {
        ...query,
        scope: nextScope,
        sourceKind: nextSourceKind
      }
    }

    const normalizeEditorState = (widget: WidgetEditorDraft): WidgetEditorDraft => {
      const normalizedWidget = normalizeOverviewWidget(widget)
      const normalized =
        normalizedWidget.kind === 'query-card'
          ? {
              ...normalizedWidget,
              config: {
                query: normalizeAccessibleQuery((normalizedWidget.config as { query: QuerySpec }).query)
              }
            }
          : normalizedWidget
      const nextEditor = buildOverviewWidgetEditorState(normalized)
      const allowedRanges = editorTimeRangeCatalog[nextEditor.timeGranularity]
      const hasCurrentRange = allowedRanges.some((item) => item.value === nextEditor.timeRange)

      return {
        ...normalized,
        size: normalized.size === 'S' && !canWidgetUseSmallSize(normalized) ? 'M' : normalized.size,
        editor: {
          ...nextEditor,
          timeRange: hasCurrentRange ? nextEditor.timeRange : allowedRanges[0].value
        }
      }
    }

    const updateWidgetDraft = (patch: Partial<WidgetEditorDraft>) => {
      const previousEditor = buildOverviewWidgetEditorState(widgetEditorDraft.value)
      const mergedDraft = {
        ...widgetEditorDraft.value,
        ...patch,
        config: {
          ...(widgetEditorDraft.value.config as Record<string, unknown>),
          ...((patch.config as Record<string, unknown>) || {})
        }
      } as WidgetEditorDraft

      const selectedMetric = patch.editor?.displayedMetrics?.[0]
      if (selectedMetric && !patch.config) {
        if (mergedDraft.kind === 'metric-summary') {
          mergedDraft.config = {
            ...(mergedDraft.config as MetricSummaryConfig),
            metricKey: selectedMetric as OverviewMetricKey
          } as MetricSummaryConfig
        }

        if (mergedDraft.kind === 'trend') {
          mergedDraft.config = {
            ...(mergedDraft.config as TrendConfig),
            metric: selectedMetric as OverviewTrendMetricKey
          } as TrendConfig
        }
      }

      widgetEditorDraft.value = normalizeEditorState(mergedDraft)
      const nextEditor = buildOverviewWidgetEditorState(widgetEditorDraft.value)

      if (
        widgetEditorDraft.value.kind === 'query-card' &&
        queryEditMode.value === 'query-statement' &&
        nextEditor.timeRange !== previousEditor.timeRange
      ) {
        updateRawQueryScript((query) => ({
          ...query,
          timeRange: `-${nextEditor.timeRange}`
        }))
      }
    }

    const updateQueryCardDraft = (queryPatch: Partial<QuerySpec>) => {
      updateWidgetDraft({
        config: {
          query: {
            ...queryCardDraft.value,
            ...queryPatch
          }
        } as QueryWidgetConfig
      })
    }

    const updateQueryDisplayValueDraft = (valuePatch: NonNullable<NonNullable<QuerySpec['display']>['value']>) => {
      updateQueryCardDraft({
        display: {
          ...(queryCardDraft.value.display || {}),
          value: {
            ...(queryCardDraft.value.display?.value || {}),
            ...valuePatch
          }
        }
      })
    }

    const normalizeQueryCompareConfig = (compare: QuerySpec['compare']) => {
      if (typeof compare === 'string') {
        return {
          enabled: true,
          mode: compare === 'same-period' ? ('previous-day' as const) : ('previous-period' as const),
          display: 'relative' as const,
          directionality: 'neutral' as const
        }
      }

      return {
        enabled: compare?.enabled !== false,
        mode: compare?.mode || ('previous-period' as const),
        display: compare?.display || ('relative' as const),
        directionality: compare?.directionality || ('neutral' as const)
      }
    }

    const updateQueryCompareDraft = (comparePatch: Partial<ReturnType<typeof normalizeQueryCompareConfig>>) => {
      updateQueryCardDraft({
        compare: {
          ...normalizeQueryCompareConfig(queryCardDraft.value.compare),
          ...comparePatch
        }
      })
    }

    const updateQueryAlertDraft = (alertPatch: Partial<NonNullable<QuerySpec['alert']>>) => {
      updateQueryCardDraft({
        alert: {
          enabled: false,
          operator: '>',
          threshold: 0,
          unit: queryCardDraft.value.display?.value?.unit || queryCardDraft.value.display?.yAxis?.unit || '',
          duration: 5,
          level: 'warning',
          channels: ['Email'],
          ...(queryCardDraft.value.alert || {}),
          ...alertPatch
        }
      })
    }

    const replaceRawQueryScript = (query: QuerySpec) => {
      editorRawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query }, null, 2)
      editorScriptValidation.value = null
      editorPreviewData.value = null
      editorPreviewError.value = ''
    }

    const updateRawQueryScript = (updater: (query: QuerySpec) => QuerySpec) => {
      const parsed = parseQuerySpecJson(editorRawQueryScript.value)
      replaceRawQueryScript(updater(parsed.query || queryCardDraft.value))
    }

    const updateRawQueryDisplayValueDraft = (valuePatch: NonNullable<NonNullable<QuerySpec['display']>['value']>) => {
      updateRawQueryScript((query) => ({
        ...query,
        display: {
          ...(query.display || {}),
          value: {
            ...(query.display?.value || {}),
            ...valuePatch
          }
        }
      }))
    }

    const updateRawQueryCompareDraft = (comparePatch: Partial<ReturnType<typeof normalizeQueryCompareConfig>>) => {
      updateRawQueryScript((query) => ({
        ...query,
        compare: {
          ...normalizeQueryCompareConfig(query.compare),
          ...comparePatch
        }
      }))
    }

    const updateRawQueryAlertDraft = (alertPatch: Partial<NonNullable<QuerySpec['alert']>>) => {
      updateRawQueryScript((query) => ({
        ...query,
        alert: {
          enabled: false,
          operator: '>',
          threshold: 0,
          unit: query.display?.value?.unit || query.display?.yAxis?.unit || '',
          duration: 5,
          level: 'warning',
          channels: ['Email'],
          ...(query.alert || {}),
          ...alertPatch
        }
      }))
    }

    const resolveQueryAlertUnit = (query: QuerySpec) =>
      query.alert?.unit || query.display?.value?.unit || query.display?.yAxis?.unit || ''

    const buildDefaultQueryAlertRules = (query: QuerySpec): QueryAlertRule[] => {
      const unit = resolveQueryAlertUnit(query)
      const currentThreshold =
        typeof query.alert?.threshold === 'number' ? query.alert.threshold : unit === '%' ? 85 : 80
      const warningThreshold = unit === '%' ? Math.min(100, currentThreshold || 85) : currentThreshold
      const criticalThreshold =
        unit === '%' ? Math.min(100, Math.max(warningThreshold + 10, 95)) : warningThreshold + 10

      return [
        {
          level: 'warning',
          operator: query.alert?.operator || '>',
          threshold: warningThreshold,
          unit,
          duration: 5,
          channels: ['Email']
        },
        {
          level: 'critical',
          operator: query.alert?.operator || '>',
          threshold: criticalThreshold,
          unit,
          duration: 3,
          channels: ['Email']
        }
      ]
    }

    const buildQueryAlertPatchFromRules = (
      query: QuerySpec,
      rules: QueryAlertRule[]
    ): Partial<NonNullable<QuerySpec['alert']>> => {
      const unit = resolveQueryAlertUnit(query)
      const nextRules = rules.map((rule) => ({
        ...rule,
        operator: rule.operator || query.alert?.operator || '>',
        unit: rule.unit ?? unit,
        duration: rule.duration || 5,
        channels: rule.channels?.length ? rule.channels : ['Email'],
        level: rule.level || 'warning'
      }))
      const primaryRule = nextRules.find((rule) => rule.level === 'warning') || nextRules[0]

      return {
        enabled: true,
        operator: primaryRule?.operator || query.alert?.operator || '>',
        threshold: primaryRule?.threshold ?? query.alert?.threshold ?? 0,
        unit: primaryRule?.unit ?? unit,
        duration: primaryRule?.duration || query.alert?.duration || 5,
        level: primaryRule?.level || query.alert?.level || 'warning',
        channels: primaryRule?.channels?.length
          ? primaryRule.channels
          : query.alert?.channels?.length
            ? query.alert.channels
            : ['Email'],
        rules: nextRules
      }
    }

    const getEditableQueryAlertRules = (query: QuerySpec): QueryAlertRule[] => {
      const unit = resolveQueryAlertUnit(query)
      const inheritedDuration = query.alert?.duration || 5
      const inheritedChannels = query.alert?.channels?.length ? query.alert.channels : ['Email']
      const rawRules = Array.isArray(query.alert?.rules) ? query.alert.rules : []
      const orderedRules = rawRules
        .filter((rule) => typeof rule.threshold === 'number' && Number.isFinite(rule.threshold))
        .map((rule) => ({
          ...rule,
          operator: rule.operator || query.alert?.operator || '>',
          unit: rule.unit ?? unit,
          duration: rule.duration || inheritedDuration,
          channels: rule.channels?.length ? rule.channels : inheritedChannels,
          level: rule.level || 'warning'
        }))

      if (orderedRules.length) return orderedRules

      if (query.alert?.enabled && typeof query.alert.threshold === 'number' && Number.isFinite(query.alert.threshold)) {
        return [
          {
            ruleId: query.alert.ruleId,
            level: query.alert.level || 'warning',
            operator: query.alert.operator || '>',
            threshold: query.alert.threshold,
            unit,
            duration: inheritedDuration,
            channels: inheritedChannels
          }
        ]
      }

      return buildDefaultQueryAlertRules(query)
    }

    const setQueryAlertEnabled = (enabled: boolean, mode: OverviewWidgetQueryEditMode) => {
      const query = mode === 'query-statement' ? queryStatementDraft.value : queryCardDraft.value
      const patch = enabled ? buildQueryAlertPatchFromRules(query, getEditableQueryAlertRules(query)) : { enabled }
      if (mode === 'query-statement') {
        updateRawQueryAlertDraft(patch)
      } else {
        updateQueryAlertDraft(patch)
      }
    }

    const updateQueryAlertRuleDraft = (
      mode: OverviewWidgetQueryEditMode,
      index: number,
      patch: Partial<QueryAlertRule>
    ) => {
      const query = mode === 'query-statement' ? queryStatementDraft.value : queryCardDraft.value
      const rules = [...getEditableQueryAlertRules(query)]
      const currentRule = rules[index]
      if (!currentRule) return
      rules[index] = { ...currentRule, ...patch }
      const alertPatch = buildQueryAlertPatchFromRules(query, rules)
      if (mode === 'query-statement') {
        updateRawQueryAlertDraft(alertPatch)
      } else {
        updateQueryAlertDraft(alertPatch)
      }
    }

    const addQueryAlertRuleDraft = (mode: OverviewWidgetQueryEditMode) => {
      const query = mode === 'query-statement' ? queryStatementDraft.value : queryCardDraft.value
      const rules = getEditableQueryAlertRules(query)
      const unit = resolveQueryAlertUnit(query)
      const maxThreshold = rules.reduce(
        (max, rule) => (typeof rule.threshold === 'number' ? Math.max(max, rule.threshold) : max),
        unit === '%' ? 75 : 0
      )
      const nextRules = [
        ...rules,
        {
          level: 'warning' as const,
          operator: '>' as const,
          threshold: unit === '%' ? Math.min(100, maxThreshold + 10) : maxThreshold + 10,
          unit,
          duration: 5,
          channels: ['Email']
        }
      ]
      const alertPatch = buildQueryAlertPatchFromRules(query, nextRules)
      if (mode === 'query-statement') {
        updateRawQueryAlertDraft(alertPatch)
      } else {
        updateQueryAlertDraft(alertPatch)
      }
    }

    const removeQueryAlertRuleDraft = (mode: OverviewWidgetQueryEditMode, index: number) => {
      const query = mode === 'query-statement' ? queryStatementDraft.value : queryCardDraft.value
      const rules = getEditableQueryAlertRules(query)
      if (rules.length <= 1) return
      const nextRules = rules.filter((_, ruleIndex) => ruleIndex !== index)
      const alertPatch = buildQueryAlertPatchFromRules(query, nextRules)
      if (mode === 'query-statement') {
        updateRawQueryAlertDraft(alertPatch)
      } else {
        updateQueryAlertDraft(alertPatch)
      }
    }

    const renderQueryAlertRulesEditor = (query: QuerySpec, mode: OverviewWidgetQueryEditMode) => {
      const rules = getEditableQueryAlertRules(query)

      return (
        <div class="overview-page__query-alert-rules-editor">
          {rules.map((rule, index) => {
            const meta = alertLevelMeta[rule.level]
            return (
              <div class="overview-page__query-alert-rule-row" key={`${rule.level}-${rule.threshold}-${index}`}>
                <div class="overview-page__query-alert-rule-title">
                  <NTag size="small" bordered={false} type={meta?.tagType || 'warning'}>
                    {meta?.label || rule.level}
                  </NTag>
                  <span>阈值 {index + 1}</span>
                  <NButton
                    size="tiny"
                    quaternary
                    type="error"
                    disabled={rules.length <= 1}
                    onClick={() => removeQueryAlertRuleDraft(mode, index)}>
                    删除
                  </NButton>
                </div>
                <div class="overview-page__query-alert-rule-fields">
                  <label class="overview-page__query-alert-rule-field">
                    <span>级别</span>
                    <NSelect
                      value={rule.level}
                      options={queryAlertLevelOptions}
                      onUpdateValue={(value: QueryAlertRule['level']) =>
                        updateQueryAlertRuleDraft(mode, index, { level: value })
                      }
                    />
                  </label>
                  <label class="overview-page__query-alert-rule-field">
                    <span>条件</span>
                    <NSelect
                      value={rule.operator}
                      options={queryAlertOperatorOptions}
                      onUpdateValue={(value: QueryAlertRule['operator']) =>
                        updateQueryAlertRuleDraft(mode, index, { operator: value })
                      }
                    />
                  </label>
                  <label class="overview-page__query-alert-rule-field">
                    <span>阈值</span>
                    <NInputNumber
                      value={rule.threshold ?? null}
                      placeholder={rule.level === 'critical' ? '例如 95' : '例如 85'}
                      onUpdateValue={(value: number | null) =>
                        updateQueryAlertRuleDraft(mode, index, { threshold: typeof value === 'number' ? value : 0 })
                      }
                    />
                  </label>
                  <label class="overview-page__query-alert-rule-field">
                    <span>持续(分钟)</span>
                    <NInputNumber
                      value={rule.duration ?? 5}
                      min={1}
                      onUpdateValue={(value: number | null) =>
                        updateQueryAlertRuleDraft(mode, index, { duration: value || 5 })
                      }
                    />
                  </label>
                  <label class="overview-page__query-alert-rule-field overview-page__query-alert-rule-field--wide">
                    <span>通知渠道</span>
                    <NSelect
                      value={rule.channels || ['Email']}
                      options={queryAlertChannelOptions}
                      multiple
                      placeholder="通知渠道"
                      onUpdateValue={(value: string[]) =>
                        updateQueryAlertRuleDraft(mode, index, { channels: value.length ? value : ['Email'] })
                      }
                    />
                  </label>
                </div>
              </div>
            )
          })}
          <div class="overview-page__query-alert-rule-actions">
            <NButton size="small" type="primary" onClick={() => addQueryAlertRuleDraft(mode)}>
              添加阈值
            </NButton>
          </div>
          <div class="overview-page__query-alert-rule-caption">
            可同时配置多条阈值，例如警告阈值提前关注、严重阈值立即处理；图表与告警规则会同步使用这些阈值。
          </div>
        </div>
      )
    }

    const alertLevelMeta = {
      critical: { label: '严重', tagType: 'error' as const, color: 'var(--color-danger-6)' },
      warning: { label: '警告', tagType: 'warning' as const, color: 'var(--color-warning-6)' },
      info: { label: '提示', tagType: 'info' as const, color: 'var(--color-primary-6)' }
    }
    const alertLevelPriority: Record<QueryAlertRule['level'], number> = {
      critical: 3,
      warning: 2,
      info: 1
    }

    const buildAlertRulesFromOverviewQuery = (title: string, query: QuerySpec): OverviewAlertRuleDraft[] => {
      const rules = normalizeQueryAlertRules(query.alert)
      if (!rules.length) return []
      return rules.map((rule) => ({
        ...(rule.ruleId ? { id: rule.ruleId } : {}),
        name: `${title} ${alertLevelMeta[rule.level]?.label || rule.level}阈值告警`,
        service: query.subject.type === 'service' ? query.subject.id || 'all' : 'all',
        metric: query.metricRef,
        operator: rule.operator,
        threshold: rule.threshold,
        unit: rule.unit || query.display?.value?.unit || query.display?.yAxis?.unit || '',
        duration: rule.duration || 5,
        level: rule.level || 'warning',
        enabled: true,
        channels: rule.channels?.length ? rule.channels : ['Email']
      }))
    }

    const persistAlertRuleForOverviewQuery = async (title: string, query: QuerySpec) => {
      const rules = buildAlertRulesFromOverviewQuery(title, query)
      if (!rules.length) return []
      return Promise.all(
        rules.map((rule) => {
          if (!rule.id) return saveAlertRule(rule)
          return updateAlertRule({ ...rule, id: rule.id })
        })
      )
    }

    const applySchemaMetricToQueryDraft = (item: MetricsCatalogSchemaItem) => {
      const nextAggregation = item.allowedAggregations.includes(queryCardDraft.value.aggregation)
        ? queryCardDraft.value.aggregation
        : item.allowedAggregations[0] || 'avg'
      const nextVisualization = item.recommendedVisualizations.includes(
        queryCardDraft.value.visualizationHint || 'line'
      )
        ? queryCardDraft.value.visualizationHint
        : item.recommendedVisualizations[0] || 'line'
      const nextScope = item.scope.includes(queryCardDraft.value.scope)
        ? queryCardDraft.value.scope
        : item.scope[0] || 'tenant'
      const nextSourceKind =
        item.sourceKind === 'mixed' || item.sourceKind === 'auto'
          ? queryCardDraft.value.sourceKind || 'auto'
          : item.sourceKind
      const nextSubject = item.subjectKinds.includes(queryCardDraft.value.subject?.type || 'system')
        ? queryCardDraft.value.subject || { type: 'system' as const }
        : { type: item.subjectKinds[0] || 'system' }
      const isPercentMetric =
        item.unit === '%' || item.name.toLowerCase().includes('cpu') || item.name.toLowerCase().includes('percent')

      updateQueryCardDraft({
        metricRef: item.name,
        aggregation: nextAggregation,
        visualizationHint: nextVisualization,
        scope: nextScope,
        sourceKind: nextSourceKind,
        subject: nextSubject,
        display: {
          ...(queryCardDraft.value.display || {}),
          value: isPercentMetric
            ? { min: 0, max: 100, unit: '%' }
            : {
                ...(queryCardDraft.value.display?.value || {}),
                unit: item.unit || queryCardDraft.value.display?.value?.unit || ''
              }
        }
      })

      if (queryEditMode.value === 'query-statement') {
        const nextQuery = {
          ...queryCardDraft.value,
          metricRef: item.name,
          aggregation: nextAggregation,
          visualizationHint: nextVisualization,
          scope: nextScope,
          sourceKind: nextSourceKind,
          subject: nextSubject
        }
        editorRawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query: nextQuery }, null, 2)
      }
    }

    const insertSchemaMetricIntoRawQuery = (item: MetricsCatalogSchemaItem) => {
      const parsed = parseQuerySpecJson(editorRawQueryScript.value)
      const baseQuery = parsed.query || queryCardDraft.value
      const nextAggregation = item.allowedAggregations.includes(baseQuery.aggregation)
        ? baseQuery.aggregation
        : item.allowedAggregations[0] || 'avg'
      const nextVisualization = item.recommendedVisualizations.includes(baseQuery.visualizationHint || 'line')
        ? baseQuery.visualizationHint
        : item.recommendedVisualizations[0] || 'line'
      const nextScope = item.scope.includes(baseQuery.scope) ? baseQuery.scope : item.scope[0] || 'tenant'
      const nextSourceKind =
        item.sourceKind === 'mixed' || item.sourceKind === 'auto' ? baseQuery.sourceKind || 'auto' : item.sourceKind
      const nextSubject = item.subjectKinds.includes(baseQuery.subject?.type || 'system')
        ? baseQuery.subject || { type: 'system' as const }
        : { type: item.subjectKinds[0] || 'system' }
      const isPercentMetric =
        item.unit === '%' || item.name.toLowerCase().includes('cpu') || item.name.toLowerCase().includes('percent')
      const nextQuery: QuerySpec = {
        ...baseQuery,
        metricRef: item.name,
        aggregation: nextAggregation,
        visualizationHint: nextVisualization,
        scope: nextScope,
        sourceKind: nextSourceKind,
        subject: nextSubject,
        display: {
          ...(baseQuery.display || {}),
          value: isPercentMetric
            ? { min: 0, max: 100, unit: '%' }
            : {
                ...(baseQuery.display?.value || {}),
                unit: item.unit || baseQuery.display?.value?.unit || ''
              }
        }
      }

      editorRawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query: nextQuery }, null, 2)
      editorScriptValidation.value = null
    }

    const switchQueryEditMode = (mode: OverviewWidgetQueryEditMode) => {
      updateWidgetDraft({
        editor: {
          ...widgetEditorState.value,
          queryEditMode: mode
        }
      })

      editorPreviewData.value = null
      editorPreviewError.value = ''
      editorScriptValidation.value = null
      if (mode === 'query-statement') {
        editorRawQueryScript.value = JSON.stringify(
          { type: 'queryspec', version: 1, query: queryCardDraft.value },
          null,
          2
        )
      }
    }

    const applyRawQueryScriptToDraft = () => {
      const result = parseQuerySpecJson(editorRawQueryScript.value)
      if (!result.query) {
        editorScriptValidation.value = { valid: false, issues: result.issues, supported: false }
        return false
      }

      updateWidgetDraft({
        config: { query: result.query } as QueryWidgetConfig,
        editor: {
          ...widgetEditorState.value,
          queryEditMode: 'query-statement',
          timeRange: String(result.query.timeRange || '-1h').replace(/^-/, '') as OverviewWidgetEditorTimeRange,
          visualization: result.query.visualizationHint || widgetEditorState.value.visualization
        }
      })
      editorScriptValidation.value = { valid: true, issues: ['QuerySpec 已应用，可继续预览或保存。'], supported: false }
      editorPreviewData.value = null
      editorPreviewError.value = ''
      return true
    }

    const resetWidgetDraftForKind = (kind: OverviewWidgetKind) => {
      widgetEditorDraft.value = normalizeEditorState(buildWidgetDraft(kind, runtimeCapabilities.value))
      if (kind === 'query-card') {
        editorRawQueryScript.value = JSON.stringify(
          { type: 'queryspec', version: 1, query: (widgetEditorDraft.value.config as { query: QuerySpec }).query },
          null,
          2
        )
      }
    }

    const syncDraftMetricSelection = (draft: WidgetEditorDraft): WidgetEditorDraft => {
      const normalized = normalizeEditorState(draft)
      const normalizedEditor = buildOverviewWidgetEditorState(normalized)
      const selectedMetric = normalizedEditor.displayedMetrics[0]

      if (normalized.kind === 'metric-summary') {
        const fallback = (normalized.config as MetricSummaryConfig).metricKey
        const metricKey = (selectedMetric as OverviewMetricKey | undefined) || fallback
        return normalizeEditorState({
          ...normalized,
          config: {
            ...(normalized.config as MetricSummaryConfig),
            metricKey
          },
          editor: {
            ...normalizedEditor,
            displayedMetrics: metricKey ? [metricKey] : []
          }
        } as WidgetEditorDraft)
      }

      if (normalized.kind === 'trend') {
        const fallback = (normalized.config as TrendConfig).metric
        const metric = (selectedMetric as OverviewTrendMetricKey | undefined) || fallback
        return normalizeEditorState({
          ...normalized,
          config: {
            ...(normalized.config as TrendConfig),
            metric
          },
          editor: {
            ...normalizedEditor,
            displayedMetrics: metric ? [metric] : []
          }
        } as WidgetEditorDraft)
      }

      if (normalized.kind === 'darwin-infra-summary') {
        const fallback = (normalized.config as DarwinInfraSummaryConfig).metric
        const metric = (selectedMetric as DarwinInfraMetricKey | undefined) || fallback
        return normalizeEditorState({
          ...normalized,
          config: {
            ...(normalized.config as DarwinInfraSummaryConfig),
            metric
          },
          editor: {
            ...normalizedEditor,
            displayedMetrics: metric ? [metric] : []
          }
        } as WidgetEditorDraft)
      }

      if (normalized.kind === 'darwin-infra-trend') {
        const fallback = (normalized.config as DarwinInfraTrendConfig).metric
        const metric = (selectedMetric as DarwinInfraMetricKey | undefined) || fallback
        return normalizeEditorState({
          ...normalized,
          config: {
            ...(normalized.config as DarwinInfraTrendConfig),
            metric
          },
          editor: {
            ...normalizedEditor,
            displayedMetrics: metric ? [metric] : []
          }
        } as WidgetEditorDraft)
      }

      return normalized
    }

    const validateWidgetDraftBeforeSave = (draft: WidgetEditorDraft) => {
      if (!draft.title.trim()) return '请输入组件标题'

      if (['metric-summary', 'trend', 'darwin-infra-summary', 'darwin-infra-trend'].includes(draft.kind)) {
        if (!draft.editor?.displayedMetrics?.[0]) {
          return '请先选择一个指标'
        }
      }

      if (draft.kind === 'query-card') {
        const query = getQueryWidgetQuery(draft)
        if (!query?.metricRef) return '请先填写指标标识'
        if (!canAccessMetricsDatasetScope(query.scope || datasetScope.value, getStoredUserInfo())) {
          return '当前用户无权访问该数据范围'
        }
        if (
          !canUseMetricsSourceKind(
            (query.sourceKind || 'auto') as NonNullable<QuerySpec['sourceKind']>,
            getStoredUserInfo()
          )
        ) {
          return '当前用户无权使用该数据来源'
        }
        if (query.subject?.type !== 'system' && !query.subject?.id) {
          return '请先选择目标服务或实例'
        }
      }

      if (draft.kind === 'darwin-instance-table' && !(draft.config as DarwinInstanceTableConfig).serviceId) {
        return '请先选择目标服务'
      }

      return ''
    }

    const openCreateWidget = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (!currentPanelEditable.value) return
      const firstSupported = overviewWidgetCatalog.find((item) => {
        const capability = capabilityMap.value.get(item.capability)
        return item.frontendReady && capability?.available
      })
      console.log('[Overview:AddWidget] openCreateWidget', {
        datasetScope: datasetScope.value,
        dataReady: dataReady.value,
        runtimeCapabilities: runtimeCapabilities.value,
        widgetTypeOptions: widgetTypeOptions.value,
        firstSupported: firstSupported?.kind || null,
        currentPanelId: currentPanel.value?.id,
        currentPanelWidgets:
          currentPanel.value?.widgets?.map((widget) => ({
            id: widget.id,
            kind: widget.kind,
            capability: widget.capability,
            size: widget.size
          })) || []
      })
      resetWidgetDraftForKind((firstSupported?.kind || 'metric-summary') as OverviewWidgetKind)
      widgetEditorMode.value = 'create'
      showWidgetEditor.value = true
    }

    const openCreateWidgetFromRoutePrefill = () => {
      if (routePrefillApplied.value || !currentPanelEditable.value || route.query.startAdd !== '1') return
      const prefillMetric = typeof route.query.prefillMetric === 'string' ? route.query.prefillMetric : ''
      if (!prefillMetric) return

      const matchingMetric = metricsSchemaItems.value.find((item) => item.name === prefillMetric)
      if (!matchingMetric && metricsSchemaSource.value === 'empty') return

      routePrefillApplied.value = true
      resetWidgetDraftForKind('query-card')
      const title =
        typeof route.query.prefillTitle === 'string' && route.query.prefillTitle.trim()
          ? route.query.prefillTitle.trim()
          : matchingMetric?.description && matchingMetric.description !== '暂无描述'
            ? matchingMetric.description
            : prefillMetric
      const prefillType = typeof route.query.prefillType === 'string' ? route.query.prefillType : ''
      const visualization =
        prefillType === 'stat'
          ? 'number'
          : prefillType === 'distribution'
            ? 'bar'
            : matchingMetric?.recommendedVisualizations[0] || 'line'

      updateWidgetDraft({
        title,
        editor: {
          ...widgetEditorState.value,
          queryEditMode: 'form-builder',
          visualization: visualization as OverviewWidgetVisualization
        }
      })

      if (matchingMetric) {
        applySchemaMetricToQueryDraft(matchingMetric)
      } else {
        updateQueryCardDraft({ metricRef: prefillMetric })
      }

      widgetEditorMode.value = 'create'
      showWidgetEditor.value = true
    }

    const loadMetricsSchemaForRoutePrefill = () => {
      if (routePrefillApplied.value || route.query.startAdd !== '1') return
      fetchMetricsSchema({
        scope: datasetScope.value,
        serviceId: typeof route.query.serviceId === 'string' ? route.query.serviceId : undefined
      })
        .then((payload) => {
          const result = loadMetricsCatalogFallback(payload)
          metricsSchemaItems.value = result.items
          metricsSchemaSource.value = result.source
          openCreateWidgetFromRoutePrefill()
        })
        .catch(() => {
          metricsSchemaItems.value = []
          metricsSchemaSource.value = 'unavailable'
          openCreateWidgetFromRoutePrefill()
        })
    }

    const openEditWidget = (widget: OverviewPanelWidget) => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (!currentPanelEditable.value) return
      widgetEditorDraft.value = normalizeEditorState(cloneValue(widget))
      widgetEditorMode.value = 'update'
      showWidgetEditor.value = true
    }

    const removeWidget = (widgetId: string) => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (!currentPanelEditable.value) return
      replaceCurrentPanel((panel) => ({
        ...panel,
        widgets: panel.widgets.filter((widget) => widget.id !== widgetId)
      }))
      message.success('组件已移除')
    }

    const applyWidgetDraft = async () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (widgetEditorSaving.value) return
      if (!currentPanelEditable.value) return
      widgetEditorSaving.value = true
      try {
        if (widgetEditorDraft.value.kind === 'query-card' && queryEditMode.value === 'query-statement') {
          if (!applyRawQueryScriptToDraft()) return
        }
        const syncedDraft = syncDraftMetricSelection(widgetEditorDraft.value)
        const validationMessage = validateWidgetDraftBeforeSave(syncedDraft)
        if (validationMessage) {
          message.warning(validationMessage)
          return
        }

        if (syncedDraft.kind === 'query-card') {
          const query = getQueryWidgetQuery(syncedDraft)
          if (query) {
            const validation = await validateMetricQuery(query, query.scope || datasetScope.value)
            if (!validation.valid) {
              message.warning(validation.issues[0] || '当前查询配置未通过校验')
              return
            }
          }
        }

        console.log('[Overview:AddWidget] applyWidgetDraft:before', {
          mode: widgetEditorMode.value,
          draft: cloneValue(syncedDraft),
          currentPanelId: currentPanel.value?.id,
          currentPanelWidgets:
            currentPanel.value?.widgets?.map((widget) => ({
              id: widget.id,
              kind: widget.kind,
              capability: widget.capability,
              size: widget.size
            })) || []
        })

        const normalizedDraft = syncDraftMetricSelection(syncedDraft)
        if (normalizedDraft.kind === 'query-card') {
          const query = getQueryWidgetQuery(normalizedDraft)
          if (!query) return
          const existingWidget =
            widgetEditorMode.value === 'update'
              ? currentPanel.value?.widgets.find((widget) => widget.id === normalizedDraft.id)
              : null
          const existingRules =
            existingWidget?.kind === 'query-card'
              ? normalizeQueryAlertRules(getQueryWidgetQuery(existingWidget)?.alert)
              : []
          if (existingRules.length && query.alert?.enabled) {
            const nextRules = normalizeQueryAlertRules(query.alert).map((rule) => ({
              ...rule,
              ruleId: rule.ruleId || existingRules.find((item) => item.level === rule.level)?.ruleId
            }))
            const alert = query.alert
            query.alert = {
              enabled: alert?.enabled ?? true,
              operator: alert?.operator || '>',
              threshold: alert?.threshold ?? 0,
              unit: alert?.unit,
              duration: alert?.duration,
              level: alert?.level,
              channels: alert?.channels,
              ruleId: nextRules[0]?.ruleId,
              rules: nextRules
            }
          }

          try {
            const rules = await persistAlertRuleForOverviewQuery(normalizedDraft.title, query)
            if (rules.length) {
              const nextRules = normalizeQueryAlertRules(query.alert).map((rule, index) => ({
                ...rule,
                ruleId: rules[index]?.id || rule.ruleId
              }))
              const alert = query.alert
              query.alert = {
                enabled: alert?.enabled ?? true,
                operator: alert?.operator || '>',
                threshold: alert?.threshold ?? 0,
                unit: alert?.unit,
                duration: alert?.duration,
                level: alert?.level,
                channels: alert?.channels,
                ruleId: nextRules[0]?.ruleId,
                rules: nextRules
              }
            }
          } catch (error) {
            console.error('Failed to persist overview widget alert rule:', error)
            message.warning('卡片会继续保存，但告警规则创建失败，请稍后到告警规则页补建')
          }
        }

        if (widgetEditorMode.value === 'create') {
          replaceCurrentPanel((panel) => ({
            ...panel,
            widgets: [...panel.widgets, cloneValue(normalizedDraft)]
          }))
          message.success('组件已添加到当前面板')
        } else {
          replaceCurrentPanel((panel) => ({
            ...panel,
            widgets: panel.widgets.map((widget) =>
              widget.id === normalizedDraft.id ? cloneValue(normalizedDraft) : widget
            )
          }))
          message.success('组件配置已更新')
        }

        showWidgetEditor.value = false
        console.log('[Overview:AddWidget] applyWidgetDraft:after', {
          currentPanelId: currentPanel.value?.id,
          panelWidgets:
            currentPanel.value?.widgets?.map((widget) => ({
              id: widget.id,
              kind: widget.kind,
              capability: widget.capability,
              size: widget.size
            })) || [],
          currentVisibleWidgets: currentVisibleWidgets.value.map((widget) => ({
            id: widget.id,
            kind: widget.kind,
            capability: widget.capability,
            size: widget.size
          }))
        })
        loadOverview()
      } finally {
        widgetEditorSaving.value = false
      }
    }

    const resizeWidget = (widgetId: string, size: OverviewWidgetSize) => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (!currentPanelEditable.value) return
      replaceCurrentPanel((panel) => ({
        ...panel,
        widgets: panel.widgets.map((widget) => {
          if (widget.id !== widgetId) return widget
          const nextWidget = normalizeOverviewWidget({ ...widget, size })
          return size === 'S' && !canWidgetUseSmallSize(nextWidget) ? { ...nextWidget, size: 'M' } : nextWidget
        })
      }))
    }

    const setWidgetGridRef = (element: Element | { $el?: Element | null } | null) => {
      const resolvedElement =
        element instanceof Element ? element : element?.$el instanceof Element ? element.$el : null
      widgetGridRef.value = resolvedElement instanceof HTMLElement ? resolvedElement : null
    }

    const setWidgetGridItemRef = (widgetId: string, element: Element | { $el?: Element | null } | null) => {
      const resolvedElement =
        element instanceof Element ? element : element?.$el instanceof Element ? element.$el : null
      const nextElement = resolvedElement instanceof HTMLElement ? resolvedElement : null
      const currentElement = widgetGridItemRefs.get(widgetId) || null
      if (currentElement === nextElement) return
      if (nextElement) {
        widgetGridItemRefs.set(widgetId, nextElement)
      } else {
        widgetGridItemRefs.delete(widgetId)
      }
    }

    const setWidgetShellRef = (widgetId: string, element: Element | { $el?: Element | null } | null) => {
      const resolvedElement =
        element instanceof Element ? element : element?.$el instanceof Element ? element.$el : null
      const nextElement = resolvedElement instanceof HTMLElement ? resolvedElement : null
      const currentElement = widgetShellRefs.get(widgetId) || null
      if (currentElement === nextElement) return
      if (nextElement) {
        widgetShellRefs.set(widgetId, nextElement)
      } else {
        widgetShellRefs.delete(widgetId)
      }
    }

    const clearReorderState = () => {
      reorderState.value = null
      reorderTarget.value = null
    }

    const detachReorderListeners = () => {
      window.removeEventListener('pointermove', handleReorderPointerMove)
      window.removeEventListener('pointerup', handleReorderPointerUp)
      window.removeEventListener('pointercancel', handleReorderPointerUp)
    }

    const reorderVisibleWidgets = (dragId: string, targetId: string, placement: OverviewReorderPlacement) => {
      if (!dragId || !targetId || dragId === targetId) return

      replaceCurrentPanel((panel) => {
        const visibleIds = currentVisibleWidgets.value.map((widget) => widget.id)
        const nextVisibleIds = reorderVisibleWidgetIds(visibleIds, dragId, targetId, placement)
        if (nextVisibleIds === visibleIds) return panel
        return {
          ...panel,
          widgets: applyVisibleOrderToPanelWidgets(panel.widgets, nextVisibleIds)
        }
      })
    }

    const resolvePointerTarget = (clientX: number, clientY: number) => {
      const pointerElements = document.elementsFromPoint(clientX, clientY)
      const targetElement = pointerElements.find((element) =>
        (element as HTMLElement | null)?.closest?.('[data-widget-id]')
      ) as HTMLElement | undefined

      const targetWidgetId =
        targetElement?.closest?.('[data-widget-id]')?.getAttribute('data-widget-id') ||
        Array.from(widgetShellRefs.entries())
          .map(([widgetId, element]) => ({ widgetId, rect: element.getBoundingClientRect() }))
          .sort((left, right) => {
            const leftDistance = Math.hypot(
              clientX - (left.rect.left + left.rect.width / 2),
              clientY - (left.rect.top + left.rect.height / 2)
            )
            const rightDistance = Math.hypot(
              clientX - (right.rect.left + right.rect.width / 2),
              clientY - (right.rect.top + right.rect.height / 2)
            )
            return leftDistance - rightDistance
          })[0]?.widgetId ||
        ''

      if (!targetWidgetId) return null

      const targetElementRef = widgetShellRefs.get(targetWidgetId)
      if (!targetElementRef) return null

      const targetRect = targetElementRef.getBoundingClientRect()
      const targetWidget = currentVisibleWidgets.value.find((widget) => widget.id === targetWidgetId)
      const placement =
        targetWidget?.size === 'L' || clientY < targetRect.top || clientY > targetRect.bottom
          ? clientY < targetRect.top + targetRect.height / 2
            ? 'before'
            : 'after'
          : clientX < targetRect.left + targetRect.width / 2
            ? 'before'
            : 'after'

      return { targetId: targetWidgetId, placement: placement as OverviewReorderPlacement }
    }

    const getWidgetMasonrySpan = (size: OverviewWidgetSize) => {
      if (size === 'S') return 'span 3'
      if (size === 'M') return 'span 6'
      return '1 / -1'
    }

    const layoutWidgetMasonry = () => {
      const container = widgetGridRef.value
      if (!container) return

      const orderedShells = currentVisibleWidgets.value
        .map((widget) => {
          const shell = widgetShellRefs.get(widget.id) || null
          const gridItem = widgetGridItemRefs.get(widget.id) || null
          return shell && gridItem ? { shell, gridItem } : null
        })
        .filter((entry): entry is { shell: HTMLElement; gridItem: HTMLElement } => Boolean(entry))

      if (!orderedShells.length) return

      container.style.removeProperty('grid-auto-rows')
      orderedShells.forEach(({ gridItem }) => {
        gridItem.style.removeProperty('grid-row-end')
        gridItem.style.removeProperty('min-height')
      })

      if (typeof window === 'undefined' || window.innerWidth <= 960) return

      const computedStyle = window.getComputedStyle(container)
      const rowGap = Number.parseFloat(computedStyle.rowGap || computedStyle.gap || '16') || 16
      const baseRow = 1

      container.style.gridAutoRows = `${baseRow}px`

      orderedShells.forEach(({ shell, gridItem }) => {
        const measuredHeight = shell.getBoundingClientRect().height
        const rowSpan = Math.max(1, Math.ceil((measuredHeight + rowGap) / (baseRow + rowGap)))
        gridItem.style.gridRowEnd = `span ${rowSpan}`
        gridItem.style.minHeight = `${rowSpan * baseRow + (rowSpan - 1) * rowGap}px`
      })
    }

    const handleWidgetMasonryResize = () => {
      layoutWidgetMasonry()
    }

    const handleReorderPointerMove = (event: PointerEvent) => {
      const state = reorderState.value
      if (!state || event.pointerId !== state.pointerId) return

      const nextState = {
        ...state,
        currentX: event.clientX,
        currentY: event.clientY
      }
      const distance = Math.hypot(nextState.currentX - nextState.startX, nextState.currentY - nextState.startY)
      nextState.active = state.active || distance > 6
      reorderState.value = nextState

      if (!nextState.active) return
      reorderTarget.value = resolvePointerTarget(event.clientX, event.clientY)
    }

    const handleReorderPointerUp = (event: PointerEvent) => {
      const state = reorderState.value
      if (!state || event.pointerId !== state.pointerId) return

      if (state.active && reorderTarget.value) {
        reorderVisibleWidgets(state.dragId, reorderTarget.value.targetId, reorderTarget.value.placement)
      }

      detachReorderListeners()
      clearReorderState()
    }

    const handleReorderPointerDown = (widgetId: string, event: PointerEvent) => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (!editMode.value || !currentPanelEditable.value || event.button !== 0) return

      event.preventDefault()
      reorderState.value = {
        pointerId: event.pointerId,
        dragId: widgetId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        active: false
      }
      reorderTarget.value = null
      detachReorderListeners()
      window.addEventListener('pointermove', handleReorderPointerMove)
      window.addEventListener('pointerup', handleReorderPointerUp)
      window.addEventListener('pointercancel', handleReorderPointerUp)
    }

    const openDuplicatePanel = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      panelModalMode.value = 'duplicate'
      panelName.value = `${currentPanel.value?.name || '面板'} 副本`
      showPanelModal.value = true
    }

    const openRenamePanel = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (currentPanel.value?.kind !== 'user') return
      panelModalMode.value = 'rename'
      panelName.value = currentPanel.value.name
      showPanelModal.value = true
    }

    const confirmPanelModal = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      const normalizedName = panelName.value.trim()
      if (!normalizedName) {
        message.warning('请输入面板名称')
        return
      }

      if (panelModalMode.value === 'duplicate') {
        const nextPanel = createUserPanelDefinition(normalizedName, currentPanel.value?.widgets || [])
        const nextBaselines = {
          ...panelBaselines.value,
          [nextPanel.id]: cloneValue(nextPanel)
        }
        updatePanels([...panels.value, nextPanel], nextBaselines)
        activePanelId.value = nextPanel.id
        message.success('已创建用户面板')
      } else {
        replaceCurrentPanel((panel) => ({
          ...panel,
          name: normalizedName
        }))
        message.success('已更新面板名称')
      }

      showPanelModal.value = false
    }

    const deleteCurrentPanel = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      if (currentPanel.value?.kind !== 'user') return
      const nextPanels = panels.value.filter((panel) => panel.id !== currentPanel.value?.id)
      const nextBaselines = { ...panelBaselines.value }
      delete nextBaselines[currentPanel.value.id]
      if (!nextPanels.length) {
        const emptyPanel = createEmptyOverviewPanel()
        nextPanels.push(emptyPanel)
        nextBaselines[emptyPanel.id] = cloneValue(emptyPanel)
      }
      activePanelId.value = nextPanels[0].id
      updatePanels(nextPanels, nextBaselines)
      message.success('已删除用户面板')
    }

    const restoreCurrentPanel = () => {
      if (isLargeScreenMode.value) {
        showLargeScreenReadonlyPrompt()
        return
      }
      const baseline = panelBaselines.value[currentPanel.value?.id || '']
      if (!baseline || !currentPanel.value) {
        message.warning('当前面板没有可恢复的基线')
        return
      }
      const nextPanels = panels.value.map((panel) =>
        panel.id === currentPanel.value?.id ? cloneValue(baseline) : panel
      )
      updatePanels(nextPanels)
      message.success(currentPanel.value.kind === 'user' ? '已恢复到用户面板初始版本' : '已恢复到模板初始定义')
      loadOverview()
    }

    const buildOverviewLoadKey = () =>
      JSON.stringify({
        panelId: activePanelId.value,
        scope: datasetScope.value,
        service: scopeValue.value.service || '',
        timeRange: timeStore.timeRange,
        widgets: currentVisibleWidgets.value.map((widget) => ({
          id: widget.id,
          kind: widget.kind,
          size: widget.size,
          config: widget.config,
          editor: widget.editor
        }))
      })

    const refreshOverviewQueryCardsOnly = async () => {
      if (overviewLoadState.inFlightPromise) return overviewLoadState.inFlightPromise

      const { requests, cards } = buildOverviewCardsQueryRequest({
        widgets: currentVisibleWidgets.value,
        scope: datasetScope.value,
        scopedServiceName: scopeValue.value.service,
        services: services.value,
        refreshGenerationId: `${Date.now()}`,
        autoRefresh: true
      })

      if (!cards.length) return loadOverview({ silent: true })

      const token = overviewLoadState.latestToken + 1
      overviewLoadState.latestToken = token
      overviewLoadState.inFlightKey = `query-cards:${buildOverviewLoadKey()}`
      overviewLoadState.inFlightPromise = Promise.all(requests.map((request) => queryMetricCards(request)))
        .then(async (responses) => {
          if (token !== overviewLoadState.latestToken) return
          queryWidgetResults.value = mapQueryResultsByWidgetId(responses.flatMap((response) => response?.items || []))
          autoRefreshFailureCount.value = 0
          await nextTick()
          layoutWidgetMasonry()
          syncOverviewAutoRefresh()
        })
        .catch((error) => {
          if (token !== overviewLoadState.latestToken) return
          console.error('Failed to refresh overview query cards:', error)
          autoRefreshFailureCount.value += 1
        })
        .finally(() => {
          if (overviewLoadState.latestToken !== token) return
          overviewLoadState.inFlightKey = ''
          overviewLoadState.inFlightPromise = null
        })

      return overviewLoadState.inFlightPromise
    }

    const executeOverviewLoad = async (token: number, options: { silent?: boolean } = {}) => {
      const silent = Boolean(options.silent)
      if (!silent) loading.value = true
      try {
        const overviewTimeRange = toOverviewTimeRange(timeStore.timeRange)
        const visibleWidgets = currentVisibleWidgets.value
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
        const needTrendOverall = visibleWidgets.some((widget) => {
          if (widget.kind === 'trend') {
            const groupBy = (widget.config as TrendConfig).groupBy as OverviewTrendGroupBy | undefined
            return groupBy === 'overall' || !groupBy
          }
          return [
            'metric-summary',
            'query-card',
            'darwin-infra-summary',
            'darwin-infra-trend',
            'darwin-instance-table'
          ].includes(widget.kind)
        })
        const needTrendEnv = visibleWidgets.some(
          (widget) => widget.kind === 'trend' && (widget.config as TrendConfig).groupBy === 'env'
        )
        const needTrendTeam = visibleWidgets.some(
          (widget) => widget.kind === 'trend' && (widget.config as TrendConfig).groupBy === 'team'
        )
        const needRiskServices = visibleWidgets.some((widget) => widget.kind === 'risk-service')
        const needIncidents = visibleWidgets.some((widget) => widget.kind === 'incident')
        const needIngestStatus = visibleWidgets.some((widget) => widget.kind === 'ingest-status')
        const needQueryCards = visibleWidgets.some((widget) =>
          [
            'query-card',
            'metric-summary',
            'trend',
            'darwin-infra-summary',
            'darwin-infra-trend',
            'darwin-instance-table'
          ].includes(widget.kind)
        )

        const catalogPromise = fetchCatalogServices({
          keyword: scopeValue.value.service || undefined,
          page: 1,
          pageSize: 100,
          scope: datasetScope.value
        })
        const overviewDataPromise = Promise.all([
          fetchOverviewSummary({ timeRange: overviewTimeRange, scope: datasetScope.value }),
          needTrendOverall
            ? fetchOverviewTrends({ timeRange: overviewTimeRange, groupBy: 'overall', scope: datasetScope.value })
            : Promise.resolve(null),
          needTrendEnv
            ? fetchOverviewTrends({ timeRange: overviewTimeRange, groupBy: 'env', scope: datasetScope.value })
            : Promise.resolve(null),
          needTrendTeam
            ? fetchOverviewTrends({ timeRange: overviewTimeRange, groupBy: 'team', scope: datasetScope.value })
            : Promise.resolve(null),
          needRiskServices ? fetchOverviewRiskServices({ scope: datasetScope.value }) : Promise.resolve(null),
          needIngestStatus ? fetchOverviewIngestStatus({ scope: datasetScope.value }) : Promise.resolve(null),
          needIncidents
            ? fetchOverviewIncidents({ timeRange: overviewTimeRange, scope: datasetScope.value })
            : Promise.resolve([])
        ])

        const catalogRes = await catalogPromise
        const catalogItems = catalogRes?.items || []
        const nextServices = catalogItems.map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name,
          owner: item.identity?.owner,
          team: item.identity?.team,
          env: item.identity?.env,
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
        if (token !== overviewLoadState.latestToken) return
        services.value = nextServices

        const visibleWidgetRanges = Array.from(
          new Set(
            visibleWidgets
              .filter((widget) => {
                if (widget.kind !== 'metric-summary' && widget.kind !== 'trend') return false
                return !buildOverviewWidgetQueryPreviewSpec({
                  widget,
                  scope: datasetScope.value,
                  scopedServiceName: scopeValue.value.service,
                  services: nextServices
                }).supported
              })
              .map((widget) => buildOverviewWidgetEditorState(widget).timeRange)
          )
        )
        const pageWidgetRange = timeStore.timeRange
        const snapshotFetchPlan = buildOverviewSnapshotFetchPlan({
          visibleWidgetRanges,
          pageWidgetRange
        })
        const snapshotDataPromise = Promise.all([
          needQueryCards
            ? Promise.all(
                snapshotFetchPlan.summaryFetchRanges.map(
                  async (range) =>
                    [
                      range,
                      (await fetchOverviewSummary({ timeRange: `-${range}`, scope: datasetScope.value }))?.totals || {}
                    ] as const
                )
              )
            : Promise.resolve([]),
          needQueryCards
            ? Promise.all(
                snapshotFetchPlan.trendFetchPairs
                  .filter(({ groupBy }) => {
                    if (groupBy === 'overall') return needTrendOverall
                    if (groupBy === 'env') return needTrendEnv
                    return needTrendTeam
                  })
                  .map(
                    async ({ range, groupBy }) =>
                      [
                        `${range}:${groupBy}`,
                        normalizeTrendSnapshot(
                          await fetchOverviewTrends({ timeRange: `-${range}`, groupBy, scope: datasetScope.value })
                        )
                      ] as const
                  )
              )
            : Promise.resolve([])
        ])

        const { requests, cards } = buildOverviewCardsQueryRequest({
          widgets: visibleWidgets,
          scope: datasetScope.value,
          scopedServiceName: scopeValue.value.service,
          services: nextServices,
          refreshGenerationId: `${Date.now()}`
        })
        const queryCardsPromise =
          cards.length && needQueryCards
            ? Promise.all(requests.map((request) => queryMetricCards(request))).then((responses) =>
                mapQueryResultsByWidgetId(responses.flatMap((response) => response?.items || []))
              )
            : Promise.resolve({} as Record<string, CardData | null>)

        const [summaryRes, overallTrendRes, envTrendRes, teamTrendRes, riskRes, ingestRes, incidentsRes] =
          await overviewDataPromise

        if (token !== overviewLoadState.latestToken) return

        const totals = summaryRes?.totals || {}
        summary.value = {
          serviceCount: totals.serviceCount ?? null,
          healthyServices: totals.healthyServices ?? null,
          activeAlerts: totals.activeIncidents ?? null,
          errorRate: totals.errorRate ?? null,
          p95Latency: totals.p95Latency ?? null,
          totalRequests: totals.totalRequests ?? null
        }
        incidents.value = Array.isArray(incidentsRes) ? incidentsRes : []
        ingestStatus.value = ingestRes || null
        riskServices.value = {
          highRiskServices: Array.isArray(riskRes?.highRiskServices) ? riskRes.highRiskServices : [],
          recentDegradedServices: Array.isArray(riskRes?.recentDegradedServices) ? riskRes.recentDegradedServices : []
        }

        trendsByGroup.value = {
          overall: normalizeTrendSnapshot(overallTrendRes || {}),
          env: normalizeTrendSnapshot(envTrendRes || {}),
          team: normalizeTrendSnapshot(teamTrendRes || {})
        }
        const [extraRangeSummaries, extraRangeTrends] = await snapshotDataPromise
        if (token !== overviewLoadState.latestToken) return
        const rangeScopedSummaries = [[pageWidgetRange, totals] as const, ...extraRangeSummaries]
        const rangeScopedTrends = [
          ...(['overall', 'env', 'team'] as OverviewTrendGroupBy[])
            .filter((groupBy) => {
              if (groupBy === 'overall') return needTrendOverall
              if (groupBy === 'env') return needTrendEnv
              return needTrendTeam
            })
            .map(
              (groupBy) =>
                [
                  `${pageWidgetRange}:${groupBy}`,
                  normalizeTrendSnapshot(
                    groupBy === 'overall'
                      ? overallTrendRes || {}
                      : groupBy === 'env'
                        ? envTrendRes || {}
                        : teamTrendRes || {}
                  )
                ] as const
            ),
          ...extraRangeTrends
        ]

        widgetTrendSnapshots.value = Object.fromEntries(rangeScopedTrends) as Record<string, TrendSnapshot>
        widgetSummarySnapshots.value = Object.fromEntries(
          rangeScopedSummaries.map(([range, scopedTotals]) => [
            range,
            {
              serviceCount: scopedTotals.serviceCount ?? null,
              activeIncidents: scopedTotals.activeIncidents ?? null,
              totalRequests: scopedTotals.totalRequests ?? null,
              errorRate: scopedTotals.errorRate ?? null,
              p95Latency: scopedTotals.p95Latency ?? null
            }
          ])
        ) as Partial<Record<OverviewWidgetEditorTimeRange, Record<string, any>>> as Record<
          OverviewWidgetEditorTimeRange,
          Record<string, any>
        >

        const nextQueryWidgetResults = await queryCardsPromise
        if (token !== overviewLoadState.latestToken) return
        queryWidgetResults.value = nextQueryWidgetResults

        dataReady.value = {
          catalog: true,
          summary: true,
          incidents: false,
          ingest: false
        }
        console.log('[Overview:AddWidget] loadOverview:success', {
          datasetScope: datasetScope.value,
          dataReady: dataReady.value,
          runtimeCapabilities: runtimeCapabilities.value,
          widgetTypeOptions: widgetTypeOptions.value,
          currentVisibleWidgets: currentVisibleWidgets.value.map((widget) => ({
            id: widget.id,
            kind: widget.kind,
            capability: widget.capability,
            size: widget.size
          }))
        })
        autoRefreshFailureCount.value = 0
      } catch (error) {
        if (token !== overviewLoadState.latestToken) return
        console.error('Failed to load overview v2:', error)
        autoRefreshFailureCount.value += 1
      } finally {
        if (token !== overviewLoadState.latestToken) return
        if (!silent) loading.value = false
        await nextTick()
        layoutWidgetMasonry()
        syncOverviewAutoRefresh()
      }
    }

    const loadOverview = (options: { silent?: boolean; force?: boolean } = {}) => {
      const key = buildOverviewLoadKey()
      const now = Date.now()

      if (!options.force && overviewLoadState.inFlightPromise && overviewLoadState.inFlightKey === key) {
        return overviewLoadState.inFlightPromise
      }

      if (
        !options.force &&
        overviewLoadState.lastCompletedKey === key &&
        now - overviewLoadState.lastCompletedAt < OVERVIEW_LOAD_DEDUPE_WINDOW_MS
      ) {
        return Promise.resolve()
      }

      const token = overviewLoadState.latestToken + 1
      overviewLoadState.latestToken = token
      overviewLoadState.inFlightKey = key
      overviewLoadState.inFlightPromise = executeOverviewLoad(token, options).finally(() => {
        if (overviewLoadState.latestToken !== token) return
        overviewLoadState.lastCompletedKey = key
        overviewLoadState.lastCompletedAt = Date.now()
        overviewLoadState.inFlightKey = ''
        overviewLoadState.inFlightPromise = null
      })

      return overviewLoadState.inFlightPromise
    }

    const overallTrends = computed(() => trendsByGroup.value.overall)
    const serviceMetaMap = computed(() => new Map(services.value.map((item: any) => [item.id || item.name, item])))
    const kpiCards = computed<KpiCard[]>(() => {
      const healthyCount =
        typeof summary.value.healthyServices === 'number'
          ? summary.value.healthyServices
          : services.value.filter((service) => service.health === 'healthy').length
      const serviceCount = typeof summary.value.serviceCount === 'number' ? summary.value.serviceCount : null
      const activeAlerts = typeof summary.value.activeAlerts === 'number' ? summary.value.activeAlerts : null
      const errorRate = typeof summary.value.errorRate === 'number' ? summary.value.errorRate : null
      const p95Latency = typeof summary.value.p95Latency === 'number' ? summary.value.p95Latency : null
      const totalRequests = typeof summary.value.totalRequests === 'number' ? summary.value.totalRequests : null
      const healthyRatio =
        typeof serviceCount === 'number' && serviceCount > 0
          ? Math.round((healthyCount / Math.max(serviceCount, 1)) * 100)
          : null
      const incidentCount = incidents.value.length
      const requestValues = overallTrends.value.requests
        .map((item) => item.value)
        .filter((value): value is number => typeof value === 'number')
      const latencyValues = overallTrends.value.latency
        .map((item) => item.value)
        .filter((value): value is number => typeof value === 'number')
      const errorRateValues = overallTrends.value.requests
        .map((item, index) => {
          const requests = item.value
          const errors = overallTrends.value.errors[index]?.value
          if (typeof requests !== 'number' || typeof errors !== 'number' || requests <= 0) return null
          return (errors / requests) * 100
        })
        .filter((value): value is number => value !== null)
      const ingestChannelStatuses = ingestStatus.value
        ? [
            ingestStatus.value.metrics?.status,
            ingestStatus.value.logs?.status,
            ingestStatus.value.traces?.status
          ].filter((status): status is string => typeof status === 'string')
        : []
      const healthyIngestCount = ingestChannelStatuses.filter((status) => status === 'healthy').length
      const ingestKnownCount = ingestChannelStatuses.length
      const unhealthyCount = typeof serviceCount === 'number' ? Math.max(serviceCount - healthyCount, 0) : null
      const activeAlertRatio =
        typeof activeAlerts === 'number' && typeof serviceCount === 'number' && serviceCount > 0
          ? `${(activeAlerts / Math.max(serviceCount, 1)).toFixed(1)}/服务`
          : '等待服务基线'
      const requestMeta = buildTrendMeta(requestValues)
      const errorMeta = buildTrendMeta(errorRateValues, '%', true)
      const latencyMeta = buildTrendMeta(latencyValues, 'ms', true)

      return [
        {
          key: 'service-count',
          label: '服务总数',
          value: summary.value.serviceCount ?? '未知',
          baseline: `健康 ${healthyCount}`,
          delta: `待关注 ${typeof unhealthyCount === 'number' ? unhealthyCount : '未知'}`,
          mom: typeof healthyRatio === 'number' ? `健康率 ${healthyRatio}%` : '等待健康分布',
          deltaDirection: typeof unhealthyCount === 'number' && unhealthyCount > 0 ? 'up' : 'flat'
        },
        {
          key: 'healthy-services',
          label: '健康服务数',
          value: healthyCount,
          baseline: `总数 ${summary.value.serviceCount ?? '未知'}`,
          delta: `待关注 ${typeof unhealthyCount === 'number' ? unhealthyCount : '未知'}`,
          mom: typeof healthyRatio === 'number' ? `占比 ${healthyRatio}%` : '等待健康分布',
          deltaDirection: typeof unhealthyCount === 'number' && unhealthyCount > 0 ? 'down' : 'flat'
        },
        {
          key: 'active-alerts',
          label: '活跃告警',
          value: summary.value.activeAlerts ?? '未知',
          baseline: `事件 ${incidentCount}`,
          delta: `活跃 ${summary.value.activeAlerts ?? '未知'}`,
          mom:
            incidentCount === 0 && activeAlerts === 0
              ? '当前无关键事件'
              : typeof activeAlerts === 'number'
                ? activeAlertRatio
                : '等待事件数据',
          deltaDirection: typeof activeAlerts === 'number' && activeAlerts > 0 ? 'up' : 'flat',
          route: {
            path: '/home/alerts/inbox',
            query: { status: 'active', timeRange: timeStore.timeRange }
          }
        },
        {
          key: 'total-requests',
          label: '请求总量',
          value: totalRequests === null ? '未知' : totalRequests,
          ...requestMeta
        },
        {
          key: 'error-rate',
          label: '全局错误率',
          value: errorRate === null ? '未知' : `${errorRate}%`,
          ...errorMeta,
          route: {
            path: '/home/investigate/metrics',
            query: { timeRange: timeStore.timeRange }
          }
        },
        {
          key: 'p95-latency',
          label: 'P95 延迟',
          value: p95Latency === null ? '未知' : `${p95Latency}ms`,
          ...latencyMeta,
          route: {
            path: '/home/investigate/traces',
            query: { timeRange: timeStore.timeRange }
          }
        },
        {
          key: 'ingest-success-rate',
          label: 'ingest 成功率',
          value: ingestKnownCount === 3 ? `${Math.round((healthyIngestCount / 3) * 100)}%` : '未知',
          baseline: `已知 ${ingestKnownCount}/3`,
          delta: `异常 ${ingestKnownCount === 3 ? Math.max(3 - healthyIngestCount, 0) : '未知'}`,
          mom: ingestKnownCount ? `正常 ${healthyIngestCount}/${ingestKnownCount}` : '等待 ingest 状态',
          deltaDirection: ingestKnownCount === 3 && Math.max(3 - healthyIngestCount, 0) > 0 ? 'down' : 'flat',
          route: {
            path: '/home/admin/ingestion',
            query: { timeRange: timeStore.timeRange }
          }
        }
      ]
    })
    const kpiCardMap = computed(() => new Map(kpiCards.value.map((item) => [item.key, item])))

    const displayMetric = (value: string | number | null | undefined, suffix = '') => {
      if (typeof value === 'number') return `${value}${suffix}`
      if (typeof value === 'string' && value.length > 0) return `${value}${suffix}`
      return '未知'
    }

    const formatQueryCompareValue = (compare: NonNullable<Extract<CardData, { kind: 'number' }>['compare']>) => {
      const absolute =
        typeof compare.absoluteDelta === 'number'
          ? `${compare.absoluteDelta > 0 ? '+' : ''}${formatQueryNumberValue(compare.absoluteDelta)}`
          : '—'
      const relative =
        typeof compare.relativeDelta === 'number'
          ? `${compare.relativeDelta > 0 ? '+' : ''}${compare.relativeDelta.toFixed(1)}%`
          : '—'
      if (compare.display === 'absolute') return absolute
      if (compare.display === 'both') return `${relative} · ${absolute}`
      return relative
    }

    const formatQueryCompareTitle = (compare: NonNullable<Extract<CardData, { kind: 'number' }>['compare']>) => {
      const baseline =
        typeof compare.baselineValue === 'number'
          ? `基线 ${formatQueryNumberValue(compare.baselineValue)}`
          : '暂无基线数据'
      const delta =
        typeof compare.absoluteDelta === 'number' ? `差值 ${formatQueryNumberValue(compare.absoluteDelta)}` : '暂无差值'
      const relative =
        typeof compare.relativeDelta === 'number' ? `变化 ${compare.relativeDelta.toFixed(1)}%` : '暂无变化率'
      return `${compare.label}，${baseline}，${delta}，${relative}`
    }

    const renderQueryNumberTrend = (compare?: Extract<CardData, { kind: 'number' }>['compare']) => {
      if (!compare) return null
      const tone = compare.sentiment === 'neutral' ? compare.direction : compare.sentiment
      const trendPath =
        compare.direction === 'up'
          ? 'M2.75 11.25L6.25 7.75L9.25 9.75L13.25 4.75'
          : compare.direction === 'down'
            ? 'M2.75 4.75L6.25 8.25L9.25 6.25L13.25 11.25'
            : 'M2.75 8H13.25'
      return (
        <div
          class={[
            'overview-page__query-number-trend',
            `overview-page__query-number-trend--${compare.sentiment}`,
            `overview-page__query-number-trend--${compare.direction}`,
            `overview-page__query-number-trend--tone-${tone}`
          ]}
          title={formatQueryCompareTitle(compare)}
          aria-label={formatQueryCompareTitle(compare)}>
          <svg class="overview-page__query-number-trend-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d={trendPath} />
            <circle
              cx="13.25"
              cy={compare.direction === 'down' ? '11.25' : compare.direction === 'up' ? '4.75' : '8'}
              r="1.35"
            />
          </svg>
          <span class="overview-page__query-number-trend-value">{formatQueryCompareValue(compare)}</span>
        </div>
      )
    }

    const resolveQueryDisplayValue = (query: QuerySpec | null | undefined, data?: CardData | null) => {
      const valueDisplay = query?.display?.value
      const yAxisDisplay = query?.display?.yAxis
      const dataUnit = data && 'unit' in data ? data.unit : ''
      return {
        min: valueDisplay?.min ?? yAxisDisplay?.min,
        max: valueDisplay?.max ?? yAxisDisplay?.max,
        unit: valueDisplay?.unit ?? yAxisDisplay?.unit ?? dataUnit ?? ''
      }
    }

    const resolveQueryThresholdLines = (query: QuerySpec | null | undefined) =>
      normalizeQueryAlertRules(query?.alert).map((rule) => ({
        value: rule.threshold,
        label: alertLevelMeta[rule.level]?.label || '阈值',
        unit: rule.unit || query?.display?.value?.unit || query?.display?.yAxis?.unit || '',
        level: rule.level,
        color: alertLevelMeta[rule.level]?.color
      }))

    const isQueryAlertRuleMatched = (value: number, rule: QueryAlertRule) => {
      if (!Number.isFinite(value) || !Number.isFinite(rule.threshold)) return false
      if (rule.operator === '>') return value > rule.threshold
      if (rule.operator === '>=') return value >= rule.threshold
      if (rule.operator === '<') return value < rule.threshold
      if (rule.operator === '<=') return value <= rule.threshold
      return value === rule.threshold
    }

    const resolveNumberAlertLevel = (
      query: QuerySpec | null | undefined,
      value: unknown
    ): QueryAlertRule['level'] | null => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null
      const matchedRules = normalizeQueryAlertRules(query?.alert).filter((rule) => isQueryAlertRuleMatched(value, rule))
      if (!matchedRules.length) return null
      return matchedRules.sort((left, right) => alertLevelPriority[right.level] - alertLevelPriority[left.level])[0]
        .level
    }

    const renderWidgetAlertSummary = (widget: OverviewPanelWidget) => {
      if (widget.kind !== 'query-card') return null
      const query = (widget as OverviewPanelWidget<'query-card'>).config.query
      const rules = normalizeQueryAlertRules(query.alert)
      if (!rules.length) return null
      return (
        <div class="overview-page__widget-alert-summary">
          {rules.map((rule) => {
            const channels = rule.channels?.length ? rule.channels.join('、') : 'Email'
            const meta = alertLevelMeta[rule.level]
            return (
              <span class="overview-page__widget-alert-rule" key={`${rule.level}-${rule.threshold}`}>
                <NTag size="small" bordered={false} type={meta?.tagType || 'warning'}>
                  {meta?.label || rule.level}
                </NTag>
                <span>
                  {rule.operator} {rule.threshold}
                  {rule.unit || query.display?.value?.unit || query.display?.yAxis?.unit || ''}，持续{' '}
                  {rule.duration || 5} 分钟，通知 {channels}
                </span>
              </span>
            )
          })}
        </div>
      )
    }

    const renderQueryDrivenWidget = (widget: OverviewPanelWidget, query?: QuerySpec) => {
      const cardData = queryWidgetResults.value[widget.id]
      const queryCardConfig =
        widget.kind === 'query-card' ? (widget as OverviewPanelWidget<'query-card'>).config.query : null
      const effectiveQuery = queryCardConfig || query
      const display = resolveQueryDisplayValue(effectiveQuery, cardData)
      const thresholdLines = resolveQueryThresholdLines(effectiveQuery)
      const renderWithAlertSummary = (content: any) => (
        <div class="overview-page__query-card-body">
          {renderWidgetAlertSummary(widget)}
          {content}
        </div>
      )
      if (!cardData) {
        return renderWithAlertSummary(
          <NEmpty description={`${widget.title} 当前暂无查询结果。`} class="overview-page__future-empty" />
        )
      }

      if (cardData.kind === 'number') {
        const numberAlertLevel = resolveNumberAlertLevel(effectiveQuery, cardData.value)
        const numberDisplay =
          typeof cardData.value === 'number' ? formatQueryNumberDisplay(cardData.value, display.unit) : null
        return renderWithAlertSummary(
          widget.editor?.visualization === 'donut' ? (
            <GaugeChart
              value={typeof cardData.value === 'number' ? cardData.value : 0}
              min={display.min ?? 0}
              max={display.max ?? 100}
              unit={display.unit || '%'}
              color="var(--color-primary-6)"
              height={widget.size === 'L' ? '260px' : '220px'}
              loading={loading.value}
            />
          ) : (
            <div class="overview-page__query-number-card">
              <div class="overview-page__query-number-accent" />
              <div class="overview-page__query-number-value-row">
                <div class="overview-page__query-number-primary">
                  <strong
                    class={[
                      'overview-page__query-number-value',
                      numberAlertLevel ? `overview-page__query-number-value--${numberAlertLevel}` : ''
                    ]}>
                    {numberDisplay ? numberDisplay.value : (cardData.value ?? '未知')}
                  </strong>
                  {numberDisplay?.unit || display.unit ? (
                    <span class="overview-page__query-number-unit">{numberDisplay?.unit || display.unit}</span>
                  ) : null}
                </div>
                {renderQueryNumberTrend(cardData.compare)}
              </div>
              <div class="overview-page__query-number-meta">
                <span>{effectiveQuery?.metricRef || 'QuerySpec'}</span>
                <span>{effectiveQuery?.aggregation || 'latest'}</span>
              </div>
            </div>
          )
        )
      }

      if (cardData.kind === 'timeseries') {
        return renderWithAlertSummary(
          widget.editor?.visualization === 'bar' ? (
            <BarChart
              data={(cardData.series?.[0]?.points || []).map((point) => ({
                name: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: point.value
              }))}
              height={widget.size === 'L' ? '260px' : '220px'}
              variant="monitor"
              yAxisMin={display.min}
              yAxisMax={display.max}
              yAxisUnit={display.unit}
            />
          ) : (
            <LineChart
              series={(cardData.series || []).map((series) => ({
                name: series.name,
                data: series.points
              }))}
              title=""
              height={widget.size === 'L' ? '260px' : '220px'}
              area={widget.editor?.visualization === 'line'}
              variant="monitor"
              showLegend
              yAxisMin={display.min}
              yAxisMax={display.max}
              yAxisUnit={display.unit}
              thresholdLines={thresholdLines}
            />
          )
        )
      }

      if (cardData.kind === 'distribution') {
        return renderWithAlertSummary(
          widget.editor?.visualization === 'donut' ? (
            <PieChart data={cardData.items || []} height={widget.size === 'L' ? '260px' : '220px'} variant="monitor" />
          ) : (
            <BarChart data={cardData.items || []} height={widget.size === 'L' ? '260px' : '220px'} variant="monitor" />
          )
        )
      }

      if (cardData.kind === 'table') {
        return renderWithAlertSummary(
          <ResultTable
            columns={
              (cardData.columns || []).map((column) => ({
                title: column.label,
                key: column.key
              })) as OverviewResultTableColumn[]
            }
            data={(cardData.rows || []) as OverviewResultTableRow[]}
            density="compact"
            flexHeight={false}
          />
        )
      }

      return renderWithAlertSummary(
        <NEmpty description={`${widget.title} 当前暂无查询结果。`} class="overview-page__future-empty" />
      )
    }

    const filteredRiskServices = (widget: OverviewPanelWidget<'risk-service'>) => {
      const tags = widget.config.tags || []
      const source = tags.includes('degraded')
        ? riskServices.value.recentDegradedServices
        : riskServices.value.highRiskServices
      const matched = source.filter((item) => {
        const meta = serviceMetaMap.value.get(item.serviceId) || serviceMetaMap.value.get(item.service)
        if (widget.config.team && meta?.team !== widget.config.team) return false
        if (widget.config.env && meta?.env !== widget.config.env) return false
        if ((widget.config.tags || []).some((tag) => !['high-risk', 'degraded'].includes(tag)) && meta) {
          const requiredTags = (widget.config.tags || []).filter((tag) => !['high-risk', 'degraded'].includes(tag))
          if (requiredTags.some((tag) => !(meta.tags || []).includes(tag))) return false
        }
        return true
      })
      return matched.slice(0, widget.config.limit || 6)
    }

    const filteredIncidents = (widget: OverviewPanelWidget<'incident'>) =>
      incidents.value
        .filter((item) => {
          const severity = typeof item.severity === 'string' ? item.severity : null
          const source = typeof item.source === 'string' ? (item.source as OverviewIncidentSource) : null
          if (widget.config.severity?.length && (!severity || !widget.config.severity.includes(severity))) return false
          if (widget.config.source?.length && (!source || !widget.config.source.includes(source))) return false
          if (widget.config.env && item.env && item.env !== widget.config.env) return false
          return true
        })
        .slice(0, widget.config.limit || 5)

    const selectedIngestEntries = (widget: OverviewPanelWidget<'ingest-status'>) => {
      const selectedSources = widget.config.source?.length ? widget.config.source : ['metrics', 'logs', 'traces']
      return selectedSources.map((source) => ({
        key: source,
        label: `${source[0].toUpperCase()}${source.slice(1)} 采集`,
        item: ingestStatus.value?.[source]
      }))
    }

    const resolveTrendSeries = (widget: OverviewPanelWidget<'trend'>) => {
      const groupBy = (widget.config.groupBy || 'overall') as OverviewTrendGroupBy
      const snapshot = trendsByGroup.value[groupBy] || trendsByGroup.value.overall
      if (widget.config.metric === 'errors') return snapshot.errors
      if (widget.config.metric === 'latency') return snapshot.latency
      return snapshot.requests
    }

    const getDisplayMetricMeta = (metric: OverviewWidgetDisplayMetricKey) => widgetDisplayMetricMeta[metric]

    const getTrendMetricForDisplay = (metric: OverviewWidgetDisplayMetricKey): OverviewTrendMetricKey | null => {
      if (metric === 'requests' || metric === 'errors' || metric === 'latency') return metric
      if (metric === 'total-requests') return 'requests'
      if (metric === 'error-rate') return 'errors'
      if (metric === 'p95-latency') return 'latency'
      return null
    }

    const getSeriesForDisplayMetric = (
      metric: OverviewWidgetDisplayMetricKey,
      range?: OverviewWidgetEditorTimeRange,
      groupBy: OverviewTrendGroupBy = 'overall'
    ) => {
      const trendMetric = getTrendMetricForDisplay(metric)
      if (!trendMetric) return [] as TrendPoint[]
      const source =
        (range ? widgetTrendSnapshots.value[`${range}:${groupBy}`] : null) ||
        trendsByGroup.value[groupBy] ||
        trendsByGroup.value.overall
      if (trendMetric === 'errors') return source.errors
      if (trendMetric === 'latency') return source.latency
      return source.requests
    }

    const buildComparisonCopy = (
      values: number[],
      metric: OverviewWidgetDisplayMetricKey,
      compareWindow: OverviewCompareWindow
    ) => {
      const base = buildTrendComparison(values, getDisplayMetricMeta(metric)?.unit || '')
      return compareWindow === 'same-period' ? base.replace('较前序', '较同比窗口') : base
    }

    const getNumericValueForDisplayMetric = (
      metric: OverviewWidgetDisplayMetricKey,
      range?: OverviewWidgetEditorTimeRange
    ) => {
      const totals = range ? widgetSummarySnapshots.value[range] : null
      if (totals) {
        if (metric === 'service-count') return totals.serviceCount ?? 0
        if (metric === 'active-alerts') return totals.activeIncidents ?? 0
        if (metric === 'total-requests') return totals.totalRequests ?? 0
        if (metric === 'error-rate') return totals.errorRate ?? 0
        if (metric === 'p95-latency') return totals.p95Latency ?? 0
      }
      if (metric === 'healthy-services') return summary.value.healthyServices ?? 0
      if (metric === 'ingest-success-rate') {
        const ingestKnownCount = ['metrics', 'logs', 'traces'].filter((key) => ingestStatus.value?.[key]).length
        const healthyIngestCount = ['metrics', 'logs', 'traces'].filter(
          (key) => ingestStatus.value?.[key]?.status === 'healthy'
        ).length
        return ingestKnownCount ? Math.round((healthyIngestCount / ingestKnownCount) * 100) : 0
      }

      const card = !range ? kpiCardMap.value.get(metric as OverviewMetricKey) : null
      if (card) return Number(String(card.value).replace(/[^0-9.\-]/g, '')) || 0
      const series = getSeriesForDisplayMetric(metric, range)
      return series.length ? series[series.length - 1].value : 0
    }

    const formatMetricNumber = (metric: OverviewWidgetDisplayMetricKey, value: number) => {
      const unit = getDisplayMetricMeta(metric)?.unit || ''
      if (unit === '%') return `${value.toFixed(1)}%`
      if (unit === 'ms') return `${Math.round(value)}ms`
      if (Math.abs(value) >= 1000) return `${value.toFixed(0)}`
      return `${value.toFixed(unit ? 1 : 0)}${unit}`
    }

    const accumulateSeries = (series: TrendPoint[]) => {
      let total = 0
      return series.map((point) => {
        total += point.value
        return { ...point, value: total }
      })
    }

    const renderEditorNotes = (widget: OverviewPanelWidget) => {
      const notes = buildOverviewWidgetEditorState(widget).notes
      return notes ? <div class="overview-page__editor-note">备注：{notes}</div> : null
    }

    const renderMetricSummaryVisualization = (widget: OverviewPanelWidget<'metric-summary'>) => {
      const editor = buildOverviewWidgetEditorState(widget)
      const range = editor.timeRange
      const metrics = (editor.displayedMetrics.length ? editor.displayedMetrics : [widget.config.metricKey]).filter(
        (metric): metric is OverviewWidgetDisplayMetricKey => Boolean(metric)
      )
      const cards = metrics.map((metric) => ({
        key: metric,
        label: getDisplayMetricMeta(metric)?.label || metric,
        value: getNumericValueForDisplayMetric(metric, range),
        series: getSeriesForDisplayMetric(metric, range)
      }))

      if (!cards.length) return <NEmpty description="当前指标不可用" class="overview-page__metric-empty" />

      const hasSeriesBackedCards = cards.some((card) => card.series.length > 0)

      if (editor.visualization === 'bar') {
        return (
          <div>
            <BarChart
              data={cards.map((card) => ({
                name: card.label,
                value: Number(card.value) || 0
              }))}
              height={widget.size === 'L' ? '260px' : '220px'}
            />
            {renderEditorNotes(widget)}
          </div>
        )
      }

      if (editor.visualization === 'donut') {
        return (
          <div>
            <PieChart
              data={cards.map((card) => ({
                name: card.label,
                value: Number(card.value) || 0
              }))}
              height={widget.size === 'L' ? '260px' : '220px'}
              variant="monitor"
            />
            {renderEditorNotes(widget)}
          </div>
        )
      }

      return (
        <div class="overview-page__metric-summary-grid">
          {cards.map((card) => (
            <div key={card.key} class="overview-page__metric-summary-item">
              <div class="overview-page__metric-summary-label">{card.label}</div>
              <div class="overview-page__metric-summary-value">
                {formatMetricNumber(card.key, Number(card.value) || 0)}
              </div>
              <div class="overview-page__metric-summary-extra">
                {hasSeriesBackedCards && editor.display.showTotal ? (
                  <span>
                    合计：
                    {formatMetricNumber(
                      card.key,
                      card.series.reduce((sum, item) => sum + item.value, 0) || Number(card.value) || 0
                    )}
                  </span>
                ) : null}
                {hasSeriesBackedCards && editor.display.showAverage ? (
                  <span>
                    均值：
                    {formatMetricNumber(
                      card.key,
                      average(card.series.map((item) => item.value)) || Number(card.value) || 0
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {renderEditorNotes(widget)}
        </div>
      )
    }

    const renderTrendVisualization = (widget: OverviewPanelWidget<'trend'>) => {
      const editor = buildOverviewWidgetEditorState(widget)
      const range = editor.timeRange
      const groupBy = ((widget.config as TrendConfig).groupBy as OverviewTrendGroupBy | undefined) || 'overall'
      const metrics = (editor.displayedMetrics.length ? editor.displayedMetrics : [widget.config.metric]).filter(
        (metric): metric is OverviewWidgetDisplayMetricKey => Boolean(metric)
      )
      const trendMetrics = metrics
        .map((metric) => getTrendMetricForDisplay(metric))
        .filter((metric): metric is OverviewTrendMetricKey => Boolean(metric))
      const series = trendMetrics.map((metric) => {
        const meta = getDisplayMetricMeta(metric)
        const data = getSeriesForDisplayMetric(metric, range, groupBy)
        return {
          name: meta.label,
          color: meta.color,
          data: editor.visualization === 'cumulative' ? accumulateSeries(data) : data
        }
      })

      if (!series.length || !series.some((item) => item.data.length)) {
        return <NEmpty description="暂无趋势数据" class="overview-page__trend-empty" />
      }

      if (editor.visualization === 'bar') {
        return (
          <div>
            <div class="overview-page__trend-tags">
              <NTag size="small" bordered={false}>
                {groupBy}
              </NTag>
            </div>
            <BarChart
              series={series.map((item) => ({
                name: item.name,
                color: item.color,
                data: item.data.map((point) => ({
                  name: new Date(point.timestamp).toLocaleTimeString(),
                  value: point.value
                }))
              }))}
              height={widget.size === 'L' ? '260px' : '220px'}
            />
            {renderEditorNotes(widget)}
          </div>
        )
      }

      if (editor.visualization === 'table') {
        const rows = series[0].data.slice(-6).map((point, index) => ({
          timestamp: point.timestamp,
          values: series.map((item) => item.data[index]?.value ?? 0)
        }))
        return (
          <div class="overview-page__table-shell">
            <table class="overview-page__data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  {series.map((item) => (
                    <th key={item.name}>{item.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.timestamp}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.timestamp}-${index}`}>{formatMetricNumber(trendMetrics[index], value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {renderEditorNotes(widget)}
          </div>
        )
      }

      return (
        <div>
          <div class="overview-page__trend-tags">
            <NTag size="small" bordered={false}>
              {groupBy}
            </NTag>
          </div>
          <LineChart
            series={series}
            height={widget.size === 'L' ? '260px' : '220px'}
            area={editor.visualization === 'cumulative'}
          />
          {renderEditorNotes(widget)}
        </div>
      )
    }

    const renderMetricSummary = (widget: OverviewPanelWidget<'metric-summary'>) => {
      return renderMetricSummaryVisualization(widget)
    }

    const renderRiskService = (widget: OverviewPanelWidget<'risk-service'>) => {
      const items = filteredRiskServices(widget)
      return items.length ? (
        <div class="overview-page__stack-list">
          {items.map((service) => (
            <div
              key={service.serviceId}
              class="overview-page__risk-card"
              onClick={() =>
                router.push({
                  path: `/home/services/${service.serviceId}`,
                  query: { timeRange: timeStore.timeRange, scope: datasetScope.value }
                })
              }>
              <div>
                <div class="overview-page__risk-title">{service.service}</div>
                <div class="overview-page__risk-meta">
                  Health {service.healthStatus || 'unknown'} · 错误率 {displayMetric(service.errorRate, '%')} · 延迟变化{' '}
                  {typeof service.latencyDelta === 'number' ? (service.latencyDelta > 0 ? '+' : '') : ''}
                  {displayMetric(service.latencyDelta, 'ms')}
                </div>
                <div class="overview-page__risk-submeta">活跃事件 {displayMetric(service.activeIncidentCount)}</div>
              </div>
              <ServiceHealthBadge
                status={
                  service.healthStatus === 'healthy'
                    ? 'healthy'
                    : service.healthStatus === 'warning'
                      ? 'degraded'
                      : service.healthStatus === 'unknown'
                        ? 'unknown'
                        : service.healthStatus === 'muted'
                          ? 'muted'
                          : 'unknown'
                }
                size="sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <NEmpty description="暂无符合条件的风险服务" class="overview-page__list-empty" />
      )
    }

    const renderIncidentList = (widget: OverviewPanelWidget<'incident'>) => {
      const items = filteredIncidents(widget)
      return items.length ? (
        <div class="overview-page__stack-list">
          {items.map((incident) => (
            <div
              key={incident.id}
              class="overview-page__incident-card"
              onClick={() =>
                router.push({
                  path: `/home/alerts/inbox/${incident.id}`,
                  query: {
                    serviceId: incident.serviceId || undefined,
                    timeRange: timeStore.timeRange
                  }
                })
              }>
              <div class="overview-page__incident-header">
                <div>
                  <div class="overview-page__incident-title">{incident.title}</div>
                  <div class="overview-page__incident-meta">{incident.summary || '暂无摘要'}</div>
                </div>
                <ServiceHealthBadge
                  status={
                    incident.severity === 'critical'
                      ? 'critical'
                      : incident.severity === 'warning'
                        ? 'degraded'
                        : 'unknown'
                  }
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NEmpty description="暂无符合筛选条件的事件" class="overview-page__list-empty" />
      )
    }

    const renderIngestStatus = (widget: OverviewPanelWidget<'ingest-status'>) => {
      if (!ingestStatus.value) return <NEmpty description="暂无采集状态数据" class="overview-page__ingest-empty" />
      const entries = selectedIngestEntries(widget)
      return (
        <div class="overview-page__ingest-grid">
          {entries.map((entry) => (
            <div key={entry.key} class="overview-page__ingest-card">
              <div class="overview-page__ingest-card-label">{entry.label}</div>
              <div class="overview-page__ingest-card-header">
                <div class="overview-page__ingest-card-value">{displayMetric(entry.item?.value)}</div>
                <ServiceHealthBadge
                  status={
                    entry.item?.status === 'healthy'
                      ? 'healthy'
                      : entry.item?.status === 'warning'
                        ? 'degraded'
                        : 'unknown'
                  }
                  size="sm"
                />
              </div>
            </div>
          ))}
          <div class="overview-page__ingest-summary">
            <div class="overview-page__ingest-summary-grid">
              <div>丢弃：{displayMetric(ingestStatus.value.dropped)}</div>
              <div>延迟：{displayMetric(ingestStatus.value.delayed)}</div>
              <div>失败：{displayMetric(ingestStatus.value.failed)}</div>
            </div>
          </div>
        </div>
      )
    }

    const renderTrendWidget = (widget: OverviewPanelWidget<'trend'>) => {
      return renderTrendVisualization(widget)
    }

    const renderQuickPivot = (widget: OverviewPanelWidget<'quick-pivot'>) => {
      const entries = (widget.config.links || []).filter((item) => {
        if (item.visible === false) return false
        if (item.key === 'admin-ingestion' && !isAdminUser.value) return false
        return true
      })
      return entries.length ? (
        <div class="overview-page__pivot-grid">
          {entries.map((entry) => (
            <div
              key={entry.key}
              class="overview-page__pivot-card"
              onClick={() =>
                router.push({
                  path: getRouteForQuickPivot(entry.key),
                  query: { timeRange: timeStore.timeRange, scope: datasetScope.value }
                })
              }>
              <div class="overview-page__pivot-title">{getQuickPivotLabel(entry.key)}</div>
              <div class="overview-page__pivot-desc">从 Overview 快速进入对应调查链路。</div>
            </div>
          ))}
        </div>
      ) : (
        <NEmpty description="当前没有可见快捷入口" class="overview-page__pivot-empty" />
      )
    }

    const renderFutureWidget = (widget: OverviewPanelWidget) => (
      <NEmpty description={`${widget.title} 当前暂无可显示数据。`} class="overview-page__future-empty" />
    )

    const renderOverviewSkeleton = () => {
      const skeletonCards = [
        { key: 'hero', size: 'L', lines: 4, chart: true },
        { key: 'health', size: 'S', lines: 3, chart: false },
        { key: 'latency', size: 'S', lines: 3, chart: false },
        { key: 'trend', size: 'M', lines: 3, chart: true },
        { key: 'incidents', size: 'M', lines: 5, chart: false },
        { key: 'ingest', size: 'S', lines: 4, chart: false }
      ] as const

      return (
        <div class="overview-page__skeleton" aria-busy="true" aria-label="看板数据加载中">
          <div class="overview-page__skeleton-header">
            <div>
              <div class="overview-page__skeleton-kicker" />
              <div class="overview-page__skeleton-title" />
            </div>
            <div class="overview-page__skeleton-status">
              <span />
              正在并行加载指标、服务与卡片数据
            </div>
          </div>
          <div class="overview-page__masonry-grid overview-page__skeleton-grid">
            {skeletonCards.map((card) => (
              <div
                key={card.key}
                class="overview-page__grid-item"
                style={{ gridColumn: getWidgetMasonrySpan(card.size as OverviewWidgetSize) }}>
                <div
                  class={['overview-page__skeleton-card', `overview-page__skeleton-card--${card.size.toLowerCase()}`]}>
                  <div class="overview-page__skeleton-card-top">
                    <div class="overview-page__skeleton-card-title" />
                    <div class="overview-page__skeleton-pill" />
                  </div>
                  <div class="overview-page__skeleton-card-subtitle" />
                  {card.chart ? (
                    <div class="overview-page__skeleton-chart">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                  <div class="overview-page__skeleton-lines">
                    {Array.from({ length: card.lines }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    const renderWidgetBody = (widget: OverviewPanelWidget) => {
      const runtimeSupport = buildOverviewWidgetQueryPreviewSpec({
        widget,
        scope: datasetScope.value,
        scopedServiceName: scopeValue.value.service,
        services: services.value
      })
      if (runtimeSupport.supported) {
        return renderQueryDrivenWidget(widget, runtimeSupport.query)
      }

      switch (widget.kind) {
        case 'metric-summary':
          return renderMetricSummary(widget as OverviewPanelWidget<'metric-summary'>)
        case 'trend':
          return renderTrendWidget(widget as OverviewPanelWidget<'trend'>)
        case 'risk-service':
          return renderRiskService(widget as OverviewPanelWidget<'risk-service'>)
        case 'incident':
          return renderIncidentList(widget as OverviewPanelWidget<'incident'>)
        case 'ingest-status':
          return renderIngestStatus(widget as OverviewPanelWidget<'ingest-status'>)
        case 'quick-pivot':
          return renderQuickPivot(widget as OverviewPanelWidget<'quick-pivot'>)
        default:
          return renderFutureWidget(widget)
      }
    }

    const metricKeyOptions = computed(() => kpiCards.value.map((item) => ({ label: item.label, value: item.key })))
    const widgetTypeOptions = computed(() =>
      overviewWidgetCatalog
        .filter((item) => {
          const capability = capabilityMap.value.get(item.capability)
          return capability?.available && item.frontendReady
        })
        .map((item) => ({ label: `${item.label} · ${item.description}`, value: item.kind }))
    )
    const currentWidgetCatalogMeta = computed(
      () => overviewWidgetCatalog.find((item) => item.kind === widgetEditorDraft.value.kind) || overviewWidgetCatalog[0]
    )
    const metricSummaryDraft = computed(() => widgetEditorDraft.value.config as MetricSummaryConfig)
    const riskServiceDraft = computed(() => widgetEditorDraft.value.config as RiskServiceConfig)
    const incidentDraft = computed(() => widgetEditorDraft.value.config as IncidentConfig)
    const ingestDraft = computed(() => widgetEditorDraft.value.config as IngestStatusConfig)
    const trendDraft = computed(() => widgetEditorDraft.value.config as TrendConfig)
    const quickPivotDraft = computed(() => widgetEditorDraft.value.config as QuickPivotConfig)
    const darwinSummaryDraft = computed(() => widgetEditorDraft.value.config as DarwinInfraSummaryConfig)
    const darwinTrendDraft = computed(() => widgetEditorDraft.value.config as DarwinInfraTrendConfig)
    const darwinInstanceDraft = computed(() => widgetEditorDraft.value.config as DarwinInstanceTableConfig)

    onMounted(async () => {
      document.addEventListener('visibilitychange', handleOverviewVisibilityChange)
      window.addEventListener('resize', handleWidgetMasonryResize)
      isRestoringOverviewState.value = true
      await Promise.all([restoreSavedDefaultView(), restorePanelState(), restoreAutoRefreshState()])
      await nextTick()
      layoutWidgetMasonry()
      isRestoringOverviewState.value = false
      loadOverview()
      loadMetricsSchemaForRoutePrefill()
    })

    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handleOverviewVisibilityChange)
      window.removeEventListener('resize', handleWidgetMasonryResize)
      clearOverviewAutoRefresh()
      detachReorderListeners()
      clearReorderState()
    })

    watch(
      () => [timeStore.timeRange, activePanelId.value],
      () => {
        if (isRestoringOverviewState.value) return
        loadOverview()
      }
    )

    watch(
      () => datasetScope.value,
      () => {
        if (isRestoringOverviewState.value) return
        loadOverview()
      }
    )

    watch(
      () => [autoRefreshSetting.value, timeStore.isLive, timeStore.timeRange, pageVisible.value],
      () => {
        syncOverviewAutoRefresh()
      }
    )

    watch(
      () => editMode.value,
      (nextEditMode) => {
        if (nextEditMode) return
        detachReorderListeners()
        clearReorderState()
      }
    )

    watch(
      () => currentPanelEditable.value,
      (editable) => {
        if (!editable && editMode.value) {
          editMode.value = false
        }
        if (editable) openCreateWidgetFromRoutePrefill()
      }
    )

    watch(
      () => [
        metricsSchemaItems.value.length,
        metricsSchemaSource.value,
        route.query.startAdd,
        route.query.prefillMetric
      ],
      () => openCreateWidgetFromRoutePrefill()
    )

    watch(
      () =>
        currentVisibleWidgets.value.map((widget) => `${widget.id}:${widget.size}`).join('|') +
        `:${editMode.value}:${loading.value}`,
      async () => {
        await nextTick()
        layoutWidgetMasonry()
      }
    )

    watch(
      () => showWidgetEditor.value,
      (visible) => {
        if (visible) {
          if (widgetEditorDraft.value.kind === 'query-card') {
            fetchMetricsSchema({
              scope: datasetScope.value,
              serviceId: queryCardDraft.value.subject?.id || undefined
            })
              .then((payload) => {
                const result = loadMetricsCatalogFallback(payload)
                metricsSchemaItems.value = result.items
                metricsSchemaSource.value = result.source
              })
              .catch(() => {
                metricsSchemaItems.value = []
                metricsSchemaSource.value = 'unavailable'
              })
          }
          return
        }
        resetEditorAssistState()
        editorDiscoveryKeyword.value = ''
      }
    )

    watch(
      () => widgetEditorDraft.value.kind,
      () => {
        editorDiscoveryKeyword.value = ''
        if (widgetEditorDraft.value.kind !== 'query-card') {
          metricsSchemaItems.value = []
        }
      }
    )

    const renderDarwinWidgetSettings = () => {
      if (widgetEditorDraft.value.kind === 'darwin-infra-summary') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field">
              <span>资源指标</span>
              <NSelect
                value={darwinSummaryDraft.value.metric}
                options={darwinMetricOptions}
                onUpdateValue={(value: DarwinInfraMetricKey) =>
                  updateWidgetDraft({
                    config: { ...darwinSummaryDraft.value, metric: value } as DarwinInfraSummaryConfig,
                    editor: {
                      ...widgetEditorState.value,
                      displayedMetrics: [value]
                    }
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>目标服务</span>
              <NSelect
                value={darwinSummaryDraft.value.serviceId || null}
                clearable
                options={darwinServiceOptions.value}
                placeholder="未选择时跟随 Darwin 全局视角"
                onUpdateValue={(value: string | null) =>
                  updateWidgetDraft({
                    config: { ...darwinSummaryDraft.value, serviceId: value || undefined } as DarwinInfraSummaryConfig
                  })
                }
              />
            </label>
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'darwin-infra-trend') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field">
              <span>资源指标</span>
              <NSelect
                value={darwinTrendDraft.value.metric}
                options={darwinMetricOptions}
                onUpdateValue={(value: DarwinInfraMetricKey) =>
                  updateWidgetDraft({
                    config: { ...darwinTrendDraft.value, metric: value } as DarwinInfraTrendConfig,
                    editor: {
                      ...widgetEditorState.value,
                      displayedMetrics: [value]
                    }
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>目标服务</span>
              <NSelect
                value={darwinTrendDraft.value.serviceId || null}
                clearable
                options={darwinServiceOptions.value}
                placeholder="未选择时跟随 Darwin 全局视角"
                onUpdateValue={(value: string | null) =>
                  updateWidgetDraft({
                    config: { ...darwinTrendDraft.value, serviceId: value || undefined } as DarwinInfraTrendConfig
                  })
                }
              />
            </label>
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'darwin-instance-table') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field">
              <span>目标服务</span>
              <NSelect
                value={darwinInstanceDraft.value.serviceId || null}
                options={darwinServiceOptions.value}
                placeholder="请选择要查看实例资源的服务"
                onUpdateValue={(value: string | null) =>
                  updateWidgetDraft({
                    config: { ...darwinInstanceDraft.value, serviceId: value || undefined } as DarwinInstanceTableConfig
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>排序方式</span>
              <NSelect
                value={darwinInstanceDraft.value.sortBy || 'cpu'}
                options={darwinMetricOptions}
                onUpdateValue={(value: DarwinInfraMetricKey) =>
                  updateWidgetDraft({
                    config: { ...darwinInstanceDraft.value, sortBy: value } as DarwinInstanceTableConfig
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>实例上限</span>
              <NInputNumber
                value={darwinInstanceDraft.value.limit || 6}
                min={3}
                max={20}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: { ...darwinInstanceDraft.value, limit: value || 6 } as DarwinInstanceTableConfig
                  })
                }
              />
            </label>
          </div>
        )
      }

      return null
    }

    const renderNonQueryWidgetSettings = () => {
      if (widgetEditorDraft.value.kind === 'query-card') {
        return (
          <div class="overview-page__query-builder-flow">
            <div class="overview-page__query-mode-grid">
              <button
                type="button"
                class={['overview-page__query-mode-card', queryEditMode.value === 'form-builder' ? 'is-active' : '']}
                onClick={() => switchQueryEditMode('form-builder')}>
                <span class="overview-page__query-mode-kicker">Guided</span>
                <strong>表单组装</strong>
                <span>按指标、对象、聚合和分组一步步生成开放查询卡。</span>
                <em>适合新用户和标准监控卡片</em>
              </button>
              <button
                type="button"
                class={[
                  'overview-page__query-mode-card',
                  'overview-page__query-mode-card--code',
                  queryEditMode.value === 'query-statement' ? 'is-active' : ''
                ]}
                onClick={() => switchQueryEditMode('query-statement')}>
                <span class="overview-page__query-mode-kicker">QuerySpec</span>
                <strong>查询语句</strong>
                <span>直接粘贴完整 QuerySpec JSON，保存时不会被表单反向改写。</span>
                <em>适合专业用户、复杂查询和复制已有配置</em>
              </button>
            </div>

            {queryEditMode.value === 'form-builder' ? (
              <>
                <div class="overview-page__query-builder-step">
                  <div class="overview-page__query-builder-step-header">
                    <span>1</span>
                    <div>
                      <div class="overview-page__editor-query-title">选择指标与查询范围</div>
                      <div class="overview-page__editor-query-subtitle">先决定查什么，再选择数据集和目标对象。</div>
                    </div>
                  </div>
                  <div class="overview-page__darwin-settings-grid">
                    <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
                      <span>指标标识</span>
                      <NSelect
                        value={queryCardDraft.value.metricRef}
                        options={queryMetricOptions.value}
                        filterable
                        clearable
                        placeholder={metricsSchemaSource.value === 'schema' ? '选择一个指标' : '例如 service.cpu.usage'}
                        onUpdateValue={(value: string | null) => updateQueryCardDraft({ metricRef: value || '' })}
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>数据范围</span>
                      <NSelect
                        value={queryCardDraft.value.scope}
                        options={queryScopeOptions.value}
                        onUpdateValue={(value: MetricsDatasetScope) => updateQueryCardDraft({ scope: value })}
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>数据来源</span>
                      <NSelect
                        value={queryCardDraft.value.sourceKind}
                        options={querySourceKindOptions.value}
                        onUpdateValue={(value: QuerySpec['sourceKind']) =>
                          updateQueryCardDraft({ sourceKind: value || 'auto' })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>目标对象</span>
                      <NSelect
                        value={queryCardDraft.value.subject?.type || 'system'}
                        options={querySubjectOptions}
                        onUpdateValue={(value: QuerySpec['subject']['type']) =>
                          updateQueryCardDraft({
                            subject:
                              value === 'service'
                                ? { type: 'service', id: queryCardDraft.value.subject?.id || '' }
                                : { type: 'system' }
                          })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>目标服务</span>
                      <NSelect
                        value={queryCardDraft.value.subject?.id || null}
                        clearable
                        options={darwinServiceOptions.value}
                        placeholder="当目标对象为服务时选择"
                        disabled={queryCardDraft.value.subject?.type === 'system'}
                        onUpdateValue={(value: string | null) =>
                          updateQueryCardDraft({
                            subject: {
                              ...(queryCardDraft.value.subject || { type: 'service' }),
                              id: value || undefined
                            }
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div class="overview-page__query-builder-step">
                  <div class="overview-page__query-builder-step-header">
                    <span>2</span>
                    <div>
                      <div class="overview-page__editor-query-title">设置计算方式</div>
                      <div class="overview-page__editor-query-subtitle">
                        选择聚合方式和可选分组字段，图表形态在展示设置中选择。
                      </div>
                    </div>
                  </div>
                  <div class="overview-page__darwin-settings-grid">
                    <label class="overview-page__darwin-settings-field">
                      <span>聚合方式</span>
                      <NSelect
                        value={queryCardDraft.value.aggregation}
                        options={queryAggregationOptionsResolved.value}
                        onUpdateValue={(value: QuerySpec['aggregation']) =>
                          updateQueryCardDraft({ aggregation: value })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
                      <span>分组字段</span>
                      <NInput
                        value={(queryCardDraft.value.groupBy || []).join(',')}
                        placeholder={
                          selectedQueryMetricSchema.value?.labelNames?.length
                            ? `可选：${selectedQueryMetricSchema.value.labelNames.join(', ')}`
                            : '多个字段用逗号分隔，例如 service,env'
                        }
                        onUpdate:value={(value: string) =>
                          updateQueryCardDraft({
                            groupBy: value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean)
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div class="overview-page__query-builder-step overview-page__query-display-rule-panel">
                  <div class="overview-page__query-builder-step-header">
                    <span>3</span>
                    <div>
                      <div class="overview-page__editor-query-title">展示与规则</div>
                      <div class="overview-page__editor-query-subtitle">
                        设置图表最大值和单位；启用阈值后，保存卡片会同步创建或更新告警规则。
                      </div>
                    </div>
                  </div>
                  <div class="overview-page__darwin-settings-grid">
                    <label class="overview-page__darwin-settings-field">
                      <span>最小值</span>
                      <NInputNumber
                        value={queryCardDraft.value.display?.value?.min ?? null}
                        placeholder="自动"
                        clearable
                        onUpdateValue={(value: number | null) =>
                          updateQueryDisplayValueDraft({ min: typeof value === 'number' ? value : undefined })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>最大值</span>
                      <NInputNumber
                        value={queryCardDraft.value.display?.value?.max ?? null}
                        placeholder="例如 100"
                        clearable
                        onUpdateValue={(value: number | null) =>
                          updateQueryDisplayValueDraft({ max: typeof value === 'number' ? value : undefined })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>展示单位</span>
                      <NSelect
                        value={queryCardDraft.value.display?.value?.unit || ''}
                        options={queryDisplayUnitOptions}
                        tag
                        clearable
                        placeholder="例如 % / ms"
                        onUpdateValue={(value: string | null) => {
                          const unit = value || ''
                          updateQueryDisplayValueDraft({ unit })
                          if (queryCardDraft.value.alert?.enabled) updateQueryAlertDraft({ unit })
                        }}
                      />
                    </label>
                  </div>
                  {queryCardDraft.value.visualizationHint === 'number' ? (
                    <div class="overview-page__query-compare-panel">
                      <div class="overview-page__query-compare-toggle-row">
                        <NSwitch
                          value={Boolean(
                            queryCardDraft.value.compare &&
                            normalizeQueryCompareConfig(queryCardDraft.value.compare).enabled
                          )}
                          onUpdateValue={(value: boolean) =>
                            value
                              ? updateQueryCompareDraft({ enabled: true })
                              : updateQueryCardDraft({ compare: undefined })
                          }
                        />
                        <div>
                          <strong>对比时间段</strong>
                          <span>仅数值卡支持趋势徽章，会展示在数值与单位同一行右侧。</span>
                        </div>
                      </div>
                      {queryCardDraft.value.compare ? (
                        <div class="overview-page__query-compare-grid">
                          <label class="overview-page__darwin-settings-field">
                            <span>对比窗口</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryCardDraft.value.compare).mode}
                              options={queryCompareModeOptions}
                              onUpdateValue={(value: 'previous-period' | 'previous-day' | 'previous-week') =>
                                updateQueryCompareDraft({ mode: value })
                              }
                            />
                          </label>
                          <label class="overview-page__darwin-settings-field">
                            <span>展示方式</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryCardDraft.value.compare).display}
                              options={queryCompareDisplayOptions}
                              onUpdateValue={(value: 'relative' | 'absolute' | 'both') =>
                                updateQueryCompareDraft({ display: value })
                              }
                            />
                          </label>
                          <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
                            <span>趋势语义</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryCardDraft.value.compare).directionality}
                              options={queryCompareDirectionalityOptions}
                              onUpdateValue={(value: 'increase_better' | 'decrease_better' | 'neutral') =>
                                updateQueryCompareDraft({ directionality: value })
                              }
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div class="overview-page__query-alert-toggle-row">
                    <NSwitch
                      value={Boolean(queryCardDraft.value.alert?.enabled)}
                      onUpdateValue={(value: boolean) => setQueryAlertEnabled(value, 'form-builder')}
                    />
                    <div>
                      <strong>告警阈值</strong>
                      <span>超过阈值后触发告警，并按选择的渠道发送通知。</span>
                    </div>
                  </div>
                  {queryCardDraft.value.alert?.enabled
                    ? renderQueryAlertRulesEditor(queryCardDraft.value, 'form-builder')
                    : null}
                </div>
              </>
            ) : (
              <div class="overview-page__query-script-editor">
                <div class="overview-page__editor-query-header">
                  <div>
                    <div class="overview-page__editor-query-title">QuerySpec JSON</div>
                    <div class="overview-page__editor-query-subtitle">
                      保存的是完整查询语句；切回表单前不会自动拆解覆盖字段。
                    </div>
                  </div>
                  <NButton size="small" ghost onClick={() => replaceRawQueryScript(queryCardDraft.value)}>
                    从当前表单生成模板
                  </NButton>
                </div>
                <NInput
                  type="textarea"
                  autosize={{ minRows: 10, maxRows: 18 }}
                  value={editorRawQueryScript.value}
                  onUpdate:value={(value: string) => (editorRawQueryScript.value = value)}
                  placeholder="粘贴 QuerySpec、{ query } 或 { config: { query } }"
                />
                <div class="overview-page__query-required-fields">
                  <span>必须包含：</span>
                  <code>scope</code>
                  <code>subject</code>
                  <code>metricRef</code>
                  <code>aggregation</code>
                  <code>timeRange</code>
                </div>
                <div class="overview-page__query-builder-step overview-page__query-display-rule-panel">
                  <div class="overview-page__query-builder-step-header">
                    <span>3</span>
                    <div>
                      <div class="overview-page__editor-query-title">展示与规则</div>
                      <div class="overview-page__editor-query-subtitle">
                        这里会直接改写上方 QuerySpec JSON 的 display 和 alert 字段，保存查询语句时一并生效。
                      </div>
                    </div>
                  </div>
                  <div class="overview-page__darwin-settings-grid">
                    <label class="overview-page__darwin-settings-field">
                      <span>最小值</span>
                      <NInputNumber
                        value={queryStatementDraft.value.display?.value?.min ?? null}
                        placeholder="自动"
                        clearable
                        onUpdateValue={(value: number | null) =>
                          updateRawQueryDisplayValueDraft({ min: typeof value === 'number' ? value : undefined })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>最大值</span>
                      <NInputNumber
                        value={queryStatementDraft.value.display?.value?.max ?? null}
                        placeholder="例如 100"
                        clearable
                        onUpdateValue={(value: number | null) =>
                          updateRawQueryDisplayValueDraft({ max: typeof value === 'number' ? value : undefined })
                        }
                      />
                    </label>
                    <label class="overview-page__darwin-settings-field">
                      <span>展示单位</span>
                      <NSelect
                        value={queryStatementDraft.value.display?.value?.unit || ''}
                        options={queryDisplayUnitOptions}
                        tag
                        clearable
                        placeholder="例如 % / ms"
                        onUpdateValue={(value: string | null) => {
                          const unit = value || ''
                          updateRawQueryDisplayValueDraft({ unit })
                          if (queryStatementDraft.value.alert?.enabled) updateRawQueryAlertDraft({ unit })
                        }}
                      />
                    </label>
                  </div>
                  {queryStatementDraft.value.visualizationHint === 'number' ? (
                    <div class="overview-page__query-compare-panel">
                      <div class="overview-page__query-compare-toggle-row">
                        <NSwitch
                          value={Boolean(
                            queryStatementDraft.value.compare &&
                            normalizeQueryCompareConfig(queryStatementDraft.value.compare).enabled
                          )}
                          onUpdateValue={(value: boolean) =>
                            value
                              ? updateRawQueryCompareDraft({ enabled: true })
                              : updateRawQueryScript((query) => ({ ...query, compare: undefined }))
                          }
                        />
                        <div>
                          <strong>对比时间段</strong>
                          <span>直接写入 QuerySpec compare 字段，仅数值卡展示趋势徽章。</span>
                        </div>
                      </div>
                      {queryStatementDraft.value.compare ? (
                        <div class="overview-page__query-compare-grid">
                          <label class="overview-page__darwin-settings-field">
                            <span>对比窗口</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryStatementDraft.value.compare).mode}
                              options={queryCompareModeOptions}
                              onUpdateValue={(value: 'previous-period' | 'previous-day' | 'previous-week') =>
                                updateRawQueryCompareDraft({ mode: value })
                              }
                            />
                          </label>
                          <label class="overview-page__darwin-settings-field">
                            <span>展示方式</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryStatementDraft.value.compare).display}
                              options={queryCompareDisplayOptions}
                              onUpdateValue={(value: 'relative' | 'absolute' | 'both') =>
                                updateRawQueryCompareDraft({ display: value })
                              }
                            />
                          </label>
                          <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
                            <span>趋势语义</span>
                            <NSelect
                              value={normalizeQueryCompareConfig(queryStatementDraft.value.compare).directionality}
                              options={queryCompareDirectionalityOptions}
                              onUpdateValue={(value: 'increase_better' | 'decrease_better' | 'neutral') =>
                                updateRawQueryCompareDraft({ directionality: value })
                              }
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div class="overview-page__query-alert-toggle-row">
                    <NSwitch
                      value={Boolean(queryStatementDraft.value.alert?.enabled)}
                      onUpdateValue={(value: boolean) => setQueryAlertEnabled(value, 'query-statement')}
                    />
                    <div>
                      <strong>告警阈值</strong>
                      <span>超过阈值后触发告警，并按选择的渠道发送通知。</span>
                    </div>
                  </div>
                  {queryStatementDraft.value.alert?.enabled
                    ? renderQueryAlertRulesEditor(queryStatementDraft.value, 'query-statement')
                    : null}
                </div>
              </div>
            )}
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'risk-service') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field">
              <span>展示数量</span>
              <NInputNumber
                value={riskServiceDraft.value.limit || 6}
                min={1}
                max={12}
                onUpdateValue={(value) =>
                  updateWidgetDraft({ config: { ...riskServiceDraft.value, limit: value || 6 } as RiskServiceConfig })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>环境</span>
              <NInput
                value={riskServiceDraft.value.env || ''}
                placeholder="可选，如 prod"
                onUpdate:value={(value: string) =>
                  updateWidgetDraft({
                    config: { ...riskServiceDraft.value, env: value || undefined } as RiskServiceConfig
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>团队</span>
              <NInput
                value={riskServiceDraft.value.team || ''}
                placeholder="可选，如 core-platform"
                onUpdate:value={(value: string) =>
                  updateWidgetDraft({
                    config: { ...riskServiceDraft.value, team: value || undefined } as RiskServiceConfig
                  })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>筛选标签</span>
              <NCheckboxGroup
                value={riskServiceDraft.value.tags || []}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: { ...riskServiceDraft.value, tags: value as string[] } as RiskServiceConfig
                  })
                }>
                <div class="overview-page__editor-choice-list">
                  {[
                    { label: '高风险', value: 'high-risk' },
                    { label: '最近退化', value: 'degraded' }
                  ].map((option) => (
                    <label key={option.value} class="overview-page__editor-choice-tile">
                      <NCheckbox value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'incident') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field">
              <span>展示数量</span>
              <NInputNumber
                value={incidentDraft.value.limit || 5}
                min={1}
                max={12}
                onUpdateValue={(value) =>
                  updateWidgetDraft({ config: { ...incidentDraft.value, limit: value || 5 } as IncidentConfig })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field">
              <span>环境</span>
              <NInput
                value={incidentDraft.value.env || ''}
                placeholder="可选，如 prod"
                onUpdate:value={(value: string) =>
                  updateWidgetDraft({ config: { ...incidentDraft.value, env: value || undefined } as IncidentConfig })
                }
              />
            </label>
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>事件级别</span>
              <NCheckboxGroup
                value={incidentDraft.value.severity || []}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: { ...incidentDraft.value, severity: value as OverviewSeverity[] } as IncidentConfig
                  })
                }>
                <div class="overview-page__editor-choice-list">
                  {severityOptions.map((option) => (
                    <label key={option.value} class="overview-page__editor-choice-tile">
                      <NCheckbox value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>事件来源</span>
              <NCheckboxGroup
                value={incidentDraft.value.source || []}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: { ...incidentDraft.value, source: value as OverviewIncidentSource[] } as IncidentConfig
                  })
                }>
                <div class="overview-page__editor-choice-list">
                  {incidentSourceOptions.map((option) => (
                    <label key={option.value} class="overview-page__editor-choice-tile">
                      <NCheckbox value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'ingest-status') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>采集来源</span>
              <NCheckboxGroup
                value={ingestDraft.value.source || []}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: { ...ingestDraft.value, source: value as OverviewIngestSource[] } as IngestStatusConfig
                  })
                }>
                <div class="overview-page__editor-choice-list">
                  {ingestSourceOptions.map((option) => (
                    <label key={option.value} class="overview-page__editor-choice-tile">
                      <NCheckbox value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
          </div>
        )
      }

      if (widgetEditorDraft.value.kind === 'quick-pivot') {
        return (
          <div class="overview-page__darwin-settings-grid">
            <label class="overview-page__darwin-settings-field overview-page__darwin-settings-field--full">
              <span>可见入口</span>
              <NCheckboxGroup
                value={(quickPivotDraft.value.links || [])
                  .filter((item) => item.visible !== false)
                  .map((item) => item.key)}
                onUpdateValue={(value) =>
                  updateWidgetDraft({
                    config: {
                      ...quickPivotDraft.value,
                      links: quickPivotOptions.map((option) => ({
                        key: option.value,
                        visible: (value as string[]).includes(option.value)
                      }))
                    } as QuickPivotConfig
                  })
                }>
                <div class="overview-page__editor-choice-list">
                  {quickPivotOptions.map((option) => (
                    <label key={option.value} class="overview-page__editor-choice-tile">
                      <NCheckbox value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
          </div>
        )
      }

      return null
    }

    const renderEditorPreviewBody = () => {
      if (editorPreviewLoading.value) {
        return (
          <div class="overview-page__editor-query-loading">
            <NSpin size="small" />
          </div>
        )
      }

      if (editorPreviewError.value) {
        return <NEmpty description={editorPreviewError.value} class="overview-page__editor-query-empty" />
      }

      if (!editorPreviewData.value) {
        return <NEmpty description="点击“预览查询”后查看当前卡片数据效果" class="overview-page__editor-query-empty" />
      }

      if (editorPreviewData.value.kind === 'number') {
        return currentEditorQuerySupport.value.query?.visualizationHint === 'donut' ? (
          <GaugeChart
            value={typeof editorPreviewData.value.value === 'number' ? editorPreviewData.value.value : 0}
            color="var(--color-primary-6)"
            height="220px"
            loading={editorPreviewLoading.value}
          />
        ) : (
          <NStatistic
            label={widgetEditorDraft.value.title || '当前值'}
            value={editorPreviewData.value.value ?? '未知'}
          />
        )
      }

      if (editorPreviewData.value.kind === 'timeseries') {
        const display = resolveQueryDisplayValue(currentEditorQuerySupport.value.query, editorPreviewData.value)
        const thresholdLines = resolveQueryThresholdLines(currentEditorQuerySupport.value.query)
        return currentEditorQuerySupport.value.query?.visualizationHint === 'bar' ? (
          <BarChart
            data={(editorPreviewData.value.series?.[0]?.points || []).map((point: any) => ({
              name: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: point.value
            }))}
            height="220px"
            variant="monitor"
            yAxisMin={display.min}
            yAxisMax={display.max}
            yAxisUnit={display.unit}
          />
        ) : (
          <LineChart
            series={(editorPreviewData.value.series || []).map((series: any) => ({
              name: series.name,
              data: series.points
            }))}
            title=""
            height="220px"
            area={currentEditorQuerySupport.value.query?.visualizationHint === 'line'}
            variant="monitor"
            showLegend
            yAxisMin={display.min}
            yAxisMax={display.max}
            yAxisUnit={display.unit}
            thresholdLines={thresholdLines}
          />
        )
      }

      if (editorPreviewData.value.kind === 'distribution') {
        return currentEditorQuerySupport.value.query?.visualizationHint === 'bar' ? (
          <BarChart data={editorPreviewData.value.items || []} height="220px" variant="monitor" />
        ) : (
          <PieChart data={editorPreviewData.value.items || []} height="220px" variant="monitor" />
        )
      }

      if (editorPreviewData.value.kind === 'table') {
        return (
          <NList>
            {(editorPreviewData.value.rows || []).slice(0, 5).map((row: any, index: number) => (
              <NListItem key={`${index}`}>
                <div>{JSON.stringify(row)}</div>
              </NListItem>
            ))}
          </NList>
        )
      }

      return <NEmpty description="当前预览结果暂不支持直接展示" class="overview-page__editor-query-empty" />
    }

    const resetEditorAssistState = () => {
      editorPreviewLoading.value = false
      editorPreviewData.value = null
      editorPreviewError.value = ''
      editorAdvancedMode.value = false
      editorCompiledScript.value = ''
      editorRawQueryScript.value = ''
      editorScriptLanguage.value = 'queryspec-json'
      editorScriptValidation.value = null
      editorScriptLoading.value = false
    }

    const currentEditorQuerySupport = computed(() => {
      if (widgetEditorDraft.value.kind === 'query-card' && queryEditMode.value === 'query-statement') {
        const parsed = parseQuerySpecJson(editorRawQueryScript.value)
        return parsed.query
          ? { supported: true, query: parsed.query }
          : { supported: false, reason: parsed.issues[0] || 'QuerySpec JSON 未通过解析' }
      }

      return buildOverviewWidgetQueryPreviewSpec({
        widget: normalizeEditorState(widgetEditorDraft.value),
        scope: datasetScope.value,
        scopedServiceName: scopeValue.value.service,
        services: services.value
      })
    })
    const currentEditorQuerySignature = computed(() => JSON.stringify(currentEditorQuerySupport.value))

    watch(
      () => [showWidgetEditor.value, widgetEditorDraft.value.id, queryEditMode.value],
      () => {
        if (
          showWidgetEditor.value &&
          widgetEditorDraft.value.kind === 'query-card' &&
          !editorRawQueryScript.value.trim()
        ) {
          editorRawQueryScript.value = JSON.stringify(
            { type: 'queryspec', version: 1, query: queryCardDraft.value },
            null,
            2
          )
        }
      }
    )

    watch(
      () => currentEditorQuerySignature.value,
      () => {
        editorPreviewData.value = null
        editorPreviewError.value = ''
        editorScriptValidation.value = null
        editorCompiledScript.value = ''
      }
    )

    const runEditorPreview = async () => {
      const support = currentEditorQuerySupport.value
      const querySignature = currentEditorQuerySignature.value
      editorPreviewLoading.value = true
      editorPreviewError.value = ''
      try {
        if (!support.supported || !support.query) {
          editorPreviewData.value = null
          editorPreviewError.value = support.reason || '当前卡片暂不支持查询预览'
          return
        }

        const result = await previewMetricCard(support.query, support.query.scope || datasetScope.value)
        if (querySignature !== currentEditorQuerySignature.value) return
        editorPreviewData.value = result.data || null
        if (!result.data) {
          editorPreviewError.value = result.supported
            ? '预览接口已返回，但当前没有可展示的数据'
            : '当前环境未提供专用预览接口，已尝试查询网关回退'
        }
      } catch (error) {
        console.error('Failed to run overview widget preview:', error)
        if (querySignature !== currentEditorQuerySignature.value) return
        editorPreviewData.value = null
        editorPreviewError.value = '预览失败，请稍后重试'
      } finally {
        editorPreviewLoading.value = false
      }
    }

    const runEditorAdvancedInspection = async () => {
      const support = currentEditorQuerySupport.value
      const querySignature = currentEditorQuerySignature.value
      editorScriptLoading.value = true
      try {
        if (!support.supported || !support.query) {
          editorScriptValidation.value = {
            valid: false,
            issues: [support.reason || '当前卡片暂不支持脚本模式'],
            supported: false
          }
          editorCompiledScript.value = JSON.stringify(
            {
              type: 'queryspec',
              version: 1,
              widgetKind: widgetEditorDraft.value.kind,
              reason: support.reason || 'unsupported'
            },
            null,
            2
          )
          editorScriptLanguage.value = 'queryspec-json'
          return
        }

        const [validateResult, compileResult] = await Promise.all([
          validateMetricQuery(support.query, datasetScope.value),
          compileMetricQuery(support.query, datasetScope.value)
        ])

        if (querySignature !== currentEditorQuerySignature.value) return

        editorScriptValidation.value = {
          valid: validateResult.valid,
          issues: validateResult.issues,
          supported: validateResult.supported
        }
        editorCompiledScript.value = compileResult.script
        editorScriptLanguage.value = compileResult.language
      } catch (error) {
        console.error('Failed to inspect overview widget script mode:', error)
        if (querySignature !== currentEditorQuerySignature.value) return
        editorScriptValidation.value = {
          valid: false,
          issues: ['脚本校验失败，请稍后重试'],
          supported: false
        }
        editorCompiledScript.value = support.query
          ? JSON.stringify({ type: 'queryspec', query: support.query }, null, 2)
          : ''
        editorScriptLanguage.value = 'queryspec-json'
      } finally {
        editorScriptLoading.value = false
      }
    }

    const applyEditorJsonConfiguration = () => {
      if (widgetEditorDraft.value.kind !== 'query-card') {
        editorScriptValidation.value = {
          valid: false,
          issues: ['只有开放查询卡支持应用 QuerySpec JSON'],
          supported: false
        }
        return
      }

      const result = parseQuerySpecJson(editorCompiledScript.value)
      if (!result.query) {
        editorScriptValidation.value = { valid: false, issues: result.issues, supported: false }
        return
      }

      updateWidgetDraft({
        config: {
          query: result.query
        } as QueryWidgetConfig,
        editor: {
          ...widgetEditorState.value,
          timeRange: String(result.query.timeRange || '-1h').replace(/^-/, '') as OverviewWidgetEditorTimeRange,
          visualization: result.query.visualizationHint || widgetEditorState.value.visualization
        }
      })
      editorCompiledScript.value = JSON.stringify({ type: 'queryspec', version: 1, query: result.query }, null, 2)
      editorScriptLanguage.value = 'queryspec-json'
      editorScriptValidation.value = {
        valid: true,
        issues: ['JSON 配置已应用到开放查询卡，可继续预览或保存。'],
        supported: false
      }
      editorPreviewData.value = null
      editorPreviewError.value = ''
      message.success('JSON 配置已应用')
    }

    const renderEditorQueryAssist = () => {
      const support = currentEditorQuerySupport.value

      return (
        <div class="overview-page__editor-query-assist">
          <div class="overview-page__editor-query-panel">
            <div class="overview-page__editor-query-header">
              <div>
                <div class="overview-page__editor-query-title">单卡预览</div>
                <div class="overview-page__editor-query-subtitle">通过查询网关预览当前卡片配置对应的数据形态。</div>
              </div>
              <NButton
                size="small"
                type="primary"
                ghost
                onClick={runEditorPreview}
                loading={editorPreviewLoading.value}>
                预览查询
              </NButton>
            </div>
            {support.supported || editorPreviewLoading.value || editorPreviewError.value ? (
              <div class="overview-page__editor-query-preview-body">{renderEditorPreviewBody()}</div>
            ) : (
              <NEmpty
                description={
                  support.supported
                    ? '点击“预览查询”后查看当前卡片数据效果'
                    : support.reason || '当前卡片暂不支持查询预览'
                }
                class="overview-page__editor-query-empty"
              />
            )}
          </div>

          {isAdminUser.value ? (
            <div class="overview-page__editor-query-panel">
              <div class="overview-page__editor-query-header">
                <div>
                  <div class="overview-page__editor-query-title">高级模式</div>
                  <div class="overview-page__editor-query-subtitle">
                    管理员可编辑 QuerySpec JSON，应用后会回填开放查询卡配置。
                  </div>
                </div>
                <NButton size="small" onClick={() => (editorAdvancedMode.value = !editorAdvancedMode.value)}>
                  {editorAdvancedMode.value ? '收起高级模式' : '展开高级模式'}
                </NButton>
              </div>
              {editorAdvancedMode.value ? (
                <div class="overview-page__editor-script-body">
                  <div class="overview-page__editor-script-actions">
                    <NButton
                      size="small"
                      type="primary"
                      ghost
                      onClick={runEditorAdvancedInspection}
                      loading={editorScriptLoading.value}>
                      编译并校验
                    </NButton>
                    {widgetEditorDraft.value.kind === 'query-card' ? (
                      <NButton size="small" ghost onClick={applyEditorJsonConfiguration}>
                        应用 JSON 配置
                      </NButton>
                    ) : null}
                  </div>
                  <div class="overview-page__editor-script-status-row">
                    <NTag
                      size="small"
                      bordered={false}
                      type={editorScriptValidation.value?.valid ? 'success' : 'warning'}>
                      {editorScriptValidation.value?.valid ? '校验通过' : '待校验 / 存在问题'}
                    </NTag>
                    {editorScriptValidation.value ? (
                      <NTag
                        size="small"
                        bordered={false}
                        type={editorScriptValidation.value.supported ? 'info' : 'default'}>
                        {editorScriptValidation.value.supported ? '服务端校验' : '本地校验回退'}
                      </NTag>
                    ) : null}
                  </div>
                  {editorScriptValidation.value?.issues?.length ? (
                    <div class="overview-page__editor-script-issues">
                      {editorScriptValidation.value.issues.map((issue) => (
                        <div key={issue}>{issue}</div>
                      ))}
                    </div>
                  ) : null}
                  <NInput
                    type="textarea"
                    autosize={{ minRows: 8, maxRows: 14 }}
                    value={editorCompiledScript.value}
                    onUpdate:value={(value: string) => (editorCompiledScript.value = value)}
                    placeholder="可粘贴 QuerySpec、{ query } 或 { config: { query } }，再点击“应用 JSON 配置”"
                  />
                  <div class="overview-page__editor-script-language">当前语言：{editorScriptLanguage.value}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    }

    const applyDiscoveredMetricToEditor = (preset: OverviewMetricDiscoveryPreset) => {
      const currentTitle = widgetEditorDraft.value.title.trim()
      const defaultLabel = overviewWidgetCatalog.find((item) => item.kind === widgetEditorDraft.value.kind)?.label || ''
      const nextTitle = !currentTitle || currentTitle === defaultLabel ? preset.title : widgetEditorDraft.value.title

      if (widgetEditorDraft.value.kind === 'metric-summary') {
        updateWidgetDraft({
          title: nextTitle,
          config: {
            ...(metricSummaryDraft.value as MetricSummaryConfig),
            ...(preset.configPatch as Partial<MetricSummaryConfig>)
          } as MetricSummaryConfig,
          editor: {
            ...widgetEditorState.value,
            displayedMetrics: preset.displayedMetrics
          }
        })
        return
      }

      if (widgetEditorDraft.value.kind === 'trend') {
        updateWidgetDraft({
          title: nextTitle,
          config: {
            ...(trendDraft.value as TrendConfig),
            ...(preset.configPatch as Partial<TrendConfig>)
          } as TrendConfig,
          editor: {
            ...widgetEditorState.value,
            displayedMetrics: preset.displayedMetrics
          }
        })
        return
      }

      if (widgetEditorDraft.value.kind === 'darwin-infra-summary') {
        updateWidgetDraft({
          title: nextTitle,
          config: {
            ...(darwinSummaryDraft.value as DarwinInfraSummaryConfig),
            ...(preset.configPatch as Partial<DarwinInfraSummaryConfig>)
          } as DarwinInfraSummaryConfig,
          editor: {
            ...widgetEditorState.value,
            displayedMetrics: preset.displayedMetrics
          }
        })
        return
      }

      if (widgetEditorDraft.value.kind === 'darwin-infra-trend') {
        updateWidgetDraft({
          title: nextTitle,
          config: {
            ...(darwinTrendDraft.value as DarwinInfraTrendConfig),
            ...(preset.configPatch as Partial<DarwinInfraTrendConfig>)
          } as DarwinInfraTrendConfig,
          editor: {
            ...widgetEditorState.value,
            displayedMetrics: preset.displayedMetrics
          }
        })
      }
    }

    const renderQueryMetricCatalogBrowser = () => {
      if (widgetEditorDraft.value.kind !== 'query-card') return null

      return (
        <div class="overview-page__editor-query-panel overview-page__query-metric-browser">
          <div class="overview-page__editor-query-header">
            <div>
              <div class="overview-page__editor-query-title">系统指标目录</div>
              <div class="overview-page__editor-query-subtitle">
                用于选择 metricRef、查看可用标签和聚合方式；查询语句模式也可以直接把指标写入 QuerySpec。
              </div>
            </div>
            <NTag size="small" bordered={false} type={metricsSchemaSource.value === 'schema' ? 'success' : 'warning'}>
              {metricsSchemaSource.value === 'schema' ? 'Schema 已加载' : 'Schema 未完整加载'}
            </NTag>
          </div>
          <div class="overview-page__query-metric-stats">
            <div>
              <strong>{queryMetricCatalogStats.value.total}</strong>
              <span>当前可选</span>
            </div>
            <div>
              <strong>{queryMetricCatalogStats.value.system}</strong>
              <span>系统指标</span>
            </div>
            <div>
              <strong>{queryMetricCatalogStats.value.darwin}</strong>
              <span>Darwin 来源</span>
            </div>
            <div>
              <strong>{queryMetricCatalogStats.value.labels}</strong>
              <span>标签字段</span>
            </div>
          </div>
          <div class="overview-page__editor-discovery-filters">
            <NInput
              value={metricsSchemaFilters.value.keyword}
              placeholder="搜索指标名、描述、标签、服务"
              onUpdate:value={(value: string) => {
                metricsSchemaFilters.value.keyword = value
              }}
            />
            <NSelect
              value={metricsSchemaFilters.value.type || null}
              clearable
              placeholder="指标类型"
              options={Array.from(new Set(metricsSchemaItems.value.map((item) => item.type).filter(Boolean))).map(
                (type) => ({
                  label: type,
                  value: type
                })
              )}
              onUpdateValue={(value: string | null) => {
                metricsSchemaFilters.value.type = value || ''
              }}
            />
          </div>
          {filteredMetricsSchemaItems.value.length ? (
            <div class="overview-page__editor-discovery-list overview-page__query-metric-list">
              {filteredMetricsSchemaItems.value.slice(0, 60).map((item) => (
                <div key={item.name} class="overview-page__editor-discovery-item overview-page__query-metric-item">
                  <div class="overview-page__editor-discovery-main">
                    <div class="overview-page__editor-discovery-name">{item.name}</div>
                    <div class="overview-page__editor-discovery-description">{item.description}</div>
                    <div class="overview-page__editor-discovery-meta">
                      <NTag size="small" bordered={false}>
                        {item.type}
                      </NTag>
                      <NTag size="small" bordered={false} type="info">
                        {item.unit || '无单位'}
                      </NTag>
                      <NTag size="small" bordered={false} type={item.scope.includes('system') ? 'warning' : 'default'}>
                        {item.scope.join(' / ')}
                      </NTag>
                      <NTag
                        size="small"
                        bordered={false}
                        type={item.sourceKind === 'darwin-event' ? 'success' : 'default'}>
                        {item.sourceKind}
                      </NTag>
                      <NTag size="small" bordered={false} type="success">
                        聚合 {item.allowedAggregations.join(', ')}
                      </NTag>
                    </div>
                    <div class="overview-page__query-metric-detail-row">
                      <span>标签：</span>
                      <strong>{item.labelNames.length ? item.labelNames.join(', ') : '无标签'}</strong>
                    </div>
                    <div class="overview-page__query-metric-detail-row">
                      <span>推荐展示：</span>
                      <strong>{item.recommendedVisualizations.join(', ') || item.recommendation}</strong>
                    </div>
                  </div>
                  <div class="overview-page__query-metric-actions">
                    <NButton size="small" type="primary" ghost onClick={() => applySchemaMetricToQueryDraft(item)}>
                      应用到表单
                    </NButton>
                    <NButton size="small" secondary onClick={() => insertSchemaMetricIntoRawQuery(item)}>
                      写入 QuerySpec
                    </NButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NEmpty
              description={metricsSchemaSource.value === 'schema' ? '当前筛选下没有指标' : '指标 schema 暂不可用'}
              class="overview-page__editor-query-empty"
            />
          )}
        </div>
      )
    }

    const renderEditorMetricDiscovery = () => {
      if (!editorMetricDiscoveryEnabled.value) return null

      return (
        <div class="overview-page__editor-query-panel">
          <div class="overview-page__editor-query-header">
            <div>
              <div class="overview-page__editor-query-title">当前卡片可用指标</div>
              <div class="overview-page__editor-query-subtitle">
                这些是当前卡片类型已经支持并可保存到面板的指标；部分指标支持查询预览，部分指标走本地运行时渲染。
              </div>
            </div>
            <NTag size="small" bordered={false} type="success">
              可直接使用
            </NTag>
          </div>
          <div class="overview-page__editor-discovery-filters">
            <NInput
              value={editorDiscoveryKeyword.value}
              placeholder="搜索当前卡片可用指标"
              onUpdate:value={(value: string) => {
                editorDiscoveryKeyword.value = value
              }}
            />
          </div>
          {filteredEditorMetricDiscoveryPresets.value.length ? (
            <div class="overview-page__editor-discovery-list">
              {filteredEditorMetricDiscoveryPresets.value.map((preset) => (
                <div key={preset.key} class="overview-page__editor-discovery-item">
                  <div class="overview-page__editor-discovery-main">
                    <div class="overview-page__editor-discovery-name">{preset.label}</div>
                    <div class="overview-page__editor-discovery-description">{preset.description}</div>
                    <div class="overview-page__editor-discovery-meta">
                      <NTag size="small" bordered={false}>
                        {widgetEditorDraft.value.kind}
                      </NTag>
                      <NTag size="small" bordered={false} type="info">
                        {preset.unit || '无单位'}
                      </NTag>
                      <NTag size="small" bordered={false} type="success">
                        推荐 {preset.recommendation}
                      </NTag>
                      <NTag size="small" bordered={false} type="warning">
                        查询指标 {preset.label}
                      </NTag>
                    </div>
                  </div>
                  <NButton size="small" type="primary" ghost onClick={() => applyDiscoveredMetricToEditor(preset)}>
                    应用
                  </NButton>
                </div>
              ))}
            </div>
          ) : (
            <NEmpty
              description="当前关键词下没有可直接用于这张卡片的指标。"
              class="overview-page__editor-query-empty"
            />
          )}
        </div>
      )
    }

    const widgetEditorSlots = () => {
      const normalizedDraft = normalizeEditorState(widgetEditorDraft.value)
      const slots: Record<string, () => any> = {
        preview: () => {
          if (currentEditorQuerySupport.value.supported) {
            return renderEditorPreviewBody()
          }
          return renderWidgetBody(normalizedDraft)
        }
      }

      const showQueryAssist = currentEditorQuerySupport.value.supported

      slots.settings = () => (
        <>
          {renderDarwinWidgetSettings()}
          {renderNonQueryWidgetSettings()}
          {renderQueryMetricCatalogBrowser()}
          {renderEditorMetricDiscovery()}
          {showQueryAssist ? renderEditorQueryAssist() : null}
        </>
      )

      return slots
    }

    return () => (
      <div class={['overview-page', isLargeScreenMode.value ? 'overview-page--large-screen' : '']}>
        {!isLargeScreenMode.value ? (
          <>
            <PageHeader title="看板" subtitle={'集中查看系统健康、风险服务和关键事件，支持保存常用看板布局。'}>
              {{
                actions: () => (
                  <NButton
                    secondary
                    onClick={() => {
                      autoRefreshFailureCount.value = 0
                      timeStore.refreshTime()
                      loadOverview()
                    }}>
                    刷新
                  </NButton>
                )
              }}
            </PageHeader>

            <NCard bordered={false} class="overview-page__control-panel">
              <div class="overview-page__control-toolbar">
                <div class="overview-page__time-control-shell">
                  <TimeRangeBar
                    value={timeStore.timeRange}
                    live={timeStore.isLive}
                    options={timeRangeOptions.value}
                    autoRefreshValue={autoRefreshSetting.value}
                    autoRefreshOptions={overviewAutoRefreshOptions}
                    autoRefreshHint={autoRefreshHint.value}
                    onUpdate:value={(range) => {
                      timeStore.setTimeRange(range)
                    }}
                    onUpdate:live={(value: boolean) => {
                      timeStore.isLive = value
                      if (value) timeStore.refreshTime()
                      loadOverview()
                    }}
                    onUpdate:autoRefresh={(value: string) => {
                      if (!isOverviewAutoRefreshKey(value)) return
                      autoRefreshFailureCount.value = 0
                      autoRefreshSetting.value = value
                      if (!isRestoringOverviewState.value) saveAutoRefreshState(value)
                      const shouldRefreshImmediately =
                        timeStore.isLive &&
                        (value === 'auto' ? Boolean(recommendedAutoRefreshInterval.value) : value !== 'off')
                      if (shouldRefreshImmediately) {
                        timeStore.refreshTime()
                        refreshOverviewQueryCardsOnly()
                      }
                    }}
                    onRefresh={() => {
                      autoRefreshFailureCount.value = 0
                      timeStore.refreshTime()
                      loadOverview()
                    }}
                  />
                </div>
                <div class="overview-page__service-search">
                  <NInput
                    value={scopeValue.value.service || ''}
                    placeholder="全部服务"
                    clearable
                    onUpdate:value={(value: string) => {
                      scopeValue.value = { service: value || null }
                    }}
                    onKeydown={(event: KeyboardEvent) => {
                      if (event.key === 'Enter') loadOverview()
                    }}
                  />
                  <NButton
                    class="overview-page__service-search-button"
                    type="primary"
                    secondary
                    onClick={() => loadOverview()}>
                    搜索
                  </NButton>
                </div>
              </div>
            </NCard>

            <PanelToolbar
              panel={currentPanel.value}
              panelOptions={panels.value}
              capabilities={runtimeCapabilities.value}
              canRestore={Boolean(panelBaselines.value[currentPanel.value?.id || ''])}
              canEdit={currentPanelEditable.value}
              editMode={editMode.value}
              largeScreenMode={isLargeScreenMode.value}
              onChange-panel={(panelId: string) => {
                activePanelId.value = panelId
              }}
              onDuplicate-panel={openDuplicatePanel}
              onRename-panel={openRenamePanel}
              onDelete-panel={deleteCurrentPanel}
              onRestore-panel={restoreCurrentPanel}
              onSave-default={saveDefaultView}
              onToggle-edit={() => {
                if (isLargeScreenMode.value) {
                  showLargeScreenReadonlyPrompt()
                  return
                }
                editMode.value = !editMode.value
              }}
              onToggle-large-screen={toggleLargeScreenMode}
              onAdd-widget={openCreateWidget}
            />
          </>
        ) : (
          <NButton
            class="overview-page__large-screen-exit"
            size="small"
            type="warning"
            ghost
            onClick={exitLargeScreenMode}>
            退出大屏
          </NButton>
        )}

        {!isLargeScreenMode.value && widgetTagOptions.value.length ? (
          <NCard bordered={false} class="overview-page__tag-filter-card">
            <div class="overview-page__tag-filter-head">
              <div>
                <div class="overview-page__tag-filter-title">卡片分类</div>
                <div class="overview-page__tag-filter-description">默认展示全部，点击分类仅过滤当前面板。</div>
              </div>
              {activeWidgetTag.value ? (
                <NButton size="small" quaternary onClick={() => (activeWidgetTag.value = '')}>
                  清除过滤
                </NButton>
              ) : null}
            </div>
            <div class="overview-page__tag-filter-list" role="tablist" aria-label="卡片标签过滤">
              <button
                type="button"
                class={['overview-page__tag-filter-chip', !activeWidgetTag.value ? 'is-active' : '']}
                onClick={() => (activeWidgetTag.value = '')}>
                <span>全部</span>
                <span class="overview-page__tag-filter-count">{currentAvailableWidgets.value.length}</span>
              </button>
              {widgetTagOptions.value.map((option) => (
                <button
                  key={option.tag}
                  type="button"
                  class={['overview-page__tag-filter-chip', activeWidgetTag.value === option.tag ? 'is-active' : '']}
                  onClick={() => (activeWidgetTag.value = option.tag)}>
                  <span>{option.tag}</span>
                  <span class="overview-page__tag-filter-count">{option.count}</span>
                </button>
              ))}
            </div>
            {activeWidgetTag.value ? (
              <div class="overview-page__tag-filter-result">
                正在查看 <strong>{activeWidgetTag.value}</strong> 标签下的 {activeWidgetTagCount.value} 张卡片。
              </div>
            ) : null}
          </NCard>
        ) : null}

        {editMode.value && !isLargeScreenMode.value ? (
          <NCard bordered={false} class="overview-page__edit-notice">
            <div class="overview-page__edit-notice-text">
              当前处于编辑态：支持切换模板、复制为用户面板、通过卡片右上角“拖拽排序”手柄调整顺序、尺寸切换与 widget
              配置。当前面板状态会通过后端存储保存，并在恢复时优先读取后端持久化结果。
            </div>
          </NCard>
        ) : null}

        {loading.value ? (
          renderOverviewSkeleton()
        ) : currentVisibleWidgets.value.length ? (
          <div class={['overview-page__grid-shell', reorderState.value?.active ? 'is-reordering' : '']}>
            <div ref={(element) => setWidgetGridRef(element as Element | null)} class="overview-page__masonry-grid">
              {currentVisibleWidgets.value.map((widget) => (
                <div
                  key={widget.id}
                  ref={(element) => setWidgetGridItemRef(widget.id, element as Element | null)}
                  class="overview-page__grid-item"
                  style={{ gridColumn: getWidgetMasonrySpan(widget.size) }}>
                  <div
                    ref={(element) => setWidgetShellRef(widget.id, element as Element | null)}
                    class={[
                      'overview-page__widget-shell',
                      reorderState.value?.dragId === widget.id && reorderState.value.active
                        ? 'overview-page__widget-shell--dragging'
                        : '',
                      reorderTarget.value?.targetId === widget.id && reorderTarget.value.placement === 'before'
                        ? 'overview-page__widget-shell--drop-before'
                        : '',
                      reorderTarget.value?.targetId === widget.id && reorderTarget.value.placement === 'after'
                        ? 'overview-page__widget-shell--drop-after'
                        : ''
                    ]}
                    data-widget-id={widget.id}>
                    <PanelWidgetCard
                      widget={widget}
                      editMode={editMode.value && !isLargeScreenMode.value}
                      panelEditable={currentPanelEditable.value && !isLargeScreenMode.value}
                      {...{
                        'onReorder-pointerdown': (event: PointerEvent) => handleReorderPointerDown(widget.id, event)
                      }}
                      onConfigure={() => openEditWidget(widget)}
                      onRemove={() => removeWidget(widget.id)}
                      onResize={(size: OverviewWidgetSize) => resizeWidget(widget.id, size)}>
                      {{
                        default: () => renderWidgetBody(widget)
                      }}
                    </PanelWidgetCard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <NCard bordered={false} class="overview-page__widgets-empty-card">
            <NEmpty
              description={
                activeWidgetTag.value
                  ? `没有匹配「${activeWidgetTag.value}」标签的卡片。`
                  : '当前面板还是空的，请新增第一张指标卡片。'
              }
              class="overview-page__widgets-empty">
              {{
                extra: () =>
                  activeWidgetTag.value ? (
                    <NButton type="primary" secondary onClick={() => (activeWidgetTag.value = '')}>
                      查看全部卡片
                    </NButton>
                  ) : (
                    <NButton type="primary" onClick={openCreateWidget}>
                      添加第一张卡片
                    </NButton>
                  )
              }}
            </NEmpty>
          </NCard>
        )}

        {!isLargeScreenMode.value && useLegacyWidgetEditor ? (
          <NModal
            show={showWidgetEditor.value}
            preset="dialog"
            title={widgetEditorMode.value === 'create' ? '添加组件' : '配置组件'}
            onUpdate:show={(value: boolean) => (showWidgetEditor.value = value)}>
            <NForm>
              <NFormItem label="组件标题">
                <NInput
                  value={widgetEditorDraft.value.title}
                  placeholder="请输入组件标题"
                  onUpdate:value={(value: string) => updateWidgetDraft({ title: value })}
                />
              </NFormItem>
              <NFormItem label="组件类型">
                <NSelect
                  value={widgetEditorDraft.value.kind}
                  options={widgetTypeOptions.value}
                  onUpdateValue={(value: OverviewWidgetKind) => resetWidgetDraftForKind(value)}
                />
              </NFormItem>
            </NForm>
            <div class="overview-page__modal-actions">
              <NButton disabled={widgetEditorSaving.value} onClick={() => (showWidgetEditor.value = false)}>
                取消
              </NButton>
              <NButton type="primary" loading={widgetEditorSaving.value} onClick={applyWidgetDraft}>
                {widgetEditorMode.value === 'create' ? '添加组件' : '保存配置'}
              </NButton>
            </div>
          </NModal>
        ) : !isLargeScreenMode.value ? (
          <OverviewAnalyticsWidgetEditor
            show={showWidgetEditor.value}
            mode={widgetEditorMode.value}
            confirmLoading={widgetEditorSaving.value}
            draft={normalizeEditorState(widgetEditorDraft.value)}
            widgetTypeOptions={widgetTypeOptions.value.map((item) => ({ label: item.label, value: item.value }))}
            tagOptions={widgetTagSelectOptions.value}
            granularityOptions={editorGranularityOptions}
            timeRangeOptions={currentEditorTimeRangeOptions.value}
            showTimeSettings={
              widgetEditorDraft.value.kind === 'query-card' ||
              widgetEditorDraft.value.kind === 'trend' ||
              widgetEditorDraft.value.kind === 'darwin-infra-summary' ||
              widgetEditorDraft.value.kind === 'darwin-infra-trend' ||
              widgetEditorDraft.value.kind === 'darwin-instance-table' ||
              (widgetEditorDraft.value.kind === 'metric-summary' &&
                !['healthy-services', 'ingest-success-rate'].includes(String(currentEditorPrimaryMetric.value || '')))
            }
            metricOptions={
              currentEditorMetricOptions.value as Array<{
                label: string
                value: OverviewWidgetDisplayMetricKey
              }>
            }
            comparisonOptions={comparisonEditorOptions}
            sizeOptions={widgetSizeOptions.map((item) => ({
              label: item.label,
              value: item.value,
              description: item.value === 'S' ? '紧凑卡片' : item.value === 'M' ? '标准宽度' : '大尺寸卡片'
            }))}
            visualizationOptions={
              widgetEditorDraft.value.kind === 'query-card'
                ? queryVisualizationOptionsResolved.value
                : currentWidgetVisualizationOptions.value
            }
            showVisualizationOptions={[
              'query-card',
              'metric-summary',
              'trend',
              'darwin-infra-summary',
              'darwin-infra-trend',
              'darwin-instance-table'
            ].includes(widgetEditorDraft.value.kind)}
            allowSmallSize={canWidgetUseSmallSize(normalizeEditorState(widgetEditorDraft.value))}
            showMetricSelector={['metric-summary', 'trend'].includes(widgetEditorDraft.value.kind)}
            metricSelectorMultiple={false}
            showComparisonSelector={false}
            showDisplayOptions={false}
            settingsSectionTitle={currentEditorQuerySupport.value.supported ? '专项设置与查询预览' : '专项设置'}
            settingsSectionDescription={
              currentEditorQuerySupport.value.supported
                ? '补充当前卡片专属配置，并通过查询网关预览或查看高级脚本。'
                : '补充当前卡片专属配置。'
            }
            onUpdate:show={(value: boolean) => (showWidgetEditor.value = value)}
            onUpdate:draft={(patch: Partial<OverviewPanelWidget>) => updateWidgetDraft(patch)}
            onKind-change={(value: OverviewWidgetKind) => resetWidgetDraftForKind(value)}
            onConfirm={applyWidgetDraft}>
            {widgetEditorSlots()}
          </OverviewAnalyticsWidgetEditor>
        ) : null}

        {!isLargeScreenMode.value ? (
          <NModal
            show={showPanelModal.value}
            preset="dialog"
            title={panelModalMode.value === 'duplicate' ? '创建用户面板' : '重命名用户面板'}
            onUpdate:show={(value: boolean) => (showPanelModal.value = value)}>
            <NForm>
              <NFormItem label="面板名称">
                <NInput
                  value={panelName.value}
                  placeholder="请输入面板名称"
                  onUpdate:value={(value: string) => (panelName.value = value)}
                />
              </NFormItem>
            </NForm>
            <div class="overview-page__modal-actions">
              <NButton onClick={() => (showPanelModal.value = false)}>取消</NButton>
              <NButton type="primary" onClick={confirmPanelModal}>
                {panelModalMode.value === 'duplicate' ? '创建面板' : '保存名称'}
              </NButton>
            </div>
          </NModal>
        ) : null}
      </div>
    )
  }
})
