/**
 * 服务日志页面
 */
import { defineComponent, ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NDataTable,
  NPagination,
  NTag,
  NModal,
  NCode,
  NScrollbar,
  NEmpty,
  NSpin,
  NTooltip,
  NIcon,
  NPopover,
  NGrid,
  NGridItem,
  NStatistic,
  useMessage,
  useDialog
} from 'naive-ui'
import {
  SearchOutline,
  RefreshOutline,
  DownloadOutline,
  PlayOutline,
  StopOutline,
  FilterOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { LogLevelEnum, LogSourceEnum, LogExportFormatEnum } from '@/types/logs'
import type {
  LogEntry,
  LogSearchParams,
  LogSearchResponse,
  LogStatsResponse,
  LogStreamParams,
  LogStreamEvent
} from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'ServiceLogs',
  setup() {
    const message = useMessage()
    const dialog = useDialog()

    // 响应式数据
    const loading = ref(false)
    const statsLoading = ref(false)
    const streamConnected = ref(false)
    const logs = ref<LogEntry[]>([])
    const stats = ref<NonNullable<LogStatsResponse['data']> | null>(null)
    const selectedLog = ref<LogEntry | null>(null)
    const showLogDetail = ref(false)
    const autoRefresh = ref(false)
    const refreshInterval = ref<NodeJS.Timeout | null>(null)
    const wsConnection = ref<WebSocket | null>(null)

    // 搜索参数
    const searchParams = reactive<LogSearchParams>({
      service: '',
      level: undefined,
      keyword: '',
      startTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      page: 1,
      pageSize: 50,
      source: undefined,
      hostname: '',
      containerId: ''
    })

    // 分页信息
    const pagination = reactive({
      page: 1,
      pageSize: 50,
      total: 0,
      showSizePicker: true,
      pageSizes: [20, 50, 100, 200]
    })

    // 日志级别选项
    const levelOptions = Object.values(LogLevelEnum).map((level) => ({
      label: level.toUpperCase(),
      value: level
    }))

    // 日志来源选项
    const sourceOptions = Object.values(LogSourceEnum).map((source) => ({
      label: source.charAt(0).toUpperCase() + source.slice(1),
      value: source
    }))

    // 导出格式选项
    const exportFormatOptions = Object.values(LogExportFormatEnum).map((format) => ({
      label: format.toUpperCase(),
      value: format
    }))

    // 表格列定义
    const columns = [
      {
        title: '时间',
        key: 'timestamp',
        width: 180,
        render: (row: LogEntry) => dayjs(row.timestamp).format('MM-DD HH:mm:ss.SSS')
      },
      {
        title: '级别',
        key: 'level',
        width: 80,
        render: (row: LogEntry) => {
          const colorMap = {
            [LogLevelEnum.ERROR]: 'error',
            [LogLevelEnum.WARN]: 'warning',
            [LogLevelEnum.INFO]: 'info',
            [LogLevelEnum.DEBUG]: 'default',
            [LogLevelEnum.TRACE]: 'default',
            [LogLevelEnum.FATAL]: 'error'
          }
          return h(
            NTag,
            {
              type: colorMap[row.level] as any,
              size: 'small'
            },
            () => row.level.toUpperCase()
          )
        }
      },
      {
        title: '服务',
        key: 'service',
        width: 120,
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '消息',
        key: 'message',
        ellipsis: {
          tooltip: true
        },
        render: (row: LogEntry) => {
          return h(
            'span',
            {
              style: { cursor: 'pointer' },
              onClick: () => showLogDetails(row)
            },
            row.message
          )
        }
      },
      {
        title: '主机',
        key: 'hostname',
        width: 120,
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        render: (row: LogEntry) => {
          return h(NSpace, { size: 'small' }, () => [
            h(
              NTooltip,
              { trigger: 'hover' },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'primary',
                      ghost: true,
                      onClick: () => showLogDetails(row)
                    },
                    () => '详情'
                  ),
                default: () => '查看日志详情'
              }
            )
          ])
        }
      }
    ]

    // 计算属性
    const hasFilters = computed(() => {
      return (
        searchParams.service ||
        searchParams.level ||
        searchParams.keyword ||
        searchParams.source ||
        searchParams.hostname ||
        searchParams.containerId
      )
    })

    // 搜索日志
    const searchLogs = async (resetPage = true) => {
      if (resetPage) {
        searchParams.page = 1
        pagination.page = 1
      }

      loading.value = true
      try {
        const response = await api.logs.searchLogs({
          ...searchParams,
          page: pagination.page,
          pageSize: pagination.pageSize
        })

        if (response.success && response.data) {
          logs.value = response.data.logs
          pagination.total = response.data.total
          pagination.page = response.data.page
          pagination.pageSize = response.data.pageSize
        } else {
          message.error('搜索日志失败: 无数据')
        }
      } catch (error) {
        message.error('搜索日志失败')
        console.error('Search logs error:', error)
      } finally {
        loading.value = false
      }
    }

    // 获取日志统计
    const getLogStats = async () => {
      if (!searchParams.startTime || !searchParams.endTime) return

      statsLoading.value = true
      try {
        const response = await api.logs.getLogStats({
          service: searchParams.service,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          interval: '1h'
        })
        if (response.success && response.data) {
          stats.value = response.data
        }
      } catch (error) {
        message.error('获取统计数据失败')
        console.error('Get stats error:', error)
      } finally {
        statsLoading.value = false
      }
    }

    // 显示日志详情
    const showLogDetails = (log: LogEntry) => {
      selectedLog.value = log
      showLogDetail.value = true
    }

    // 导出日志
    const exportLogs = async (format: LogExportFormatEnum) => {
      try {
        const response = await api.logs.exportLogs({
          searchParams: { ...searchParams },
          format,
          filename: `logs_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.${format}`
        })

        // 创建下载链接
        const link = document.createElement('a')
        link.href = response.downloadUrl
        link.download = response.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        message.success('日志导出成功')
      } catch (error) {
        message.error('导出日志失败')
        console.error('Export logs error:', error)
      }
    }

    // 开始实时日志流
    const startLogStream = async () => {
      try {
        const streamParams: LogStreamParams = {
          service: searchParams.service,
          level: searchParams.level,
          keywords: searchParams.keyword
        }

        const response = await api.logs.createLogStream(streamParams)

        // 创建WebSocket连接
        wsConnection.value = new WebSocket(response.wsUrl)

        wsConnection.value.onopen = () => {
          streamConnected.value = true
          message.success('实时日志流已连接')
        }

        wsConnection.value.onmessage = (event) => {
          const streamEvent: LogStreamEvent = JSON.parse(event.data)

          if (streamEvent.type === 'log' && streamEvent.data) {
            // 将新日志添加到列表顶部
            logs.value.unshift(streamEvent.data)
            // 限制显示的日志数量
            if (logs.value.length > 1000) {
              logs.value = logs.value.slice(0, 1000)
            }
          }
        }

        wsConnection.value.onclose = () => {
          streamConnected.value = false
          message.info('实时日志流已断开')
        }

        wsConnection.value.onerror = (error) => {
          streamConnected.value = false
          message.error('实时日志流连接错误')
          console.error('WebSocket error:', error)
        }
      } catch (error) {
        message.error('启动实时日志流失败')
        console.error('Start log stream error:', error)
      }
    }

    // 停止实时日志流
    const stopLogStream = () => {
      if (wsConnection.value) {
        wsConnection.value.close()
        wsConnection.value = null
      }
      streamConnected.value = false
    }

    // 切换自动刷新
    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value

      if (autoRefresh.value) {
        refreshInterval.value = setInterval(() => {
          searchLogs(false)
        }, 30000) // 30秒刷新一次
        message.success('已开启自动刷新')
      } else {
        if (refreshInterval.value) {
          clearInterval(refreshInterval.value)
          refreshInterval.value = null
        }
        message.info('已关闭自动刷新')
      }
    }

    // 清空过滤条件
    const clearFilters = () => {
      searchParams.service = ''
      searchParams.level = undefined
      searchParams.keyword = ''
      searchParams.source = undefined
      searchParams.hostname = ''
      searchParams.containerId = ''
      searchLogs()
    }

    // 分页变化处理
    const handlePageChange = (page: number) => {
      pagination.page = page
      searchParams.page = page
      searchLogs(false)
    }

    const handlePageSizeChange = (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
      searchParams.page = 1
      searchParams.pageSize = pageSize
      searchLogs(false)
    }

    // 生命周期
    onMounted(() => {
      searchLogs()
      getLogStats()
    })

    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
      if (wsConnection.value) {
        wsConnection.value.close()
      }
    })

    return () => (
      <div class="service-logs-container">
        {/* 统计卡片 */}
        {stats.value && stats.value.data && (
          <NCard class="mb-4">
            <NGrid cols={4} xGap={16}>
              <NGridItem>
                <NStatistic label="总日志数" value={stats.value.data.totalLogs} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="错误日志" value={stats.value.data.errorLogs} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="警告日志" value={stats.value.data.warnLogs} />
              </NGridItem>
              <NGridItem>
                <NStatistic
                  label="错误率"
                  value={
                    stats.value.data.totalLogs > 0
                      ? ((stats.value.data.errorLogs / stats.value.data.totalLogs) * 100).toFixed(2) + '%'
                      : '0%'
                  }
                />
              </NGridItem>
            </NGrid>
          </NCard>
        )}

        {/* 搜索和过滤 */}
        <NCard class="mb-4">
          <NSpace vertical size="medium">
            <NSpace size="medium" wrap={false}>
              <NInput
                v-model:value={searchParams.keyword}
                placeholder="搜索关键词"
                clearable
                style={{ width: '200px' }}
              />
              <NSelect
                v-model:value={searchParams.service}
                placeholder="选择服务"
                clearable
                filterable
                tag
                style={{ width: '150px' }}
                options={[]}
              />
              <NSelect
                v-model:value={searchParams.level}
                placeholder="日志级别"
                clearable
                style={{ width: '120px' }}
                options={levelOptions}
              />
              <NSelect
                v-model:value={searchParams.source}
                placeholder="日志来源"
                clearable
                style={{ width: '120px' }}
                options={sourceOptions}
              />
            </NSpace>

            <NSpace size="medium" wrap={false}>
              <NDatePicker
                v-model:value={searchParams.startTime}
                type="datetime"
                placeholder="开始时间"
                format="yyyy-MM-dd HH:mm:ss"
                style={{ width: '180px' }}
              />
              <NDatePicker
                v-model:value={searchParams.endTime}
                type="datetime"
                placeholder="结束时间"
                format="yyyy-MM-dd HH:mm:ss"
                style={{ width: '180px' }}
              />
              <NInput v-model:value={searchParams.hostname} placeholder="主机名" clearable style={{ width: '150px' }} />
              <NInput
                v-model:value={searchParams.containerId}
                placeholder="容器ID"
                clearable
                style={{ width: '150px' }}
              />
            </NSpace>

            <NSpace size="medium">
              <NButton type="primary" onClick={() => searchLogs()} loading={loading.value}>
                <NIcon component={SearchOutline} class="mr-1" />
                搜索
              </NButton>

              <NButton onClick={() => searchLogs(false)}>
                <NIcon component={RefreshOutline} class="mr-1" />
                刷新
              </NButton>

              {hasFilters.value && (
                <NButton onClick={clearFilters}>
                  <NIcon component={FilterOutline} class="mr-1" />
                  清空过滤
                </NButton>
              )}

              <NButton type={autoRefresh.value ? 'warning' : 'default'} onClick={toggleAutoRefresh}>
                <NIcon component={TimeOutline} class="mr-1" />
                {autoRefresh.value ? '停止自动刷新' : '自动刷新'}
              </NButton>

              <NButton
                type={streamConnected.value ? 'error' : 'success'}
                onClick={streamConnected.value ? stopLogStream : startLogStream}>
                <NIcon component={streamConnected.value ? StopOutline : PlayOutline} class="mr-1" />
                {streamConnected.value ? '停止实时' : '实时日志'}
              </NButton>

              <NPopover trigger="click">
                {{
                  trigger: () => (
                    <NButton>
                      <NIcon component={DownloadOutline} class="mr-1" />
                      导出
                    </NButton>
                  ),
                  default: () => (
                    <NSpace vertical size="small">
                      {exportFormatOptions.map((option) => (
                        <NButton key={option.value} text onClick={() => exportLogs(option.value)}>
                          导出为 {option.label}
                        </NButton>
                      ))}
                    </NSpace>
                  )
                }}
              </NPopover>
            </NSpace>
          </NSpace>
        </NCard>

        {/* 日志表格 */}
        <NCard>
          <NSpin show={loading.value}>
            {logs.value.length > 0 ? (
              <>
                <NDataTable
                  columns={columns}
                  data={logs.value}
                  bordered={false}
                  striped
                  size="small"
                  scrollX={1200}
                  maxHeight={600}
                />

                <div class="mt-4 flex justify-end">
                  <NPagination
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    itemCount={pagination.total}
                    showSizePicker
                    pageSizes={pagination.pageSizes}
                    onUpdatePage={handlePageChange}
                    onUpdatePageSize={handlePageSizeChange}
                  />
                </div>
              </>
            ) : (
              <NEmpty description="暂无日志数据" />
            )}
          </NSpin>
        </NCard>

        {/* 日志详情弹窗 */}
        <NModal
          v-model:show={showLogDetail.value}
          preset="card"
          title="日志详情"
          style={{ width: '80%', maxWidth: '1000px' }}>
          {selectedLog.value && (
            <NSpace vertical size="medium">
              <NSpace size="medium">
                <NTag type={selectedLog.value.level === LogLevelEnum.ERROR ? 'error' : 'info'}>
                  {selectedLog.value.level.toUpperCase()}
                </NTag>
                <span>服务: {selectedLog.value.service}</span>
                <span>时间: {dayjs(selectedLog.value.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}</span>
              </NSpace>

              <div>
                <h4>消息内容:</h4>
                <NCode code={selectedLog.value.message} language="text" />
              </div>

              {selectedLog.value.stack && (
                <div>
                  <h4>堆栈信息:</h4>
                  <NScrollbar style={{ maxHeight: '300px' }}>
                    <NCode code={selectedLog.value.stack} language="text" />
                  </NScrollbar>
                </div>
              )}

              {selectedLog.value.fields && Object.keys(selectedLog.value.fields).length > 0 && (
                <div>
                  <h4>额外字段:</h4>
                  <NCode code={JSON.stringify(selectedLog.value.fields, null, 2)} language="json" />
                </div>
              )}

              {selectedLog.value.tags && Object.keys(selectedLog.value.tags).length > 0 && (
                <div>
                  <h4>标签:</h4>
                  <NSpace size="small">
                    {Object.entries(selectedLog.value.tags).map(([key, value]) => (
                      <NTag key={key} size="small">
                        {key}: {String(value)}
                      </NTag>
                    ))}
                  </NSpace>
                </div>
              )}
            </NSpace>
          )}
        </NModal>
      </div>
    )
  }
})
