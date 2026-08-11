import { defineComponent, ref, onActivated, onDeactivated, onUnmounted, computed, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Tab } from 'vant'
import {
  MobileButton,
  MobileCard,
  MobileTag,
  MobileEmpty,
  MobileLoading,
  MobileInput,
  MobileSelect,
  MobileTabs,
  MobileProgress,
  MobileSwitch,
  MobileGrid
} from '@/mobile/ui'
import {
  PhArrowsClockwise,
  PhFile,
  PhCalendar,
  PhWarningCircle,
  PhCloudArrowUp,
  PhComputerTower,
  PhBug
} from '@phosphor-icons/vue'
import { searchLogs, fetchCatalogServices, getLogStats } from '@/api'
import { getDebugDiagnosticsState, setDebugDiagnosticsState } from '@/api/logs'
import type { LogEntry, LogOriginType, LogSearchParams } from '@/types/logs'
import { LogLevelEnum } from '@/types/logs'
import dayjs from 'dayjs'
import { getPreferredMetricsDatasetScope, getStoredUserInfo } from '@/services/authSession'
import { parseInvestigationContext, resolveInvestigationWindow } from '@/mobile/hooks/investigationContext'
import { useActivationRefresh } from '@/mobile/hooks/useActivationRefresh'
import './MobileLogCenter.scss'

const LOG_LEVELS: Array<{ key: LogLevelEnum; label: string }> = [
  { key: LogLevelEnum.ERROR, label: 'ERROR' },
  { key: LogLevelEnum.WARN, label: 'WARN' },
  { key: LogLevelEnum.INFO, label: 'INFO' },
  { key: LogLevelEnum.DEBUG, label: 'DEBUG' }
]

const TIME_RANGES = [
  { key: '15m', label: '15分钟' },
  { key: '1h', label: '1小时' },
  { key: '4h', label: '4小时' },
  { key: '1d', label: '1天' }
]

const TIME_RANGE_HOURS: Record<string, number> = {
  '15m': 0.25,
  '1h': 1,
  '4h': 4,
  '1d': 24
}

const levelTagTypeMap: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  ERROR: 'danger',
  WARN: 'warning',
  INFO: 'info',
  DEBUG: 'default'
}

