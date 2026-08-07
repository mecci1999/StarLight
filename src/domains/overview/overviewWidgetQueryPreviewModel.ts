import type { MetricsDatasetScope } from '@/api/metrics'
import { SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF, type QuerySpec } from '@/domains/metrics/queryModel'
import type {
  DarwinInfraSummaryConfig,
  DarwinInfraTrendConfig,
  DarwinInstanceTableConfig,
  OverviewPanelWidget,
  OverviewWidgetDisplayMetricKey,
  TrendConfig
} from '@/domains/overview/panelModel'
import type { ServiceItem } from '@/types/monitor'

export type OverviewWidgetQueryPreviewSupport = {
  supported: boolean
  reason?: string
  query?: QuerySpec
}

const trendMetricMap = {
  requests: 'service.qps',
  errors: 'service.error.rate',
  latency: 'service.response.time'
} as const

const metricSummaryMap: Partial<Record<OverviewWidgetDisplayMetricKey, string>> = {
  'total-requests': 'service.qps',
  'error-rate': 'service.error.rate',
  'p95-latency': 'service.response.time'
}

const visualizationHintFromWidget = (widget: OverviewPanelWidget): QuerySpec['visualizationHint'] => {
  const visualization = widget.editor?.visualization
  if (visualization === 'line' || visualization === 'bar' || visualization === 'table' || visualization === 'donut') {
    return visualization
  }
  return 'number'
}

const resolveEffectiveDisplayedMetrics = (widget: OverviewPanelWidget) => {
  const displayedMetrics = widget.editor?.displayedMetrics || []
  if (displayedMetrics.length) return displayedMetrics

  if (widget.kind === 'metric-summary') {
    return [(widget.config as any).metricKey as OverviewWidgetDisplayMetricKey]
  }
  if (widget.kind === 'trend') {
    return [(widget.config as TrendConfig).metric as OverviewWidgetDisplayMetricKey]
  }

  return []
}

const resolveScopedServiceId = (serviceName: string | null, services: ServiceItem[]) => {
  if (!serviceName) return undefined
  return services.find((service) => service.name === serviceName)?.id
}

const resolveDarwinServiceId = (
  explicitServiceId: string | undefined,
  scopedServiceId: string | undefined,
  services: ServiceItem[]
) => {
  if (explicitServiceId) return explicitServiceId
  return scopedServiceId
}

