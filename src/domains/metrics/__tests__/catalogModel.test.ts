import { describe, expect, it } from 'vitest'
import {
  collectMetricTypes,
  collectMetricUnits,
  filterMetricsCatalog,
  loadMetricsCatalogFallback,
  mapMetricToDashboardPreset,
  normalizeMetricsSchemaPayload,
  type MetricsCatalogSchemaItem
} from '../catalogModel'

describe('catalogModel', () => {
  it('normalizes schema payload into flat catalog items', () => {
    const items = normalizeMetricsSchemaPayload({
      content: [
        {
          name: 'process.memory.heap.size.used',
          description: 'used heap',
          type: 'gauge',
          unit: 'byte',
          labelNames: ['space'],
          values: [{ timestamp: 1, labels: { space: 'old' }, value: 1 }]
        }
      ]
    })

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('process.memory.heap.size.used')
    expect(items[0].sampleLabels.space).toEqual(['old'])
    expect(items[0].sampleCount).toBe(1)
  })

  it('accepts v2 metric schema shape and respects recommended visualizations', () => {
    const items = normalizeMetricsSchemaPayload({
      items: [
        {
          name: 'service.qps',
          description: 'query per second',
          type: 'gauge',
          unit: 'count/s',
          scope: ['tenant', 'system'],
          sourceKind: 'sdk',
          subjectKinds: ['service'],
          allowedAggregations: ['avg', 'sum'],
          labelNames: ['service'],
          sourceServices: ['svc-1'],
          recommendedVisualizations: ['line', 'bar']
        }
      ]
    })

    expect(items[0].recommendation).toBe('line')
    expect(items[0].sourceServices).toEqual(['svc-1'])
    expect(items[0].scope).toEqual(['tenant', 'system'])
    expect(items[0].sourceKind).toBe('sdk')
    expect(items[0].subjectKinds).toEqual(['service'])
    expect(items[0].allowedAggregations).toEqual(['avg', 'sum'])
    expect(items[0].recommendedVisualizations).toEqual(['line', 'bar'])
  })

  it('accepts nested data.items schema payloads', () => {
    const items = normalizeMetricsSchemaPayload({
      data: {
        items: [
          {
            name: 'service.cpu.usage',
            description: 'cpu usage',
            type: 'gauge',
            unit: 'percent',
            labelNames: ['service']
          }
        ]
      }
    })

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('service.cpu.usage')
  })

  it('falls back to mock metrics when payload is empty', () => {
    const result = loadMetricsCatalogFallback(null)
    expect(result.source).toBe('empty')
    expect(result.items).toEqual([])
  })

  it('marks unsupported schema envelopes separately from empty data', () => {
    const result = loadMetricsCatalogFallback({ success: true, data: { result: [] } })
    expect(result.source).toBe('unsupported')
    expect(result.items).toEqual([])
  })

  it('filters metrics by keyword/type/unit/labels', () => {
    const items: MetricsCatalogSchemaItem[] = [
      {
        name: 'cpu.usage',
        description: 'cpu usage',
        type: 'gauge',
        unit: 'percent',
        scope: ['tenant'],
        sourceKind: 'sdk',
        subjectKinds: ['service'],
        allowedAggregations: ['avg'],
        recommendedVisualizations: ['line'],
        labelNames: ['service'],
        sampleLabels: { service: ['gateway'] },
        sampleCount: 2,
        lastSeenAt: 1,
        sourceServices: [],
        recommendation: 'line'
      },
      {
        name: 'request.total',
        description: 'request total',
        type: 'counter',
        unit: 'count',
        scope: ['tenant'],
        sourceKind: 'sdk',
        subjectKinds: ['service'],
        allowedAggregations: ['sum'],
        recommendedVisualizations: ['number'],
        labelNames: [],
        sampleLabels: {},
        sampleCount: 2,
        lastSeenAt: 1,
        sourceServices: [],
        recommendation: 'number'
      }
    ]

    expect(
      filterMetricsCatalog(items, { keyword: 'cpu', type: '', unit: '', hasLabels: false, serviceId: '' })
    ).toHaveLength(1)
    expect(
      filterMetricsCatalog(items, { keyword: '', type: 'gauge', unit: 'percent', hasLabels: true, serviceId: '' })
    ).toHaveLength(1)
  })

  it('collects sorted types and units', () => {
    const items: MetricsCatalogSchemaItem[] = [
      {
        name: 'cpu.usage',
        description: '',
        type: 'gauge',
        unit: 'percent',
        scope: ['tenant'],
        sourceKind: 'sdk',
        subjectKinds: ['service'],
        allowedAggregations: ['avg'],
        recommendedVisualizations: ['line'],
        labelNames: [],
        sampleLabels: {},
        sampleCount: 0,
        lastSeenAt: null,
        sourceServices: [],
        recommendation: 'line'
      },
      {
        name: 'request.total',
        description: '',
        type: 'counter',
        unit: 'count',
        scope: ['tenant'],
        sourceKind: 'sdk',
        subjectKinds: ['service'],
        allowedAggregations: ['sum'],
        recommendedVisualizations: ['number'],
        labelNames: [],
        sampleLabels: {},
        sampleCount: 0,
        lastSeenAt: null,
        sourceServices: [],
        recommendation: 'number'
      }
    ]

    expect(collectMetricTypes(items)).toEqual(['counter', 'gauge'])
    expect(collectMetricUnits(items)).toEqual(['count', 'percent'])
  })

  it('maps known metrics to dashboard presets', () => {
    expect(
      mapMetricToDashboardPreset({
        name: 'process.memory.heap.size.used',
        description: '',
        type: 'gauge',
        unit: 'byte',
        scope: ['tenant'],
        sourceKind: 'sdk',
        subjectKinds: ['service'],
        allowedAggregations: ['avg'],
        recommendedVisualizations: ['line'],
        labelNames: [],
        sampleLabels: {},
        sampleCount: 0,
        lastSeenAt: null,
        sourceServices: [],
        recommendation: 'line'
      })
    ).toEqual({ metric: 'memory', type: 'trend' })
  })
})
