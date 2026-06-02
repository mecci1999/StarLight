import request from '@/services/request'
import url from '@/api/url'
import type {
  ServiceItem,
  ServiceInstance,
  TopologyData,
  DashboardData,
  RealtimeOverview,
  MetricsAnalysisData
} from '@/types/monitor'
import type { DashboardQueryRequest, DashboardQueryResponse, QuerySpec, CardData } from '@/domains/metrics/queryModel'

export type MetricsDatasetScope = 'tenant' | 'system'

const cleanQuery = <T extends Record<string, any>>(params: T | undefined) => {
  const source = params || ({} as T)
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== null && value !== 'undefined')
  ) as T
}

const withScope = <T extends Record<string, any>>(params: T | undefined, scope?: MetricsDatasetScope) => {
  const cleaned = cleanQuery(params)
  if (!scope) return cleaned
  return { ...cleaned, scope }
}

export function fetchCatalogServices(params?: {
  page?: number
  pageSize?: number
  status?: string[]
  keyword?: string
  env?: string
  region?: string
  scope?: MetricsDatasetScope
}) {
  return request.get<any>(url.metricsCatalogServices, withScope(params, params?.scope))
}

export function fetchCatalogServicesSummary(params?: { scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsCatalogServicesSummary, withScope(params, params?.scope))
}

export function fetchCatalogServiceDetail(serviceId: string, params?: { scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsCatalogServiceDetail, { serviceId, ...(params || {}) })
}

export function fetchCatalogServiceQuickView(serviceId: string, params?: { scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsCatalogServiceQuickView, { serviceId, ...(params || {}) })
}

export function fetchOverviewSummary(params?: {
  timeRange?: string
  env?: string
  region?: string
  scope?: MetricsDatasetScope
}) {
  return request.get<any>(url.metricsOverviewSummary, withScope(params, params?.scope))
}

export function fetchOverviewTrends(params?: {
  timeRange?: string
  groupBy?: 'overall' | 'env' | 'team'
  env?: string
  region?: string
  scope?: MetricsDatasetScope
}) {
  return request.get<any>(url.metricsOverviewTrends, withScope(params, params?.scope))
}

export function fetchOverviewRiskServices(params?: { env?: string; region?: string; scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsOverviewRiskServices, withScope(params, params?.scope))
}

export function fetchOverviewIngestStatus(params?: { env?: string; region?: string; scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsOverviewIngestStatus, withScope(params, params?.scope))
}

export function fetchOverviewIncidents(params?: {
  timeRange?: string
  env?: string
  region?: string
  scope?: MetricsDatasetScope
}) {
  return request.get<any>(url.metricsOverviewIncidents, withScope(params, params?.scope))
}

export function fetchServiceDetailSummary(
  serviceId: string,
  params?: { timeRange?: string; scope?: MetricsDatasetScope }
) {
  return request.get<any>(url.metricsServiceDetail, { serviceId, ...(params || {}) })
}

export function fetchServiceRuntime(serviceId: string, params?: { scope?: MetricsDatasetScope }) {
  return request.get<any>(url.metricsServiceRuntime, { serviceId, ...(params || {}) })
}

// 获取服务拓扑
export function fetchTopology(params?: { timeRange?: string; scope?: MetricsDatasetScope }) {
  return request.get<TopologyData>(url.metricsTopology, { type: 'graph', ...(params || {}) })
}

export function saveTopologyCanvas(payload: {
  manualLayers?: Record<string, number>
  nodes?: any[]
  edges?: any[]
  scope?: MetricsDatasetScope
}) {
  return request.post<{ manualLayers?: Record<string, number>; nodes: any[]; edges: any[] }>(url.metricsTopology, {
    type: 'manual',
    ...(payload || {})
  })
}

// 获取服务列表
export function fetchServices(params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
  scope?: MetricsDatasetScope
}) {
  return request.get<{ services: ServiceItem[]; total: number; page: number }>(url.metricsTopology, {
    type: 'services',
    ...params
  })
}

// 获取服务实例
export function fetchServiceInstances(serviceId: string, params?: { scope?: MetricsDatasetScope }) {
  return request.get<ServiceInstance[]>(url.metricsTopology, { type: 'instances', serviceId, ...(params || {}) })
}

