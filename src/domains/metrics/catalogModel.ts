export type MetricsCatalogSchemaItem = {
  name: string
  description: string
  type: string
  unit: string
  scope: Array<'tenant' | 'system'>
  sourceKind: 'sdk' | 'darwin-event' | 'mixed' | 'auto'
  subjectKinds: Array<'system' | 'service' | 'instance'>
  allowedAggregations: Array<'latest' | 'avg' | 'sum' | 'max' | 'p95'>
  recommendedVisualizations: Array<'number' | 'line' | 'bar' | 'table' | 'donut'>
  labelNames: string[]
  sampleLabels: Record<string, string[]>
  sampleCount: number
  lastSeenAt: number | null
  sourceServices: string[]
  recommendation: 'number' | 'line' | 'bar' | 'table'
}

export type MetricsCatalogSourceMode = 'schema' | 'empty' | 'unsupported'

export type MetricsCatalogFilters = {
  keyword: string
  type: string
  unit: string
  hasLabels: boolean
  serviceId: string
}

const recommendationFromItem = (
  item: MetricsCatalogSchemaItem,
  recommendedVisualizations?: string[]
): MetricsCatalogSchemaItem['recommendation'] => {
  const normalizedRecommended = Array.isArray(recommendedVisualizations)
    ? recommendedVisualizations.map((value) => String(value).toLowerCase())
    : []
  if (normalizedRecommended.includes('table')) return 'table'
  if (normalizedRecommended.includes('line')) return 'line'
  if (normalizedRecommended.includes('bar')) return 'bar'
  if (normalizedRecommended.includes('number') || normalizedRecommended.includes('donut')) return 'number'

  const metricName = item.name.toLowerCase()
  if (item.type === 'info') return 'table'
  if (metricName.includes('latency') || metricName.includes('duration') || metricName.includes('response'))
    return 'line'
  if (metricName.includes('cpu') || metricName.includes('memory') || metricName.includes('load')) return 'line'
  if (metricName.includes('status') || metricName.includes('state')) return 'number'
  if (item.labelNames.length > 0) return 'bar'
  return 'number'
}

const normalizeSampleLabels = (values: any[] = []) => {
  const buckets = new Map<string, Set<string>>()

  values.forEach((item) => {
    const labels = item?.labels || {}
    Object.entries(labels).forEach(([key, value]) => {
      if (!buckets.has(key)) buckets.set(key, new Set())
      buckets.get(key)!.add(String(value))
    })
  })

  return Object.fromEntries(
    Array.from(buckets.entries()).map(([key, valuesSet]) => [key, Array.from(valuesSet).slice(0, 5)])
  )
}

const normalizeSingleSchemaItem = (item: any): MetricsCatalogSchemaItem | null => {
  const name = String(item?.name || '').trim()
  if (!name) return null

  const values = Array.isArray(item?.values) ? item.values : []
  const timestamps = values
    .map((entry: any) => Number(entry?.timestamp))
    .filter((timestamp: number) => Number.isFinite(timestamp))
  const lastSeenAt = timestamps.length ? Math.max(...timestamps) : null

  const normalized: MetricsCatalogSchemaItem = {
    name,
    description: String(item?.description || '').trim() || '暂无描述',
    type: String(item?.type || 'unknown').trim() || 'unknown',
    unit: String(item?.unit || '').trim(),
    scope: Array.isArray(item?.scope)
      ? item.scope.filter((value: unknown): value is 'tenant' | 'system' => value === 'tenant' || value === 'system')
      : ['tenant'],
    sourceKind:
      item?.sourceKind === 'sdk' || item?.sourceKind === 'darwin-event' || item?.sourceKind === 'mixed'
        ? item.sourceKind
        : 'auto',
    subjectKinds: Array.isArray(item?.subjectKinds)
      ? item.subjectKinds.filter(
          (value: unknown): value is 'system' | 'service' | 'instance' =>
            value === 'system' || value === 'service' || value === 'instance'
        )
      : ['system'],
    allowedAggregations: Array.isArray(item?.allowedAggregations)
      ? item.allowedAggregations.filter(
          (value: unknown): value is 'latest' | 'avg' | 'sum' | 'max' | 'p95' =>
            value === 'latest' || value === 'avg' || value === 'sum' || value === 'max' || value === 'p95'
        )
      : ['latest', 'avg'],
    recommendedVisualizations: Array.isArray(item?.recommendedVisualizations)
      ? item.recommendedVisualizations.filter(
          (value: unknown): value is 'number' | 'line' | 'bar' | 'table' | 'donut' =>
            value === 'number' || value === 'line' || value === 'bar' || value === 'table' || value === 'donut'
        )
      : [],
    labelNames: Array.isArray(item?.labelNames) ? item.labelNames.map((value: any) => String(value)) : [],
    sampleLabels: normalizeSampleLabels(values),
    sampleCount: values.length,
    lastSeenAt,
    sourceServices: Array.isArray(item?.sourceServices)
      ? item.sourceServices.map((value: any) => String(value))
      : Array.isArray(item?.services)
        ? item.services.map((value: any) => String(value))
        : [],
    recommendation: 'number'
  }

  normalized.recommendation = recommendationFromItem(normalized, normalized.recommendedVisualizations)
  return normalized
}

