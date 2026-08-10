import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestGet = vi.hoisted(() => vi.fn((): Promise<unknown> => Promise.resolve([])))

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

  it('rejects malformed trace responses instead of treating them as empty data', async () => {
    requestGet.mockImplementationOnce(() => Promise.resolve({ spans: [] }) as Promise<unknown>)
    const { searchTraces } = await import('../trace')

    await expect(searchTraces({})).rejects.toThrow('Trace search returned an invalid response payload')
  })

  it('keeps a successful empty trace array as empty data', async () => {
    requestGet.mockResolvedValueOnce([])
    const { getTraceDetails } = await import('../trace')

    await expect(getTraceDetails('trace-1')).resolves.toEqual([])
  })
})
