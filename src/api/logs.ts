/**
 * 日志中心API接口
 */
import request from '@/services/request'
import urls from './url'
import {
  LogSearchParams,
  LogSearchResponse,
  LogStatsParams,
  LogStatsResponse,
  LogExportParams,
  LogStreamParams,
  ExceptionAnalysisParams,
  ExceptionAnalysisResponse,
  LogEntry
} from '@/types/logs'

const GET = <T>(url: string, params?: any, abort?: AbortController) => request.get<T>(url, params, abort)
const POST = <T>(url: string, params?: any, abort?: AbortController) => request.post<T>(url, params, abort)

export default {
  /** 搜索日志 */
  searchLogs: (params: LogSearchParams, abort?: AbortController) =>
    GET<LogSearchResponse>(urls.logSearch, params, abort),

  /** 获取日志统计 */
  getLogStats: (params: LogStatsParams, abort?: AbortController) => GET<LogStatsResponse>(urls.logStats, params, abort),

  /** 导出日志 */
  exportLogs: (params: LogExportParams, abort?: AbortController) =>
    POST<{ downloadUrl: string; filename: string }>(urls.logExport, params, abort),

  /** 创建日志流连接 */
  createLogStream: (params: LogStreamParams, abort?: AbortController) =>
    GET<{ streamId: string; wsUrl: string }>(urls.logStream, params, abort),

  /** 摄取单条日志 */
  ingestLog: (log: Omit<LogEntry, 'id'>, abort?: AbortController) =>
    POST<{ success: boolean; logId: string }>(urls.logIngest, log, abort),

  /** 批量摄取日志 */
  batchIngestLogs: (logs: Omit<LogEntry, 'id'>[], abort?: AbortController) =>
    POST<{ success: boolean; processedCount: number; failedCount: number }>(urls.logBatchIngest, { logs }, abort),

  /** 异常分析 */
  analyzeExceptions: (params: ExceptionAnalysisParams, abort?: AbortController) =>
    GET<ExceptionAnalysisResponse>(urls.exceptionAnalysis, params, abort)
}
