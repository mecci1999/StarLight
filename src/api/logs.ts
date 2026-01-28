import request from '@/services/request'
import type { LogSearchParams, LogSearchResponse } from '@/types/logs'

// 搜索日志
export function searchLogs(params: LogSearchParams) {
  return request.post<LogSearchResponse>('/logs/v1/search', params)
}

// 获取日志统计
export function getLogStats(params: any) {
  return request.post<any>('/logs/v1/stats', params)
}

// 上报单条日志
export function ingestLog(data: any) {
  return request.post<any>('/logs/v1/ingest', data)
}

// 批量上报日志
export function batchIngestLogs(logs: any[]) {
  return request.post<any>('/logs/v1/ingest/batch', { logs })
}

// 导出日志
export function exportLogs(params: any) {
  return request.post<any>('/logs/v1/export', params)
}

// 创建日志流
export function createLogStream(params: any) {
  return request.post<any>('/logs/v1/stream', params)
}

// 分析异常
export function analyzeExceptions(params: any) {
  return request.post<any>('/logs/v1/analysis/exceptions', params)
}
