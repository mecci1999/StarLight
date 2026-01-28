import request from '@/services/request'
import type { ServiceItem, ServiceInstance, TopologyData } from '@/types/monitor'

// 获取服务拓扑
export function fetchTopology() {
  return request.get<TopologyData>('/metrics/v1/topology', {})
}

// 获取服务列表
export function fetchServices(params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) {
  return request.get<{ services: ServiceItem[]; total: number; page: number }>('/metrics/v1/services', params || {})
}

// 获取服务实例
export function fetchServiceInstances(serviceId: string) {
  return request.get<ServiceInstance[]>('/metrics/v1/instances', { serviceId })
}

// 获取实时监控数据
export function fetchRealtimeMetrics(serviceId?: string) {
  return request.get<{
    cpu: number
    memory: number
    qps: number
    responseTime: number
    errorRate: number
    activeConnections: number
    systemLoad: number
    activeInstances: number
    activeApps?: number
    healthDistribution: { name: string; value: number }[]
    trafficDistribution: { name: string; value: number }[]
  }>('/metrics/v1/realtime', { serviceId })
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

  return request.post<any>('/metrics/v1/query', finalParams)
}

// 获取应用列表 (兼容 getAppKeys)
export function getAppKeys() {
  return request.get<string[]>('/metrics/v1/app-keys', {}).then((keys: any) => {
    if (Array.isArray(keys) && (keys.length === 0 || typeof keys[0] === 'string')) {
      return keys.map((k) => ({ appKey: k, name: k }))
    }
    return keys
  })
}

// 获取服务统计 (兼容 getServiceStats)
export function getServiceStats(serviceId?: string) {
  return fetchRealtimeMetrics(serviceId)
}
