import { describe, expect, it } from 'vitest'
import { buildLocalCompileFallback, buildLocalValidateFallback, isQueryCapabilityUnsupported } from '../metrics'
import type { QuerySpec } from '@/domains/metrics/queryModel'

describe('metrics preview adapters', () => {
  const sampleQuery: QuerySpec = {
    scope: 'system',
    sourceKind: 'auto',
    subject: { type: 'system' },
    metricRef: 'service.cpu.usage',
    aggregation: 'avg',
    timeRange: '-1h',
    visualizationHint: 'line'
  }

  it('treats supported:false as unsupported capability', () => {
    expect(isQueryCapabilityUnsupported({ supported: false })).toBe(true)
    expect(isQueryCapabilityUnsupported({ supported: true })).toBe(false)
    expect(isQueryCapabilityUnsupported({})).toBe(false)
  })

  it('builds local compile fallback from queryspec', () => {
    const fallback = buildLocalCompileFallback(sampleQuery)
    expect(fallback.supported).toBe(false)
    expect(fallback.language).toBe('queryspec-json')
    expect(fallback.script).toContain('service.cpu.usage')
  })

  it('builds local validate fallback', () => {
    expect(buildLocalValidateFallback()).toEqual({
      supported: false,
      valid: true,
      issues: []
    })
  })
})
