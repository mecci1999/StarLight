import { describe, expect, it, vi } from 'vitest'
import { useActivationRefresh } from '../useActivationRefresh'

describe('useActivationRefresh', () => {
  it('loads on first activation and only reloads after the freshness window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00.000Z'))
    const shouldRefresh = useActivationRefresh(30_000)

    expect(shouldRefresh()).toBe(true)
    expect(shouldRefresh()).toBe(false)

    vi.advanceTimersByTime(30_000)
    expect(shouldRefresh()).toBe(true)
    vi.useRealTimers()
  })

  it('reloads immediately when the page context changes', () => {
    let context = 'all'
    const shouldRefresh = useActivationRefresh(30_000, { contextKey: () => context })

    expect(shouldRefresh()).toBe(true)
    expect(shouldRefresh()).toBe(false)
    context = 'gateway'
    expect(shouldRefresh()).toBe(true)
  })
})
