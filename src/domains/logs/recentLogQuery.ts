import { LogLevelEnum } from '@/types/logs'
import type { LogOriginType, LogSearchParams } from '@/types/logs'

export type RecentLogLevelFilter = LogLevelEnum | 'info-and-above' | null

export const RECENT_LOG_INFO_AND_ABOVE_LEVELS = [
  LogLevelEnum.INFO,
  LogLevelEnum.WARN,
  LogLevelEnum.ERROR,
  LogLevelEnum.FATAL
]

const DARWIN_COLLECTOR_EXCLUSIONS = {
  excludeServices: ['logs'],
  excludeNodeIDs: ['logs-development']
}

export const getRecentLogLevelParams = (
  levelFilter: RecentLogLevelFilter
): Pick<LogSearchParams, 'level' | 'levels'> => {
  if (levelFilter === 'info-and-above') {
    return { levels: RECENT_LOG_INFO_AND_ABOVE_LEVELS }
  }

  if (levelFilter) {
    return { level: levelFilter }
  }

  return {}
}

export const buildRecentLogSearchParams = ({
  originType,
  page,
  pageSize,
  levelFilter = null,
  service,
  keyword
}: {
  originType: LogOriginType
  page: number
  pageSize: number
  levelFilter?: RecentLogLevelFilter
  service?: string
  keyword?: string
}): LogSearchParams => {
  const normalizedKeyword = keyword?.trim()

  return {
    page,
    pageSize,
    limit: pageSize,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    originType,
    ...(originType === 'darwin-app' ? DARWIN_COLLECTOR_EXCLUSIONS : {}),
    ...getRecentLogLevelParams(levelFilter),
    ...(service ? { service } : {}),
    ...(normalizedKeyword ? { keyword: normalizedKeyword, query: normalizedKeyword } : {})
  }
}
