import { describe, expect, it } from 'vitest'
import { resolveCustomDashboardRouteContext } from '../customDashboardRouteModel'

describe('resolveCustomDashboardRouteContext', () => {
  it('honors routed scope and service context for catalog-driven add flow', () => {
    expect(
      resolveCustomDashboardRouteContext(
        {
          scope: 'system',
          serviceId: 'svc-1',
          prefillMetric: 'cpu',
          prefillType: 'trend',
          prefillTitle: 'CPU 趋势',
          startAdd: '1'
        },
        'tenant'
      )
    ).toEqual({
      datasetScope: 'system',
      serviceId: 'svc-1',
      prefillMetric: 'cpu',
      prefillType: 'trend',
      prefillTitle: 'CPU 趋势',
      startAdd: true
    })
  })

  it('falls back to preferred scope when route context is missing', () => {
    expect(resolveCustomDashboardRouteContext({}, 'tenant')).toEqual({
      datasetScope: 'tenant',
      serviceId: '',
      prefillMetric: '',
      prefillType: '',
      prefillTitle: '',
      startAdd: false
    })
  })
})
