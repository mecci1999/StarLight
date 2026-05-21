import type { MetricsAnalysisData, SeriesGroup } from '@/types/monitor'
import type { MetricsDatasetScope } from '@/api/metrics'

export const SERVICE_MEMORY_USAGE_METRIC_REF = 'service.memory.usage'
export const SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF = 'service.memory.usage.percent'

export type MetricSchema = {
  name: string
  description: string
  unit?: string
  type: 'gauge' | 'counter' | 'histogram' | 'summary' | 'info'
  scope: Array<'tenant' | 'system'>
  sourceKind: 'sdk' | 'darwin-event' | 'mixed'
  subjectKinds: Array<'system' | 'service' | 'instance'>
  allowedAggregations: Array<'latest' | 'avg' | 'sum' | 'max' | 'p95'>
  labelNames: string[]
  recommendedVisualizations: Array<'number' | 'line' | 'bar' | 'table' | 'donut'>
}

export type QuerySpec = {
  scope: 'tenant' | 'system'
  sourceKind?: 'sdk' | 'darwin-event' | 'auto'
  subject: {
    type: 'system' | 'service' | 'instance'
    id?: string
  }
  metricRef: string
  aggregation: 'latest' | 'avg' | 'sum' | 'max' | 'p95'
  groupBy?: string[]
  filters?: Record<string, string | string[]>
  compare?: 'previous-period' | 'same-period'
  timeRange: string
  granularity?: string
  limit?: number
  visualizationHint?: 'number' | 'line' | 'bar' | 'table' | 'donut'
  calculation?: {
    type: 'ratio'
    numerator: {
      metricRef: string
      aggregation?: 'latest' | 'avg' | 'sum' | 'max' | 'p95'
    }
    denominator: {
      metricRef: string
      aggregation?: 'latest' | 'avg' | 'sum' | 'max' | 'p95'
    }
    scale?: number
    unit?: string
  }
}

export type CardData =
  | {
      kind: 'number'
      value: number | null
      unit?: string
      compare?: { value: number; direction: 'up' | 'down' | 'flat' }
      meta?: Record<string, any>
    }
  | {
      kind: 'timeseries'
      series: Array<{ name: string; points: Array<{ timestamp: number; value: number }> }>
      unit?: string
    }
  | {
      kind: 'distribution'
      items: Array<{ name: string; value: number }>
      unit?: string
    }
  | {
      kind: 'table'
      columns: Array<{ key: string; label: string }>
      rows: Array<Record<string, any>>
    }

export type DashboardQueryRequest = {
  dashboardId?: string
  refreshGenerationId: string
  context: {
    scope: 'tenant' | 'system'
    timeRange: string
    granularity?: string
    autoRefresh?: boolean
  }
  cards: Array<{
    cardId: string
    priority?: 'high' | 'normal' | 'low'
    query: QuerySpec
  }>
}

export type DashboardQueryResponse = {
  refreshGenerationId: string
  items: Array<{
    cardId: string
    status: 'success' | 'partial' | 'timeout' | 'cancelled' | 'error'
    startedAt: number
    finishedAt: number
    data?: CardData
    error?: { code: string; message: string }
    cache?: { hit: boolean; ttlMs?: number }
  }>
}

export const METRICS_EXPLORER_CARD_IDS = {
  cpu: 'explorer-cpu',
  memory: 'explorer-memory',
  qps: 'explorer-qps',
  responseTime: 'explorer-response-time',
  requestStats: 'explorer-request-stats'
} as const

export type MetricsExplorerMetricPreset = keyof typeof METRICS_EXPLORER_CARD_IDS

export const resolveMetricsExplorerMetricPreset = (metricRef?: string | null): MetricsExplorerMetricPreset | null => {
  if (!metricRef) return null
  const normalized = metricRef.toLowerCase()
  if (normalized.includes('cpu')) return 'cpu'
  if (normalized.includes('memory') || normalized.includes('mem')) return 'memory'
  if (normalized.includes('response') || normalized.includes('latency') || normalized.includes('duration'))
    return 'responseTime'
  if (normalized.includes('request.stats') || normalized.includes('status.code') || normalized.includes('distribution'))
    return 'requestStats'
  if (
    normalized.includes('qps') ||
    normalized.includes('throughput') ||
    normalized.includes('request.total') ||
    normalized.includes('request.count')
  )
    return 'qps'
  return null
}

