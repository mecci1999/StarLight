export type OverviewCapabilityKey = 'metrics' | 'logs' | 'traces' | 'alerts' | 'serviceCatalog' | 'ingestion'
export type OverviewPanelKind = 'system' | 'preset' | 'user'
export type OverviewWidgetSize = 'S' | 'M' | 'L'
export type OverviewWidgetVisualization = 'line' | 'bar' | 'donut' | 'cumulative' | 'table' | 'number'
export type OverviewWidgetTimeGranularity = 'hour' | 'day' | 'week' | 'month'
export type OverviewWidgetEditorTimeRange = '15m' | '1h' | '4h' | '1d' | '2d' | '7d' | '14d' | '30d'
export type OverviewMetricKey =
  | 'service-count'
  | 'healthy-services'
  | 'active-alerts'
  | 'total-requests'
  | 'error-rate'
  | 'p95-latency'
  | 'ingest-success-rate'
export type OverviewTrendMetricKey = 'requests' | 'errors' | 'latency'
export type DarwinInfraMetricKey = 'cpu' | 'memory'
export type OverviewWidgetDisplayMetricKey = OverviewMetricKey | OverviewTrendMetricKey | DarwinInfraMetricKey
export type OverviewTrendGroupBy = 'overall' | 'env' | 'team'
export type OverviewCompareWindow = 'previous-period' | 'same-period' | '24h' | '7d'
export type OverviewQuickPivotLinkKey = 'services' | 'topology' | 'traces' | 'logs' | 'alerts' | 'admin-ingestion'
export type OverviewSeverity = 'info' | 'warning' | 'critical'
export type OverviewIncidentSource = 'metrics' | 'logs' | 'traces' | 'alerts'
export type OverviewIngestSource = 'metrics' | 'logs' | 'traces'

export type MetricSummaryConfig = {
  metricKey: OverviewMetricKey
  compareWindow?: OverviewCompareWindow
  threshold?: number | null
  service?: string
  env?: string
  region?: string
  tags?: string[]
}

export type RiskServiceConfig = {
  env?: string
  team?: string
  tags?: string[]
  limit?: number
}

export type IncidentConfig = {
  severity?: OverviewSeverity[]
  source?: OverviewIncidentSource[]
  env?: string
  limit?: number
}

export type IngestStatusConfig = {
  env?: string
  source?: OverviewIngestSource[]
}

export type TrendConfig = {
  metric: OverviewTrendMetricKey
  aggregation?: 'avg' | 'sum' | 'p95' | 'rate'
  groupBy?: OverviewTrendGroupBy
  compareWindow?: OverviewCompareWindow
  service?: string
  env?: string
}

export type QuickPivotConfig = {
  links?: Array<{
    key: OverviewQuickPivotLinkKey
    visible?: boolean
  }>
}

export type DarwinInfraSummaryConfig = {
  metric: DarwinInfraMetricKey
  serviceId?: string
  aggregation?: 'latest' | 'avg' | 'max'
}

export type DarwinInfraTrendConfig = {
  metric: DarwinInfraMetricKey
  serviceId?: string
  aggregation?: 'avg'
}

export type DarwinInstanceTableConfig = {
  serviceId?: string
  limit?: number
  sortBy?: DarwinInfraMetricKey
}

export type LogPatternsConfig = {
  service?: string
  env?: string
  tags?: string[]
  limit?: number
}

export type OverviewWidgetDisplayOptions = {
  showTotal?: boolean
  showAverage?: boolean
  showPreviousPeriod?: boolean
  showSamePeriod?: boolean
}

export type OverviewWidgetEditorState = {
  timeGranularity?: OverviewWidgetTimeGranularity
  timeRange?: OverviewWidgetEditorTimeRange
  visualization?: OverviewWidgetVisualization
  displayedMetrics?: OverviewWidgetDisplayMetricKey[]
  compareEnabled?: boolean
  compareWindow?: OverviewCompareWindow
  display?: OverviewWidgetDisplayOptions
  notes?: string
}

export type TraceLatencyConfig = {
  service?: string
  env?: string
  operation?: string
  limit?: number
  compareWindow?: OverviewCompareWindow
}

export type OverviewWidgetKind =
  | 'query-card'
  | 'metric-summary'
  | 'risk-service'
  | 'incident'
  | 'ingest-status'
  | 'trend'
  | 'quick-pivot'
  | 'darwin-infra-summary'
  | 'darwin-infra-trend'
  | 'darwin-instance-table'

