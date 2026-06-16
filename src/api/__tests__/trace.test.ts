import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestGet = vi.hoisted(() => vi.fn(() => Promise.resolve([])))

vi.mock('@/services/request', () => ({
  default: {
    get: requestGet
  }
}))

describe('trace api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('omits empty trace search query params', async () => {
    const { searchTraces } = await import('../trace')

    await searchTraces({
      startTime: 1,
      endTime: 2,
      service: undefined,
      traceId: 'undefined',
      operation: '',
      limit: 100
    })

    expect(requestGet).toHaveBeenCalledWith(expect.any(String), {
      startTime: 1,
      endTime: 2,
      limit: 100
    })
  })

  it('passes trace detail time bounds and omits empty values', async () => {
    const { getTraceDetails } = await import('../trace')

    await getTraceDetails('trace-1', {
      startTime: 10,
      endTime: undefined
    })

    expect(requestGet).toHaveBeenCalledWith(expect.any(String), {
      traceId: 'trace-1',
      startTime: 10
    })
  })
})
