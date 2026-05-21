import { describe, expect, it } from 'vitest'
import {
  buildOverviewCardsQueryRequest,
  createEmptyOverviewPanel,
  mapQueryResultsByWidgetId
} from '../overviewRuntimeQueryModel'
import type { OverviewPanelWidget } from '../panelModel'
import type { ServiceItem } from '@/types/monitor'

const services: ServiceItem[] = [{ id: 'svc-1', name: 'gateway' } as ServiceItem]

describe('overviewRuntimeQueryModel', () => {
  it('creates an empty default overview panel', () => {
    expect(createEmptyOverviewPanel()).toMatchObject({
      id: 'user-overview',
      kind: 'user',
      widgets: []
    })
  })

  it('builds query cards only for query-supported widgets', () => {
    const widgets = [
      {
        id: 'query-1',
        title: '开放查询卡',
        kind: 'query-card',
        size: 'M',
        capability: 'metrics',
        description: '',
        config: {
          query: {
            scope: 'system',
            sourceKind: 'darwin-event',
            subject: { type: 'system' },
            metricRef: 'service.cpu.usage',
            aggregation: 'avg',
            timeRange: '-1h',
            visualizationHint: 'line'
          }
        },
        editor: { timeRange: '1h', visualization: 'line', displayedMetrics: [] }
      },
      {
        id: 'w1',
        title: '请求总量',
        kind: 'metric-summary',
        size: 'S',
        capability: 'metrics',
        description: '',
        config: { metricKey: 'total-requests' },
        editor: { timeRange: '1h', visualization: 'number', displayedMetrics: ['total-requests'] }
      },
      {
        id: 'w3',
        title: 'P95 延迟',
        kind: 'metric-summary',
        size: 'S',
        capability: 'metrics',
        description: '',
        config: { metricKey: 'p95-latency' },
        editor: { timeRange: '7d', visualization: 'number', displayedMetrics: ['p95-latency'] }
      },
      {
        id: 'w2',
        title: '风险服务',
        kind: 'risk-service',
        size: 'M',
        capability: 'serviceCatalog',
        description: '',
        config: { limit: 6 },
        editor: { timeRange: '1h', visualization: 'table', displayedMetrics: ['error-rate'] }
      }
    ] as unknown as OverviewPanelWidget[]

    const result = buildOverviewCardsQueryRequest({
      widgets,
      scope: 'system',
      scopedServiceName: null,
      services,
      refreshGenerationId: 'gen-1'
    })

    expect(result.request.refreshGenerationId).toBe('gen-1')
    expect(result.cards.map((item) => item.cardId)).toEqual(['query-1', 'w1', 'w3'])
    expect(result.requests).toHaveLength(2)
    expect(result.requests.map((request) => request.context.timeRange)).toEqual(['-1h', '-7d'])
  })

  it('maps query results by widget id', () => {
    expect(
      mapQueryResultsByWidgetId([
        { cardId: 'w1', status: 'success', data: { kind: 'number', value: 10 } as any },
        { cardId: 'w2', status: 'error', data: { kind: 'number', value: 20 } as any },
        { cardId: 'w3', status: 'partial', data: { kind: 'number', value: 30 } as any }
      ])
    ).toEqual({
      w1: { kind: 'number', value: 10 },
      w3: { kind: 'number', value: 30 }
    })
  })
})
