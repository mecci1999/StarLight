import request from '@/services/request'
import url from '@/api/url'
import dayjs from 'dayjs'
import type {
  ExceptionGroup,
  LogExportResponse,
  LogSearchParams,
  LogSearchResponse,
  LogStatsResponse
} from '@/types/logs'

type ExplorerSearchResponse = {
  items?: any[]
  pagination?: {
    page?: number
    pageSize?: number
    total?: number
  }
}

type ExplorerStatsResponse = LogStatsResponse & {
  total?: number
  data?: Array<{ key: string; count: number }>
  topServices?: Array<{ service: string; count?: number; logCount?: number; errorRate?: number }>
  errorRate?: number
  avgResponseTime?: number
}

type ExceptionListResponse = {
  items?: ExceptionGroup[]
  analysis?: {
    topErrors?: Array<{ message: string; count: number }>
    summary?: string
    possibleCauses?: string[]
    recommendations?: string[]
    confidence?: number
  }
}

export type DebugDiagnosticsState = {
  enabled: boolean
  updatedAt: string | null
  updatedBy?: string
  expiresAt: string | null
}

const normalizeSearchResponse = (response: any): LogSearchResponse & ExplorerSearchResponse => {
  if (Array.isArray(response?.items) || response?.pagination) {
    const items = (response?.items || []).map((item: any, index: number) => ({
      key: item.key || item.id || `${item.timestamp || 'log'}-${index}`,
      ...item
    }))
    const pagination = response?.pagination || {}

    return {
      items,
      logs: items,
      total: Number(pagination.total || items.length || 0),
      page: Number(pagination.page || 1),
      pageSize: Number(pagination.pageSize || items.length || 0),
      hasMore:
        typeof pagination.total === 'number' &&
        typeof pagination.page === 'number' &&
        typeof pagination.pageSize === 'number'
          ? pagination.page * pagination.pageSize < pagination.total
          : false,
      pagination: {
        page: Number(pagination.page || 1),
        pageSize: Number(pagination.pageSize || items.length || 0),
        total: Number(pagination.total || items.length || 0)
      }
    }
  }

  const logs = (response?.logs || []).map((item: any, index: number) => ({
    key: item.key || item.id || `${item.timestamp || 'log'}-${index}`,
    ...item
  }))

  return {
    logs,
    items: logs,
    total: Number(response?.total || logs.length || 0),
    page: Number(response?.page || 1),
    pageSize: Number(response?.pageSize || response?.limit || logs.length || 0),
    hasMore: Boolean(response?.hasMore),
    pagination: {
      page: Number(response?.page || 1),
      pageSize: Number(response?.pageSize || response?.limit || logs.length || 0),
      total: Number(response?.total || logs.length || 0)
    }
  }
}

const normalizeStatsResponse = (response: any): ExplorerStatsResponse => {
  const totalLogs = Number(response?.totalLogs ?? response?.total ?? 0)
  const levelStats = response?.levelStats || {}
  const serviceStats = response?.serviceStats || {}
  const errorLogs = Number(response?.errorLogs ?? (levelStats.error || 0) + (levelStats.fatal || 0))
  const warnLogs = Number(response?.warnLogs ?? (levelStats.warn || 0))

  return {
    ...response,
    totalLogs,
    errorLogs,
    warnLogs,
    levelStats,
    serviceStats,
    topServices: Array.isArray(response?.topServices) ? response.topServices : [],
    errorRate:
      typeof response?.errorRate === 'number' ? response.errorRate : totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
    avgResponseTime: Number(response?.avgResponseTime || 0)
  }
}

const normalizeExceptionListResponse = (response: ExceptionListResponse | any): ExceptionListResponse => {
  if (Array.isArray(response?.items) && response.items.length > 0) {
    return response
  }

  const now = dayjs().toISOString()
  const derivedItems = (response?.analysis?.topErrors || []).map((item: any, index: number) => ({
    id: `exception-${index}`,
    message: item.message,
    type: 'UnknownError',
    service: 'unknown-service',
    count: Number(item.count || 0),
    affectedUsers: 0,
    trend: 0,
    firstOccurrence: now,
    lastOccurrence: now,
    stackTrace: '',
    sampleLogs: [],
    hourlyTrend: []
  }))

  return {
    ...response,
    items: derivedItems
  }
}

// 搜索日志
export function searchLogs(params: LogSearchParams) {
  return request.post<any>(url.logSearch, params).then(normalizeSearchResponse)
}

export function searchLogsExplorer(params: LogSearchParams) {
  return request.post<any>(url.logsExplorerSearch, params).then(normalizeSearchResponse)
}

// 获取日志统计
export function getLogStats(params: any) {
  return request.post<any>(url.logStats, params).then(normalizeStatsResponse)
}

export function testLogConnection(params: {
  engine?: string
  elasticsearch?: {
    hosts?: string[]
    username?: string
    password?: string
    indexPrefix?: string
  }
}) {
  return request.post<{ connected: boolean; engine: string; reason?: string }>(url.logConfigTestConnection, params)
}

export function getLogExplorerStats(params: any) {
  return request.post<any>(url.logsExplorerStats, params).then(normalizeStatsResponse)
}

// 上报单条日志
export function ingestLog(data: any) {
  return request.post<any>(url.logIngest, data)
}

// 批量上报日志
export function batchIngestLogs(logs: any[]) {
  return request.post<any>(url.logBatchIngest, { logs })
}

export function getDebugDiagnosticsState() {
  return request.postWithOptions<DebugDiagnosticsState>(
    url.logDebugDiagnostics,
    {},
    { noRetry: true, suppressErrorLog: true }
  )
}

export function setDebugDiagnosticsState(params: { enabled: boolean; durationMs?: number; reason?: string }) {
  return request.postWithOptions<DebugDiagnosticsState>(url.logDebugDiagnostics, params, {
    noRetry: true,
    suppressErrorLog: true
  })
}

// 导出日志
export function exportLogs(params: any) {
  return request.post<LogExportResponse>(url.logExport, params)
}

// 创建日志流
// 分析异常
export function analyzeExceptions(params: any) {
  return request.post<any>(url.exceptionAnalysis, params)
}

export function listExceptions(params: any) {
  return request.get<any>(url.logsExceptionsList, params).then(normalizeExceptionListResponse)
}