// 获取实时监控数据
export function fetchRealtimeMetrics(serviceId?: string, params?: { scope?: MetricsDatasetScope }) {
  return request
    .get<RealtimeOverview>(url.metricsRealtime, { serviceId, ...(params || {}) })
    .then((res: any) => res?.summary || res)
}

export function fetchRealtimeOverview(serviceId?: string, params?: { scope?: MetricsDatasetScope }) {
  return request.get<RealtimeOverview>(url.metricsRealtime, { serviceId, ...(params || {}) })
}

export function fetchDashboardData() {
  return request.get<DashboardData>(url.metricsDashboard, {})
}

export function fetchMetricsAnalysis(params: { serviceId?: string }) {
  return request.get<MetricsAnalysisData>(url.metricsAnalysis, params || {})
}

export function fetchMetricsExplorer(params: { serviceId?: string; timeRange?: string; scope?: MetricsDatasetScope }) {
  return request.get<MetricsAnalysisData>(url.metricsExplorer, params || {})
}

export function queryMetricCards(payload: DashboardQueryRequest) {
  return request.post<DashboardQueryResponse>(url.metricsV2QueryCards, payload)
}

export const isQueryCapabilityUnsupported = (payload: any) => payload?.supported === false

export const buildLocalCompileFallback = (query: QuerySpec) => ({
  supported: false,
  script: JSON.stringify({ type: 'queryspec', query }, null, 2),
  language: 'queryspec-json'
})

export const buildLocalValidateFallback = () => ({
  supported: false,
  valid: true,
  issues: [] as string[]
})

export function previewMetricCard(query: QuerySpec, scope: MetricsDatasetScope) {
  return request
    .post<{ supported?: boolean; data?: CardData | null; item?: { data?: CardData; status?: string } }>(
      url.metricsV2QueryPreview,
      {
        scope,
        query
      }
    )
    .then(async (res: any) => {
      if (isQueryCapabilityUnsupported(res)) {
        const batch = await queryMetricCards({
          refreshGenerationId: `${Date.now()}`,
          context: { scope, timeRange: query.timeRange, autoRefresh: false },
          cards: [{ cardId: 'custom-dashboard-preview', priority: 'high', query }]
        })
        const previewItem = batch?.items?.find((item) => item.cardId === 'custom-dashboard-preview')
        return {
          supported: false,
          data:
            previewItem && (previewItem.status === 'success' || previewItem.status === 'partial')
              ? previewItem.data || null
              : null
        }
      }

      const previewData = res?.data ?? res?.item?.data ?? res?.content?.data ?? null
      return {
        supported: true,
        data: previewData as CardData | null
      }
    })
    .catch(async (error) => {
      console.error('Failed to preview metric card via preview endpoint, fallback to batch query:', error)
      const batch = await queryMetricCards({
        refreshGenerationId: `${Date.now()}`,
        context: { scope, timeRange: query.timeRange, autoRefresh: false },
        cards: [{ cardId: 'custom-dashboard-preview', priority: 'high', query }]
      })
      const previewItem = batch?.items?.find((item) => item.cardId === 'custom-dashboard-preview')
      return {
        supported: false,
        data:
          previewItem && (previewItem.status === 'success' || previewItem.status === 'partial')
            ? previewItem.data || null
            : null
      }
    })
}

export function compileMetricQuery(query: QuerySpec, scope: MetricsDatasetScope) {
  return request
    .post<{ supported?: boolean; script?: string; language?: string }>(url.metricsV2QueryCompile, {
      scope,
      query
    })
    .then((res: any) => {
      if (isQueryCapabilityUnsupported(res)) {
        return buildLocalCompileFallback(query)
      }

      return {
        supported: res?.supported !== false,
        script: res?.script || res?.content?.script || '',
        language: res?.language || res?.content?.language || 'flux'
      }
    })
    .catch((error) => {
      console.error('Compile endpoint unavailable, fallback to local queryspec script:', error)
      return buildLocalCompileFallback(query)
    })
}

