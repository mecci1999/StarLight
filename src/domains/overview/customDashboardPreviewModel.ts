import type { MetricsDatasetScope } from '@/api/metrics'
import {
  SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
  type CardData,
  type DashboardQueryRequest,
  type QuerySpec
} from '@/domains/metrics/queryModel'

export type LegacyCustomDashboardWidgetType = 'stat' | 'trend' | 'distribution' | 'alerts'
export type LegacyCustomDashboardMetricKey = 'cpu' | 'memory' | 'qps' | 'response-time' | 'error-rate' | 'connections'

export type CustomDashboardWidgetDraft = {
  title: string
  scope?: MetricsDatasetScope
  timeRange?: string
  visualization: NonNullable<QuerySpec['visualizationHint']>
  metricRef: string
  aggregation: QuerySpec['aggregation']
  sourceKind: NonNullable<QuerySpec['sourceKind']>
  subjectType: QuerySpec['subject']['type']
  serviceId?: string
  groupBy: string[]
  limit?: number | null
  type?: LegacyCustomDashboardWidgetType
  metric?: LegacyCustomDashboardMetricKey
}

export type QueryValidationResult = {
  valid: boolean
  issues: string[]
}

type QuerySpecJsonEnvelope = {
  query?: unknown
  config?: {
    query?: unknown
  }
}

const legacyMetricRefMap: Record<LegacyCustomDashboardMetricKey, string> = {
  cpu: 'service.cpu.usage',
  memory: SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
  qps: 'service.qps',
  'response-time': 'service.response.time',
  'error-rate': 'service.error.rate',
  connections: 'service.connections.active'
}

const legacyVisualizationHintMap: Record<LegacyCustomDashboardWidgetType, QuerySpec['visualizationHint'] | null> = {
  stat: 'number',
  trend: 'line',
  distribution: 'bar',
  alerts: null
}

const legacyAggregationMap: Record<LegacyCustomDashboardWidgetType, QuerySpec['aggregation']> = {
  stat: 'latest',
  trend: 'avg',
  distribution: 'sum',
  alerts: 'latest'
}

export const resolveLegacyMetricRef = (metric?: LegacyCustomDashboardMetricKey | string | null) => {
  if (!metric) return ''
  return legacyMetricRefMap[metric as LegacyCustomDashboardMetricKey] || ''
}

export const createDefaultCustomDashboardWidgetDraft = (
  serviceId?: string,
  scope: MetricsDatasetScope = 'tenant'
): CustomDashboardWidgetDraft => ({
  title: '',
  scope,
  timeRange: '-1h',
  visualization: 'line',
  metricRef: 'service.cpu.usage',
  aggregation: 'avg',
  sourceKind: 'auto',
  subjectType: serviceId ? 'service' : 'system',
  serviceId: serviceId || '',
  groupBy: [],
  limit: null,
  type: 'trend',
  metric: 'cpu'
})

const normalizeLegacyDraft = (draft: CustomDashboardWidgetDraft) => {
  const visualization = draft.visualization || (draft.type ? legacyVisualizationHintMap[draft.type] || 'line' : 'line')
  const metricRef = draft.metricRef.trim() || resolveLegacyMetricRef(draft.metric)
  const aggregation = draft.aggregation || (draft.type ? legacyAggregationMap[draft.type] : 'avg')
  const sourceKind = draft.sourceKind || 'auto'
  const timeRange = typeof draft.timeRange === 'string' && draft.timeRange.trim() ? draft.timeRange.trim() : '-1h'
  const subjectType = draft.subjectType || (draft.serviceId ? 'service' : 'system')
  const serviceId = typeof draft.serviceId === 'string' ? draft.serviceId : ''
  const groupBy = Array.isArray(draft.groupBy) ? draft.groupBy.map((item) => item.trim()).filter(Boolean) : []
  const limit = typeof draft.limit === 'number' && draft.limit > 0 ? draft.limit : undefined

  return {
    visualization,
    metricRef,
    aggregation,
    sourceKind,
    timeRange,
    subjectType,
    serviceId,
    groupBy,
    limit
  }
}

export const buildCustomDashboardQuerySpec = (
  draft: CustomDashboardWidgetDraft,
  scope: MetricsDatasetScope
): QuerySpec | null => {
  if (draft.type === 'alerts') return null
  const normalized = normalizeLegacyDraft(draft)
  const queryScope = draft.scope || scope
  if (!normalized.metricRef) return null
  if (normalized.subjectType === 'instance') return null

  return {
    scope: queryScope,
    sourceKind: normalized.sourceKind,
    subject:
      normalized.subjectType === 'service' && normalized.serviceId
        ? { type: 'service', id: normalized.serviceId }
        : { type: 'system' },
    metricRef: normalized.metricRef,
    aggregation: normalized.aggregation,
    visualizationHint: normalized.visualization || undefined,
    timeRange: normalized.timeRange,
    groupBy: normalized.groupBy.length ? normalized.groupBy : undefined,
    limit: normalized.limit
  }
}

