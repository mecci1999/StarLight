export type OverviewSnapshotTrendGroupBy = 'overall' | 'env' | 'team'

export const buildOverviewSnapshotFetchPlan = (params: { visibleWidgetRanges: string[]; pageWidgetRange: string }) => {
  const summaryFetchRanges = params.visibleWidgetRanges.filter((range) => range !== params.pageWidgetRange)
  const trendFetchPairs = summaryFetchRanges.flatMap((range) =>
    (['overall', 'env', 'team'] as OverviewSnapshotTrendGroupBy[]).map((groupBy) => ({ range, groupBy }))
  )

  return {
    summaryFetchRanges,
    trendFetchPairs
  }
}