export type OverviewWidgetConfigMap = {
  'query-card': {
    query: import('@/domains/metrics/queryModel').QuerySpec
  }
  'metric-summary': MetricSummaryConfig
  'risk-service': RiskServiceConfig
  incident: IncidentConfig
  'ingest-status': IngestStatusConfig
  trend: TrendConfig
  'quick-pivot': QuickPivotConfig
  'darwin-infra-summary': DarwinInfraSummaryConfig
  'darwin-infra-trend': DarwinInfraTrendConfig
  'darwin-instance-table': DarwinInstanceTableConfig
}

export type OverviewPanelWidget<K extends OverviewWidgetKind = OverviewWidgetKind> = {
  id: string
  title: string
  kind: K
  size: OverviewWidgetSize
  capability: OverviewCapabilityKey
  description: string
  future?: boolean
  config: OverviewWidgetConfigMap[K]
  editor?: OverviewWidgetEditorState
}

export type OverviewPanelDefinition = {
  id: string
  name: string
  description: string
  kind: OverviewPanelKind
  editable: boolean
  widgets: OverviewPanelWidget[]
}

export type OverviewCapabilityState = {
  key: OverviewCapabilityKey
  label: string
  available: boolean
  frontendReady: boolean
  note?: string
}

export type OverviewWidgetCatalogItem = {
  kind: OverviewWidgetKind
  label: string
  capability: OverviewCapabilityKey
  description: string
  defaultSize: OverviewWidgetSize
  frontendReady: boolean
  future?: boolean
}

const defaultQuickLinks: OverviewQuickPivotLinkKey[] = [
  'services',
  'topology',
  'traces',
  'logs',
  'alerts',
  'admin-ingestion'
]

const DEFAULT_WIDGET_DISPLAY_OPTIONS: Required<OverviewWidgetDisplayOptions> = {
  showTotal: true,
  showAverage: false,
  showPreviousPeriod: true,
  showSamePeriod: false
}

export const overviewWidgetCatalog: OverviewWidgetCatalogItem[] = [
  {
    kind: 'query-card',
    label: '开放查询卡',
    capability: 'metrics',
    description: '按查询条件自由选择指标、聚合、分组与展示方式。',
    defaultSize: 'M',
    frontendReady: true
  },
  {
    kind: 'metric-summary',
    label: '指标摘要',
    capability: 'metrics',
    description: '显示单个指标的当前值、baseline 与阈值提示。',
    defaultSize: 'S',
    frontendReady: true
  },
  {
    kind: 'risk-service',
    label: '风险服务',
    capability: 'serviceCatalog',
    description: '展示高风险或最近退化的服务列表，并可直接进入服务详情。',
    defaultSize: 'M',
    frontendReady: true
  },
  {
    kind: 'incident',
    label: '事件列表',
    capability: 'alerts',
    description: '展示最近事件，支持 severity/source 过滤。',
    defaultSize: 'M',
    frontendReady: true
  },
  {
    kind: 'ingest-status',
    label: '接入状态',
    capability: 'ingestion',
    description: '展示 metrics/logs/traces 采集通道状态。',
    defaultSize: 'M',
    frontendReady: true
  },
  {
    kind: 'trend',
    label: '趋势图',
    capability: 'metrics',
    description: '展示请求、错误或延迟趋势，并保留 groupBy/compareWindow 配置。',
    defaultSize: 'L',
    frontendReady: true
  },
  {
    kind: 'quick-pivot',
    label: '快捷入口',
    capability: 'serviceCatalog',
    description: '统一展示服务目录、拓扑、日志、链路和告警跳转入口。',
    defaultSize: 'M',
    frontendReady: true
  },
  {
    kind: 'darwin-infra-summary',
    label: 'Darwin 资源摘要',
    capability: 'metrics',
    description: '展示 Darwin 系统基础资源当前值，如 CPU、内存。',
    defaultSize: 'S',
    frontendReady: true
  },
  {
    kind: 'darwin-infra-trend',
    label: 'Darwin 资源趋势',
    capability: 'metrics',
    description: '展示 Darwin 系统基础资源趋势，如 CPU、内存。',
    defaultSize: 'L',
    frontendReady: true
  },
  {
    kind: 'darwin-instance-table',
    label: 'Darwin 实例资源',
    capability: 'metrics',
    description: '展示 Darwin 服务实例 CPU、内存明细。',
    defaultSize: 'L',
    frontendReady: true
  }
]

