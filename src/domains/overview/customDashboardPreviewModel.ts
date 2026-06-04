import type { MetricsDatasetScope } from '@/api/metrics'
import {
  SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
  type CardData,
  type DashboardQueryRequest,
  type QueryAlertRule,
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
  displayMin?: number | null
  displayMax?: number | null
  displayUnit?: string
  alertEnabled?: boolean
  alertOperator?: NonNullable<QuerySpec['alert']>['operator']
  alertThreshold?: number | null
  alertDuration?: number | null
  alertLevel?: NonNullable<QuerySpec['alert']>['level']
  alertChannels?: string[]
  alertRules?: QueryAlertRule[]
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
  displayMin: 0,
  displayMax: 100,
  displayUnit: '%',
  alertEnabled: false,
  alertOperator: '>',
  alertThreshold: null,
  alertDuration: 5,
  alertLevel: 'warning',
  alertChannels: ['Email'],
  alertRules: [
    { level: 'warning', operator: '>', threshold: 85, unit: '%', duration: 5, channels: ['Email'] },
    { level: 'critical', operator: '>', threshold: 95, unit: '%', duration: 3, channels: ['Email'] }
  ],
  type: 'trend',
  metric: 'cpu'
})

const isPercentMetricRef = (metricRef: string) => {
  const normalized = metricRef.toLowerCase()
  return normalized.includes('cpu') || normalized.includes('percent') || normalized.includes('rate')
}

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
  const displayMin = typeof draft.displayMin === 'number' ? draft.displayMin : undefined
  const displayMax = typeof draft.displayMax === 'number' ? draft.displayMax : undefined
  const displayUnit = typeof draft.displayUnit === 'string' ? draft.displayUnit.trim() : ''
  const alertThreshold = typeof draft.alertThreshold === 'number' ? draft.alertThreshold : undefined
  const alertDuration =
    typeof draft.alertDuration === 'number' && draft.alertDuration > 0 ? draft.alertDuration : undefined
  const alertRules = Array.isArray(draft.alertRules)
    ? draft.alertRules
        .filter((rule) => typeof rule.threshold === 'number' && Number.isFinite(rule.threshold))
        .map((rule) => ({
          ...rule,
          operator: rule.operator || draft.alertOperator || '>',
          unit: typeof rule.unit === 'string' ? rule.unit : displayUnit,
          duration: typeof rule.duration === 'number' && rule.duration > 0 ? rule.duration : alertDuration || 5,
          channels: rule.channels?.length
            ? rule.channels
            : draft.alertChannels?.length
              ? draft.alertChannels
              : ['Email']
        }))
    : []

  return {
    visualization,
    metricRef,
    aggregation,
    sourceKind,
    timeRange,
    subjectType,
    serviceId,
    groupBy,
    limit,
    displayMin,
    displayMax,
    displayUnit,
    alertThreshold,
    alertDuration,
    alertRules
  }
}

