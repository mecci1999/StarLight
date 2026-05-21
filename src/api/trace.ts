import request from '@/services/request'
import url from '@/api/url'
import { TraceSpan } from '@/types/monitor'

export function searchTraces(params: {
  service?: string
  operation?: string
  traceId?: string
  startTime?: number
  endTime?: number
  limit?: number
}) {
  return request.get<any>(url.traceSearch, params).then((res) => {
    return Array.isArray(res) ? (res as TraceSpan[]) : []
  })
}

export function getTraceDetails(traceId: string) {
  return request.get<any>(url.traceDetail, { traceId }).then((res) => {
    return Array.isArray(res) ? (res as TraceSpan[]) : []
  })
}