const metricSummaryWidget = (
  id: string,
  title: string,
  metricKey: OverviewMetricKey
): OverviewPanelWidget<'metric-summary'> => ({
  id,
  title,
  kind: 'metric-summary',
  size: 'S',
  capability: 'metrics',
  description: 'KPI 卡片会根据当前时间范围与筛选条件显示 baseline/delta。',
  config: {
    metricKey,
    compareWindow: 'previous-period',
    threshold: null
  }
})

const riskServiceWidget = (
  id: string,
  title: string,
  limit: number,
  mode: 'high-risk' | 'degraded'
): OverviewPanelWidget<'risk-service'> => ({
  id,
  title,
  kind: 'risk-service',
  size: 'M',
  capability: 'serviceCatalog',
  description: mode === 'high-risk' ? '优先展示需要立刻排查的服务。' : '展示近期退化服务，帮助发现刚发生的抖动。',
  config: {
    limit,
    tags: mode === 'high-risk' ? ['high-risk'] : ['degraded']
  }
})

const incidentWidget = (id: string, title: string, limit = 5): OverviewPanelWidget<'incident'> => ({
  id,
  title,
  kind: 'incident',
  size: 'M',
  capability: 'alerts',
  description: '保留当前 overview incidents read model 作为默认模板的数据来源。',
  config: {
    limit,
    severity: ['warning', 'critical'],
    source: ['metrics', 'alerts']
  }
})

const ingestWidget = (id: string, title: string): OverviewPanelWidget<'ingest-status'> => ({
  id,
  title,
  kind: 'ingest-status',
  size: 'M',
  capability: 'ingestion',
  description: '采集状态会根据当前 scope 透传到 overview ingest-status 接口。',
  config: {
    source: ['metrics', 'logs', 'traces']
  }
})

const trendWidget = (
  id: string,
  title: string,
  metric: OverviewTrendMetricKey,
  groupBy: OverviewTrendGroupBy,
  size: OverviewWidgetSize = 'L'
): OverviewPanelWidget<'trend'> => ({
  id,
  title,
  kind: 'trend',
  size,
  capability: 'metrics',
  description: '趋势图在当前阶段仍复用 overview trends read model。',
  config: {
    metric,
    aggregation: metric === 'latency' ? 'p95' : metric === 'errors' ? 'rate' : 'sum',
    groupBy,
    compareWindow: 'previous-period'
  }
})

const quickPivotWidget = (
  id: string,
  title: string,
  links: OverviewQuickPivotLinkKey[] = defaultQuickLinks
): OverviewPanelWidget<'quick-pivot'> => ({
  id,
  title,
  kind: 'quick-pivot',
  size: 'M',
  capability: 'serviceCatalog',
  description: '快捷入口帮助从 overview 进入 service-first 的排查链路。',
  config: {
    links: links.map((key) => ({ key, visible: true }))
  }
})

const darwinInfraSummaryWidget = (
  id: string,
  title: string,
  metric: DarwinInfraMetricKey
): OverviewPanelWidget<'darwin-infra-summary'> => ({
  id,
  title,
  kind: 'darwin-infra-summary',
  size: 'S',
  capability: 'metrics',
  description: `展示 Darwin ${metric === 'cpu' ? 'CPU' : '内存'} 当前资源状态。`,
  config: {
    metric,
    aggregation: 'avg'
  }
})

const darwinInfraTrendWidget = (
  id: string,
  title: string,
  metric: DarwinInfraMetricKey
): OverviewPanelWidget<'darwin-infra-trend'> => ({
  id,
  title,
  kind: 'darwin-infra-trend',
  size: 'L',
  capability: 'metrics',
  description: `展示 Darwin ${metric === 'cpu' ? 'CPU' : '内存'} 趋势。`,
  config: {
    metric,
    aggregation: 'avg'
  }
})

