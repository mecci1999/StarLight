/**
 * 日志流页面
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
  TrashOutline,
  RadioOutline
} from '@vicons/ionicons5'
import { LogLevelEnum } from '@/types/logs'
import type { LogStreamParams, LogEntry } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'
import SectionHeader from '@/components/common/SectionHeader'

export default defineComponent({
  name: 'LogStream',
  setup() {
    const message = useMessage()

    // 响应式数据
    const isStreaming = ref(false)
    const isPaused = ref(false)
    const loading = ref(false)
    const autoScroll = ref(true)
    const showTimestamp = ref(true)
    const showLevel = ref(true)
    const showService = ref(true)
    const maxLines = ref(1000)

    const logContainer = ref<HTMLElement>()
    const logs = ref<LogEntry[]>([])
    const filteredLogs = ref<LogEntry[]>([])
    const streamConnection = ref<EventSource | null>(null)
    const refreshTimer = ref<NodeJS.Timeout | null>(null)

    // 流参数
    const streamParams = reactive<LogStreamParams>({
      services: [],
      levels: [],
      startTime: '',
      endTime: '',
      keywords: '',
      follow: true,
      bufferSize: 1000
    })

    // 过滤参数
    const filterParams = reactive({
      service: '',
      level: '',
      keyword: '',
      timeRange: ''
    })

    // 统计信息
    const streamStats = reactive({
      totalReceived: 0,
      linesPerSecond: 0,
      lastReceiveTime: '',
      connectionTime: '',
      errorCount: 0
    })

    // 日志级别选项
    const levelOptions = [
      { label: 'ALL', value: '' },
      { label: 'DEBUG', value: LogLevelEnum.DEBUG },
      { label: 'INFO', value: LogLevelEnum.INFO },
      { label: 'WARN', value: LogLevelEnum.WARN },
      { label: 'ERROR', value: LogLevelEnum.ERROR },
      { label: 'FATAL', value: LogLevelEnum.FATAL }
    ]

    // 服务选项（这里可以从API获取）
    const serviceOptions = ref([
      { label: 'ALL', value: '' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' },
      { label: 'notification-service', value: 'notification-service' }
    ])

    // 获取日志级别颜色
    const getLevelColor = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.DEBUG:
          return '#909399'
        case LogLevelEnum.INFO:
          return '#409eff'
        case LogLevelEnum.WARN:
          return '#e6a23c'
        case LogLevelEnum.ERROR:
          return '#f56c6c'
        case LogLevelEnum.FATAL:
          return '#f56c6c'
        default:
          return '#909399'
      }
    }

    // 过滤日志
    const filterLogs = () => {
      let filtered = [...logs.value]

      // 服务过滤
      if (filterParams.service) {
        filtered = filtered.filter((log) => log.service === filterParams.service)
      }

      // 级别过滤
      if (filterParams.level) {
        filtered = filtered.filter((log) => log.level === filterParams.level)
      }

      // 关键词过滤
      if (filterParams.keyword) {
        const keyword = filterParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (log) => log.message.toLowerCase().includes(keyword) || log.service.toLowerCase().includes(keyword)
        )
      }

      filteredLogs.value = filtered
    }

    // 添加日志
    const addLog = (log: LogEntry) => {
      logs.value.push(log)

      // 限制日志数量
      if (logs.value.length > maxLines.value) {
        logs.value = logs.value.slice(-maxLines.value)
      }

      // 更新统计
      streamStats.totalReceived++
      streamStats.lastReceiveTime = dayjs().format('HH:mm:ss')

      // 重新过滤
      filterLogs()

      // 自动滚动
      if (autoScroll.value && !isPaused.value) {
        nextTick(() => {
          if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
          }
        })
      }
    }

    // 开始流
    const startStream = async () => {
      if (isStreaming.value) return

      loading.value = true

      try {
        // 创建流连接
        const response = await api.logs.createLogStream(streamParams)

        if (response.streamId) {
          // 使用 EventSource 连接流
          const eventSource = new EventSource(`/api/logs/stream/${response.streamId}`)

          eventSource.onopen = () => {
            isStreaming.value = true
            streamStats.connectionTime = dayjs().format('HH:mm:ss')
            message.success('日志流连接成功')
          }

          eventSource.onmessage = (event) => {
            try {
              const log = JSON.parse(event.data) as LogEntry
              addLog(log)
            } catch (error) {
              console.error('Parse log error:', error)
              streamStats.errorCount++
            }
          }

          eventSource.onerror = (error) => {
            console.error('Stream error:', error)
            streamStats.errorCount++

            if (!isPaused.value) {
              message.error('日志流连接错误')
              stopStream()
            }
          }

          streamConnection.value = eventSource
        }
      } catch (error: any) {
        message.error('启动日志流失败: ' + (error.message || '未知错误'))
        console.error('Start stream error:', error)
      } finally {
        loading.value = false
      }
    }

    // 暂停/恢复流
    const togglePause = () => {
      isPaused.value = !isPaused.value

      if (isPaused.value) {
        message.info('日志流已暂停')
      } else {
        message.info('日志流已恢复')
      }
    }

    // 停止流
    const stopStream = () => {
      if (streamConnection.value) {
        streamConnection.value.close()
        streamConnection.value = null
      }

      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }

      isStreaming.value = false
      isPaused.value = false

      message.info('日志流已停止')
    }

    // 清空日志
    const clearLogs = () => {
      logs.value = []
      filteredLogs.value = []
      streamStats.totalReceived = 0
      streamStats.errorCount = 0
      message.info('日志已清空')
    }

    // 导出日志
    const exportLogs = () => {
      if (filteredLogs.value.length === 0) {
        message.warning('没有日志可导出')
        return
      }

      const content = filteredLogs.value
        .map((log) => {
          const timestamp = dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')
          return `[${timestamp}] [${log.level}] [${log.service}] ${log.message}`
        })
        .join('\n')

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      message.success('日志导出成功')
    }

    // 计算每秒日志数
    const calculateLinesPerSecond = () => {
      const now = Date.now()
      const oneSecondAgo = now - 1000

      const recentLogs = logs.value.filter((log) => {
        const logTime = new Date(log.timestamp).getTime()
        return logTime > oneSecondAgo
      })

      streamStats.linesPerSecond = recentLogs.length
    }

    // 监听过滤参数变化
    const watchFilter = () => {
      filterLogs()
    }

    // 生命周期
    onMounted(() => {
      // 初始化过滤
      filterLogs()

      // 启动统计计时器
      refreshTimer.value = setInterval(() => {
        calculateLinesPerSecond()
      }, 1000)
    })

    onUnmounted(() => {
      stopStream()
    })

    return () => (
      <div class="p-24px h-full bg-gray-50/50 flex flex-col overflow-hidden">
        <SectionHeader title="日志流" subtitle="实时查看和监控系统日志" icon={RadioOutline} />

        <div class="flex-1 overflow-auto">
          {/* 控制面板 */}
          <NCard bordered={false} class="mb-4 shadow-sm rounded-lg">
            <NSpace justify="space-between" align="center">
              <NSpace>
                {/* 流控制按钮 */}
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

                    <NButton onClick={stopStream}>
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
              </NSpace>

              <NSpace>
                {/* 显示选项 */}
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

          {/* 统计信息 */}
          <NCard bordered={false} class="mb-4 shadow-sm rounded-lg">
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

          {/* 过滤器 */}
          <NCard bordered={false} class="mb-4 shadow-sm rounded-lg">
            <NSpace align="center">
              <NIcon component={FilterOutline} />
              <span>过滤器:</span>

              <NSelect
                v-model:value={filterParams.service}
                options={serviceOptions.value}
                placeholder="选择服务"
                style={{ width: '150px' }}
                clearable
                onUpdateValue={watchFilter}
              />

              <NSelect
                v-model:value={filterParams.level}
                options={levelOptions}
                placeholder="选择级别"
                style={{ width: '120px' }}
                clearable
                onUpdateValue={watchFilter}
              />

              <NInput
                v-model:value={filterParams.keyword}
                placeholder="关键词搜索"
                style={{ width: '200px' }}
                clearable
                onUpdateValue={watchFilter}
              />

              <span class="text-sm text-gray-500">
                显示 {filteredLogs.value.length} / {logs.value.length} 条日志
              </span>
            </NSpace>
          </NCard>

          {/* 日志显示区域 */}
          <NCard bordered={false} class="shadow-sm rounded-lg">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">实时日志</h3>

              <NSpace>
                <span class="text-sm text-gray-500">显示选项:</span>

                <NSpace size="small">
                  <span class="text-xs">时间戳</span>
                  <NSwitch v-model:value={showTimestamp.value} size="small" />
                </NSpace>

                <NSpace size="small">
                  <span class="text-xs">级别</span>
                  <NSwitch v-model:value={showLevel.value} size="small" />
                </NSpace>

                <NSpace size="small">
                  <span class="text-xs">服务</span>
                  <NSwitch v-model:value={showService.value} size="small" />
                </NSpace>
              </NSpace>
            </div>

            {isStreaming.value && (
              <NAlert type="info" class="mb-4">
                <div class="flex items-center justify-between">
                  <span>{isPaused.value ? '日志流已暂停' : '正在接收实时日志...'}</span>
                  <NSpin size="small" v-show={!isPaused.value} />
                </div>
              </NAlert>
            )}

            <div
              ref={logContainer}
              class="log-container"
              style={{
                height: '500px',
                overflow: 'auto',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '12px',
                lineHeight: '1.4',
                padding: '12px',
                borderRadius: '4px'
              }}>
              {filteredLogs.value.length > 0 ? (
                <div>
                  {filteredLogs.value.map((log, index) => (
                    <div key={index} class="log-line" style={{ marginBottom: '2px' }}>
                      {showTimestamp.value && (
                        <span style={{ color: '#569cd6', marginRight: '8px' }}>
                          [{dayjs(log.timestamp).format('HH:mm:ss.SSS')}]
                        </span>
                      )}

                      {showLevel.value && (
                        <span
                          style={{
                            color: getLevelColor(log.level),
                            marginRight: '8px',
                            fontWeight: 'bold',
                            minWidth: '50px',
                            display: 'inline-block'
                          }}>
                          [{log.level}]
                        </span>
                      )}

                      {showService.value && (
                        <span style={{ color: '#4ec9b0', marginRight: '8px' }}>[{log.service}]</span>
                      )}

                      <span style={{ color: '#d4d4d4' }}>{log.message}</span>
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
