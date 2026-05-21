import request from '@/services/request'
import url from '@/api/url'
import type { LogExportResponse, LogSearchParams, LogSearchResponse, LogStatsResponse } from '@/types/logs'

// 搜索日志
export function searchLogs(params: LogSearchParams) {
  return request.post<LogSearchResponse>(url.logSearch, params)
}

export function searchLogsExplorer(params: LogSearchParams) {
  return request.post<any>(url.logsExplorerSearch, params)
}

// 获取日志统计
export function getLogStats(params: any) {
  return request.post<LogStatsResponse>(url.logStats, params)
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
  return request.post<any>(url.logsExplorerStats, params)
}

// 上报单条日志
export function ingestLog(data: any) {
  return request.post<any>(url.logIngest, data)
}

// 批量上报日志
export function batchIngestLogs(logs: any[]) {
  return request.post<any>(url.logBatchIngest, { logs })
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
  return request.get<any>(url.logsExceptionsList, params)
}