export const buildShippedOverviewPanels = (): OverviewPanelDefinition[] => [
  {
    id: 'system-overview',
    name: '系统默认模板',
    description: '展示当前接入能力下的完整默认模板，是 `/home/overview` 的默认入口。',
    kind: 'system',
    editable: false,
    widgets: [
      metricSummaryWidget('system-service-count', '服务总数', 'service-count'),
      metricSummaryWidget('system-healthy-services', '健康服务数', 'healthy-services'),
      metricSummaryWidget('system-active-alerts', '活跃告警', 'active-alerts'),
      metricSummaryWidget('system-total-requests', '请求总量', 'total-requests'),
      metricSummaryWidget('system-error-rate', '全局错误率', 'error-rate'),
      metricSummaryWidget('system-p95-latency', 'P95 延迟', 'p95-latency'),
      darwinInfraSummaryWidget('system-darwin-cpu', 'Darwin CPU', 'cpu'),
      darwinInfraSummaryWidget('system-darwin-memory', 'Darwin 内存', 'memory'),
      riskServiceWidget('system-high-risk', '高风险服务', 5, 'high-risk'),
      riskServiceWidget('system-degraded', '最近退化服务', 5, 'degraded'),
      trendWidget('system-trend', '趋势概览', 'requests', 'overall'),
      darwinInfraTrendWidget('system-darwin-cpu-trend', 'Darwin CPU 趋势', 'cpu'),
      ingestWidget('system-ingest', '接入状态'),
      incidentWidget('system-incidents', '最近事件', 5),
      quickPivotWidget('system-quick-pivot', '快捷入口')
    ]
  },
  {
    id: 'preset-service-stability',
    name: '服务稳定性模板',
    description: '聚焦服务健康、风险服务与核心趋势。',
    kind: 'preset',
    editable: false,
    widgets: [
      metricSummaryWidget('preset-service-stability-alerts', '活跃告警', 'active-alerts'),
      metricSummaryWidget('preset-service-stability-error', '全局错误率', 'error-rate'),
      metricSummaryWidget('preset-service-stability-latency', 'P95 延迟', 'p95-latency'),
      riskServiceWidget('preset-service-stability-risk', '高风险服务', 8, 'high-risk'),
      riskServiceWidget('preset-service-stability-degraded', '最近退化服务', 8, 'degraded'),
      trendWidget('preset-service-stability-trend', '请求与延迟趋势', 'latency', 'team'),
      quickPivotWidget('preset-service-stability-quick-pivot', '排查入口', [
        'services',
        'topology',
        'logs',
        'traces',
        'alerts'
      ])
    ]
  },
  {
    id: 'preset-ingestion-health',
    name: '接入健康模板',
    description: '聚焦采集状态、事件和接入排查。',
    kind: 'preset',
    editable: false,
    widgets: [
      metricSummaryWidget('preset-ingestion-health-service-count', '服务总数', 'service-count'),
      metricSummaryWidget('preset-ingestion-health-ingest-success', 'ingest 成功率', 'ingest-success-rate'),
      ingestWidget('preset-ingestion-health-ingest', '采集状态'),
      incidentWidget('preset-ingestion-health-incidents', '接入相关事件', 6),
      quickPivotWidget('preset-ingestion-health-quick-pivot', '接入排查入口', [
        'services',
        'logs',
        'traces',
        'admin-ingestion'
      ])
    ]
  },
  {
    id: 'preset-alert-duty',
    name: '告警值班模板',
    description: '聚焦当前活跃告警、关键事件与最近风险服务。',
    kind: 'preset',
    editable: false,
    widgets: [
      metricSummaryWidget('preset-alert-duty-active', '活跃告警', 'active-alerts'),
      metricSummaryWidget('preset-alert-duty-healthy', '健康服务数', 'healthy-services'),
      riskServiceWidget('preset-alert-duty-risk', '值班关注服务', 10, 'high-risk'),
      incidentWidget('preset-alert-duty-incidents', '值班事件流', 8),
      quickPivotWidget('preset-alert-duty-quick-pivot', '值班跳转', ['alerts', 'services', 'logs', 'traces'])
    ]
  }
]

export const cloneOverviewPanels = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const getAllowedWidgetVisualizations = (kind: OverviewWidgetKind): OverviewWidgetVisualization[] => {
  switch (kind) {
    case 'query-card':
      return ['number', 'line', 'bar', 'donut', 'table']
    case 'metric-summary':
      return ['number', 'bar', 'donut']
    case 'trend':
      return ['line', 'bar']
    case 'darwin-infra-summary':
      return ['number', 'line', 'bar']
    case 'darwin-infra-trend':
      return ['line', 'bar']
    case 'darwin-instance-table':
      return ['table']
    case 'risk-service':
    case 'ingest-status':
    case 'incident':
    case 'quick-pivot':
    default:
      return ['table']
  }
}

export const getDefaultWidgetVisualization = (kind: OverviewWidgetKind): OverviewWidgetVisualization => {
  const [defaultVisualization] = getAllowedWidgetVisualizations(kind)
  return defaultVisualization || 'table'
}

