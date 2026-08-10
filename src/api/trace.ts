import request from '@/services/request'
import url from '@/api/url'
import { TraceSpan } from '@/types/monitor'
import type { LogOriginType } from '@/types/logs'
import { AppException, ErrorType } from '@/common/exception'

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
  return request.get<unknown>(url.traceSearch, cleanTraceQueryParams(params)).then((res) => {
    if (!Array.isArray(res))
      throw new AppException('Trace search returned an invalid response payload', { type: ErrorType.Network })
    return res as TraceSpan[]
  })
}

export function getTraceDetails(
  traceId: string,
  params?: { startTime?: number; endTime?: number; originType?: LogOriginType }
) {
  return request.get<unknown>(url.traceDetail, cleanTraceQueryParams({ traceId, ...(params || {}) })).then((res) => {
    if (!Array.isArray(res))
      throw new AppException('Trace detail returned an invalid response payload', { type: ErrorType.Network })
    return res as TraceSpan[]
  })
}
