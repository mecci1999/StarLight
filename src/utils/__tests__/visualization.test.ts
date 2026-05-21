import { describe, expect, it } from 'vitest'
import {
  aggregateValues,
  buildCategoryAggregation,
  buildSizeRows,
  parseVisualizationDataset,
  recommendComponents
} from '../visualization'
import type { ComponentDescriptor } from '../visualization'

describe('visualization utils', () => {
  it('parses metrics payload into dataset', () => {
    const payload = {
      metrics: [
        {
          name: 'cpu_usage',
          values: [
            { timestamp: 1700000000000, value: 42, labels: { service: 'api' } },
            { timestamp: 1700000060000, value: 45, labels: { service: 'api' } }
          ]
        }
      ]
    }
    const result = parseVisualizationDataset(payload, 'custom', '自定义数据')
    expect(result.dataset).not.toBeNull()
    expect(result.dataset?.records.length).toBe(2)
    expect(result.dataset?.fields.includes('metric')).toBe(true)
    expect(result.dataset?.fields.includes('timestamp')).toBe(true)
  })

  it('aggregates category values', () => {
    const records = [
      { category: 'A', value: 10 },
      { category: 'A', value: 15 },
      { category: 'B', value: 8 }
    ]
    const result = buildCategoryAggregation(records, 'category', 'value', 'sum')
    const a = result.find((item) => item.name === 'A')
    const b = result.find((item) => item.name === 'B')
    expect(a?.value).toBe(25)
    expect(b?.value).toBe(8)
  })

  it('aggregates numeric values', () => {
    const values = [2, 4, 6]
    expect(aggregateValues(values, 'sum')).toBe(12)
    expect(aggregateValues(values, 'avg')).toBe(4)
    expect(aggregateValues(values, 'max')).toBe(6)
    expect(aggregateValues(values, 'min')).toBe(2)
    expect(aggregateValues(values, 'last')).toBe(6)
  })

  it('builds size rows by layout rule', () => {
    const items = [
      { id: 'a', size: 'small' as const },
      { id: 'b', size: 'small' as const },
      { id: 'c', size: 'small' as const },
      { id: 'd', size: 'small' as const },
      { id: 'e', size: 'small' as const },
      { id: 'f', size: 'medium' as const },
      { id: 'g', size: 'medium' as const },
      { id: 'h', size: 'medium' as const },
      { id: 'i', size: 'large' as const }
    ]
    const rows = buildSizeRows(items)
    expect(rows.length).toBe(5)
    expect(rows[0].items.length).toBe(4)
    expect(rows[1].items.length).toBe(1)
    expect(rows[2].items.length).toBe(2)
    expect(rows[3].items.length).toBe(1)
    expect(rows[4].items.length).toBe(1)
  })

  it('recommends components by responsibility and data kind', () => {
    const components: ComponentDescriptor[] = [
      {
        id: 'cpu_trend',
        responsibility: 'system' as const,
        dataKind: 'timeseries' as const,
        goals: ['trend'],
        allowedSizes: ['large'],
        defaultSize: 'large' as const
      },
      {
        id: 'alert_stat',
        responsibility: 'alert' as const,
        dataKind: 'status' as const,
        goals: ['status'],
        allowedSizes: ['small'],
        defaultSize: 'small' as const
      }
    ]
    const result = recommendComponents(components, {
      responsibility: 'system',
      dataKind: 'timeseries',
      goal: 'trend'
    })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('cpu_trend')
  })

  it('recommends components by dataset signals', () => {
    const components: ComponentDescriptor[] = [
      {
        id: 'cpu_trend',
        responsibility: 'system' as const,
        dataKind: 'timeseries' as const,
        goals: ['trend'],
        allowedSizes: ['large'],
        defaultSize: 'large' as const
      },
      {
        id: 'alert_stat',
        responsibility: 'alert' as const,
        dataKind: 'status' as const,
        goals: ['status'],
        allowedSizes: ['small'],
        defaultSize: 'small' as const
      }
    ]
    const dataset = {
      id: 'custom',
      name: 'custom',
      fields: ['metric', 'timestamp', 'value', 'series'],
      records: [
        { metric: 'cpu', timestamp: 1700000000000, value: 1, series: 'svc-a' },
        { metric: 'cpu', timestamp: 1700000060000, value: 2, series: 'svc-a' }
      ]
    }
    const result = recommendComponents(components, { dataset, goal: 'trend' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('cpu_trend')
  })
})
