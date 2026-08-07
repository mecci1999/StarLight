/**
 * 日志流内容
 */
import { defineComponent, ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NEmpty,
  NSpin,
  NIcon,
  NGrid,
  NGridItem,
  NStatistic,
  NSwitch,
  NTooltip,
  NAlert,
  useMessage
} from 'naive-ui'
import {
  PlayOutline,
  PauseOutline,
  StopOutline,
  SettingsOutline,
  DownloadOutline,
  FilterOutline,
  EyeOutline,
  EyeOffOutline,
  TrashOutline
} from '@vicons/ionicons5'
import { LogLevelEnum, type LogOriginType } from '@/types/logs'
import type { LogStreamParams, LogEntry } from '@/types/logs'
import api from '@/api'
import { fetchCatalogServices } from '@/api/metrics'
import dayjs from 'dayjs'
import PageHeader from '@/shared/layout/PageHeader'
import { getStoredUserInfo } from '@/services/authSession'
import type { MetricsDatasetScope } from '@/api'
import { buildRecentLogSearchParams } from '@/domains/logs/recentLogQuery'
import webSocket from '@/services/webSocket'
import { useMitt } from '@/hooks/useMitt'
import { ConnectionState } from '@/types/enums'
import { copyLogText, formatLogForClipboard } from '@/domains/logs/clipboard'
import './LogStreamContent.scss'

