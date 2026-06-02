import { describe, expect, it } from 'vitest'
import { buildOverviewWidgetQueryPreviewSpec } from '../overviewWidgetQueryPreviewModel'
import { SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF } from '@/domains/metrics/queryModel'
import type { OverviewPanelWidget } from '../panelModel'
import type { ServiceItem } from '@/types/monitor'

const services: ServiceItem[] = [
  { id: 'svc-1', name: 'gateway' } as ServiceItem,
  { id: 'svc-2', name: 'order-service' } as ServiceItem
]

describe('overviewWidgetQueryPreviewModel', () => {
  it('maps trend widgets to query specs', () => {
    const widget = {
      id: 'w1',
      title: 'QPS 趋势',
      kind: 'trend',
      size: 'L',
      capability: 'metrics',
      description: '',
      config: { metric: 'requests', aggregation: 'avg', groupBy: 'overall' },
      editor: { timeRange: '1h', visualization: 'line', displayedMetrics: ['requests'] }
    } as unknown as OverviewPanelWidget

    const result = buildOverviewWidgetQueryPreviewSpec({ widget, scope: 'system', scopedServiceName: null, services })
    expect(result.supported).toBe(true)
    expect(result.query?.metricRef).toBe('service.qps')
  })

  it('keeps legacy unsupported summary metrics unsupported in preview', () => {
    const widget = {
      id: 'w2',
      title: '服务总数',
      kind: 'metric-summary',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: { metricKey: 'service-count' },
      editor: { timeRange: '1h', visualization: 'number', displayedMetrics: ['service-count'] }
    } as unknown as OverviewPanelWidget

    const result = buildOverviewWidgetQueryPreviewSpec({ widget, scope: 'system', scopedServiceName: null, services })
    expect(result.supported).toBe(false)
  })

  it('rejects multi-metric or grouped trend previews that cannot be expressed safely', () => {
    const multiMetricWidget = {
      id: 'w5',
      title: '多指标摘要',
      kind: 'metric-summary',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: { metricKey: 'total-requests' },
      editor: { timeRange: '1h', visualization: 'bar', displayedMetrics: ['total-requests', 'error-rate'] }
    } as unknown as OverviewPanelWidget

    const groupedTrendWidget = {
      id: 'w6',
      title: '按环境趋势',
      kind: 'trend',
      size: 'L',
      capability: 'metrics',
      description: '',
      config: { metric: 'requests', aggregation: 'avg', groupBy: 'env' },
      editor: { timeRange: '1h', visualization: 'line', displayedMetrics: ['requests'] }
    } as unknown as OverviewPanelWidget

    expect(
      buildOverviewWidgetQueryPreviewSpec({
        widget: multiMetricWidget,
        scope: 'system',
        scopedServiceName: null,
        services
      }).supported
    ).toBe(false)
    expect(
      buildOverviewWidgetQueryPreviewSpec({
        widget: groupedTrendWidget,
        scope: 'system',
        scopedServiceName: null,
        services
      }).supported
    ).toBe(false)
  })

  it('maps darwin summary to system-scoped query when no service selected', () => {
    const widget = {
      id: 'w3',
      title: 'CPU',
      kind: 'darwin-infra-summary',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: { metric: 'cpu' },
      editor: { timeRange: '1h', visualization: 'number' }
    } as unknown as OverviewPanelWidget

    const result = buildOverviewWidgetQueryPreviewSpec({ widget, scope: 'system', scopedServiceName: null, services })
    expect(result.query?.subject).toEqual({ type: 'system' })
    expect(result.query?.sourceKind).toBe('darwin-event')
  })

  it('maps darwin memory summary and trend previews to memory usage percent', () => {
    const summaryWidget = {
      id: 'memory-summary',
      title: '内存使用率',
      kind: 'darwin-infra-summary',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: { metric: 'memory' },
      editor: { timeRange: '1h', visualization: 'donut' }
    } as unknown as OverviewPanelWidget

    const trendWidget = {
      ...summaryWidget,
      id: 'memory-trend',
      kind: 'darwin-infra-trend',
      editor: { timeRange: '1h', visualization: 'line' }
    } as unknown as OverviewPanelWidget

    expect(
      buildOverviewWidgetQueryPreviewSpec({ widget: summaryWidget, scope: 'system', scopedServiceName: null, services })
        .query?.metricRef
    ).toBe(SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF)
    expect(
      buildOverviewWidgetQueryPreviewSpec({ widget: trendWidget, scope: 'system', scopedServiceName: null, services })
        .query?.metricRef
    ).toBe(SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF)
  })

  it('passes query-card config through while applying shared time and display controls', () => {
    const widget = {
      id: 'query-1',
      title: '开放查询卡',
      kind: 'query-card',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'service', id: 'svc-1' },
          metricRef: SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
          aggregation: 'avg',
          timeRange: '-1h',
          visualizationHint: 'line'
        }
      },
      editor: { timeRange: '4h', visualization: 'bar' }
    } as unknown as OverviewPanelWidget

    const result = buildOverviewWidgetQueryPreviewSpec({ widget, scope: 'tenant', scopedServiceName: null, services })
    expect(result.supported).toBe(true)
    expect(result.query?.metricRef).toBe(SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF)
    expect(result.query?.subject).toEqual({ type: 'service', id: 'svc-1' })
    expect(result.query?.timeRange).toBe('-4h')
    expect(result.query?.visualizationHint).toBe('bar')
  })

  it('requires target service for darwin instance table', () => {
    const widget = {
      id: 'w4',
      title: '实例资源',
      kind: 'darwin-instance-table',
      size: 'L',
      capability: 'metrics',
      description: '',
      config: { limit: 6, sortBy: 'cpu' },
      editor: { timeRange: '1h', visualization: 'table' }
    } as unknown as OverviewPanelWidget

    const result = buildOverviewWidgetQueryPreviewSpec({ widget, scope: 'system', scopedServiceName: null, services })
    expect(result.supported).toBe(false)
    expect(result.reason).toContain('目标服务')
  })
})