const querySpecAggregations: QuerySpec['aggregation'][] = ['latest', 'avg', 'sum', 'max', 'p95']
const querySpecVisualizations: NonNullable<QuerySpec['visualizationHint']>[] = [
  'number',
  'line',
  'bar',
  'table',
  'donut'
]
const querySpecSourceKinds: NonNullable<QuerySpec['sourceKind']>[] = ['sdk', 'darwin-event', 'auto']
const querySpecSubjectTypes: QuerySpec['subject']['type'][] = ['system', 'service', 'instance']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isRatioCalculationLike = (value: unknown): value is NonNullable<QuerySpec['calculation']> => {
  if (!isRecord(value) || value.type !== 'ratio') return false
  if (!isRecord(value.numerator) || typeof value.numerator.metricRef !== 'string') return false
  if (!isRecord(value.denominator) || typeof value.denominator.metricRef !== 'string') return false
  if (
    value.numerator.aggregation &&
    !querySpecAggregations.includes(value.numerator.aggregation as QuerySpec['aggregation'])
  )
    return false
  if (
    value.denominator.aggregation &&
    !querySpecAggregations.includes(value.denominator.aggregation as QuerySpec['aggregation'])
  )
    return false
  if (value.scale !== undefined && typeof value.scale !== 'number') return false
  if (value.unit !== undefined && typeof value.unit !== 'string') return false
  return true
}

const isQuerySpecLike = (value: unknown): value is QuerySpec => {
  if (!isRecord(value)) return false
  if ((value.scope !== 'tenant' && value.scope !== 'system') || typeof value.metricRef !== 'string') return false
  if (!querySpecAggregations.includes(value.aggregation as QuerySpec['aggregation'])) return false
  if (typeof value.timeRange !== 'string' || !isRecord(value.subject)) return false
  if (!querySpecSubjectTypes.includes(value.subject.type as QuerySpec['subject']['type'])) return false
  if (value.sourceKind && !querySpecSourceKinds.includes(value.sourceKind as NonNullable<QuerySpec['sourceKind']>))
    return false
  if (
    value.visualizationHint &&
    !querySpecVisualizations.includes(value.visualizationHint as NonNullable<QuerySpec['visualizationHint']>)
  )
    return false
  if (value.calculation && !isRatioCalculationLike(value.calculation)) return false
  return true
}

export const extractQuerySpecFromJson = (payload: unknown): QuerySpec | null => {
  if (isQuerySpecLike(payload)) return payload
  if (!isRecord(payload)) return null

  const envelope = payload as QuerySpecJsonEnvelope
  if (isQuerySpecLike(envelope.query)) return envelope.query
  if (isQuerySpecLike(envelope.config?.query)) return envelope.config.query

  return null
}

export const parseQuerySpecJson = (source: string): { query: QuerySpec | null; issues: string[] } => {
  if (!source.trim()) {
    return { query: null, issues: ['请先粘贴或输入 QuerySpec JSON'] }
  }

  try {
    const query = extractQuerySpecFromJson(JSON.parse(source))
    return query
      ? { query, issues: [] }
      : { query: null, issues: ['JSON 中未找到有效的 QuerySpec；请提供 QuerySpec、{ query } 或 { config: { query } }'] }
  } catch {
    return { query: null, issues: ['JSON 格式不正确，请检查括号、逗号和引号'] }
  }
}

export const createCustomDashboardDraftFromQuerySpec = (
  query: QuerySpec,
  currentDraft: CustomDashboardWidgetDraft
): CustomDashboardWidgetDraft => ({
  ...currentDraft,
  scope: query.scope,
  timeRange: query.timeRange,
  visualization: query.visualizationHint || currentDraft.visualization || 'line',
  metricRef: query.metricRef,
  aggregation: query.aggregation,
  sourceKind: query.sourceKind || 'auto',
  subjectType: query.subject.type,
  serviceId: query.subject.type === 'service' ? query.subject.id || '' : '',
  groupBy: Array.isArray(query.groupBy) ? query.groupBy : [],
  limit: typeof query.limit === 'number' ? query.limit : null,
  type: undefined,
  metric: undefined
})

export const buildCustomDashboardPreviewRequest = (
  draft: CustomDashboardWidgetDraft,
  scope: MetricsDatasetScope,
  refreshGenerationId = `${Date.now()}`
): DashboardQueryRequest | null => {
  const query = buildCustomDashboardQuerySpec(draft, scope)
  if (!query) return null

  return {
    refreshGenerationId,
    context: {
      scope,
      timeRange: query.timeRange,
      autoRefresh: false
    },
    cards: [
      {
        cardId: 'custom-dashboard-preview',
        priority: 'high',
        query
      }
    ]
  }
}

export const validateCustomDashboardDraft = (draft: CustomDashboardWidgetDraft): QueryValidationResult => {
  const issues: string[] = []
  if (!draft.title.trim()) issues.push('组件名称不能为空')
  const normalized = normalizeLegacyDraft(draft)
  if (draft.type === 'alerts') {
    issues.push('告警列表暂不支持脚本预览')
  }
  if (!normalized.metricRef) issues.push('请输入或选择指标标识')
  if (normalized.subjectType === 'service' && !normalized.serviceId) {
    issues.push('请选择目标服务')
  }
  if (normalized.subjectType === 'instance') {
    issues.push('实例维度查询暂未开放，请先使用服务维度')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

export const createLocalCompiledScript = (draft: CustomDashboardWidgetDraft, scope: MetricsDatasetScope) => {
  const query = buildCustomDashboardQuerySpec(draft, scope)
  return JSON.stringify(
    {
      type: 'queryspec',
      version: 1,
      draft,
      query
    },
    null,
    2
  )
}

export const extractPreviewCardData = (payload: {
  items?: Array<{ cardId: string; data?: CardData; status: string }>
}) => {
  const item = payload?.items?.find((entry) => entry.cardId === 'custom-dashboard-preview')
  return item && (item.status === 'success' || item.status === 'partial') ? item.data || null : null
}
