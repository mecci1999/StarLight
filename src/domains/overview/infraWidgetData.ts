import type { MetricsAnalysisData, MetricPoint, ServiceInstance } from '@/types/monitor'
import type { ServiceItem } from '@/types/monitor'

export type DarwinInfraMetricKey = 'cpu' | 'memory'
export type DarwinInfraAggregation = 'latest' | 'avg' | 'max'

export const getInfraMetricLabel = (metric: DarwinInfraMetricKey) => (metric === 'cpu' ? 'CPU 使用率' : '内存使用率')

export const getInfraMetricUnit = (_metric: DarwinInfraMetricKey) => '%'

const roundOne = (value: number) => Math.round(value * 10) / 10

export const getLatestAverage = (groups: MetricsAnalysisData['series'][DarwinInfraMetricKey] = []) => {
  const values = groups
    .map((group) => group?.data?.[group.data.length - 1]?.value)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
  if (!values.length) return null
  return roundOne(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export const getLatestMax = (groups: MetricsAnalysisData['series'][DarwinInfraMetricKey] = []) => {
  const values = groups
    .map((group) => group?.data?.[group.data.length - 1]?.value)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
  if (!values.length) return null
  return roundOne(Math.max(...values))
}

export const aggregateInfraLatestValue = (
  groups: MetricsAnalysisData['series'][DarwinInfraMetricKey] = [],
  aggregation: DarwinInfraAggregation = 'latest'
) => {
  if (aggregation === 'max') return getLatestMax(groups)
  return getLatestAverage(groups)
}

export const buildAggregatedInfraTrend = (
  groups: MetricsAnalysisData['series'][DarwinInfraMetricKey] = []
): MetricPoint[] => {
  const bucket = new Map<number, number[]>()

  groups.forEach((group) => {
    ;(group?.data || []).forEach((point) => {
      if (!bucket.has(point.timestamp)) bucket.set(point.timestamp, [])
      bucket.get(point.timestamp)!.push(point.value)
    })
  })

  return Array.from(bucket.entries())
    .sort(([left], [right]) => left - right)
    .map(([timestamp, values]) => ({
      timestamp,
      value: roundOne(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1))
    }))
}

export const resolveInfraServiceTarget = (
  widgetServiceId: string | undefined,
  globalServiceId: string | null,
  services: ServiceItem[],
  options?: { fallbackToFirst?: boolean }
) => {
  const resolved = widgetServiceId || globalServiceId || (options?.fallbackToFirst ? services[0]?.id || '' : '')
  return services.find((service) => service.id === resolved)?.id || resolved
}

export const buildDarwinInstanceRows = (
  instances: ServiceInstance[],
  sortBy: DarwinInfraMetricKey = 'cpu',
  limit = 6
) =>
  [...instances]
    .sort((left, right) => {
      const leftValue = typeof left[sortBy] === 'number' ? left[sortBy] : -1
      const rightValue = typeof right[sortBy] === 'number' ? right[sortBy] : -1
      return rightValue - leftValue
    })
    .slice(0, limit)
