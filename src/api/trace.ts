import request from '@/services/request'
import { TraceSpan } from '@/types/monitor'

// 搜索链路
export function searchTraces(params: {
  service?: string
  operation?: string
  traceId?: string
  startTime?: number
  endTime?: number
  limit?: number
}) {
  // 由于后端暂无独立的 Trace 服务，我们暂时复用日志服务来模拟
  // 在实际生产中，这应该调用 Jaeger/Tempo 或专用的 Trace 服务

  // 构造日志搜索查询
  const queryParts = []
  if (params.service) queryParts.push(`service:"${params.service}"`)
  if (params.operation) queryParts.push(`message:"${params.operation}"`) // 假设 message 包含操作名
  if (params.traceId) queryParts.push(`traceId:"${params.traceId}"`)

  const query = queryParts.join(' AND ') || '*'

  return request
    .post<any>('/logs/v1/search', {
      query,
      startTime: params.startTime ? new Date(params.startTime).toISOString() : undefined,
      endTime: params.endTime ? new Date(params.endTime).toISOString() : undefined,
      limit: params.limit || 50,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    })
    .then((res) => {
      // 将日志转换为 TraceSpan 格式
      if (res.success && res.data && res.data.logs) {
        return res.data.logs.map((log: any) => ({
          id: log.id,
          traceId: log.traceId || log.metadata?.traceId || 'unknown',
          parentId: log.metadata?.parentId,
          name: log.message, // 暂时用 message 作为 span name
          service: log.service,
          startTime: new Date(log.timestamp).getTime(),
          duration: log.metadata?.duration || Math.floor(Math.random() * 100), // 模拟 duration
          status: log.level === 'error' ? 'error' : 'ok',
          tags: log.metadata || {}
        }))
      }
      return []
    })
}

// 获取链路详情
export function getTraceDetails(traceId: string) {
  return searchTraces({ traceId, limit: 100 })
}
