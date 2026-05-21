import type { MetricsDatasetScope } from '@/api/metrics'

export function resolveCustomDashboardRouteContext(
  query: Record<string, unknown>,
  preferredScope: MetricsDatasetScope
) {
  return {
    datasetScope:
      query.scope === 'system' || query.scope === 'tenant' ? (query.scope as MetricsDatasetScope) : preferredScope,
    serviceId: typeof query.serviceId === 'string' ? query.serviceId : '',
    prefillMetric: typeof query.prefillMetric === 'string' ? query.prefillMetric : '',
    prefillType: typeof query.prefillType === 'string' ? query.prefillType : '',
    prefillTitle: typeof query.prefillTitle === 'string' ? query.prefillTitle : '',
    startAdd: query.startAdd === '1'
  }
}
