/**
 * 日志中心相关类型定义
 */

/** 日志级别 */
export enum LogLevelEnum {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/** 日志来源类型 */
export enum LogSourceEnum {
  APPLICATION = 'application',
  SYSTEM = 'system',
  ACCESS = 'access',
  ERROR = 'error',
  AUDIT = 'audit'
}

/** 日志导出格式 */
export enum LogExportFormatEnum {
  JSON = 'json',
  CSV = 'csv',
  TXT = 'txt'
}

/** 日志查询参数 */
export interface LogSearchParams {
  /** 服务名称 */
  service?: string
  /** 日志级别 */
  level?: LogLevelEnum
  /** 关键词搜索 */
  keyword?: string
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 日志来源 */
  source?: LogSourceEnum
  /** 主机名 */
  hostname?: string
  /** 容器ID */
  containerId?: string
  /** 标签过滤 */
  tags?: Record<string, string>
  /** 排序字段 */
  sortBy?: string
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
}

/** 日志条目 */
export interface LogEntry {
  /** 日志ID */
  id: string
  /** 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: LogLevelEnum
  /** 服务名称 */
  service: string
  /** 日志消息 */
  message: string
  /** 主机名 */
  hostname?: string
  /** 容器ID */
  containerId?: string
  /** 日志来源 */
  source: LogSourceEnum
  /** 标签 */
  tags?: Record<string, any>
  /** 堆栈信息 */
  stack?: string
  /** 请求ID */
  requestId?: string
  /** 用户ID */
  userId?: string
  /** 额外字段 */
  fields?: Record<string, any>
}

/** 日志搜索响应 */
export interface LogSearchResponse {
  /** 请求是否成功 */
  success: boolean
  /** 响应数据 */
  data?: {
    /** 日志列表 */
    logs: LogEntry[]
    /** 总数 */
    total: number
    /** 当前页 */
    page: number
    /** 每页数量 */
    pageSize: number
    /** 是否有更多数据 */
    hasMore: boolean
  }
}

/** 日志统计参数 */
export interface LogStatsParams {
  /** 服务名称 */
  service?: string
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime: string
  /** 时间间隔 */
  interval?: string
  /** 分组方式 */
  groupBy?: string[]
}

/** 日志统计响应 */
export interface LogStatsResponse {
  /** 请求是否成功 */
  success: boolean
  /** 响应数据 */
  data?: {
    /** 总日志数 */
    totalLogs: number
    /** 错误日志数 */
    errorLogs: number
    /** 警告日志数 */
    warnLogs: number
    /** 按级别统计 */
    levelStats: Record<LogLevelEnum, number>
    /** 按服务统计 */
    serviceStats: Record<string, number>
    /** 时间序列数据 */
    timeSeries: {
      timestamp: string
      count: number
      level: LogLevelEnum
    }[]
  }
}

/** 日志导出参数 */
export interface LogExportParams {
  /** 查询参数 */
  searchParams: LogSearchParams
  /** 导出格式 */
  format: LogExportFormatEnum
  /** 文件名 */
  filename?: string
}

/** 日志流参数 */
export interface LogStreamParams {
  /** 服务名称 */
  service?: string
  /** 多个服务名称 */
  services?: string[]
  /** 日志级别 */
  level?: LogLevelEnum
  /** 多个日志级别 */
  levels?: LogLevelEnum[]
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
  /** 关键词过滤 */
  keywords?: string
  /** 是否跟随 */
  follow?: boolean
  /** 缓冲区大小 */
  bufferSize?: number
  /** 标签过滤 */
  tags?: Record<string, string>
}

/** 日志流事件 */
export interface LogStreamEvent {
  /** 事件类型 */
  type: 'log' | 'error' | 'connected' | 'disconnected'
  /** 日志数据 */
  data?: LogEntry
  /** 错误信息 */
  error?: string
  /** 连接信息 */
  message?: string
}

/** 异常分析参数 */
export interface ExceptionAnalysisParams {
  /** 服务名称 */
  service?: string
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime: string
  /** 异常类型 */
  exceptionType?: string
  /** 最小出现次数 */
  minOccurrences?: number
  /** 分组方式 */
  groupBy?: string
  /** 排序字段 */
  sortBy?: string
  /** 排序顺序 */
  sortOrder?: string
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
}

/** 异常分组 */
export interface ExceptionGroup {
  /** 异常ID */
  id: string
  /** 异常消息 */
  message: string
  /** 异常类型 */
  type: string
  /** 服务名称 */
  service: string
  /** 出现次数 */
  count: number
  /** 影响用户数 */
  affectedUsers?: number
  /** 趋势 */
  trend?: number
  /** 首次出现时间 */
  firstOccurrence: string
  /** 最近出现时间 */
  lastOccurrence: string
  /** 堆栈跟踪 */
  stackTrace?: string
  /** 示例日志 */
  sampleLogs?: {
    timestamp: string
    hostname: string
    containerId?: string
    message: string
    stack?: string
  }[]
  /** 小时趋势 */
  hourlyTrend?: {
    hour: string
    count: number
  }[]
}

/** 异常趋势 */
export interface ExceptionTrend {
  /** 时间戳 */
  timestamp: string
  /** 数量 */
  count: number
}

/** 异常统计 */
export interface ExceptionStats {
  /** 异常类型 */
  type: string
  /** 异常数量 */
  count: number
  /** 最近发生时间 */
  lastOccurrence: string
  /** 影响的服务 */
  services: string[]
  /** 异常消息示例 */
  sampleMessage: string
}

/** 异常分析响应 */
export interface ExceptionAnalysisResponse {
  /** 总异常数 */
  totalExceptions: number
  /** 总记录数 */
  total: number
  /** 异常分组列表 */
  exceptions: ExceptionGroup[]
  /** 异常统计列表 */
  exceptionStats: ExceptionStats[]
  /** 异常趋势 */
  trend: {
    timestamp: string
    count: number
  }[]
  /** 热点服务 */
  hotServices: {
    service: string
    exceptionCount: number
    errorRate: number
  }[]
}

/** 日志摄取参数 */
export interface LogIngestParams {
  /** 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: LogLevelEnum
  /** 服务名称 */
  service: string
  /** 日志消息 */
  message: string
  /** 主机名 */
  hostname?: string
  /** 容器ID */
  containerId?: string
  /** 日志来源 */
  source: LogSourceEnum
  /** 元数据 */
  metadata?: Record<string, any>
}

/** 批量日志摄取参数 */
export interface LogBatchIngestParams {
  /** 日志列表 */
  logs: LogEntry[]
  /** 批次大小 */
  batchSize?: number
  /** 超时时间 */
  timeout?: number
}
