/**
 * 日志中心主页面
 */
import { defineComponent, ref, reactive, onMounted, onUnmounted, computed, h, nextTick } from 'vue'
import {
  NCard,
  NButton,
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NTag,
  NIcon,
  NTabs,
  NTabPane,
  NAlert,
  NEmpty,
  NTime,
  NInput,
  NSelect,
  NSwitch,
  useMessage
} from 'naive-ui'
import {
  DocumentTextOutline,
  SearchOutline,
  AnalyticsOutline,
  CloudUploadOutline,
  TrendingUpOutline,
  WarningOutline,
  TimeOutline,
  ServerOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import { LogLevelEnum } from '@/types/logs'
import type { LogEntry, LogOriginType } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'
import PageHeader from '@/shared/layout/PageHeader'
import { getStoredUserInfo } from '@/services/authSession'
import { buildRecentLogSearchParams, type RecentLogLevelFilter } from '@/domains/logs/recentLogQuery'
import { copyLogText, formatLogForClipboard } from '@/domains/logs/clipboard'
import './LogCenterPage.scss'

import LogService from '@/views/homeWindow/log/service'
import ExceptionAnalysisContent from '@/domains/logs/components/ExceptionAnalysisContent'
import LogIngest from '@/views/homeWindow/log/ingest'
import LogStreamContent from '@/domains/logs/components/LogStreamContent'

export default defineComponent({
  name: 'LogCenterPage',
  components: {
    LogService,
    ExceptionAnalysisContent,
    LogIngest,
    LogStreamContent
  },
  setup() {
    const message = useMessage()
    const loading = ref(false)
    const debugDiagnosticsLoading = ref(false)
    const debugDiagnosticsEnabled = ref(false)
    const debugDiagnosticsExpiresAt = ref<string | null>(null)
    const activeTab = ref('overview')
    const refreshTimer = ref<NodeJS.Timeout | null>(null)
    const recentLogsListRef = ref<HTMLElement | null>(null)
    const recentLogsPageSize = 200
    const recentLogsPage = ref(1)
    const recentLogsLoadingMore = ref(false)
    const recentLogsHasMore = ref(false)
    const recentLogLevelFilter = ref<RecentLogLevelFilter>('info-and-above')
    const recentLogKeyword = ref('')
    const isAdminUser = Boolean(getStoredUserInfo()?.isAdmin)
    const overviewOriginType = ref<LogOriginType>(isAdminUser ? 'darwin-app' : 'microservice')

    const recentLogLevelOptions = [
      { label: 'INFO 及以上', value: 'info-and-above' },
      { label: 'TRACE', value: LogLevelEnum.TRACE },
      { label: 'DEBUG', value: LogLevelEnum.DEBUG },
      { label: 'INFO', value: LogLevelEnum.INFO },
      { label: 'WARN', value: LogLevelEnum.WARN },
      { label: 'ERROR', value: LogLevelEnum.ERROR },
      { label: 'FATAL', value: LogLevelEnum.FATAL }
    ]

    const recentLogOriginTypeOptions = [
      ...(isAdminUser ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
      { label: '用户微服务日志', value: 'microservice' }
    ]

    const getRecentLogScopeLabel = () => {
      return overviewOriginType.value === 'darwin-app' ? '最近日志 · Darwin 服务' : '最近日志 · 用户微服务'
    }

    const stats = reactive({
      totalLogs: 0,
      todayLogs: 0,
      errorRate: 0,
      topServices: [] as Array<{ service: string; count: number; percentage: number; errorRate: number }>,
      levelDistribution: [] as Array<{ level: LogLevelEnum; count: number; percentage: number }>,
      recentLogs: [] as LogEntry[],
      recentLogsTotal: 0,
      recentLogsScopeLabel: `最近日志`,
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        lastUpdate: ''
      }
    })

    const quickActions = [
      {
        title: '日志搜索',
        description: '搜索和查看日志',
        icon: SearchOutline,
        color: 'var(--color-primary-6)',
        action: () => (activeTab.value = 'service')
      },
      {
        title: '异常分析',
        description: '分析异常和错误',
        icon: AnalyticsOutline,
        color: 'var(--color-danger-6)',
        action: () => (activeTab.value = 'exception')
      },
      {
        title: '日志摄取',
        description: '上传和摄取日志',
        icon: CloudUploadOutline,
        color: 'var(--color-success-6)',
        action: () => (activeTab.value = 'ingest')
      },
      {
        title: '实时流',
        description: '查看实时日志流',
        icon: TrendingUpOutline,
        color: 'var(--color-warning-6)',
        action: () => (activeTab.value = 'stream')
      }
    ]

    const getHealthColor = (status: string) => {
      switch (status) {
        case 'success':
        case 'healthy':
          return 'var(--color-success-6)'
        case 'warning':
          return 'var(--color-warning-6)'
        case 'error':
          return 'var(--color-danger-6)'
        default:
          return 'var(--color-text-3)'
      }
    }

    const getLevelToneClass = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.TRACE:
          return 'log-center-page__level-tone log-center-page__level-tone--trace'
        case LogLevelEnum.DEBUG:
          return 'log-center-page__level-tone log-center-page__level-tone--debug'
        case LogLevelEnum.INFO:
          return 'log-center-page__level-tone log-center-page__level-tone--info'
        case LogLevelEnum.WARN:
          return 'log-center-page__level-tone log-center-page__level-tone--warn'
        case LogLevelEnum.ERROR:
          return 'log-center-page__level-tone log-center-page__level-tone--error'
        case LogLevelEnum.FATAL:
          return 'log-center-page__level-tone log-center-page__level-tone--fatal'
        default:
          return 'log-center-page__level-tone'
      }
    }

    const getLevelColor = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.TRACE:
          return '#6b7280'
        case LogLevelEnum.DEBUG:
          return '#a21caf'
        case LogLevelEnum.INFO:
          return '#15803d'
        case LogLevelEnum.WARN:
          return '#ca8a04'
        case LogLevelEnum.ERROR:
          return '#dc2626'
        case LogLevelEnum.FATAL:
          return '#7f1d1d'
        default:
          return '#6b7280'
      }
    }

    const getLevelTagStyle = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.TRACE:
          return { backgroundColor: '#f3f4f6', color: '#6b7280' }
        case LogLevelEnum.DEBUG:
          return { backgroundColor: '#f5e8ff', color: '#a21caf' }
        case LogLevelEnum.INFO:
          return { backgroundColor: '#dcfce7', color: '#15803d' }
        case LogLevelEnum.WARN:
          return { backgroundColor: '#fef3c7', color: '#ca8a04' }
        case LogLevelEnum.ERROR:
          return { backgroundColor: '#fee2e2', color: '#dc2626' }
        case LogLevelEnum.FATAL:
          return { backgroundColor: '#7f1d1d', color: '#ffffff' }
        default:
          return { backgroundColor: '#f3f4f6', color: '#6b7280' }
      }
    }

    const parseLogTimeValue = (value: unknown) => {
      if (value instanceof Date) {
        const time = value.getTime()
        return Number.isFinite(time) ? time : 0
      }

      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
      }

      if (typeof value !== 'string' || !value.trim()) return 0

      const trimmed = value.trim()
      const numericTime = Number(trimmed)
      if (Number.isFinite(numericTime)) return numericTime

      const slashTimeWithColonMilliseconds = trimmed.match(
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,3})$/
      )
      if (slashTimeWithColonMilliseconds) {
        const [, year, month, day, hour, minute, second, millisecond] = slashTimeWithColonMilliseconds
        return new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
          Number(millisecond.padEnd(3, '0'))
        ).getTime()
      }

      const normalized = trimmed
        .replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/, '$1-$2-$3')
        .replace(/(\d{2}:\d{2}:\d{2}):(\d{1,3})$/, '$1.$2')
      const parsedTime = new Date(normalized).getTime()
      return Number.isFinite(parsedTime) ? parsedTime : 0
    }

    const getLogTimestampMs = (log: LogEntry) => {
      const logRecord = log as LogEntry & Record<string, unknown>
      const candidates = [
        logRecord.timestamp,
        logRecord['@timestamp'],
        logRecord.receivedAt,
        logRecord.createdAt,
        logRecord.updatedAt,
        logRecord.time,
        logRecord.datetime,
        logRecord.date
      ]

      for (const candidate of candidates) {
        const timestampMs = parseLogTimeValue(candidate)
        if (timestampMs > 0) return timestampMs
      }

      return 0
    }

    const sortLogsByNewestFirst = (logs: LogEntry[]) => {
      return [...logs].sort((left, right) => getLogTimestampMs(right) - getLogTimestampMs(left))
    }

    const getRecentLogIdentity = (log: LogEntry) => {
      return String(log.id || log.key || `${log.timestamp}-${log.service}-${log.message}`)
    }

    const mergeRecentLogs = (currentLogs: LogEntry[], nextLogs: LogEntry[]) => {
      const seen = new Set<string>()
      const merged: LogEntry[] = []

      for (const log of [...currentLogs, ...nextLogs]) {
        const identity = getRecentLogIdentity(log)
        if (seen.has(identity)) continue
        seen.add(identity)
        merged.push(log)
      }

      return sortLogsByNewestFirst(merged)
    }

    const getRecentLogSearchText = (log: LogEntry) => {
      const searchableValues = [
        log.level,
        log.message,
        log.service,
        log.hostname,
        log.containerId,
        log.source,
        log.originType,
        log.requestId,
        log.userId,
        log.nodeID,
        log.namespace,
        log.mod,
        log.svc,
        log.thread,
        log.logger,
        log.stackTrace,
        log.stack,
        log.tags ? JSON.stringify(log.tags) : '',
        log.fields ? JSON.stringify(log.fields) : ''
      ]

      return searchableValues
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase()
    }

    const loadRecentLogs = async (page = 1) => {
      const requestParams = buildRecentLogSearchParams({
        page,
        pageSize: recentLogsPageSize,
        originType: overviewOriginType.value,
        levelFilter: recentLogLevelFilter.value
      })

      const response = await api.logs.searchLogsExplorer({
        ...requestParams
      })
      const items = Array.isArray(response?.items) ? response.items : []
      const total = Number(response?.pagination?.total || response?.total || items.length || 0)
      return { response, items, total }
    }

    const updateRecentLogsState = (items: LogEntry[], total: number, page: number, append = false) => {
      stats.recentLogs = append ? mergeRecentLogs(stats.recentLogs, items) : sortLogsByNewestFirst(items)
      stats.recentLogsTotal = total
      recentLogsPage.value = page
      recentLogsHasMore.value = stats.recentLogs.length < total
    }

    const loadMoreRecentLogs = async () => {
      if (recentLogsLoadingMore.value || !recentLogsHasMore.value) return

      recentLogsLoadingMore.value = true
      try {
        const nextPage = recentLogsPage.value + 1
        const recentResult = await loadRecentLogs(nextPage)
        updateRecentLogsState(recentResult.items, recentResult.total, nextPage, true)
      } catch (error) {
        console.error('Load more recent logs error:', error)
      } finally {
        recentLogsLoadingMore.value = false
      }
    }

    const handleRecentLogsScroll = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null
      if (!target) return

      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
      if (distanceToBottom <= 80) {
        loadMoreRecentLogs()
      }
    }

    const reloadRecentLogs = async () => {
      const recentResult = await loadRecentLogs(1)
      updateRecentLogsState(recentResult.items, recentResult.total, 1)
      await nextTick()
      if (recentLogsListRef.value) {
        recentLogsListRef.value.scrollTop = 0
      }
    }

    const loadStats = async () => {
      loading.value = true
      try {
        const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
        const statsResponse = await api.logs.getLogExplorerStats({
          startTime: todayStart,
          endTime: todayEnd,
          groupBy: 'level',
          originType: overviewOriginType.value
        })

        const todayTotal = Number(statsResponse?.totalLogs || 0)
        stats.totalLogs = todayTotal
        stats.todayLogs = todayTotal
        stats.errorRate =
          typeof statsResponse?.errorRate === 'number'
            ? statsResponse.errorRate
            : statsResponse?.errorLogs
              ? (statsResponse.errorLogs / Math.max(statsResponse.totalLogs || 1, 1)) * 100
              : 0
        if (Array.isArray(statsResponse?.topServices) && statsResponse.topServices.length > 0) {
          stats.topServices = statsResponse.topServices.slice(0, 5).map((service: any) => {
            const count = Number(service.count ?? service.logCount ?? 0)
            return {
              service: service.service,
              count,
              percentage: todayTotal > 0 ? (count / todayTotal) * 100 : 0,
              errorRate: Number(service.errorRate ?? 0)
            }
          })
        } else {
          const serviceEntries = Object.entries(statsResponse?.serviceStats || {})
          stats.topServices = serviceEntries.slice(0, 5).map(([service, count]) => ({
            service,
            count: count as number,
            percentage: todayTotal > 0 ? ((count as number) / todayTotal) * 100 : 0,
            errorRate: 0
          }))
        }

        const levelEntries = Object.entries(statsResponse?.levelStats || {})
        stats.levelDistribution = levelEntries.map(([level, count]) => ({
          level: level as LogLevelEnum,
          count: count as number,
          percentage: todayTotal > 0 ? ((count as number) / todayTotal) * 100 : 0
        }))

        stats.recentLogsScopeLabel = getRecentLogScopeLabel()
        await reloadRecentLogs()
        stats.systemHealth.lastUpdate = dayjs().format('YYYY-MM-DD HH:mm:ss')

        if (stats.errorRate < 1) {
          stats.systemHealth.status = 'healthy'
        } else if (stats.errorRate < 5) {
          stats.systemHealth.status = 'warning'
        } else {
          stats.systemHealth.status = 'error'
        }
      } catch (error: any) {
        console.error('Load stats error:', error)
        stats.systemHealth.status = 'error'
        stats.systemHealth.lastUpdate = dayjs().format('YYYY-MM-DD HH:mm:ss')
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      loadStats()
    }

    const loadDebugDiagnosticsState = async () => {
      debugDiagnosticsLoading.value = true
      try {
        const state = await api.logs.getDebugDiagnosticsState()
        debugDiagnosticsEnabled.value = Boolean(state?.enabled)
        debugDiagnosticsExpiresAt.value = state?.expiresAt || null
      } catch (error) {
        console.error('Load debug diagnostics state error:', error)
        message.warning('调试日志开关状态获取失败，请稍后重试')
      } finally {
        debugDiagnosticsLoading.value = false
      }
    }

    const updateDebugDiagnosticsState = async (enabled: boolean) => {
      debugDiagnosticsLoading.value = true
      try {
        const state = await api.logs.setDebugDiagnosticsState({
          enabled,
          durationMs: 10 * 60 * 1000,
          reason: enabled ? 'client enabled from log center' : 'client disabled from log center'
        })
        debugDiagnosticsEnabled.value = Boolean(state?.enabled)
        debugDiagnosticsExpiresAt.value = state?.expiresAt || null
        message.success(enabled ? '已临时开启调试日志收集，10 分钟后自动关闭' : '已关闭调试日志收集')
      } catch (error) {
        console.error('Update debug diagnostics state error:', error)
        message.error('调试日志开关更新失败')
      } finally {
        debugDiagnosticsLoading.value = false
      }
    }

    const startAutoRefresh = () => {
      refreshTimer.value = setInterval(() => {
        loadStats()
      }, 30000)
    }

    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    const errorRateStatus = computed(() => {
      if (stats.errorRate < 1) return 'success'
      if (stats.errorRate < 5) return 'warning'
      return 'error'
    })

    const filteredRecentLogs = computed(() => {
      const keyword = recentLogKeyword.value.trim().toLowerCase()

      return stats.recentLogs.filter((log) => {
        if (!keyword) return true
        return getRecentLogSearchText(log).includes(keyword)
      })
    })

    const hasRecentLogFilters = computed(() => Boolean(recentLogLevelFilter.value || recentLogKeyword.value.trim()))

    const copyRecentLogs = async () => {
      if (filteredRecentLogs.value.length === 0) {
        message.warning('没有日志可复制')
        return
      }

      const content = filteredRecentLogs.value.map((log) => formatLogForClipboard(log)).join('\n')
      try {
        await copyLogText(content)
        message.success(`已复制 ${filteredRecentLogs.value.length} 条日志`)
      } catch {
        message.error('复制日志失败')
      }
    }

    onMounted(() => {
      loadStats()
      loadDebugDiagnosticsState()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return () => (
      <div class="log-center-page">
        <NTabs v-model:value={activeTab.value} type="line" size="large" animated class="log-center-page__tabs">
          <NTabPane name="overview" tab="概览">
            <div class="log-center-page__overview">
              <PageHeader title="日志中心" subtitle="统一检索、分析和追踪服务日志，快速定位异常上下文">
                {{
                  actions: () => (
                    <>
                      <div
                        class={[
                          'log-center-page__debug-switch',
                          debugDiagnosticsEnabled.value ? 'log-center-page__debug-switch--enabled' : ''
                        ]}>
                        <div class="log-center-page__debug-switch-copy">
                          <span class="log-center-page__debug-switch-title">调试日志收集</span>
                          {/* <span class="log-center-page__debug-switch-desc">{debugDiagnosticsStatusText.value}</span> */}
                        </div>
                        <NSwitch
                          value={debugDiagnosticsEnabled.value}
                          loading={debugDiagnosticsLoading.value}
                          disabled={debugDiagnosticsLoading.value}
                          onUpdateValue={updateDebugDiagnosticsState}
                        />
                      </div>
                      <NButton
                        onClick={refreshData}
                        loading={loading.value}
                        type="primary"
                        secondary
                        class="log-center-page__refresh-btn">
                        <NIcon component={RefreshOutline} class="mr-1" />
                        刷新
                      </NButton>
                    </>
                  )
                }}
              </PageHeader>

              <NAlert
                type={debugDiagnosticsEnabled.value ? 'warning' : 'info'}
                showIcon
                class="log-center-page__debug-alert">
                {debugDiagnosticsEnabled.value
                  ? '调试日志收集已临时开启。期间客户端会打印并上报 DEBUG 级别诊断日志，服务端会在到期后自动恢复关闭。'
                  : '调试日志默认关闭。排查问题时可在右上角临时开启，避免日常运行产生大量 debug 噪音。'}
              </NAlert>

              <NAlert
                type={
                  stats.systemHealth.status === 'healthy'
                    ? 'success'
                    : stats.systemHealth.status === 'warning'
                      ? 'warning'
                      : 'error'
                }
                showIcon
                class="log-center-page__health-alert">
                <div class="log-center-page__health-content">
                  <span class="log-center-page__health-title">
                    系统状态:{' '}
                    {stats.systemHealth.status === 'healthy'
                      ? '健康'
                      : stats.systemHealth.status === 'warning'
                        ? '警告'
                        : '错误'}
                    {/* {stats.systemHealth.uptime && ` | 可用性: ${stats.systemHealth.uptime}`} */}
                  </span>
                  <span class="log-center-page__health-time">最后更新: {stats.systemHealth.lastUpdate}</span>
                </div>
              </NAlert>

              <NCard title="核心指标" bordered={false} class="log-center-page__card log-center-page__card--primary">
                <NGrid cols={3} xGap={16}>
                  <NGridItem>
                    <NStatistic label="总日志数" value={stats.totalLogs.toLocaleString()}>
                      {{
                        prefix: () => h(NIcon, { component: DocumentTextOutline, color: 'var(--color-primary-6)' }),
                        default: () => (
                          <span class="log-center-page__stat-value">{stats.totalLogs.toLocaleString()}</span>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="今日日志" value={stats.todayLogs.toLocaleString()}>
                      {{
                        prefix: () => h(NIcon, { component: TimeOutline, color: 'var(--color-success-6)' }),
                        default: () => (
                          <span class="log-center-page__stat-value">{stats.todayLogs.toLocaleString()}</span>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="错误率" value={`${stats.errorRate.toFixed(2)}%`}>
                      {{
                        prefix: () =>
                          h(NIcon, { component: WarningOutline, color: getHealthColor(errorRateStatus.value) }),
                        default: () => (
                          <span
                            class={`log-center-page__stat-value ${stats.errorRate > 0 ? 'log-center-page__stat-value--danger' : 'log-center-page__stat-value--success'}`}>
                            {stats.errorRate.toFixed(2)}%
                          </span>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                </NGrid>
              </NCard>

              <NCard title="快捷操作" bordered={false} class="log-center-page__card">
                <NGrid cols={5} xGap={16} yGap={16}>
                  {quickActions.map((action, index) => (
                    <NGridItem key={index}>
                      <div class="log-center-page__quick-action" onClick={action.action}>
                        <div class="log-center-page__quick-action-content">
                          <div
                            class="log-center-page__quick-action-icon"
                            style={{ '--log-action-color': action.color }}>
                            <NIcon component={action.icon} size={24} color={action.color} />
                          </div>
                          <h4 class="log-center-page__quick-action-title">{action.title}</h4>
                          <p class="log-center-page__quick-action-desc">{action.description}</p>
                        </div>
                      </div>
                    </NGridItem>
                  ))}
                </NGrid>
              </NCard>

              <NGrid cols={2} xGap={16} class="log-center-page__split-grid">
                <NGridItem>
                  <NCard
                    title="Top 5 服务 · 日志量与错误率"
                    bordered={false}
                    class="log-center-page__card log-center-page__card--stretch">
                    {stats.topServices.length > 0 ? (
                      <div class="log-center-page__list">
                        {stats.topServices.map((service, index) => (
                          <div key={index} class="log-center-page__list-item">
                            <div class="log-center-page__list-item-main">
                              <div class="log-center-page__list-badge">
                                <NIcon component={ServerOutline} size={16} color="var(--color-primary-6)" />
                              </div>
                              <span class="log-center-page__list-title">{service.service}</span>
                            </div>
                            <div class="log-center-page__list-item-meta">
                              <span class="log-center-page__service-metric">
                                <span class="log-center-page__metric-label">日志数</span>
                                <span class="log-center-page__mono">{service.count.toLocaleString()}</span>
                              </span>
                              <span
                                class={[
                                  'log-center-page__service-metric',
                                  service.errorRate > 0 ? 'log-center-page__service-metric--danger' : ''
                                ]}>
                                <span class="log-center-page__metric-label">错误率</span>
                                <span class="log-center-page__mono">{service.errorRate.toFixed(2)}%</span>
                              </span>
                              <div
                                class="log-center-page__progress-slot"
                                title={`日志占比 ${service.percentage.toFixed(1)}%`}>
                                <NProgress
                                  type="line"
                                  percentage={service.percentage}
                                  showIndicator={false}
                                  height={6}
                                  color="var(--color-primary-6)"
                                />
                              </div>
                              <span class="log-center-page__meta-text">占比 {service.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <NEmpty description="暂无数据" />
                    )}
                  </NCard>
                </NGridItem>

                <NGridItem>
                  <NCard
                    title="日志级别分布"
                    bordered={false}
                    class="log-center-page__card log-center-page__card--stretch">
                    {stats.levelDistribution.length > 0 ? (
                      <div class="log-center-page__list">
                        {stats.levelDistribution.map((level, index) => (
                          <div key={index} class="log-center-page__list-item">
                            <div class="log-center-page__list-item-main">
                              <div
                                class={`log-center-page__level-dot ${getLevelToneClass(level.level)}`}
                                style={{ backgroundColor: getLevelColor(level.level) }}></div>
                              <span class="log-center-page__list-title">{level.level.toUpperCase()}</span>
                            </div>
                            <div class="log-center-page__list-item-meta">
                              <span class="log-center-page__mono">{level.count.toLocaleString()}</span>
                              <div class="log-center-page__progress-slot">
                                <NProgress
                                  type="line"
                                  percentage={level.percentage}
                                  showIndicator={false}
                                  height={6}
                                  color={getLevelColor(level.level)}
                                />
                              </div>
                              <span class="log-center-page__meta-text">{level.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <NEmpty description="暂无数据" />
                    )}
                  </NCard>
                </NGridItem>
              </NGrid>

              <NCard bordered={false} class="log-center-page__card log-center-page__card--recent">
                {{
                  header: () => (
                    <div class="log-center-page__card-title-row">
                      <span>{stats.recentLogsScopeLabel}</span>
                      <span class="log-center-page__card-meta">共 {stats.totalLogs.toLocaleString()} 条</span>
                    </div>
                  ),
                  default: () => (
                    <>
                      <div class="log-center-page__recent-toolbar">
                        {isAdminUser ? (
                          <NSelect
                            value={overviewOriginType.value}
                            options={recentLogOriginTypeOptions}
                            class="log-center-page__recent-origin-filter"
                            onUpdateValue={(value: LogOriginType) => {
                              overviewOriginType.value = value
                              loadStats()
                            }}
                          />
                        ) : null}
                        <NSelect
                          value={recentLogLevelFilter.value}
                          options={recentLogLevelOptions}
                          placeholder="全部级别"
                          clearable
                          class="log-center-page__recent-level-filter"
                          onUpdateValue={(value: RecentLogLevelFilter) => {
                            recentLogLevelFilter.value = value
                            reloadRecentLogs()
                          }}
                        />
                        <NInput
                          value={recentLogKeyword.value}
                          placeholder="搜索消息、服务、主机、标签"
                          clearable
                          class="log-center-page__recent-search"
                          onUpdateValue={(value: string) => {
                            recentLogKeyword.value = value
                          }}
                        />
                        <NButton secondary onClick={copyRecentLogs}>
                          复制日志
                        </NButton>
                      </div>

                      {filteredRecentLogs.value.length > 0 ? (
                        <div
                          ref={recentLogsListRef}
                          class="log-center-page__recent-list"
                          onScroll={handleRecentLogsScroll}>
                          {filteredRecentLogs.value.map((log, index) => (
                            <div
                              key={log.id || log.key || `${log.timestamp}-${index}`}
                              class="log-center-page__recent-item">
                              <div class="log-center-page__recent-rail">
                                <NTag
                                  size="small"
                                  bordered={false}
                                  class={['log-center-page__level-tag', getLevelToneClass(log.level)]}
                                  style={getLevelTagStyle(log.level)}>
                                  {log.level.toUpperCase()}
                                </NTag>
                                <span class="log-center-page__service-chip">{log.service || 'unknown-service'}</span>
                              </div>
                              <div class="log-center-page__recent-content">
                                <div class="log-center-page__recent-line">
                                  <div class="log-center-page__recent-message">{log.message}</div>
                                  <span class="log-center-page__recent-time">
                                    <NTime time={new Date(log.timestamp)} type="datetime" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div class="log-center-page__recent-load-state">
                            {recentLogsLoadingMore.value
                              ? '正在加载更多日志…'
                              : recentLogsHasMore.value
                                ? '向下滚动加载更多'
                                : '已加载全部最近日志'}
                          </div>
                        </div>
                      ) : (
                        <NEmpty description={hasRecentLogFilters.value ? '没有匹配的最近日志' : '暂无最近日志'} />
                      )}
                    </>
                  )
                }}
              </NCard>
            </div>
          </NTabPane>

          <NTabPane name="service" tab="日志搜索">
            <LogService />
          </NTabPane>

          <NTabPane name="exception" tab="异常分析">
            <ExceptionAnalysisContent />
          </NTabPane>

          <NTabPane name="ingest" tab="日志摄取">
            <LogIngest />
          </NTabPane>

          <NTabPane name="stream" tab="实时流">
            <LogStreamContent />
          </NTabPane>
        </NTabs>
      </div>
    )
  }
})