export const buildOverviewWidgetQueryPreviewSpec = (params: {
  widget: OverviewPanelWidget
  scope: MetricsDatasetScope
  scopedServiceName: string | null
  services: ServiceItem[]
}): OverviewWidgetQueryPreviewSupport => {
  const { widget, scope, scopedServiceName, services } = params
  const scopedServiceId = resolveScopedServiceId(scopedServiceName, services)
  const editorTimeRange = widget.editor?.timeRange ? `-${widget.editor.timeRange}` : '-1h'
  const visualizationHint = visualizationHintFromWidget(widget)

  if (widget.kind === 'query-card') {
    const query = (widget.config as any)?.query as QuerySpec | undefined
    if (!query?.metricRef) {
      return { supported: false, reason: '开放查询卡缺少 metricRef' }
    }

    return {
      supported: true,
      query: {
        ...query,
        scope: query.scope || scope,
        timeRange: editorTimeRange,
        visualizationHint,
        subject:
          query.subject?.type === 'service' && !query.subject?.id && scopedServiceId
            ? { ...query.subject, id: scopedServiceId }
            : query.subject
      }
    }
  }

  if (widget.kind === 'trend') {
    const config = widget.config as TrendConfig
    const displayedMetrics = resolveEffectiveDisplayedMetrics(widget)
    if (displayedMetrics.length !== 1) {
      return { supported: false, reason: '当前趋势卡仅支持单指标查询预览' }
    }
    if (config.groupBy && config.groupBy !== 'overall') {
      return { supported: false, reason: '当前分组趋势卡暂不支持脚本预览' }
    }
    const metricRef = trendMetricMap[displayedMetrics[0] as keyof typeof trendMetricMap]
    if (!metricRef) {
      return { supported: false, reason: '当前趋势指标暂不支持查询预览' }
    }
    return {
      supported: true,
      query: {
        scope,
        sourceKind: 'auto',
        subject: scopedServiceId ? { type: 'service', id: scopedServiceId } : { type: 'system' },
        metricRef,
        aggregation: config.aggregation === 'rate' ? 'avg' : (config.aggregation as QuerySpec['aggregation']) || 'avg',
        timeRange: editorTimeRange,
        visualizationHint,
        groupBy: config.groupBy && config.groupBy !== 'overall' ? [config.groupBy] : undefined
      }
    }
  }

  if (widget.kind === 'metric-summary') {
    const displayedMetrics = resolveEffectiveDisplayedMetrics(widget)
    if (displayedMetrics.length !== 1) {
      return { supported: false, reason: '当前摘要卡仅支持单指标查询预览' }
    }
    const metricKey = displayedMetrics[0]
    const metricRef = metricKey ? metricSummaryMap[metricKey] : undefined
    if (!metricRef) {
      return { supported: false, reason: '当前摘要卡片暂不支持脚本预览' }
    }
    return {
      supported: true,
      query: {
        scope,
        sourceKind: 'auto',
        subject: scopedServiceId ? { type: 'service', id: scopedServiceId } : { type: 'system' },
        metricRef,
        aggregation: metricKey === 'p95-latency' ? 'p95' : visualizationHint === 'number' ? 'latest' : 'avg',
        timeRange: editorTimeRange,
        visualizationHint
      }
    }
  }

  if (widget.kind === 'darwin-infra-summary') {
    const config = widget.config as DarwinInfraSummaryConfig
    const metricRef = config.metric === 'cpu' ? 'service.cpu.usage' : SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF
    const serviceId = resolveDarwinServiceId(config.serviceId, scopedServiceId, services)
    return {
      supported: true,
      query: {
        scope,
        sourceKind: 'darwin-event',
        subject: serviceId ? { type: 'service', id: serviceId } : { type: 'system' },
        metricRef,
        aggregation: (config.aggregation as QuerySpec['aggregation']) || 'avg',
        timeRange: editorTimeRange,
        visualizationHint
      }
    }
  }

  if (widget.kind === 'darwin-infra-trend') {
    const config = widget.config as DarwinInfraTrendConfig
    const metricRef = config.metric === 'cpu' ? 'service.cpu.usage' : SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF
    const serviceId = resolveDarwinServiceId(config.serviceId, scopedServiceId, services)
    return {
      supported: true,
      query: {
        scope,
        sourceKind: 'darwin-event',
        subject: serviceId ? { type: 'service', id: serviceId } : { type: 'system' },
        metricRef,
        aggregation: 'avg',
        timeRange: editorTimeRange,
        visualizationHint
      }
    }
  }

  if (widget.kind === 'darwin-instance-table') {
    const config = widget.config as DarwinInstanceTableConfig
    const serviceId = resolveDarwinServiceId(config.serviceId, scopedServiceId, services)
    if (!serviceId) {
      return { supported: false, reason: '实例资源预览需要先选择目标服务' }
    }
    return {
      supported: true,
      query: {
        scope,
        sourceKind: 'darwin-event',
        subject: { type: 'service', id: serviceId },
        metricRef: config.sortBy === 'memory' ? 'instance.memory.usage' : 'instance.cpu.usage',
        aggregation: 'latest',
        timeRange: editorTimeRange,
        visualizationHint: 'table',
        groupBy: ['instanceId'],
        limit: config.limit || 6
      }
    }
  }

  return { supported: false, reason: '当前卡片类型暂不支持查询预览' }
}
