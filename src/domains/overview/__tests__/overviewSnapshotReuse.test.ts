import { describe, expect, it } from 'vitest'
import { buildOverviewSnapshotFetchPlan } from '../overviewSnapshotPlan'

describe('overview snapshot reuse planning', () => {
  it('reuses already-fetched page snapshots when a widget range matches the page range', () => {
    const plan = buildOverviewSnapshotFetchPlan({
      visibleWidgetRanges: ['1h', '15m'],
      pageWidgetRange: '1h'
    })

    expect(plan.summaryFetchRanges).toEqual(['15m'])
    expect(plan.trendFetchPairs).toEqual([
      { range: '15m', groupBy: 'overall' },
      { range: '15m', groupBy: 'env' },
      { range: '15m', groupBy: 'team' }
    ])
  })

  it('skips all extra summary/trend fetches when every widget uses the page range', () => {
    const plan = buildOverviewSnapshotFetchPlan({
      visibleWidgetRanges: ['1h'],
      pageWidgetRange: '1h'
    })

    expect(plan.summaryFetchRanges).toEqual([])
    expect(plan.trendFetchPairs).toEqual([])
  })
})