const buildFallbackAlertRules = (
  draft: CustomDashboardWidgetDraft,
  normalized: ReturnType<typeof normalizeLegacyDraft>,
  unit: string
): QueryAlertRule[] => {
  if (normalized.alertRules.length) return normalized.alertRules
  if (normalized.alertThreshold === undefined) return []

  return [
    {
      level: draft.alertLevel || 'warning',
      operator: draft.alertOperator || '>',
      threshold: normalized.alertThreshold,
      ...(unit ? { unit } : {}),
      duration: normalized.alertDuration || 5,
      channels: draft.alertChannels?.length ? draft.alertChannels : ['Email']
    }
  ]
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
  const displayUnit = normalized.displayUnit || (isPercentMetricRef(normalized.metricRef) ? '%' : '')
  const hasDisplayValue =
    normalized.displayMin !== undefined || normalized.displayMax !== undefined || Boolean(displayUnit)
  const alertRules = buildFallbackAlertRules(draft, normalized, displayUnit)
  const alertEnabled = Boolean(draft.alertEnabled && alertRules.length)
  const primaryAlertRule = alertRules.find((rule) => rule.level === 'warning') || alertRules[0]

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
    limit: normalized.limit,
    display: hasDisplayValue
      ? {
          value: {
            ...(normalized.displayMin !== undefined ? { min: normalized.displayMin } : {}),
            ...(normalized.displayMax !== undefined ? { max: normalized.displayMax } : {}),
            ...(displayUnit ? { unit: displayUnit } : {})
          }
        }
      : undefined,
    alert: alertEnabled
      ? {
          enabled: true,
          ruleId: primaryAlertRule.ruleId,
          operator: primaryAlertRule.operator || '>',
          threshold: primaryAlertRule.threshold,
          ...(displayUnit ? { unit: displayUnit } : {}),
          duration: primaryAlertRule.duration || 5,
          level: primaryAlertRule.level || 'warning',
          channels: primaryAlertRule.channels?.length ? primaryAlertRule.channels : ['Email'],
          rules: alertRules
        }
      : undefined
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

const isDisplayConfigLike = (value: unknown): value is NonNullable<QuerySpec['display']> => {
  if (!isRecord(value)) return false
  if (value.value !== undefined) {
    if (!isRecord(value.value)) return false
    const { min, max, unit } = value.value
    if (min !== undefined && typeof min !== 'number') return false
    if (max !== undefined && typeof max !== 'number') return false
    if (unit !== undefined && typeof unit !== 'string') return false
  }
  if (value.yAxis === undefined) return true
  if (!isRecord(value.yAxis)) return false
  const { min, max, unit } = value.yAxis
  if (min !== undefined && typeof min !== 'number') return false
  if (max !== undefined && typeof max !== 'number') return false
  if (unit !== undefined && typeof unit !== 'string') return false
  return true
}

const isAlertConfigLike = (value: unknown): value is NonNullable<QuerySpec['alert']> => {
  if (!isRecord(value)) return false
  if (typeof value.enabled !== 'boolean') return false
  if (value.operator !== undefined && !['>', '<', '=', '>=', '<='].includes(String(value.operator))) return false
  if (value.threshold !== undefined && typeof value.threshold !== 'number') return false
  if (value.unit !== undefined && typeof value.unit !== 'string') return false
  if (value.duration !== undefined && typeof value.duration !== 'number') return false
  if (value.level !== undefined && !['critical', 'warning', 'info'].includes(String(value.level))) return false
  if (value.channels !== undefined && !Array.isArray(value.channels)) return false
  if (value.rules !== undefined) {
    if (!Array.isArray(value.rules)) return false
    const validRules = value.rules.every((rule) => {
      if (!isRecord(rule)) return false
      if (!['critical', 'warning', 'info'].includes(String(rule.level))) return false
      if (!['>', '<', '=', '>=', '<='].includes(String(rule.operator))) return false
      if (typeof rule.threshold !== 'number') return false
      if (rule.unit !== undefined && typeof rule.unit !== 'string') return false
      if (rule.duration !== undefined && typeof rule.duration !== 'number') return false
      if (rule.channels !== undefined && !Array.isArray(rule.channels)) return false
      return true
    })
    if (!validRules) return false
  }
  if (value.enabled && value.threshold === undefined && !Array.isArray(value.rules)) return false
  return true
}

const isCompareConfigLike = (value: unknown): value is NonNullable<QuerySpec['compare']> => {
  if (value === undefined) return true
  if (value === 'previous-period' || value === 'same-period') return true
  if (!isRecord(value)) return false
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') return false
  if (!['previous-period', 'previous-day', 'previous-week'].includes(String(value.mode))) return false
  if (value.display !== undefined && !['relative', 'absolute', 'both'].includes(String(value.display))) return false
  if (
    value.directionality !== undefined &&
    !['increase_better', 'decrease_better', 'neutral'].includes(String(value.directionality))
  )
    return false
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
  if (value.display && !isDisplayConfigLike(value.display)) return false
  if (value.alert && !isAlertConfigLike(value.alert)) return false
  if (!isCompareConfigLike(value.compare)) return false
  return true
}

export const extractQuerySpecFromJson = (payload: unknown): QuerySpec | null => {
  if (isQuerySpecLike(payload)) return payload
  if (!isRecord(payload)) return null

  const envelope = payload as QuerySpecJsonEnvelope
  if (isQuerySpecLike(envelope.query)) return envelope.query
  if (isQuerySpecLike(envelope.config?.query)) return envelope.config.query

  const queryspec = payload.queryspec
  if (isQuerySpecLike(queryspec)) return queryspec
  if (isRecord(queryspec) && isQuerySpecLike(queryspec.query)) return queryspec.query

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
): CustomDashboardWidgetDraft => {
  const alertRules = query.alert?.rules?.length
    ? query.alert.rules
    : query.alert?.enabled && typeof query.alert.threshold === 'number'
      ? [
          {
            ruleId: query.alert.ruleId,
            level: query.alert.level || 'warning',
            operator: query.alert.operator || '>',
            threshold: query.alert.threshold,
            unit: query.alert.unit,
            duration: query.alert.duration || 5,
            channels: query.alert.channels || ['Email']
          }
        ]
      : currentDraft.alertRules || []
  const primaryRule = alertRules.find((rule) => rule.level === 'warning') || alertRules[0]

  return {
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
    displayMin: query.display?.value?.min ?? query.display?.yAxis?.min ?? null,
    displayMax: query.display?.value?.max ?? query.display?.yAxis?.max ?? null,
    displayUnit: query.display?.value?.unit ?? query.display?.yAxis?.unit ?? currentDraft.displayUnit ?? '',
    alertEnabled: query.alert?.enabled ?? false,
    alertOperator: primaryRule?.operator || currentDraft.alertOperator || '>',
    alertThreshold: primaryRule?.threshold ?? null,
    alertDuration: primaryRule?.duration ?? currentDraft.alertDuration ?? 5,
    alertLevel: primaryRule?.level || currentDraft.alertLevel || 'warning',
    alertChannels: primaryRule?.channels || currentDraft.alertChannels || ['Email'],
    alertRules,
    type: undefined,
    metric: undefined
  }
}

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
  if (draft.alertEnabled && !normalized.alertRules.length && normalized.alertThreshold === undefined) {
    issues.push('启用告警时需要填写触发阈值')
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