const resolveSchemaItemsSource = (payload: any): any[] | null => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  return null
}

export const normalizeMetricsSchemaPayload = (payload: any): MetricsCatalogSchemaItem[] => {
  const source = resolveSchemaItemsSource(payload) || []

  return source
    .map(normalizeSingleSchemaItem)
    .filter((item: MetricsCatalogSchemaItem | null): item is MetricsCatalogSchemaItem => Boolean(item))
}

export const loadMetricsCatalogFallback = (payload: any) => {
  const source = resolveSchemaItemsSource(payload)
  if (!source) {
    if (payload == null) return { items: [], source: 'empty' as MetricsCatalogSourceMode }
    return { items: [], source: 'unsupported' as MetricsCatalogSourceMode }
  }

  const normalized = normalizeMetricsSchemaPayload(payload)
  if (normalized.length) return { items: normalized, source: 'schema' as MetricsCatalogSourceMode }
  return { items: [], source: 'empty' as MetricsCatalogSourceMode }
}

export const filterMetricsCatalog = (items: MetricsCatalogSchemaItem[], filters: MetricsCatalogFilters) => {
  const keyword = filters.keyword.trim().toLowerCase()
  return items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false
    if (filters.unit && item.unit !== filters.unit) return false
    if (filters.hasLabels && item.labelNames.length === 0) return false
    if (filters.serviceId && item.sourceServices.length > 0 && !item.sourceServices.includes(filters.serviceId))
      return false
    if (!keyword) return true

    const haystack = [
      item.name,
      item.description,
      item.type,
      item.unit,
      ...item.labelNames,
      ...Object.keys(item.sampleLabels)
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
}

export const collectMetricTypes = (items: MetricsCatalogSchemaItem[]) =>
  Array.from(new Set(items.map((item) => item.type).filter(Boolean))).sort()

export const collectMetricUnits = (items: MetricsCatalogSchemaItem[]) =>
  Array.from(new Set(items.map((item) => item.unit).filter(Boolean))).sort()

const supportedDashboardMetricMap: Array<{ includes: string[]; metric: string }> = [
  { includes: ['cpu'], metric: 'cpu' },
  { includes: ['memory', 'mem'], metric: 'memory' },
  { includes: ['response', 'latency', 'duration'], metric: 'response-time' },
  { includes: ['error'], metric: 'error-rate' },
  { includes: ['connection'], metric: 'connections' },
  { includes: ['qps', 'throughput', 'request.total', 'request.count'], metric: 'qps' }
]

const isTimeLikeUnit = (unit: string) => {
  const normalized = unit.toLowerCase()
  return ['millisecond', 'milliseconds', 'ms', 'second', 'seconds', 's'].includes(normalized)
}

export const mapMetricToDashboardPreset = (item: MetricsCatalogSchemaItem) => {
  const metricName = item.name.toLowerCase()
  const description = item.description.toLowerCase()

  if (
    metricName.includes('response') ||
    metricName.includes('latency') ||
    metricName.includes('duration') ||
    ((metricName.includes('time') || description.includes('耗时') || description.includes('延迟')) &&
      isTimeLikeUnit(item.unit))
  ) {
    return { metric: 'response-time', type: item.recommendation === 'line' ? 'trend' : 'stat' }
  }

  const matched = supportedDashboardMetricMap.find((rule) =>
    rule.includes.some((term) => metricName.includes(term) || description.includes(term))
  )
  if (!matched) return null

  return {
    metric: matched.metric,
    type: item.recommendation === 'line' ? 'trend' : 'stat'
  }
}