export default defineComponent({
  name: 'LogStreamContent',
  setup() {
    const message = useMessage()

    const isStreaming = ref(false)
    const isPaused = ref(false)
    const loading = ref(false)
    const autoScroll = ref(true)
    const showTimestamp = ref(true)
    const showLevel = ref(true)
    const showService = ref(true)
    const maxLines = ref(1000)
    const isAdminUser = Boolean(getStoredUserInfo()?.isAdmin)

    const logContainer = ref<HTMLElement>()
    const logs = ref<LogEntry[]>([])
    const filteredLogs = ref<LogEntry[]>([])
    const refreshTimer = ref<NodeJS.Timeout | null>(null)
    const isWebSocketConnected = ref(webSocket.isConnected)

    const streamParams = reactive<LogStreamParams>({
      services: [],
      levels: [],
      startTime: '',
      endTime: '',
      keywords: '',
      follow: true,
      bufferSize: 1000
    })

    const filterParams = reactive({
      originType: (isAdminUser ? 'darwin-app' : 'microservice') as LogOriginType,
      service: '',
      level: '',
      keyword: '',
      timeRange: ''
    })

    const streamStats = reactive({
      totalReceived: 0,
      linesPerSecond: 0,
      lastReceiveTime: '',
      connectionTime: '',
      errorCount: 0
    })

    const syncStreamStatsFromLogs = () => {
      streamStats.totalReceived = logs.value.length
      const latestLog = logs.value.reduce<LogEntry | null>((latest, log) => {
        if (!latest) return log
        return new Date(log.timestamp).getTime() > new Date(latest.timestamp).getTime() ? log : latest
      }, null)
      streamStats.lastReceiveTime = latestLog?.timestamp ? dayjs(latestLog.timestamp).format('HH:mm:ss') : ''
    }

    const syncStreamParamsFromFilters = () => {
      streamParams.service = filterParams.service || ''
      streamParams.level = filterParams.level ? (filterParams.level as LogLevelEnum) : undefined
      streamParams.keywords = filterParams.keyword || ''
      streamParams.originType = filterParams.originType
    }

    const originTypeOptions = [
      ...(isAdminUser ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
      { label: '用户微服务日志', value: 'microservice' }
    ]

    const levelOptions = [
      { label: 'ALL', value: '' },
      { label: 'DEBUG', value: LogLevelEnum.DEBUG },
      { label: 'INFO', value: LogLevelEnum.INFO },
      { label: 'WARN', value: LogLevelEnum.WARN },
      { label: 'ERROR', value: LogLevelEnum.ERROR },
      { label: 'FATAL', value: LogLevelEnum.FATAL }
    ]

    const serviceOptions = ref([{ label: 'ALL', value: '' }])

    const resolveServiceScope = (): MetricsDatasetScope => {
      return isAdminUser && filterParams.originType === 'darwin-app' ? 'system' : 'tenant'
    }

    const getConnectionTone = () => {
      if (isStreaming.value && !isPaused.value) return 'success'
      if (isPaused.value) return 'warning'
      return 'default'
    }

    const getConnectionLabel = () => {
      if (isStreaming.value && !isPaused.value) return '实时接收中'
      if (isPaused.value) return '已暂停'
      return '未连接'
    }

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: resolveServiceScope() })
        const items = res?.items || []
        serviceOptions.value = [
          { label: 'ALL', value: '' },
          ...items.map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: item.identity?.id || ''
          }))
        ]
      } catch (error) {
        console.error('Failed to load stream service options:', error)
        serviceOptions.value = [{ label: 'ALL', value: '' }]
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

    const getLevelClassName = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.TRACE:
          return 'log-stream-page__segment log-stream-page__segment--trace'
        case LogLevelEnum.DEBUG:
          return 'log-stream-page__segment log-stream-page__segment--debug'
        case LogLevelEnum.INFO:
          return 'log-stream-page__segment log-stream-page__segment--info'
        case LogLevelEnum.WARN:
          return 'log-stream-page__segment log-stream-page__segment--warn'
        case LogLevelEnum.ERROR:
          return 'log-stream-page__segment log-stream-page__segment--error'
        case LogLevelEnum.FATAL:
          return 'log-stream-page__segment log-stream-page__segment--fatal'
        default:
          return 'log-stream-page__segment'
      }
    }

    const filterLogs = () => {
      let filtered = [...logs.value]

      if (filterParams.service) {
        filtered = filtered.filter((log) => log.service === filterParams.service)
      }

      if (filterParams.level) {
        filtered = filtered.filter((log) => log.level === filterParams.level)
      }

      if (filterParams.keyword) {
        const keyword = filterParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (log) => log.message.toLowerCase().includes(keyword) || log.service.toLowerCase().includes(keyword)
        )
      }

      if (filterParams.originType) {
        filtered = filtered.filter((log) => !log.originType || log.originType === filterParams.originType)
      }

      filteredLogs.value = filtered
    }

    const loadRecentLogs = async () => {
      syncStreamParamsFromFilters()

      const response = await api.logs.searchLogsExplorer(
        buildRecentLogSearchParams({
          originType: streamParams.originType || filterParams.originType,
          service: streamParams.service || undefined,
          levelFilter: streamParams.level || null,
          keyword: streamParams.keywords || undefined,
          page: 1,
          pageSize: Math.min(maxLines.value, 200)
        })
      )

      const recentLogs = Array.isArray(response?.items) ? [...response.items].reverse() : []
      logs.value = recentLogs
      syncStreamStatsFromLogs()
      filterLogs()

      await nextTick()
      if (autoScroll.value && logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    }

    const addLog = (log: LogEntry) => {
      console.log('[LogStream][client:addLog]', {
        service: log.service,
        level: log.level,
        timestamp: log.timestamp,
        beforeLength: logs.value.length
      })
      logs.value.push(log)

      if (logs.value.length > maxLines.value) {
        logs.value = logs.value.slice(-maxLines.value)
      }

      streamStats.totalReceived = logs.value.length
      streamStats.lastReceiveTime = dayjs().format('HH:mm:ss')

      filterLogs()

      if (autoScroll.value && !isPaused.value) {
        nextTick(() => {
          if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
          }
        })
      }
    }

    const setStreamStopped = () => {
      isStreaming.value = false
      isPaused.value = false
    }

    const stopStream = () => {
      webSocket.send({ type: 'unsubscribe', data: { channel: 'logs' } })
      setStreamStopped()
      message.info('日志流已停止')
    }

    const handleWebSocketConnectionState = (state: ConnectionState) => {
      isWebSocketConnected.value = state === ConnectionState.CONNECTED
      if (state === ConnectionState.CONNECTED && isStreaming.value) {
        webSocket.send({ type: 'subscribe', data: { channel: 'logs' } })
      }
    }

    const waitForWebSocketConnection = async (timeoutMs = 8000) => {
      isWebSocketConnected.value = isWebSocketConnected.value || webSocket.isConnected
      if (isWebSocketConnected.value) return true

      await webSocket.ensureConnected()
      isWebSocketConnected.value = isWebSocketConnected.value || webSocket.isConnected
      if (isWebSocketConnected.value) return true

      return new Promise<boolean>((resolve) => {
        let settled = false
        const finish = (connected: boolean) => {
          if (settled) return
          settled = true
          useMitt.off('wsConnectionStateChange', handleStateChange)
          clearTimeout(timer)
          resolve(connected)
        }
        const handleStateChange = (state: ConnectionState) => {
          if (state === ConnectionState.CONNECTED) finish(true)
          if (state === ConnectionState.ERROR || state === ConnectionState.DISCONNECTED) finish(false)
        }
        const timer = setTimeout(() => finish(isWebSocketConnected.value || webSocket.isConnected), timeoutMs)
        useMitt.on('wsConnectionStateChange', handleStateChange)
      })
    }

    const startStream = async () => {
      if (isStreaming.value) return

      loading.value = true

      try {
        syncStreamParamsFromFilters()
        await loadRecentLogs()

        const connected = await waitForWebSocketConnection()
        if (!connected) {
          throw new Error('WebSocket 实时通道尚未连接')
        }

        isStreaming.value = true
        streamStats.connectionTime = dayjs().format('HH:mm:ss')
        webSocket.send({ type: 'subscribe', data: { channel: 'logs' } })

        message.success(
          logs.value.length > 0 ? `日志流连接成功，已加载 ${logs.value.length} 条最近日志` : '日志流连接成功'
        )
        console.info('[LogStream][client:connected]', {
          loadedLogs: logs.value.length,
          filteredLogs: filteredLogs.value.length,
          mode: 'websocket'
        })
      } catch (error: any) {
        message.error('启动日志流失败: ' + (error.message || '未知错误'))
        console.error('[LogStream][client:start-error]', {
          error: error?.message || String(error)
        })
        streamStats.errorCount++
        setStreamStopped()
      } finally {
        loading.value = false
      }
    }

    const togglePause = () => {
      isPaused.value = !isPaused.value

      if (isPaused.value) {
        message.info('日志流已暂停')
      } else {
        message.info('日志流已恢复')
      }
    }

    const clearLogs = () => {
      logs.value = []
      filteredLogs.value = []
      streamStats.totalReceived = 0
      streamStats.linesPerSecond = 0
      streamStats.lastReceiveTime = ''
      streamStats.errorCount = 0
      message.info('日志已清空')
    }

    const copyLogs = async () => {
      if (filteredLogs.value.length === 0) {
        message.warning('没有日志可复制')
        return
      }

      const content = filteredLogs.value
        .map((log) =>
          formatLogForClipboard(log, {
            showTimestamp: showTimestamp.value,
            showLevel: showLevel.value,
            showService: showService.value
          })
        )
        .join('\n')
      try {
        await copyLogText(content)
        message.success(`已复制 ${filteredLogs.value.length} 条日志`)
      } catch {
        message.error('复制日志失败')
      }
    }

    const exportLogs = () => {
      if (filteredLogs.value.length === 0) {
        message.warning('没有日志可导出')
        return
      }

      api.logs
        .exportLogs({
          format: 'json',
          query: filterParams.keyword || undefined,
          service: filterParams.service || undefined,
          originType: filterParams.originType || undefined,
          startTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          limit: Math.min(filteredLogs.value.length, 1000)
        })
        .then((response) => {
          const exportData = response?.exportData
          const filename =
            response?.filename || response?.meta?.filename || `logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`

          if (!exportData) {
            message.error('日志导出失败: 后端未返回导出内容')
            return
          }

          const blob = new Blob([exportData], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          message.success('日志导出成功')
        })
        .catch((error: any) => {
          message.error('日志导出失败: ' + (error.message || '未知错误'))
          console.error('Export logs error:', error)
        })
    }

    const calculateLinesPerSecond = () => {
      const now = Date.now()
      const oneSecondAgo = now - 1000

      const recentLogs = logs.value.filter((log) => {
        const logTime = new Date(log.timestamp).getTime()
        return logTime > oneSecondAgo
      })

      streamStats.linesPerSecond = recentLogs.length
    }

    const watchFilter = async () => {
      syncStreamParamsFromFilters()
      filterLogs()

      await loadServiceOptions()

      if (isStreaming.value) {
        stopStream()
        startStream()
      }
    }

    const shouldAcceptStreamLog = (log: LogEntry) => {
      if (streamParams.originType && log.originType && log.originType !== streamParams.originType) return false
      if (streamParams.service && log.service !== streamParams.service) return false
      if (streamParams.level && log.level !== streamParams.level) return false
      if (streamParams.keywords) {
        const keyword = streamParams.keywords.toLowerCase()
        const haystack = `${log.message || ''} ${log.service || ''}`.toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      return true
    }

    const handleWebSocketLogMessage = (payload: { type?: string; data?: LogEntry }) => {
      if (!isStreaming.value || isPaused.value) return
      if (payload?.type !== 'logs') return
      const log = payload.data
      if (!log || !shouldAcceptStreamLog(log)) return
      addLog(log)
    }

    onMounted(() => {
      loadServiceOptions()
      filterLogs()
      useMitt.on('wsConnectionStateChange', handleWebSocketConnectionState)
      useMitt.on('wsRawMessage', handleWebSocketLogMessage)
      refreshTimer.value = setInterval(() => {
        calculateLinesPerSecond()
      }, 1000)
    })

    onUnmounted(() => {
      useMitt.off('wsConnectionStateChange', handleWebSocketConnectionState)
      useMitt.off('wsRawMessage', handleWebSocketLogMessage)
      webSocket.send({ type: 'unsubscribe', data: { channel: 'logs' } })
      setStreamStopped()
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    })

    return () => (
      <div class="log-stream-page">
        <PageHeader title="日志流" subtitle="实时查看和监控系统日志" />

        <div class="log-stream-page__body">
          <NCard bordered={false} class="log-stream-page__card log-stream-page__card--controls">
            <NSpace justify="space-between" align="center">
              <NSpace>
                {!isStreaming.value ? (
                  <NButton type="primary" onClick={startStream} loading={loading.value}>
                    <NIcon component={PlayOutline} class="mr-1" />
                    开始流
                  </NButton>
                ) : (
                  <NSpace>
                    <NButton type={isPaused.value ? 'primary' : 'default'} onClick={togglePause}>
                      <NIcon component={isPaused.value ? PlayOutline : PauseOutline} class="mr-1" />
                      {isPaused.value ? '恢复' : '暂停'}
                    </NButton>

                    <NButton onClick={() => stopStream()}>
                      <NIcon component={StopOutline} class="mr-1" />
                      停止
                    </NButton>
                  </NSpace>
                )}

                <NButton onClick={clearLogs}>
                  <NIcon component={TrashOutline} class="mr-1" />
                  清空
                </NButton>

                <NButton onClick={exportLogs}>
                  <NIcon component={DownloadOutline} class="mr-1" />
                  导出
                </NButton>

                <NButton onClick={copyLogs}>复制日志</NButton>
              </NSpace>

              <NSpace>
                <NTooltip trigger="hover">
                  {{
                    trigger: () => (
                      <NButton size="small" onClick={() => (autoScroll.value = !autoScroll.value)}>
                        <NIcon component={autoScroll.value ? EyeOutline : EyeOffOutline} />
                      </NButton>
                    ),
                    default: () => (autoScroll.value ? '关闭自动滚动' : '开启自动滚动')
                  }}
                </NTooltip>

                <NTooltip trigger="hover">
                  {{
                    trigger: () => (
                      <NButton size="small">
                        <NIcon component={SettingsOutline} />
                      </NButton>
                    ),
                    default: () => '流设置'
                  }}
                </NTooltip>
              </NSpace>
            </NSpace>
          </NCard>

          <NCard bordered={false} class="log-stream-page__card log-stream-page__card--stats">
            <div class="log-stream-page__stats-header">
              <div>
                <div class="log-stream-page__section-title">流状态</div>
                <div class="log-stream-page__section-subtitle">
                  通过 WebSocket 订阅实时日志，并用最近日志预加载上下文
                </div>
              </div>
              <div class="log-stream-page__status-cluster">
                <span class="log-stream-page__status-dot" data-tone={getConnectionTone()}></span>
                <span class="log-stream-page__status-label">{getConnectionLabel()}</span>
              </div>
            </div>
            <NGrid cols={5} xGap={16}>
              <NGridItem>
                <NStatistic label="接收总数" value={streamStats.totalReceived} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="每秒日志" value={streamStats.linesPerSecond} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="错误数" value={streamStats.errorCount} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="连接时间" value={streamStats.connectionTime || '-'} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="最后接收" value={streamStats.lastReceiveTime || '-'} />
              </NGridItem>
            </NGrid>
          </NCard>

          <NCard bordered={false} class="log-stream-page__card log-stream-page__card--filters">
            <div class="log-stream-page__filters-shell">
              <div class="log-stream-page__filters-header">
                <div class="log-stream-page__filters-title">
                  <NIcon component={FilterOutline} />
                  <span class="log-stream-page__section-label">实时过滤器</span>
                </div>
                <span class="log-stream-page__hint">
                  显示 {filteredLogs.value.length} / {logs.value.length} 条日志
                </span>
              </div>

              <div class="log-stream-page__filters-grid">
                <NSelect
                  v-model:value={filterParams.originType}
                  options={originTypeOptions}
                  placeholder="日志来源"
                  onUpdateValue={watchFilter}
                />

                <NSelect
                  v-model:value={filterParams.service}
                  options={serviceOptions.value}
                  placeholder={isAdminUser && filterParams.originType === 'darwin-app' ? '选择系统服务' : '选择服务'}
                  clearable
                  onUpdateValue={watchFilter}
                />

                <NSelect
                  v-model:value={filterParams.level}
                  options={levelOptions}
                  placeholder="选择级别"
                  clearable
                  onUpdateValue={watchFilter}
                />

                <NInput
                  v-model:value={filterParams.keyword}
                  placeholder="关键词搜索"
                  clearable
                  onUpdateValue={watchFilter}
                />
              </div>
            </div>
          </NCard>

          <NCard bordered={false} class="log-stream-page__card log-stream-page__card--terminal">
            <div class="log-stream-page__terminal-header">
              <h3 class="log-stream-page__terminal-title">实时日志</h3>

              <NSpace>
                <span class="log-stream-page__hint">显示选项:</span>

                <NSpace size="small">
                  <span class="log-stream-page__toggle-label">时间戳</span>
                  <NSwitch v-model:value={showTimestamp.value} size="small" />
                </NSpace>

                <NSpace size="small">
                  <span class="log-stream-page__toggle-label">级别</span>
                  <NSwitch v-model:value={showLevel.value} size="small" />
                </NSpace>

                <NSpace size="small">
                  <span class="log-stream-page__toggle-label">服务</span>
                  <NSwitch v-model:value={showService.value} size="small" />
                </NSpace>
              </NSpace>
            </div>

            {isStreaming.value && (
              <NAlert type="info" class="log-stream-page__stream-alert">
                <div class="log-stream-page__stream-alert-content">
                  <span>{isPaused.value ? '日志流已暂停' : '正在通过 WebSocket 接收实时日志...'}</span>
                  <NSpin size="small" v-show={!isPaused.value} />
                </div>
              </NAlert>
            )}

            <div ref={logContainer} class="log-stream-page__terminal">
              {filteredLogs.value.length > 0 ? (
                <div class="log-stream-page__terminal-list">
                  {filteredLogs.value.map((log, index) => (
                    <div key={index} class="log-stream-page__line">
                      {showTimestamp.value && (
                        <span class="log-stream-page__segment log-stream-page__segment--timestamp">
                          [{dayjs(log.timestamp).format('HH:mm:ss.SSS')}]
                        </span>
                      )}

                      {showLevel.value && (
                        <span class={getLevelClassName(log.level)} style={{ color: getLevelColor(log.level) }}>
                          [{log.level}]
                        </span>
                      )}

                      {showService.value && (
                        <span class="log-stream-page__segment log-stream-page__segment--service">[{log.service}]</span>
                      )}

                      {log.originType && (
                        <span class="log-stream-page__segment log-stream-page__segment--origin">
                          [{log.originType}]
                        </span>
                      )}

                      <span class="log-stream-page__message">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="flex items-center justify-center h-full">
                  <NEmpty description="暂无日志数据" />
                </div>
              )}
            </div>
          </NCard>
        </div>
      </div>
    )
  }
})
