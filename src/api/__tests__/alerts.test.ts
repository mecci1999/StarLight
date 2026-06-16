import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestGet = vi.hoisted(() => vi.fn())

vi.mock('@/services/request', () => ({
  default: {
    get: requestGet
  }
}))

describe('alerts api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('omits empty serviceId values from alert rule queries', async () => {
    const { fetchAlertRules, exportAlertRules } = await import('../alerts')

    fetchAlertRules({
      serviceId: undefined,
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
    exportAlertRules({
      serviceId: 'undefined',
      scope: 'system',
      startTime: 1,
      endTime: 2
    })

    expect(requestGet).toHaveBeenNthCalledWith(1, expect.any(String), {
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
    expect(requestGet).toHaveBeenNthCalledWith(2, expect.any(String), {
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
  })
})
