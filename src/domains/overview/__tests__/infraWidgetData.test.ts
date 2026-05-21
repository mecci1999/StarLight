import { describe, expect, it } from 'vitest'
import {
  aggregateInfraLatestValue,
  buildAggregatedInfraTrend,
  buildDarwinInstanceRows,
  resolveInfraServiceTarget
} from '../infraWidgetData'
import type { ServiceItem, ServiceInstance } from '@/types/monitor'

describe('infraWidgetData', () => {
  it('aggregates latest values for cpu/memory groups', () => {
    expect(
      aggregateInfraLatestValue([
        {
          name: 'a',
          data: [
            { timestamp: 1, value: 20 },
            { timestamp: 2, value: 40 }
          ]
        },
        {
          name: 'b',
          data: [
            { timestamp: 1, value: 50 },
            { timestamp: 2, value: 60 }
          ]
        }
      ])
    ).toBe(50)
  })

  it('builds aggregated trend by averaging each timestamp', () => {
    expect(
      buildAggregatedInfraTrend([
        {
          name: 'a',
          data: [
            { timestamp: 1, value: 20 },
            { timestamp: 2, value: 40 }
          ]
        },
        {
          name: 'b',
          data: [
            { timestamp: 1, value: 40 },
            { timestamp: 2, value: 60 }
          ]
        }
      ])
    ).toEqual([
      { timestamp: 1, value: 30 },
      { timestamp: 2, value: 50 }
    ])
  })

  it('resolves widget service id with widget first then global without implicit first-service fallback', () => {
    const services = [
      { id: 'svc-a', name: 'svc-a' },
      { id: 'svc-b', name: 'svc-b' }
    ] as ServiceItem[]
    expect(resolveInfraServiceTarget('svc-b', 'svc-a', services)).toBe('svc-b')
    expect(resolveInfraServiceTarget('', 'svc-a', services)).toBe('svc-a')
    expect(resolveInfraServiceTarget('', null, services)).toBe('')
    expect(resolveInfraServiceTarget('', null, services, { fallbackToFirst: true })).toBe('svc-a')
  })

  it('sorts and limits instance rows', () => {
    const rows = buildDarwinInstanceRows(
      [
        { id: 'a', cpu: 30, memory: 50, node: 'n1', status: 'running', serviceId: 'svc', startTime: '1' },
        { id: 'b', cpu: 80, memory: 20, node: 'n2', status: 'running', serviceId: 'svc', startTime: '2' },
        { id: 'c', cpu: 60, memory: 90, node: 'n3', status: 'running', serviceId: 'svc', startTime: '3' }
      ] as ServiceInstance[],
      'memory',
      2
    )

    expect(rows.map((row) => row.id)).toEqual(['c', 'a'])
  })
})
