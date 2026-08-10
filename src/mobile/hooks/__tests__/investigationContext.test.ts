import { describe, expect, it } from 'vitest'
import { investigationQuery, parseInvestigationContext, resolveInvestigationWindow } from '../investigationContext'

describe('investigation context', () => {
  it('accepts only validated inv fields and gives an absolute window precedence over a range', () => {
    expect(
      parseInvestigationContext({
        invServiceId: 'service-1',
        invServiceName: 'checkout',
        invStart: '1700000000000',
        invEnd: '1700000060000',
        invRange: '1h',
        invKeyword: 'timeout',
        invTab: 'service',
        invIncidentId: 'alert-1'
      })
    ).toEqual({
      serviceId: 'service-1',
      serviceName: 'checkout',
      start: 1700000000000,
      end: 1700000060000,
      keyword: 'timeout',
      tab: 'service',
      incidentId: 'alert-1'
    })
  })

  it('rejects invalid epoch values and resolves a valid relative range to a fixed window', () => {
    const context = parseInvestigationContext({ invStart: '2026-01-01', invEnd: '-2', invRange: '15m' })

    expect(context).toEqual({ range: '15m' })
    expect(resolveInvestigationWindow(parseInvestigationContext({ invRange: '15m' }), 1_000_000)).toEqual({
      start: 100_000,
      end: 1_000_000
    })
  })

  it('serializes no scope and does not emit a range when an absolute window is present', () => {
    expect(investigationQuery({ serviceId: 'service-1', start: 10, end: 20, range: '1h', keyword: 'failure' })).toEqual(
      { invServiceId: 'service-1', invStart: '10', invEnd: '20', invKeyword: 'failure' }
    )
  })

  it('requires a non-zero ordered absolute window', () => {
    expect(parseInvestigationContext({ invStart: '20', invEnd: '10', invRange: '1h' })).toEqual({ range: '1h' })
    expect(parseInvestigationContext({ invStart: '20', invEnd: '20' })).toEqual({ start: 20, end: 20 })
  })
})