export const isMetricsExplorerMetricSupported = (metricRef?: string | null) =>
  Boolean(resolveMetricsExplorerMetricPreset(metricRef))

export const buildMetricsExplorerCardQueries = (params: {
  scope: MetricsDatasetScope
  serviceId?: string | null
  timeRange: string
  refreshGenerationId?: string
  metricRef?: string | null
}): DashboardQueryRequest => {
  const subject = params.serviceId ? { type: 'service' as const, id: params.serviceId } : { type: 'system' as const }
  const base = {
    scope: params.scope,
    sourceKind: 'auto' as const,
    subject,
    timeRange: params.timeRange
  }

  const cards: DashboardQueryRequest['cards'] = [
    {
      cardId: METRICS_EXPLORER_CARD_IDS.cpu,
      priority: 'high',
      query: { ...base, metricRef: 'service.cpu.usage', aggregation: 'avg', visualizationHint: 'line' }
    },
    {
      cardId: METRICS_EXPLORER_CARD_IDS.memory,
      priority: 'high',
      query: {
        ...base,
        metricRef: SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
        aggregation: 'avg',
        visualizationHint: 'line'
      }
    },
    {
      cardId: METRICS_EXPLORER_CARD_IDS.qps,
      priority: 'high',
      query: { ...base, metricRef: 'service.qps', aggregation: 'avg', visualizationHint: 'line' }
    },
    {
      cardId: METRICS_EXPLORER_CARD_IDS.responseTime,
      priority: 'high',
      query: { ...base, metricRef: 'service.response.time', aggregation: 'avg', visualizationHint: 'line' }
    },
    {
      cardId: METRICS_EXPLORER_CARD_IDS.requestStats,
      priority: 'normal',
      query: {
        ...base,
        metricRef: 'service.request.stats',
        aggregation: 'sum',
        groupBy: ['metric'],
        visualizationHint: 'bar'
      }
    }
  ]

  const focusPreset = resolveMetricsExplorerMetricPreset(params.metricRef)

  return {
    refreshGenerationId: params.refreshGenerationId || `${Date.now()}`,
    context: {
      scope: params.scope,
      timeRange: params.timeRange
    },
    cards: focusPreset ? cards.filter((card) => card.cardId === METRICS_EXPLORER_CARD_IDS[focusPreset]) : cards
  }
}

const toSeriesGroups = (data: CardData | undefined, fallbackName: string): SeriesGroup[] => {
  if (!data || data.kind !== 'timeseries') return []
  return data.series.map((series) => ({
    name: series.name || fallbackName,
    data: series.points || []
  }))
}

const findCardData = (response: DashboardQueryResponse | null, cardId: string) =>
  response?.items.find((item) => item.cardId === cardId && (item.status === 'success' || item.status === 'partial'))
    ?.data

export const adaptCardResultsToMetricsAnalysisData = (response: DashboardQueryResponse | null): MetricsAnalysisData => {
  const requestStats = findCardData(response, METRICS_EXPLORER_CARD_IDS.requestStats)
  return {
    series: {
      cpu: toSeriesGroups(findCardData(response, METRICS_EXPLORER_CARD_IDS.cpu), 'CPU'),
      memory: toSeriesGroups(findCardData(response, METRICS_EXPLORER_CARD_IDS.memory), '内存'),
      qps: toSeriesGroups(findCardData(response, METRICS_EXPLORER_CARD_IDS.qps), 'QPS'),
      responseTime: toSeriesGroups(findCardData(response, METRICS_EXPLORER_CARD_IDS.responseTime), '响应时间')
    },
    requestStats:
      requestStats && requestStats.kind === 'distribution'
        ? requestStats.items.map((item) => ({ name: item.name, value: item.value }))
        : [],
    services: []
  }
}

export const hasUsableMetricsExplorerCardResults = (response: DashboardQueryResponse | null) => {
  if (!response?.items?.length) return false

  return response.items.some((item) => {
    if ((item.status !== 'success' && item.status !== 'partial') || !item.data) return false
    if (item.data.kind === 'timeseries') {
      return item.data.series.some((series) => Array.isArray(series.points) && series.points.length > 0)
    }
    if (item.data.kind === 'distribution') {
      return Array.isArray(item.data.items) && item.data.items.length > 0
    }
    if (item.data.kind === 'table') {
      return Array.isArray(item.data.rows) && item.data.rows.length > 0
    }
    return item.data.kind === 'number' && item.data.value !== null
  })
}