const getDefaultDisplayedMetrics = (
  kind: OverviewWidgetKind,
  config: OverviewWidgetConfigMap[OverviewWidgetKind]
): OverviewWidgetDisplayMetricKey[] => {
  if (kind === 'metric-summary') {
    const metricKey = (config as MetricSummaryConfig).metricKey
    return metricKey ? [metricKey] : []
  }

  if (kind === 'trend') {
    const metric = (config as TrendConfig).metric
    return metric ? [metric] : []
  }

  if (kind === 'darwin-infra-summary') {
    const metric = (config as DarwinInfraSummaryConfig).metric
    return metric ? [metric] : []
  }

  if (kind === 'darwin-infra-trend') {
    const metric = (config as DarwinInfraTrendConfig).metric
    return metric ? [metric] : []
  }

  if (kind === 'query-card') {
    return []
  }

  return []
}

export const buildOverviewWidgetEditorState = (widget: OverviewPanelWidget): Required<OverviewWidgetEditorState> => {
  const allowedVisualizations = getAllowedWidgetVisualizations(widget.kind)
  const fallbackVisualization = getDefaultWidgetVisualization(widget.kind)
  const queryConfig = widget.kind === 'query-card' ? (widget.config as any)?.query || {} : null
  const rawVisualization = widget.editor?.visualization || queryConfig?.visualizationHint
  const visualization =
    rawVisualization && allowedVisualizations.includes(rawVisualization) ? rawVisualization : fallbackVisualization
  const inheritedCompareWindow =
    widget.kind === 'metric-summary'
      ? (widget.config as MetricSummaryConfig).compareWindow
      : widget.kind === 'trend'
        ? (widget.config as TrendConfig).compareWindow
        : undefined
  const defaultDisplayedMetrics = getDefaultDisplayedMetrics(widget.kind, widget.config)
  const displayedMetrics =
    widget.kind === 'metric-summary' ||
    widget.kind === 'trend' ||
    widget.kind === 'darwin-infra-summary' ||
    widget.kind === 'darwin-infra-trend'
      ? defaultDisplayedMetrics
      : widget.editor?.displayedMetrics && widget.editor.displayedMetrics.length
        ? widget.editor.displayedMetrics
        : defaultDisplayedMetrics

  return {
    timeGranularity: widget.editor?.timeGranularity || 'hour',
    timeRange:
      widget.editor?.timeRange ||
      (queryConfig?.timeRange
        ? (String(queryConfig.timeRange).replace(/^-/, '') as OverviewWidgetEditorTimeRange)
        : '1h'),
    visualization,
    displayedMetrics,
    compareEnabled: widget.editor?.compareEnabled ?? Boolean(inheritedCompareWindow),
    compareWindow: widget.editor?.compareWindow || inheritedCompareWindow || 'previous-period',
    display: {
      ...DEFAULT_WIDGET_DISPLAY_OPTIONS,
      ...(widget.editor?.display || {})
    },
    notes: widget.editor?.notes || ''
  }
}

const SMALL_SIZE_EXCLUDED_WIDGET_KINDS = new Set<OverviewWidgetKind>([
  'risk-service',
  'incident',
  'ingest-status',
  'quick-pivot',
  'darwin-instance-table'
])

export const canWidgetUseSmallSize = (widget: Pick<OverviewPanelWidget, 'kind' | 'config' | 'editor'>) =>
  !SMALL_SIZE_EXCLUDED_WIDGET_KINDS.has(widget.kind)

export const normalizeOverviewWidget = <K extends OverviewWidgetKind>(
  widget: OverviewPanelWidget<K>
): OverviewPanelWidget<K> => {
  const nextWidget = (() => {
    const selectedMetric = widget.editor?.displayedMetrics?.[0]

    if (widget.kind === 'query-card') {
      const query = (widget.config as any)?.query || {}
      return {
        ...widget,
        config: {
          query: {
            ...query,
            timeRange: widget.editor?.timeRange ? `-${widget.editor.timeRange}` : query.timeRange || '-1h',
            visualizationHint: widget.editor?.visualization || query.visualizationHint || 'line'
          }
        }
      }
    }

    if (widget.kind === 'metric-summary' && selectedMetric) {
      return {
        ...widget,
        config: {
          ...(widget.config as MetricSummaryConfig),
          metricKey: selectedMetric as OverviewMetricKey
        }
      }
    }

    if (widget.kind === 'trend' && selectedMetric) {
      return {
        ...widget,
        config: {
          ...(widget.config as TrendConfig),
          metric: selectedMetric as OverviewTrendMetricKey
        }
      }
    }

    if (widget.kind === 'darwin-infra-summary' && selectedMetric) {
      return {
        ...widget,
        config: {
          ...(widget.config as DarwinInfraSummaryConfig),
          metric: selectedMetric as DarwinInfraMetricKey
        }
      }
    }

    if (widget.kind === 'darwin-infra-trend' && selectedMetric) {
      return {
        ...widget,
        config: {
          ...(widget.config as DarwinInfraTrendConfig),
          metric: selectedMetric as DarwinInfraMetricKey
        }
      }
    }

    return widget
  })() as OverviewPanelWidget<K>

  const editor = buildOverviewWidgetEditorState(nextWidget)
  const size = widget.size === 'S' && !canWidgetUseSmallSize(nextWidget) ? 'M' : widget.size

  const normalizedWidget: OverviewPanelWidget<K> = {
    ...nextWidget,
    size,
    editor
  }

  return normalizedWidget
}

