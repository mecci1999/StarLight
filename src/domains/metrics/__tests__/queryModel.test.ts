import { describe, expect, it } from 'vitest'
import {
  SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
  METRICS_EXPLORER_CARD_IDS,
  adaptCardResultsToMetricsAnalysisData,
  buildMetricsExplorerCardQueries,
  hasUsableMetricsExplorerCardResults,
  isMetricsExplorerMetricSupported,
  type DashboardQueryResponse
} from '../queryModel'

describe('queryModel', () => {
  it('builds metrics explorer batch queries with stable card ids', () => {
    const request = buildMetricsExplorerCardQueries({
      scope: 'system',
      serviceId: 'svc-1',
      timeRange: '-1h',
      refreshGenerationId: 'gen-1'
    })

    expect(request.refreshGenerationId).toBe('gen-1')
    expect(request.cards.map((card) => card.cardId)).toEqual([
      METRICS_EXPLORER_CARD_IDS.cpu,
      METRICS_EXPLORER_CARD_IDS.memory,
      METRICS_EXPLORER_CARD_IDS.qps,
      METRICS_EXPLORER_CARD_IDS.responseTime,
      METRICS_EXPLORER_CARD_IDS.requestStats
    ])
    const cpuCard = request.cards.find((card) => card.cardId === METRICS_EXPLORER_CARD_IDS.cpu)
    const memoryCard = request.cards.find((card) => card.cardId === METRICS_EXPLORER_CARD_IDS.memory)
    expect(cpuCard?.query.display?.value).toEqual({ min: 0, max: 100, unit: '%' })
    expect(memoryCard?.query.metricRef).toBe(SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF)
    expect(memoryCard?.query.display?.value).toEqual({ min: 0, max: 100, unit: '%' })
    expect(request.cards[0].query.subject).toEqual({ type: 'service', id: 'svc-1' })
  })

  it('narrows explorer card queries when a specific metric is requested', () => {
    const request = buildMetricsExplorerCardQueries({
      scope: 'tenant',
      serviceId: 'svc-1',
      timeRange: '-1h',
      metricRef: 'service.qps'
    })

    expect(request.cards.map((card) => card.cardId)).toEqual([METRICS_EXPLORER_CARD_IDS.qps])
  })

  it('marks explorer-only supported metrics accurately', () => {
    expect(isMetricsExplorerMetricSupported('service.qps')).toBe(true)
    expect(isMetricsExplorerMetricSupported('service.error.rate')).toBe(false)
  })

  it('detects usable card results correctly', () => {
    expect(hasUsableMetricsExplorerCardResults(null)).toBe(false)
    expect(
      hasUsableMetricsExplorerCardResults({
        refreshGenerationId: 'gen-1',
        items: [
          {
            cardId: METRICS_EXPLORER_CARD_IDS.cpu,
            status: 'error',
            startedAt: 1,
            finishedAt: 2,
            error: { code: 'ERR', message: 'failed' }
          }
        ]
      })
    ).toBe(false)
    expect(
      hasUsableMetricsExplorerCardResults({
        refreshGenerationId: 'gen-1',
        items: [
          {
            cardId: METRICS_EXPLORER_CARD_IDS.cpu,
            status: 'partial',
            startedAt: 1,
            finishedAt: 2,
            data: {
              kind: 'timeseries',
              series: [{ name: 'CPU', points: [{ timestamp: 1, value: 20 }] }]
            }
          }
        ]
      })
    ).toBe(true)
  })

  it('adapts card query results into legacy metrics analysis data shape', () => {
    const response: DashboardQueryResponse = {
      refreshGenerationId: 'gen-1',
      items: [
        {
          cardId: METRICS_EXPLORER_CARD_IDS.cpu,
          status: 'success',
          startedAt: 1,
          finishedAt: 2,
          data: {
            kind: 'timeseries',
            series: [{ name: 'CPU', points: [{ timestamp: 1, value: 20 }] }]
          }
        },
        {
          cardId: METRICS_EXPLORER_CARD_IDS.requestStats,
          status: 'success',
          startedAt: 1,
          finishedAt: 2,
          data: {
            kind: 'distribution',
            items: [{ name: '2xx', value: 12 }]
          }
        }
      ]
    }

    const result = adaptCardResultsToMetricsAnalysisData(response)
    expect(result.series.cpu[0].name).toBe('CPU')
    expect(result.series.cpu[0].data[0].value).toBe(20)
    expect(result.requestStats).toEqual([{ name: '2xx', value: 12 }])
    expect(result.series.qps).toEqual([])
  })
})