export default defineComponent({
  name: 'MobileLogCenter',
  setup() {
    const route = useRoute()
    // ── Common state ──
    const activeTab = ref('overview')
    const isAdminUser = Boolean(getStoredUserInfo()?.isAdmin)
    const debugEnabled = ref(false)
    const debugLoading = ref(false)

    const loadDebugState = async () => {
      try {
        debugEnabled.value = Boolean((await getDebugDiagnosticsState())?.enabled)
      } catch {}
    }

    const toggleDebug = async (v: boolean) => {
      debugLoading.value = true
      try {
        await setDebugDiagnosticsState({ enabled: v, durationMs: 10 * 60 * 1000, reason: 'mobile toggle' })
        debugEnabled.value = v
      } catch {
      } finally {
        debugLoading.value = false
      }
    }

    const refreshTimer = ref<number | null>(null)

    // ── Overview tab state ──
    const loading = ref(false)
    const error = ref(false)
    const logs = ref<LogEntry[]>([])
    const logsTotal = ref(0)
    const logsPage = ref(1)
    const logsPageSize = 30
    const logsLoadingMore = ref(false)
    const logsHasMore = ref(false)
    const listRef = ref<HTMLElement | null>(null)
    const searchKeyword = ref('')
    const activeLevels = ref<LogLevelEnum[]>([])
    const overviewOriginType = ref<LogOriginType>(isAdminUser ? 'darwin-app' : 'microservice')
    const timeRange = ref('1h')
    const expandedLogId = ref<string | null>(null)

    // ── Stream tab state ──
    const streamLoading = ref(false)
    const streamError = ref(false)
    const streamPaused = ref(false)
    const streamFreq = ref<number | null>(null)
    let streamGeneration = 0
    let isStreamActive = false
    const streamLogs = ref<LogEntry[]>([])
    const streamLogsTotal = ref(0)

    // ── Ingest tab state ──
    const ingestLoading = ref(false)
    const ingestError = ref(false)
    const ingestKeys = ref<any[]>([])

    // ── Service tab state ──
    const serviceLoading = ref(false)
    const serviceOptionsError = ref(false)
    const serviceLogsError = ref(false)
    const serviceLogsLoadingMore = ref(false)
    const serviceLogsLoadMoreError = ref(false)
    const serviceServices = ref<Array<{ label: string; value: string }>>([])
    const selectedService = ref<string | null>(null)
    const serviceLogs = ref<LogEntry[]>([])
    const serviceLogsTotal = ref(0)
    const serviceLogsPage = ref(1)
    const serviceLogsHasMore = ref(false)

    // ── Exception tab state ──
    const exceptionLoading = ref(false)
    const exceptionError = ref(false)
    const exceptionStats = ref<{ total: number; critical: number; services: number; types: number }>({
      total: 0,
      critical: 0,
      services: 0,
      types: 0
    })

    // ──────────────────────────────
    //  Overview helpers
    // ──────────────────────────────

    const originTypeOptions = [
      ...(isAdminUser ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
      { label: '用户微服务日志', value: 'microservice' }
    ]

    const parseLogTimeValue = (value: unknown) => {
      if (value instanceof Date) {
        const time = value.getTime()
        return Number.isFinite(time) ? time : 0
      }
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      if (typeof value !== 'string' || !value.trim()) return 0
      const trimmed = value.trim()
      const numericTime = Number(trimmed)
      if (Number.isFinite(numericTime)) return numericTime
      const slashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,3})$/)
      if (slashMatch) {
        const [, year, month, day, hour, minute, second, millisecond] = slashMatch
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
      for (const c of candidates) {
        const ms = parseLogTimeValue(c)
        if (ms > 0) return ms
      }
      return 0
    }

    const sortLogsByNewest = (list: LogEntry[]) => [...list].sort((a, b) => getLogTimestampMs(b) - getLogTimestampMs(a))

    const getLogIdentity = (log: LogEntry) =>
      String(log.id || log.key || `${log.timestamp}-${log.service}-${log.message}`)

    const dedupeLogs = (existing: LogEntry[], incoming: LogEntry[]) => {
      const seen = new Set(existing.map(getLogIdentity))
      const unique = incoming.filter((l) => !seen.has(getLogIdentity(l)))
      return sortLogsByNewest([...existing, ...unique])
    }

    const buildSearchParams = (page = 1): LogSearchParams => {
      const context = parseInvestigationContext(route.query)
      const window = resolveInvestigationWindow(context)
      const endTime = window ? dayjs(window.end) : dayjs()
      const rangeHours = TIME_RANGE_HOURS[timeRange.value] ?? TIME_RANGE_HOURS['1h']
      const params: LogSearchParams = {
        page,
        pageSize: logsPageSize,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        originType: overviewOriginType.value,
        startTime: (window ? dayjs(window.start) : endTime.subtract(rangeHours, 'hour')).toISOString(),
        endTime: endTime.toISOString()
      }
      if (searchKeyword.value.trim()) {
        params.keyword = searchKeyword.value.trim()
      }
      if (context.serviceName) params.service = context.serviceName
      if (activeLevels.value.length > 0) {
        params.levels = activeLevels.value
      }
      if (overviewOriginType.value === 'darwin-app') {
        params.excludeServices = ['logs']
        params.excludeNodeIDs = ['logs-development']
      }
      return params
    }

    const loadLogs = async (page = 1) => {
      loading.value = true
      error.value = false
      try {
        const params = buildSearchParams(page)
        const res = await searchLogs(params)
        logs.value = sortLogsByNewest(res?.logs || [])
        logsTotal.value = Number(res?.total || res?.logs?.length || 0)
        logsPage.value = page
        logsHasMore.value = logs.value.length < logsTotal.value
        loadAnalytics()
      } catch {
        error.value = true
      } finally {
        loading.value = false
      }
    }

    const loadMoreLogs = async () => {
      if (logsLoadingMore.value || !logsHasMore.value) return
      logsLoadingMore.value = true
      try {
        const nextPage = logsPage.value + 1
        const params = buildSearchParams(nextPage)
        const res = await searchLogs(params)
        const incoming = res?.logs || []
        const newTotal = Number(res?.total || res?.logs?.length || 0)
        logs.value = dedupeLogs(logs.value, incoming)
        logsTotal.value = newTotal
        logsPage.value = nextPage
        logsHasMore.value = logs.value.length < newTotal
      } catch (err) {
        console.error('Load more overview logs error:', err)
      } finally {
        logsLoadingMore.value = false
      }
    }

    const handleOverviewScroll = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null
      if (!target) return
      const dist = target.scrollHeight - target.scrollTop - target.clientHeight
      if (dist <= 80) loadMoreLogs()
    }

    const toggleLevel = (level: LogLevelEnum) => {
      const idx = activeLevels.value.indexOf(level)
      if (idx >= 0) {
        activeLevels.value.splice(idx, 1)
      } else {
        activeLevels.value.push(level)
      }
      loadLogs(1)
    }

    const setTimeRange = (key: string) => {
      timeRange.value = key
      loadLogs(1)
    }

    const toggleExpand = (logId: string) => {
      expandedLogId.value = expandedLogId.value === logId ? null : logId
    }

    const stats = computed(() => {
      const total = logsTotal.value
      const todayCount = logs.value.filter((l) => {
        const d = new Date(l.timestamp)
        const now = new Date()
        return d.toDateString() === now.toDateString()
      }).length
      const errorCount = logs.value.filter(
        (l) => l.level === LogLevelEnum.ERROR || l.level === LogLevelEnum.FATAL
      ).length
      const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0
      return {
        total,
        today: todayCount,
        errorRate,
        topServices: analyticTopServices.value,
        levelDistribution: analyticLevelDistribution.value
      }
    })

    const analyticTopServices = ref<Array<{ service: string; count: number; percentage: number; errorRate: number }>>(
      []
    )
    const analyticLevelDistribution = ref<Array<{ level: string; count: number; percentage: number }>>([])
    const analyticLoading = ref(false)

    const levelColor = (level: string) => {
      const colors: Record<string, string> = {
        error: 'var(--color-danger-6)',
        fatal: 'var(--color-danger-6)',
        warn: 'var(--color-warning-6)',
        warning: 'var(--color-warning-6)',
        info: 'var(--color-primary-6)',
        debug: 'var(--color-text-3)',
        trace: 'var(--color-text-3)'
      }
      return colors[level] || 'var(--color-text-3)'
    }

    const loadAnalytics = async () => {
      analyticLoading.value = true
      try {
        const res = await getLogStats({
          timeRange: `-${timeRange.value}`,
          originType: overviewOriginType.value
        })
        const total = Number(res?.totalLogs || 0)
        if (Array.isArray(res?.topServices)) {
          analyticTopServices.value = res.topServices.slice(0, 5).map((s: any) => ({
            service: s.service,
            count: Number(s.count ?? s.logCount ?? 0),
            percentage: total > 0 ? (Number(s.count ?? s.logCount ?? 0) / total) * 100 : 0,
            errorRate: Number(s.errorRate ?? 0)
          }))
        }
        const levelEntries = Object.entries(res?.levelStats || {})
        analyticLevelDistribution.value = levelEntries
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([level, count]) => ({
            level,
            count: count as number,
            percentage: total > 0 ? ((count as number) / total) * 100 : 0
          }))
      } catch {
        analyticTopServices.value = []
        analyticLevelDistribution.value = []
      } finally {
        analyticLoading.value = false
      }
    }

    const filteredLogs = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return logs.value
      return logs.value.filter((log) => {
        const haystack =
          `${log.message || ''} ${log.service || ''} ${log.hostname || ''} ${log.level || ''}`.toLowerCase()
        return haystack.includes(keyword)
      })
    })

    // ──────────────────────────────
    //  Stream tab
    // ──────────────────────────────

    const startStream = async () => {
      const generation = ++streamGeneration
      isStreamActive = true
      streamLoading.value = true
      streamError.value = false
      try {
        const params: LogSearchParams = {
          page: 1,
          pageSize: 50,
          sortBy: 'timestamp',
          sortOrder: 'desc',
          originType: overviewOriginType.value
        }
        const res = await searchLogs(params)
        if (generation !== streamGeneration || !isStreamActive || activeTab.value !== 'stream') return
        streamLogs.value = res?.logs || []
        streamLogsTotal.value = Number(res?.total || streamLogs.value.length)
      } catch (err) {
        console.error('Stream load error:', err)
        if (generation === streamGeneration && activeTab.value === 'stream') streamError.value = true
        return
      } finally {
        if (generation === streamGeneration) streamLoading.value = false
      }

      if (generation !== streamGeneration || !isStreamActive || activeTab.value !== 'stream') return

      if (streamFreq.value === null) {
        streamFreq.value = window.setInterval(async () => {
          if (!streamPaused.value) {
            try {
              const params: LogSearchParams = {
                page: 1,
                pageSize: 50,
                sortBy: 'timestamp',
                sortOrder: 'desc',
                originType: overviewOriginType.value
              }
              const res = await searchLogs(params)
              if (generation !== streamGeneration || !isStreamActive || activeTab.value !== 'stream') return
              streamLogs.value = res?.logs || []
              streamLogsTotal.value = Number(res?.total || streamLogs.value.length)
            } catch {
              if (generation === streamGeneration && activeTab.value === 'stream') streamError.value = true
            }
          }
        }, 5000)
      }
    }

    const stopStream = () => {
      streamGeneration += 1
      isStreamActive = false
      if (streamFreq.value !== null) {
        window.clearInterval(streamFreq.value)
        streamFreq.value = null
      }
      streamPaused.value = false
    }

    const toggleStreamPause = () => {
      streamPaused.value = !streamPaused.value
    }

    // ──────────────────────────────
    //  Ingest tab
    // ──────────────────────────────

    const loadIngest = async () => {
      ingestLoading.value = true
      ingestError.value = false
      try {
        const { getAppKeys, getIngestionStatus } = await import('@/api/metrics')
        const [keysRes] = await Promise.all([getAppKeys(), getIngestionStatus()])
        ingestKeys.value = Array.isArray(keysRes) ? keysRes : []
      } catch {
        ingestError.value = true
      } finally {
        ingestLoading.value = false
      }
    }

    const ingestActiveKeys = computed(() => ingestKeys.value.filter((item) => item.isActive !== false))

    const ingestStats = computed(() => {
      const total = ingestKeys.value.length
      const active = ingestActiveKeys.value.length
      const expired = total - active
      return { total, active, expired }
    })

    // ──────────────────────────────
    //  Service tab
    // ──────────────────────────────

    const loadServiceOptions = async () => {
      serviceLoading.value = true
      serviceOptionsError.value = false
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: getPreferredMetricsDatasetScope() })
        const items = res?.items || []
        serviceServices.value = items.map((item: any) => ({
          label: item.identity?.name || item.identity?.id,
          value: item.identity?.name || ''
        }))
      } catch (err) {
        console.error('Failed to load service options:', err)
        serviceServices.value = []
        serviceOptionsError.value = true
      } finally {
        serviceLoading.value = false
      }
    }

    const loadServiceLogs = async () => {
      if (!selectedService.value) return
      serviceLoading.value = true
      serviceLogsError.value = false
      serviceLogsLoadMoreError.value = false
      try {
        const params: LogSearchParams = {
          page: 1,
          pageSize: 30,
          sortBy: 'timestamp',
          sortOrder: 'desc',
          service: selectedService.value,
          originType: overviewOriginType.value
        }
        const res = await searchLogs(params)
        serviceLogs.value = res?.logs || []
        serviceLogsTotal.value = Number(res?.total || serviceLogs.value.length)
        serviceLogsPage.value = 1
        serviceLogsHasMore.value = Boolean(res?.hasMore)
      } catch (err) {
        console.error('Service logs load error:', err)
        serviceLogs.value = []
        serviceLogsTotal.value = 0
        serviceLogsHasMore.value = false
        serviceLogsError.value = true
      } finally {
        serviceLoading.value = false
      }
    }

    const loadMoreServiceLogs = async () => {
      if (!selectedService.value || serviceLogsLoadingMore.value || !serviceLogsHasMore.value) return
      serviceLogsLoadingMore.value = true
      serviceLogsLoadMoreError.value = false
      try {
        const nextPage = serviceLogsPage.value + 1
        const res = await searchLogs({
          page: nextPage,
          pageSize: 30,
          sortBy: 'timestamp',
          sortOrder: 'desc',
          service: selectedService.value,
          originType: overviewOriginType.value
        })
        serviceLogs.value = dedupeLogs(serviceLogs.value, res?.logs || [])
        serviceLogsTotal.value = Number(res?.total || serviceLogs.value.length)
        serviceLogsPage.value = nextPage
        serviceLogsHasMore.value = Boolean(res?.hasMore)
      } catch (loadError) {
        console.error('Load more service logs error:', loadError)
        serviceLogsLoadMoreError.value = true
      } finally {
        serviceLogsLoadingMore.value = false
      }
    }

    // ──────────────────────────────
    //  Exception tab
    // ──────────────────────────────

    const loadExceptionStats = async () => {
      exceptionLoading.value = true
      exceptionError.value = false
      try {
        const { default: api } = await import('@/api')
        const response = await api.logs.listExceptions({
          page: 1,
          pageSize: 20,
          timeRange: '24h'
        })
        const items = response?.items || []
        const total = items.reduce((sum: number, item: any) => sum + Number(item.count || 0), 0)
        const critical = items.filter((item: any) => item.count >= 100).length
        const services = new Set(items.map((item: any) => item.service)).size
        exceptionStats.value = { total, critical, services, types: items.length }
      } catch {
        exceptionError.value = true
      } finally {
        exceptionLoading.value = false
      }
    }

    // ──────────────────────────────
    //  Lifecycle
    // ──────────────────────────────

    const refreshData = () => {
      if (activeTab.value === 'overview') loadLogs(1)
      else if (activeTab.value === 'ingest') loadIngest()
      else if (activeTab.value === 'exception') loadExceptionStats()
      else if (activeTab.value === 'service') loadServiceLogs()
      else if (activeTab.value === 'stream') startStream()
    }

    const shouldRefreshOnActivation = useActivationRefresh(15_000, {
      contextKey: () => route.fullPath
    })

    const handleTabChange = (tab: string) => {
      if (tab === activeTab.value) return
      stopStream()
      activeTab.value = tab
      if (tab === 'overview' && logs.value.length === 0) loadLogs(1)
      if (tab === 'ingest') loadIngest()
      if (tab === 'service') loadServiceOptions()
      if (tab === 'exception') loadExceptionStats()
    }

    const startRefreshTimer = () => {
      if (refreshTimer.value) window.clearInterval(refreshTimer.value)
      refreshTimer.value = window.setInterval(() => {
        if (activeTab.value === 'overview') loadLogs(1)
      }, 30000)
    }

    onActivated(() => {
      const context = parseInvestigationContext(route.query)
      if (context.tab) activeTab.value = context.tab
      if (context.keyword !== undefined) searchKeyword.value = context.keyword
      if (context.serviceName) selectedService.value = context.serviceName
      if (context.range && TIME_RANGE_HOURS[context.range]) timeRange.value = context.range
      if (shouldRefreshOnActivation()) loadLogs(1)
      if (isAdminUser) loadDebugState()
      startRefreshTimer()
      if (activeTab.value === 'stream') startStream()
    })

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.tab !== undefined) activeTab.value = context.tab
        if (context.keyword !== undefined) searchKeyword.value = context.keyword
        if (context.serviceName !== undefined) selectedService.value = context.serviceName
        if (context.range && TIME_RANGE_HOURS[context.range]) timeRange.value = context.range
        if (
          context.tab !== undefined ||
          context.keyword !== undefined ||
          context.serviceName !== undefined ||
          context.range !== undefined ||
          context.start !== undefined
        )
          refreshData()
      }
    )

    const stopRefreshTimer = () => {
      if (refreshTimer.value) {
        window.clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    onDeactivated(() => {
      stopStream()
      stopRefreshTimer()
    })

    onUnmounted(() => {
      stopStream()
      stopRefreshTimer()
    })

    // ──────────────────────────────
    //  Render helpers
    // ──────────────────────────────

    const renderLogEntry = (log: LogEntry, index: number) => {
      const logId = log.id || log.key || `${log.timestamp}-${index}`
      const expanded = expandedLogId.value === logId
      return (
        <div key={logId} class="mobile-log-center__list-card-wrapper" onClick={() => toggleExpand(logId)}>
          <MobileCard size="small" bordered={false} class="mobile-log-center__list-card">
            <div class="mobile-log-center__log-header">
              <span class="mobile-log-center__log-time">
                {log.timestamp ? dayjs(log.timestamp).format('MM-DD HH:mm:ss') : '-'}
              </span>
              <MobileTag size="small" type={levelTagTypeMap[log.level] || 'default'}>
                {log.level}
              </MobileTag>
            </div>
            <div class="mobile-log-center__log-service">{log.service || '-'}</div>
            <div class="mobile-log-center__log-message">
              {expanded
                ? log.message || '-'
                : (log.message || '').length > 120
                  ? (log.message || '').slice(0, 120) + '...'
                  : log.message || '-'}
            </div>
            {expanded && (
              <div class="mobile-log-center__log-detail">
                {log.hostname && (
                  <div class="mobile-log-center__log-meta-row">
                    <span class="mobile-log-center__log-meta-label">Host</span>
                    <span class="mobile-log-center__log-meta-value">{log.hostname}</span>
                  </div>
                )}
                {log.containerId && (
                  <div class="mobile-log-center__log-meta-row">
                    <span class="mobile-log-center__log-meta-label">Container</span>
                    <span class="mobile-log-center__log-meta-value">{log.containerId}</span>
                  </div>
                )}
                {log.thread && (
                  <div class="mobile-log-center__log-meta-row">
                    <span class="mobile-log-center__log-meta-label">Thread</span>
                    <span class="mobile-log-center__log-meta-value">{log.thread}</span>
                  </div>
                )}
                {log.originType && (
                  <div class="mobile-log-center__log-meta-row">
                    <span class="mobile-log-center__log-meta-label">Origin</span>
                    <span class="mobile-log-center__log-meta-value">{log.originType}</span>
                  </div>
                )}
                {log.stackTrace && (
                  <div class="mobile-log-center__log-stack">
                    <div class="mobile-log-center__log-meta-label">Stack</div>
                    <pre class="mobile-log-center__log-stack-code">{log.stackTrace}</pre>
                  </div>
                )}
              </div>
            )}
          </MobileCard>
        </div>
      )
    }

    const renderOverviewTab = () => (
      <div class="mobile-log-center__tab-content">
        <div class="mobile-log-center__stats">
          <MobileGrid cols={3} gap="8px">
            <div>
              <div class="mobile-log-center__stat-card">
                <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--total">
                  <PhFile size={16} />
                </div>
                <div class="mobile-log-center__stat-value">{stats.value.total}</div>
                <div class="mobile-log-center__stat-label">总日志</div>
              </div>
            </div>
            <div>
              <div class="mobile-log-center__stat-card">
                <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--today">
                  <PhCalendar size={16} />
                </div>
                <div class="mobile-log-center__stat-value">{stats.value.today}</div>
                <div class="mobile-log-center__stat-label">今日</div>
              </div>
            </div>
            <div>
              <div class="mobile-log-center__stat-card">
                <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate">
                  <PhWarningCircle size={16} />
                </div>
                <div class="mobile-log-center__stat-value">{stats.value.errorRate}%</div>
                <div class="mobile-log-center__stat-label">错误率</div>
              </div>
            </div>
          </MobileGrid>
        </div>

        {/* Top 5 services + Level distribution */}
        <MobileGrid cols={2} gap="8px" class="mobile-log-center__analytics">
          <div>
            <MobileCard size="small" title="Top 5 服务" bordered={false} class="mobile-log-center__analytic-card">
              {analyticTopServices.value.length > 0 ? (
                <div class="mobile-log-center__service-list">
                  {analyticTopServices.value.map((svc, i) => (
                    <div key={i} class="mobile-log-center__service-item">
                      <div class="mobile-log-center__service-name">
                        <span class="mobile-log-center__service-dot" />
                        <span>{svc.service}</span>
                      </div>
                      <div class="mobile-log-center__service-meta">
                        <span>{svc.count.toLocaleString()} 条</span>
                        <span class={svc.errorRate > 0 ? 'mobile-log-center__text-danger' : ''}>
                          {svc.errorRate.toFixed(1)}% 错误
                        </span>
                      </div>
                      <MobileProgress
                        percentage={svc.percentage}
                        showPivot={false}
                        strokeWidth={4}
                        color="var(--color-primary-6)"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <MobileEmpty description="暂无数据" />
              )}
            </MobileCard>
          </div>
          <div>
            <MobileCard size="small" title="日志级别" bordered={false} class="mobile-log-center__analytic-card">
              {analyticLevelDistribution.value.length > 0 ? (
                <div class="mobile-log-center__service-list">
                  {analyticLevelDistribution.value.map((lv, i) => (
                    <div key={i} class="mobile-log-center__service-item">
                      <div class="mobile-log-center__service-name">
                        <span class={['mobile-log-center__level-dot', `mobile-log-center__level-dot--${lv.level}`]} />
                        <span>{lv.level.toUpperCase()}</span>
                      </div>
                      <div class="mobile-log-center__service-meta">
                        <span>{lv.count.toLocaleString()} 条</span>
                        <span>{lv.percentage.toFixed(1)}%</span>
                      </div>
                      <MobileProgress
                        percentage={lv.percentage}
                        showPivot={false}
                        strokeWidth={4}
                        color={levelColor(lv.level)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <MobileEmpty description="暂无数据" />
              )}
            </MobileCard>
          </div>
        </MobileGrid>

        {/* Time range chips */}
        <div class="mobile-log-center__time-chips">
          {TIME_RANGES.map((range) => (
            <MobileButton
              key={range.key}
              size="small"
              type={timeRange.value === range.key ? 'primary' : 'default'}
              onClick={() => setTimeRange(range.key)}>
              {range.label}
            </MobileButton>
          ))}
        </div>

        {isAdminUser && (
          <div class="mobile-log-center__debug-toggle">
            <div class="mobile-log-center__debug-info">
              <span class="mobile-log-center__debug-title">调试日志收集</span>
              <span class="mobile-log-center__debug-status">{debugEnabled.value ? '已开启' : '已关闭'}</span>
            </div>
            <MobileSwitch
              modelValue={debugEnabled.value}
              loading={debugLoading.value}
              onUpdate:modelValue={toggleDebug}
            />
          </div>
        )}
        {isAdminUser && (
          <div class="mobile-log-center__origin-select">
            <MobileSelect
              modelValue={overviewOriginType.value}
              options={originTypeOptions}
              onUpdate:modelValue={(value: LogOriginType) => {
                overviewOriginType.value = value
                loadLogs(1)
              }}
            />
          </div>
        )}

        <div class="mobile-log-center__search">
          <MobileInput
            v-model={searchKeyword.value}
            placeholder="搜索日志关键词..."
            clearable
            onEnter={() => loadLogs(1)}
          />
        </div>

        <div class="mobile-log-center__level-filters">
          {LOG_LEVELS.map((lvl) => (
            <div key={lvl.key} onClick={() => toggleLevel(lvl.key)} class="mobile-log-center__level-chip-wrapper">
              <MobileTag
                size="small"
                type={activeLevels.value.includes(lvl.key) ? levelTagTypeMap[lvl.key] : 'default'}
                class={[
                  'mobile-log-center__level-chip',
                  `mobile-log-center__level-chip--${lvl.key}`,
                  activeLevels.value.includes(lvl.key) && 'mobile-log-center__level-chip--active'
                ]}>
                {lvl.label}
              </MobileTag>
            </div>
          ))}
        </div>

        {/* Content states */}
        {loading.value ? (
          <div class="mobile-log-center__loading">
            <MobileLoading loading={true} size="24px" />
          </div>
        ) : error.value ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="数据加载失败，请检查网络连接后重试">
              <MobileButton type="primary" size="small" onClick={() => loadLogs(1)}>
                重新加载
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : filteredLogs.value.length === 0 ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description={searchKeyword.value.trim() ? '没有匹配的日志' : '暂无日志数据'} />
          </div>
        ) : (
          <div ref={listRef} class="mobile-log-center__list" onScroll={handleOverviewScroll}>
            {filteredLogs.value.map((log, idx) => renderLogEntry(log, idx))}
            <div class="mobile-log-center__load-more">
              {logsLoadingMore.value ? '加载中…' : logsHasMore.value ? '上滑加载更多' : '已加载全部日志'}
            </div>
          </div>
        )}
      </div>
    )

    const renderStreamTab = () => (
      <div class="mobile-log-center__tab-content">
        <div class="mobile-log-center__stream-actions">
          {streamFreq.value === null ? (
            <MobileButton
              type="primary"
              size="small"
              onClick={startStream}
              loading={streamLoading.value}
              icon={() => h(PhArrowsClockwise, { size: 16 })}>
              开始
            </MobileButton>
          ) : (
            <>
              <MobileButton size="small" type={streamPaused.value ? 'primary' : 'default'} onClick={toggleStreamPause}>
                {streamPaused.value ? '恢复' : '暂停'}
              </MobileButton>
              <MobileButton size="small" onClick={stopStream}>
                停止
              </MobileButton>
            </>
          )}
          <span class="mobile-log-center__stream-hint">
            {streamFreq.value === null
              ? '点击开始接收实时日志'
              : streamPaused.value
                ? '已暂停'
                : `实时中 · ${streamLogsTotal.value} 条`}
          </span>
        </div>
        {streamLoading.value ? (
          <div class="mobile-log-center__loading">
            <MobileLoading loading={true} size="24px" />
          </div>
        ) : streamError.value && streamLogs.value.length === 0 ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="实时日志加载失败，请检查网络后重试">
              <MobileButton type="primary" size="small" onClick={startStream}>
                重新开始
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : streamLogs.value.length === 0 ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description="暂无日志" />
          </div>
        ) : (
          <div class="mobile-log-center__stream-list">
            {streamLogs.value.map((log, idx) => (
              <div key={log.id || log.key || idx} class="mobile-log-center__stream-line">
                <span class="mobile-log-center__stream-line-time">
                  {log.timestamp ? dayjs(log.timestamp).format('HH:mm:ss') : '-'}
                </span>
                <MobileTag
                  size="small"
                  type={levelTagTypeMap[log.level] || 'default'}
                  class={['mobile-log-center__stream-level', `mobile-log-center__stream-level--${log.level}`]}>
                  {log.level}
                </MobileTag>
                <span class="mobile-log-center__stream-line-service">{log.service || '-'}</span>
                <span class="mobile-log-center__stream-line-msg">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    const renderIngestTab = () => (
      <div class="mobile-log-center__tab-content">
        {!isAdminUser ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description="仅管理员可查看接入配置" />
          </div>
        ) : ingestLoading.value ? (
          <div class="mobile-log-center__loading">
            <MobileLoading loading={true} size="24px" />
          </div>
        ) : ingestError.value ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="数据加载失败，请检查网络连接后重试">
              <MobileButton type="primary" size="small" onClick={loadIngest}>
                重新加载
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : ingestKeys.value.length === 0 ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description="暂无接入 Key" />
          </div>
        ) : (
          <>
            <div class="mobile-log-center__ingest-stats">
              <MobileGrid cols={3} gap="8px">
                <div>
                  <div class="mobile-log-center__stat-card">
                    <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--total">
                      <PhCloudArrowUp size={16} />
                    </div>
                    <div class="mobile-log-center__stat-value">{ingestStats.value.total}</div>
                    <div class="mobile-log-center__stat-label">总计</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-log-center__stat-card">
                    <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--today">
                      <PhComputerTower size={16} />
                    </div>
                    <div class="mobile-log-center__stat-value">{ingestStats.value.active}</div>
                    <div class="mobile-log-center__stat-label">活跃</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-log-center__stat-card">
                    <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate">
                      <PhWarningCircle size={16} />
                    </div>
                    <div class="mobile-log-center__stat-value">{ingestStats.value.expired}</div>
                    <div class="mobile-log-center__stat-label">过期</div>
                  </div>
                </div>
              </MobileGrid>
            </div>
            <div class="mobile-log-center__list">
              {ingestKeys.value.map((key: any, idx: number) => (
                <MobileCard key={key.id || idx} size="small" bordered={false} class="mobile-log-center__list-card">
                  <div class="mobile-log-center__log-header">
                    <span class="mobile-log-center__log-service">{key.name || key.appKey || '-'}</span>
                    <MobileTag size="small" type={key.isActive !== false ? 'success' : 'default'}>
                      {key.isActive !== false ? '活跃' : '过期'}
                    </MobileTag>
                  </div>
                </MobileCard>
              ))}
            </div>
          </>
        )}
      </div>
    )

    const renderServiceTab = () => (
      <div class="mobile-log-center__tab-content">
        <div class="mobile-log-center__origin-select">
          <MobileSelect
            modelValue={selectedService.value ?? ''}
            options={serviceServices.value}
            placeholder={serviceLoading.value ? '加载中…' : '选择服务'}
            clearable
            onUpdate:modelValue={(value: string) => {
              selectedService.value = value
              if (value) loadServiceLogs()
            }}
          />
          {serviceOptionsError.value && (
            <div class="mobile-log-center__selector-error" role="alert">
              <span>服务列表加载失败</span>
              <MobileButton size="small" type="ghost" onClick={loadServiceOptions}>
                重试
              </MobileButton>
            </div>
          )}
        </div>
        {serviceLoading.value ? (
          <div class="mobile-log-center__loading">
            <MobileLoading loading={true} size="24px" />
          </div>
        ) : serviceOptionsError.value ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="服务列表加载失败，请重试" />
          </div>
        ) : !selectedService.value ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description="请选择一个服务" />
          </div>
        ) : serviceLogsError.value ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="服务日志加载失败，请检查网络后重试">
              <MobileButton type="primary" size="small" onClick={loadServiceLogs}>
                重新加载
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : serviceLogs.value.length === 0 ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description={`${selectedService.value} 暂无日志`} />
          </div>
        ) : (
          <div class="mobile-log-center__list">
            {serviceLogs.value.map((log, idx) => renderLogEntry(log, idx))}
            {serviceLogsHasMore.value && (
              <div class="mobile-log-center__load-more">
                <MobileButton
                  size="small"
                  type="primary"
                  loading={serviceLogsLoadingMore.value}
                  onClick={loadMoreServiceLogs}>
                  加载更多 ({serviceLogs.value.length}/{serviceLogsTotal.value})
                </MobileButton>
                {serviceLogsLoadMoreError.value && (
                  <p class="mobile-log-center__load-more-error">加载更多日志失败，请重试。</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )

    const renderExceptionTab = () => (
      <div class="mobile-log-center__tab-content">
        {exceptionLoading.value ? (
          <div class="mobile-log-center__loading">
            <MobileLoading loading={true} size="24px" />
          </div>
        ) : exceptionError.value ? (
          <div class="mobile-log-center__error">
            <MobileEmpty description="数据加载失败，请检查网络连接后重试">
              <MobileButton type="primary" size="small" onClick={loadExceptionStats}>
                重新加载
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : exceptionStats.value.total === 0 ? (
          <div class="mobile-log-center__empty-state">
            <MobileEmpty description="暂无异常数据" />
          </div>
        ) : (
          <>
            <div class="mobile-log-center__stats">
              <MobileGrid cols={2} gap="8px">
                <div>
                  <div class="mobile-log-center__stat-card">
                    <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate">
                      <PhBug size={16} />
                    </div>
                    <div class="mobile-log-center__stat-value">{exceptionStats.value.total}</div>
                    <div class="mobile-log-center__stat-label">异常总数</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-log-center__stat-card">
                    <div class="mobile-log-center__stat-icon mobile-log-center__stat-icon--total">
                      <PhWarningCircle size={16} />
                    </div>
                    <div class="mobile-log-center__stat-value">{exceptionStats.value.critical}</div>
                    <div class="mobile-log-center__stat-label">严重异常</div>
                  </div>
                </div>
              </MobileGrid>
            </div>
          </>
        )}
      </div>
    )

    return () => (
      <div class="mobile-log-center">
        <div class="mobile-log-center__header">
          <div>
            <h2 class="mobile-log-center__title">日志中心</h2>
          </div>
          <MobileButton
            size="small"
            type="primary"
            onClick={refreshData}
            aria-label="刷新日志数据"
            icon={() => h(PhArrowsClockwise, { size: 16 })}
          />
        </div>

        <MobileTabs
          active={activeTab.value}
          type="line"
          animated
          class="mobile-log-center__tabs"
          onUpdate:active={handleTabChange}>
          <Tab name="overview" title="概览">
            {renderOverviewTab()}
          </Tab>
          <Tab name="stream" title="实时流">
            {renderStreamTab()}
          </Tab>
          <Tab name="service" title="服务">
            {renderServiceTab()}
          </Tab>
          <Tab name="ingest" title="接入">
            {renderIngestTab()}
          </Tab>
          <Tab name="exception" title="异常">
            {renderExceptionTab()}
          </Tab>
        </MobileTabs>
      </div>
    )
  }
})