export const createUserPanelDefinition = (name: string, widgets: OverviewPanelWidget[]): OverviewPanelDefinition => {
  const normalizedName = name.trim() || '我的面板'
  const slug = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return {
    id: `user-${slug || 'panel'}-${Date.now()}`,
    name: normalizedName,
    description: '用户自定义面板，当前阶段以本地持久化代替后端 panel CRUD。',
    kind: 'user',
    editable: true,
    widgets: cloneOverviewPanels(widgets)
  }
}

export const buildWidgetDraft = (
  kind: OverviewWidgetKind,
  runtimeCapabilities: OverviewCapabilityState[]
): OverviewPanelWidget => {
  const selected = overviewWidgetCatalog.find((item) => item.kind === kind) || overviewWidgetCatalog[0]
  const metricFallback: OverviewMetricKey = 'total-requests'

  const draft: OverviewPanelWidget = (() => {
    switch (selected.kind) {
      case 'metric-summary':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'metric-summary',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: {
            metricKey: metricFallback,
            compareWindow: 'previous-period',
            threshold: null
          }
        }
      case 'risk-service':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'risk-service',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { limit: 6 }
        }
      case 'incident':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'incident',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { limit: 5, severity: ['warning', 'critical'], source: ['metrics', 'alerts'] }
        }
      case 'ingest-status':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'ingest-status',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { source: ['metrics', 'logs', 'traces'] }
        }
      case 'trend':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'trend',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { metric: 'requests', aggregation: 'sum', groupBy: 'overall', compareWindow: 'previous-period' }
        }
      case 'quick-pivot':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'quick-pivot',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { links: defaultQuickLinks.map((key) => ({ key, visible: true })) }
        }
      case 'darwin-infra-summary':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'darwin-infra-summary',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { metric: 'cpu', aggregation: 'avg' }
        }
      case 'darwin-infra-trend':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'darwin-infra-trend',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { metric: 'cpu', aggregation: 'avg' }
        }
      case 'darwin-instance-table':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'darwin-instance-table',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: { limit: 6, sortBy: 'cpu' }
        }
      case 'query-card':
        return {
          id: `widget-${selected.kind}-${Date.now()}`,
          title: selected.label,
          kind: 'query-card',
          size: selected.defaultSize,
          capability: selected.capability,
          description: selected.description,
          config: {
            query: {
              scope: 'tenant',
              sourceKind: 'auto',
              subject: { type: 'system' },
              metricRef: 'service.cpu.usage',
              aggregation: 'avg',
              timeRange: '-1h',
              visualizationHint: 'line'
            }
          }
        }
      default:
        return metricSummaryWidget(`widget-${Date.now()}`, '指标摘要', 'total-requests')
    }
  })()

  return normalizeOverviewWidget(draft as OverviewPanelWidget)
}

export const getPanelKindLabel = (kind: OverviewPanelKind) => {
  if (kind === 'system') return '系统'
  if (kind === 'preset') return '场景'
  return '用户'
}

export const getWidgetSizeSpan = (size: OverviewWidgetSize) => {
  if (size === 'S') return 4
  if (size === 'M') return 6
  return 12
}

export const getQuickPivotLabel = (key: OverviewQuickPivotLinkKey) => {
  switch (key) {
    case 'services':
      return '服务目录'
    case 'topology':
      return '服务拓扑'
    case 'traces':
      return 'Trace Explorer'
    case 'logs':
      return 'Logs Explorer'
    case 'alerts':
      return 'Alert Inbox'
    case 'admin-ingestion':
      return '接入管理'
    default:
      return key
  }
}