export function validateMetricQuery(query: QuerySpec, scope: MetricsDatasetScope) {
  return request
    .post<{ supported?: boolean; valid?: boolean; issues?: string[] }>(url.metricsV2QueryValidate, {
      scope,
      query
    })
    .then((res: any) => {
      if (isQueryCapabilityUnsupported(res)) {
        return buildLocalValidateFallback()
      }

      return {
        supported: res?.supported !== false,
        valid: res?.valid ?? res?.content?.valid ?? true,
        issues: res?.issues || res?.content?.issues || []
      }
    })
    .catch((error) => {
      console.error('Validate endpoint unavailable, fallback to client-side validation only:', error)
      return buildLocalValidateFallback()
    })
}

export function fetchMetricsSchema(params?: { serviceId?: string; scope?: MetricsDatasetScope }) {
  const nextParams = withScope(params, params?.scope)
  return request
    .getWithOptions<any>(url.metricsV2Schema, nextParams, { suppressErrorLog: true })
    .catch(() => request.getWithOptions<any>(url.metricsSchema, nextParams, { suppressErrorLog: true }))
}

// 获取指标数据 (兼容旧命名 fetchMetrics)
export function fetchMetrics(params: { serviceId: string; metricType?: string; timeRange?: string }) {
  return queryMetrics({
    appKey: params.serviceId,
    // 这里需要转换 timeRange 参数
    timeRange: { start: 'now-1h', end: 'now' } // 简化处理
  })
}

// 查询指标数据 (对接后端 v1.query)
export function queryMetrics(params: {
  appKey: string
  metric?: string
  metrics?: string[]
  tags?: Record<string, string>
  timeRange?: { start: string | number; end: string | number }
  startTime?: string | number
  endTime?: string | number
  step?: string
}) {
  const finalParams: any = { ...params }

  if (params.metrics && params.metrics.length > 0 && !params.metric) {
    finalParams.metric = params.metrics[0]
  }

  if ((params.startTime || params.endTime) && !params.timeRange) {
    finalParams.timeRange = {
      start: params.startTime || 'now-1h',
      end: params.endTime || 'now'
    }
  }

  return request.post<any>(url.metricsQuery, finalParams).then((res: any) => {
    const content = res
    // Adapter for v1.query response structure
    // Client expects MetricsBundle: { cpu: [], memory: [], qps: [], responseTime: [], errorRate: [] }
    // Server returns: { data: [...] } from InfluxDB query
    // If content has data property, return it directly
    if (content && content.data) {
      // Basic transformation logic (mock implementation for now as actual influx data structure depends on query)
      // Assuming server returns standardized structure or client needs to parse it.
      // For now, return as is if structure matches, or provide fallback.
      return content.data
    }
    return content
  })
}

// 获取应用列表 (兼容 getAppKeys)
export function getAppKeys() {
  return request.get<any>(url.metricsAppKeyList, {}).then((res: any) => {
    // Adapter for v1.appkey.list response structure
    // Server returns: { keys: [...], total: ... }
    // Client expects: string[] or object[] with appKey/name
    if (res && res.appKeys) {
      return res.appKeys
    }
    // Fallback if keys is used instead of appKeys
    if (res && res.keys) {
      return res.keys
    }
    return []
  })
}

// 生成 AppKey
export function generateAppKey(params: { name: string; description?: string }) {
  return request.post<any>(url.metricsAppKeyGenerate, params)
}

export function verifyAppKey(params: { appKey: string; appSecret: string }) {
  return request.post<any>(url.metricsAppKeyVerify, params)
}

export function deleteAppKey(params: { keyId: string }) {
  return request.post<any>(url.metricsAppKeyDelete, params)
}

export function getIngestionStatus() {
  return request.get<any>(url.metricsIngestionStatus, {})
}

// 保存仪表盘布局
export function saveDashboardLayout(key: string, layout: any[]) {
  return request.post(url.metricsLayout, { key, layout })
}

// 获取仪表盘布局
export function getDashboardLayout(key: string) {
  return request.get<{ layout: any[] }>(url.metricsLayout, { key }).then((res: any) => res?.layout || [])
}

export function saveDashboardState<T>(key: string, layout: T) {
  return request.post(url.metricsLayout, { key, layout })
}

export function getDashboardState<T>(key: string, fallback: T) {
  return request.get<{ layout: T }>(url.metricsLayout, { key }).then((res: any) => (res?.layout ?? fallback) as T)
}
