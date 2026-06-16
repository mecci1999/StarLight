import { defineComponent, reactive, onMounted, onUnmounted, computed, watch, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NTag,
  NModal,
  NCode,
  NTooltip,
  NIcon,
  NPopover,
  NGrid,
  NGridItem,
  NStatistic,
  useMessage
} from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import {
  SearchOutline,
  RefreshOutline,
  DownloadOutline,
  PlayOutline,
  StopOutline,
  FilterOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { LogLevelEnum, LogSourceEnum, LogExportFormatEnum, type LogOriginType } from '@/types/logs'
import type { LogEntry, LogSearchParams, LogStatsResponse } from '@/types/logs'
import api from '@/api'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import dayjs from 'dayjs'
import { useTimeStore } from '@/store/useTimeStore'
import { getStoredUserInfo } from '@/services/authSession'
import './LogExplorerPage.scss'

export default defineComponent({
  name: 'LogExplorerPage',
  setup() {
    const route = useRoute()
    const message = useMessage()
    const timeStore = useTimeStore()
    const isAdminUser = Boolean(getStoredUserInfo()?.isAdmin)

    const getTodayLogRange = () => ({
      startTime: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    })

    const state = reactive({
      loading: false,
      statsLoading: false,
      streamConnected: false,
      logs: [] as LogEntry[],
      stats: null as LogStatsResponse | null,
      selectedLog: null as LogEntry | null,
      showLogDetail: false,
      autoRefresh: false,
      refreshInterval: null as NodeJS.Timeout | null
    })

    const searchParams = reactive<LogSearchParams>({
      service: '',
      level: undefined,
      keyword: '',
      startTime: getTodayLogRange().startTime,
      endTime: getTodayLogRange().endTime,
      page: 1,
      pageSize: 50,
      originType: (isAdminUser ? 'darwin-app' : 'microservice') as LogOriginType,
      source: undefined,
      hostname: '',
      containerId: ''
    })
    const followRouteTimeRange = ref(false)

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => {
        if (!followRouteTimeRange.value) return
        searchParams.startTime = dayjs(timeStore.startTime).format('YYYY-MM-DD HH:mm:ss')
        searchParams.endTime = dayjs(timeStore.endTime).format('YYYY-MM-DD HH:mm:ss')
        loadExplorerLogs(true)
        loadExplorerStats()
      }
    )

    const serviceOptions = ref<{ label: string; value: string }[]>([])

    const resolveServiceScope = (): MetricsDatasetScope => {
      return isAdminUser && searchParams.originType === 'darwin-app' ? 'system' : 'tenant'
    }

    const pagination = reactive({
      page: 1,
      pageSize: 50,
      total: 0,
      showSizePicker: true,
      pageSizes: [20, 50, 100, 200]
    })

    const levelOptions = Object.values(LogLevelEnum).map((level) => ({
      label: level.toUpperCase(),
      value: level
    }))

    const sourceOptions = Object.values(LogSourceEnum).map((source) => ({
      label: source.charAt(0).toUpperCase() + source.slice(1),
      value: source
    }))

    const originTypeOptions = [
      ...(isAdminUser ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
      { label: '用户微服务日志', value: 'microservice' }
    ]

    const exportFormatOptions = Object.values(LogExportFormatEnum).map((format) => ({
      label: format.toUpperCase(),
      value: format
    }))

    const scopeHint = computed(() => {
      const rangeText = `${dayjs(searchParams.startTime).format('MM-DD HH:mm')} 至 ${dayjs(searchParams.endTime).format('MM-DD HH:mm')}`
      if (searchParams.originType === 'darwin-app') {
        return `当前查看 Darwin 系统日志，统计范围 ${rangeText}；DEBUG 级别需要先在日志中心概览开启“调试日志收集”。`
      }
      return `当前查看用户微服务日志，统计范围 ${rangeText}；可按服务、级别、主机和容器快速收敛问题范围。`
    })

    const activeFilterCount = computed(() => {
      return [
        searchParams.service,
        searchParams.level,
        searchParams.keyword,
        searchParams.source,
        searchParams.hostname,
        searchParams.containerId
      ].filter(Boolean).length
    })

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
            [LogLevelEnum.TRACE]: 'default',
            [LogLevelEnum.DEBUG]: 'default',
            [LogLevelEnum.INFO]: 'info',
            [LogLevelEnum.WARN]: 'warning',
            [LogLevelEnum.ERROR]: 'error',
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
              class: 'log-explorer-page__message-link',
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

    const hasFilters = computed(() => {
      return (
        searchParams.service ||
        searchParams.level ||
        searchParams.keyword ||
        searchParams.originType !== (isAdminUser ? 'darwin-app' : 'microservice') ||
        searchParams.source ||
        searchParams.hostname ||
        searchParams.containerId
      )
    })

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: resolveServiceScope() })
        serviceOptions.value = (res?.items || []).map((item: any) => ({
          label: item.identity?.name || item.identity?.id,
          value: item.identity?.id || ''
        }))
      } catch (error) {
        console.error('Load log service options error:', error)
        serviceOptions.value = []
      }
    }

    const loadExplorerLogs = async (resetPage = true) => {
      if (resetPage) {
        searchParams.page = 1
        pagination.page = 1
      }

      state.loading = true
      try {
        const filters = searchParams.containerId ? { containerId: searchParams.containerId } : undefined
        const response = await api.logs.searchLogsExplorer({
          ...searchParams,
          query: searchParams.keyword || undefined,
          filters,
          page: pagination.page,
          pageSize: pagination.pageSize,
          limit: pagination.pageSize
        })

        if (response) {
          state.logs = response.items || []
          pagination.total = response.pagination?.total || 0
          pagination.page = response.pagination?.page || pagination.page
          pagination.pageSize = response.pagination?.pageSize || pagination.pageSize
        } else {
          state.logs = []
        }
      } catch (error) {
        console.error('Search logs error:', error)
        state.logs = []
        pagination.total = 0
      } finally {
        state.loading = false
      }
    }

    const loadExplorerStats = async () => {
      if (!searchParams.startTime || !searchParams.endTime) return

      state.statsLoading = true
      try {
        const response = await api.logs.getLogExplorerStats({
          service: searchParams.service,
          level: searchParams.level,
          query: searchParams.keyword || undefined,
          source: searchParams.source,
          hostname: searchParams.hostname || undefined,
          filters: searchParams.containerId ? { containerId: searchParams.containerId } : undefined,
          originType: searchParams.originType,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          interval: '1h',
          groupBy: 'level'
        })
        if (response) {
          state.stats = response
        }
      } catch {
      } finally {
        state.statsLoading = false
      }
    }

    const showLogDetails = (log: LogEntry) => {
      state.selectedLog = log
      state.showLogDetail = true
    }

    const searchExplorer = (resetPage = true) => {
      loadExplorerLogs(resetPage)
      loadExplorerStats()
    }

    const exportLogs = async (format: LogExportFormatEnum) => {
      try {
        const response = await api.logs.exportLogs({
          query: searchParams.keyword || undefined,
          service: searchParams.service || undefined,
          level: searchParams.level || undefined,
          source: searchParams.source || undefined,
          hostname: searchParams.hostname || undefined,
          containerId: searchParams.containerId || undefined,
          originType: searchParams.originType,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          format,
          filename: `logs_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.${format}`
        })

        const exportData = response.exportData
        const downloadUrl =
          response.downloadUrl || (exportData ? `data:text/plain;charset=utf-8,${encodeURIComponent(exportData)}` : '')
        const filename =
          response.filename || response.meta?.filename || `logs_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.${format}`

        if (!downloadUrl) {
          message.error('导出日志失败: 后端未返回导出内容')
          return
        }

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        message.success('日志导出成功')
      } catch (error) {
        message.error('导出日志失败')
        console.error('Export logs error:', error)
      }
    }

    const toggleAutoRefresh = () => {
      state.autoRefresh = !state.autoRefresh

      if (state.autoRefresh) {
        state.refreshInterval = setInterval(() => {
          loadExplorerLogs(false)
          loadExplorerStats()
        }, 30000)
        message.success('已开启自动刷新')
      } else {
        if (state.refreshInterval) {
          clearInterval(state.refreshInterval)
          state.refreshInterval = null
        }
        message.info('已关闭自动刷新')
      }
    }

    const clearFilters = () => {
      const todayRange = getTodayLogRange()
      searchParams.service = ''
      searchParams.level = undefined
      searchParams.keyword = ''
      searchParams.originType = (isAdminUser ? 'darwin-app' : 'microservice') as LogOriginType
      searchParams.source = undefined
      searchParams.hostname = ''
      searchParams.containerId = ''
      searchParams.startTime = todayRange.startTime
      searchParams.endTime = todayRange.endTime
      loadServiceOptions()
      loadExplorerLogs()
      loadExplorerStats()
    }

    const handlePageChange = (page: number) => {
      pagination.page = page
      searchParams.page = page
      loadExplorerLogs(false)
    }

    const handlePageSizeChange = (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
      searchParams.page = 1
      searchParams.pageSize = pageSize
      loadExplorerLogs(false)
    }

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        followRouteTimeRange.value = true
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      const routeService = typeof route.query.service === 'string' ? route.query.service : route.query.serviceId
      if (typeof routeService === 'string') {
        searchParams.service = routeService
      }
      if (typeof route.query.keyword === 'string') {
        searchParams.keyword = route.query.keyword
      }
      loadServiceOptions()
      loadExplorerLogs()
      loadExplorerStats()
    })

    onUnmounted(() => {
      if (state.refreshInterval) {
        clearInterval(state.refreshInterval)
      }
    })

    return () => (
      <div class="log-explorer-page">
        <PageHeader title="服务日志" subtitle="按范围、服务和级别检索日志，并与调试采集开关联动排查上下文">
          {{
            actions: () => (
              <NButton secondary type={state.autoRefresh ? 'warning' : 'primary'} onClick={toggleAutoRefresh}>
                <NIcon
                  component={state.autoRefresh ? StopOutline : PlayOutline}
                  class="log-explorer-page__button-icon"
                />
                {state.autoRefresh ? '停止自动刷新' : '开启自动刷新'}
              </NButton>
            )
          }}
        </PageHeader>

        <div class="log-explorer-page__scope-note">
          <div class="log-explorer-page__scope-note-main">
            <NIcon component={TimeOutline} size={18} />
            <span>{scopeHint.value}</span>
          </div>
          <NTag bordered={false} type={activeFilterCount.value > 0 ? 'info' : 'default'}>
            {activeFilterCount.value > 0 ? `${activeFilterCount.value} 个筛选条件` : '未筛选'}
          </NTag>
        </div>

        {state.stats && (
          <NCard class="log-explorer-page__card log-explorer-page__summary-card" bordered={false}>
            <NGrid cols={4} xGap={16} yGap={16}>
              <NGridItem>
                <NStatistic label="总日志数" value={state.stats.totalLogs}>
                  {{ default: () => <span class="log-explorer-page__stat-value">{state.stats?.totalLogs || 0}</span> }}
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="错误日志" value={state.stats.errorLogs}>
                  {{
                    default: () => (
                      <span class="log-explorer-page__stat-value log-explorer-page__stat-value--danger">
                        {state.stats?.errorLogs || 0}
                      </span>
                    )
                  }}
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="警告日志" value={state.stats.warnLogs}>
                  {{
                    default: () => (
                      <span class="log-explorer-page__stat-value log-explorer-page__stat-value--warning">
                        {state.stats?.warnLogs || 0}
                      </span>
                    )
                  }}
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic
                  label="错误率"
                  value={
                    state.stats.totalLogs > 0
                      ? `${((state.stats.errorLogs / state.stats.totalLogs) * 100).toFixed(2)}%`
                      : '0%'
                  }>
                  {{
                    default: () => (
                      <span class="log-explorer-page__stat-value">
                        {state.stats && state.stats.totalLogs > 0
                          ? ((state.stats.errorLogs / state.stats.totalLogs) * 100).toFixed(2)
                          : '0.00'}
                        %
                      </span>
                    )
                  }}
                </NStatistic>
              </NGridItem>
            </NGrid>
          </NCard>
        )}

        <NCard class="log-explorer-page__card log-explorer-page__filter-card" bordered={false}>
          <div class="log-explorer-page__filter-header">
            <div>
              <div class="log-explorer-page__section-title">日志筛选</div>
              <div class="log-explorer-page__section-desc">先选日志归属，再按服务、级别和关键字定位目标日志。</div>
            </div>
            <NTag bordered={false}>{pagination.total.toLocaleString()} 条结果</NTag>
          </div>
          <div class="log-explorer-page__filter-grid">
            <div class="log-explorer-page__filter-primary">
              <NInput
                v-model:value={searchParams.keyword}
                placeholder="搜索关键词"
                clearable
                class="log-explorer-page__keyword-input"
              />
              <NSelect
                v-model:value={searchParams.originType}
                placeholder="日志归属"
                class="log-explorer-page__select log-explorer-page__select--scope"
                options={originTypeOptions}
              />
              <NSelect
                v-model:value={searchParams.service}
                placeholder={isAdminUser && searchParams.originType === 'darwin-app' ? '选择系统服务' : '选择服务'}
                clearable
                filterable
                tag
                class="log-explorer-page__select log-explorer-page__select--service"
                options={serviceOptions.value}
              />
              <NSelect
                v-model:value={searchParams.level}
                placeholder="日志级别"
                clearable
                class="log-explorer-page__select log-explorer-page__select--level"
                options={levelOptions}
              />
              <NSelect
                v-model:value={searchParams.source}
                placeholder="日志来源"
                clearable
                class="log-explorer-page__select log-explorer-page__select--source"
                options={sourceOptions}
              />
            </div>

            <div class="log-explorer-page__filter-secondary">
              <NInput
                v-model:value={searchParams.hostname}
                placeholder="主机名"
                clearable
                class="log-explorer-page__compact-input"
              />
              <NInput
                v-model:value={searchParams.containerId}
                placeholder="容器ID"
                clearable
                class="log-explorer-page__compact-input"
              />
            </div>

            <div class="log-explorer-page__filter-actions">
              <NButton type="primary" onClick={() => searchExplorer()} loading={state.loading}>
                <NIcon component={SearchOutline} class="log-explorer-page__button-icon" />
                搜索
              </NButton>
              <NButton onClick={() => searchExplorer(false)} loading={state.loading}>
                <NIcon component={RefreshOutline} class="log-explorer-page__button-icon" />
                刷新
              </NButton>
              <NButton onClick={clearFilters} disabled={!hasFilters.value}>
                <NIcon component={FilterOutline} class="log-explorer-page__button-icon" />
                清空过滤
              </NButton>
              <NPopover trigger="click" placement="bottom-end">
                {{
                  trigger: () => (
                    <NButton>
                      <NIcon component={DownloadOutline} class="log-explorer-page__button-icon" />
                      导出
                    </NButton>
                  ),
                  default: () => (
                    <div class="log-explorer-page__export-menu">
                      {exportFormatOptions.map((option) => (
                        <NButton
                          key={option.value}
                          size="small"
                          onClick={() => exportLogs(option.value as LogExportFormatEnum)}>
                          导出为 {option.label}
                        </NButton>
                      ))}
                    </div>
                  )
                }}
              </NPopover>
            </div>
          </div>
        </NCard>

        <NCard class="log-explorer-page__card log-explorer-page__table-card" bordered={false}>
          <div class="log-explorer-page__table-header">
            <div>
              <div class="log-explorer-page__section-title">日志结果</div>
              <div class="log-explorer-page__section-desc">点击消息或详情按钮查看原始字段、标签和上下文。</div>
            </div>
            {searchParams.level === LogLevelEnum.DEBUG ? (
              <NTag type="warning" bordered={false}>
                DEBUG 诊断视图
              </NTag>
            ) : null}
          </div>
          <ResultTable
            columns={columns}
            data={state.logs}
            loading={state.loading}
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              itemCount: pagination.total,
              showSizePicker: pagination.showSizePicker,
              pageSizes: pagination.pageSizes,
              onUpdatePage: handlePageChange,
              onUpdatePageSize: handlePageSizeChange
            }}
            rowKey={(row: LogEntry) => row.id}
          />
        </NCard>

        <NModal
          v-model:show={state.showLogDetail}
          preset="card"
          title="日志详情"
          class="log-explorer-page__modal"
          style={{ width: 'min(880px, 92vw)' }}>
          {state.selectedLog && (
            <div class="log-explorer-page__detail">
              <div class="log-explorer-page__detail-header">
                <NTag
                  type={
                    state.selectedLog.level === LogLevelEnum.ERROR || state.selectedLog.level === LogLevelEnum.FATAL
                      ? 'error'
                      : state.selectedLog.level === LogLevelEnum.WARN
                        ? 'warning'
                        : state.selectedLog.level === LogLevelEnum.INFO
                          ? 'success'
                          : 'default'
                  }>
                  {state.selectedLog.level.toUpperCase()}
                </NTag>
                <span class="log-explorer-page__detail-time">
                  {dayjs(state.selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}
                </span>
              </div>
              <div class="log-explorer-page__code-shell">
                <NCode code={state.selectedLog.message} language="text" />
              </div>
              <div class="log-explorer-page__code-shell log-explorer-page__code-shell--muted">
                <NCode
                  code={JSON.stringify({ tags: state.selectedLog.tags, fields: state.selectedLog.fields }, null, 2)}
                  language="json"
                />
              </div>
            </div>
          )}
        </NModal>
      </div>
    )
  }
})
