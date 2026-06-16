import request from '@/services/request'
import url from '@/api/url'
import { TraceSpan } from '@/types/monitor'
import type { LogOriginType } from '@/types/logs'

const cleanTraceQueryParams = <T extends Record<string, unknown>>(params?: T) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (value === 'undefined' || value === 'null') return false
      return true
    })
  ) as Partial<T>

export function searchTraces(params: {
  service?: string
  operation?: string
  traceId?: string
  startTime?: number
  endTime?: number
  limit?: number
  originType?: LogOriginType
}) {
  return request.get<any>(url.traceSearch, cleanTraceQueryParams(params)).then((res) => {
    return Array.isArray(res) ? (res as TraceSpan[]) : []
  })
}

export function getTraceDetails(
  traceId: string,
  params?: { startTime?: number; endTime?: number; originType?: LogOriginType }
) {
  return request.get<any>(url.traceDetail, cleanTraceQueryParams({ traceId, ...(params || {}) })).then((res) => {
    return Array.isArray(res) ? (res as TraceSpan[]) : []
  })
}
