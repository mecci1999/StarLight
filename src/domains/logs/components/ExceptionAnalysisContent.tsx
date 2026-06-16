/**
 * 异常分析内容
 */
import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NPagination,
  NTag,
  NModal,
  NCode,
  NScrollbar,
  NEmpty,
  NSpin,
  NTooltip,
  NIcon,
  NGrid,
  NGridItem,
  NStatistic,
  NCollapse,
  NCollapseItem,
  useMessage
} from 'naive-ui'
import { SearchOutline, RefreshOutline, BugOutline, TrendingUpOutline, AlertCircleOutline } from '@vicons/ionicons5'
import type { ExceptionAnalysisParams, ExceptionAnalysisResponse, ExceptionGroup } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import './ExceptionAnalysisContent.scss'

export default defineComponent({
  name: 'ExceptionAnalysisContent',
  setup() {
    const message = useMessage()
    const loading = ref(false)
    const analysisData = ref<ExceptionAnalysisResponse | null>(null)
    const selectedException = ref<ExceptionGroup | null>(null)
    const showExceptionDetail = ref(false)

    const searchParams = reactive<ExceptionAnalysisParams>({
      service: '',
      startTime: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      minOccurrences: 1,
      groupBy: 'message',
      sortBy: 'count',
      sortOrder: 'desc'
    })

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100]
    })

    const groupByOptions = [
      { label: '错误消息', value: 'message' },
      { label: '异常类型', value: 'type' },
      { label: '服务名称', value: 'service' },
      { label: '堆栈位置', value: 'location' }
    ]

    const sortByOptions = [
      { label: '发生次数', value: 'count' },
      { label: '最近发生时间', value: 'lastOccurrence' },
      { label: '首次发生时间', value: 'firstOccurrence' },
      { label: '影响用户数', value: 'affectedUsers' }
    ]

    const sortOrderOptions = [
      { label: '降序', value: 'desc' },
      { label: '升序', value: 'asc' }
    ]

    const showExceptionDetails = (exception: ExceptionGroup) => {
      selectedException.value = exception
      showExceptionDetail.value = true
    }

    const columns = [
      {
        title: '异常信息',
        key: 'message',
        ellipsis: {
          tooltip: true
        },
        render: (row: ExceptionGroup) => {
          return h(
            'div',
            {
              class: 'exception-analysis-page__exception-cell',
              onClick: () => showExceptionDetails(row)
            },
            [
              h('div', { class: 'exception-analysis-page__exception-message' }, row.message),
              h('div', { class: 'exception-analysis-page__exception-type' }, row.type)
            ]
          )
        }
      },
      {
        title: '服务',
        key: 'service',
        width: 120,
        render: (row: ExceptionGroup) => h(NTag, { size: 'small', type: 'info' }, () => row.service)
      },
      {
        title: '发生次数',
        key: 'count',
        width: 100,
        sorter: true,
        render: (row: ExceptionGroup) => h('div', { class: 'text-center font-medium' }, row.count.toLocaleString())
      },
      {
        title: '影响用户',
        key: 'affectedUsers',
        width: 100,
        render: (row: ExceptionGroup) => h('div', { class: 'text-center' }, row.affectedUsers?.toLocaleString() || '-')
      },
      {
        title: '趋势',
        key: 'trend',
        width: 120,
        render: (row: ExceptionGroup) => {
          const trend = row.trend
          if (!trend) return '-'

          const isIncreasing = trend > 0
          return h(NSpace, { size: 'small', align: 'center' }, () => [
            h(NIcon, {
              component: TrendingUpOutline,
              color: isIncreasing ? 'var(--color-danger-6)' : 'var(--color-success-6)',
              style: { transform: isIncreasing ? 'none' : 'rotate(180deg)' }
            }),
            h(
              'span',
              {
                class: isIncreasing
                  ? 'exception-analysis-page__trend-text--up'
                  : 'exception-analysis-page__trend-text--down'
              },
              `${isIncreasing ? '+' : ''}${trend.toFixed(1)}%`
            )
          ])
        }
      },
      {
        title: '首次发生',
        key: 'firstOccurrence',
        width: 150,
        render: (row: ExceptionGroup) => dayjs(row.firstOccurrence).format('MM-DD HH:mm')
      },
      {
        title: '最近发生',
        key: 'lastOccurrence',
        width: 150,
        render: (row: ExceptionGroup) => dayjs(row.lastOccurrence).format('MM-DD HH:mm')
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        render: (row: ExceptionGroup) => {
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
                      onClick: () => showExceptionDetails(row)
                    },
                    () => '详情'
                  ),
                default: () => '查看异常详情'
              }
            )
          ])
        }
      }
    ]

    const totalExceptions = computed(
      () => analysisData.value?.exceptions.reduce((sum, item) => sum + item.count, 0) || 0
    )
    const criticalExceptions = computed(
      () => analysisData.value?.exceptions.filter((item) => item.count >= 100).length || 0
    )
    const affectedServices = computed(
      () => new Set(analysisData.value?.exceptions.map((item) => item.service) || []).size
    )
    const activeConditionCount = computed(() => {
      return [
        searchParams.service,
        searchParams.groupBy,
        searchParams.sortBy,
        searchParams.sortOrder,
        searchParams.minOccurrences
      ].filter(Boolean).length
    })

    const loadExceptions = async (resetPage = true) => {
      if (resetPage) {
        pagination.page = 1
      }

      loading.value = true
      try {
        const response = await api.logs.listExceptions({
          ...searchParams,
          page: pagination.page,
          pageSize: pagination.pageSize,
          timeRange: '24h'
        })

        analysisData.value = {
          totalExceptions: response?.items?.reduce((sum: number, item: any) => sum + Number(item.count || 0), 0) || 0,
          total: response?.items?.length || 0,
          exceptions: response?.items || [],
          exceptionStats: [],
          trend: [],
          hotServices: []
        }
        pagination.total = response?.items?.length || 0
      } catch (error) {
        message.error('异常分析失败')
        console.error('Analyze exceptions error:', error)
      } finally {
        loading.value = false
      }
    }

    const handlePageChange = (page: number) => {
      pagination.page = page
      loadExceptions(false)
    }

    const handlePageSizeChange = (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
      loadExceptions(false)
    }

    onMounted(() => {
      loadExceptions()
    })

    return () => (
      <div class="exception-analysis-page">
        <PageHeader title="异常分析" subtitle="按服务、错误类型和发生频次聚合异常，辅助定位高风险问题">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={() => loadExceptions(false)} loading={loading.value}>
                <NIcon component={RefreshOutline} class="exception-analysis-page__button-icon" />
                刷新分析
              </NButton>
            )
          }}
        </PageHeader>

        <NScrollbar>
          <div class="exception-analysis-page__body">
            {analysisData.value && (
              <NCard bordered={false} class="exception-analysis-page__card exception-analysis-page__card--summary">
                <NGrid cols={4} xGap={16} yGap={16}>
                  <NGridItem>
                    <NStatistic label="异常总数" value={totalExceptions.value}>
                      {{
                        prefix: () => h(NIcon, { component: BugOutline, color: 'var(--color-danger-6)' }),
                        default: () => <div class="exception-analysis-page__stat-value">{totalExceptions.value}</div>
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="严重异常" value={criticalExceptions.value}>
                      {{
                        prefix: () => h(NIcon, { component: AlertCircleOutline, color: 'var(--color-warning-6)' }),
                        default: () => (
                          <div class="exception-analysis-page__stat-value exception-analysis-page__stat-value--warning">
                            {criticalExceptions.value}
                          </div>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="受影响服务" value={affectedServices.value}>
                      {{
                        default: () => <div class="exception-analysis-page__stat-value">{affectedServices.value}</div>
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="异常类型" value={analysisData.value?.exceptions.length || 0}>
                      {{
                        default: () => (
                          <div class="exception-analysis-page__stat-value">
                            {analysisData.value?.exceptions.length || 0}
                          </div>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                </NGrid>
              </NCard>
            )}

            <NCard bordered={false} class="exception-analysis-page__card exception-analysis-page__card--filters">
              <div class="exception-analysis-page__filter-header">
                <div>
                  <div class="exception-analysis-page__section-title">分析条件</div>
                  <div class="exception-analysis-page__section-desc">
                    聚合方式决定异常归因粒度，建议先按错误消息查看，再收敛到服务或类型。
                  </div>
                </div>
                <NTag bordered={false} type="info">
                  {activeConditionCount.value} 个条件
                </NTag>
              </div>
              <div class="exception-analysis-page__filter-grid">
                <div class="exception-analysis-page__filter-row">
                  <NInput
                    v-model:value={searchParams.service}
                    placeholder="服务名称"
                    clearable
                    class="exception-analysis-page__service-input"
                  />
                  <NSelect
                    v-model:value={searchParams.groupBy}
                    placeholder="分组方式"
                    class="exception-analysis-page__select"
                    options={groupByOptions}
                  />
                  <NSelect
                    v-model:value={searchParams.sortBy}
                    placeholder="排序字段"
                    class="exception-analysis-page__select"
                    options={sortByOptions}
                  />
                  <NSelect
                    v-model:value={searchParams.sortOrder}
                    placeholder="排序方向"
                    class="exception-analysis-page__select exception-analysis-page__select--compact"
                    options={sortOrderOptions}
                  />
                  <NInput
                    v-model:value={searchParams.minOccurrences}
                    placeholder="最小次数"
                    class="exception-analysis-page__number-input"
                  />
                </div>

                <div class="exception-analysis-page__filter-row exception-analysis-page__filter-row--between">
                  <div class="exception-analysis-page__filter-group">
                    <NDatePicker
                      v-model:value={searchParams.startTime}
                      type="datetime"
                      placeholder="开始时间"
                      format="yyyy-MM-dd HH:mm:ss"
                      class="exception-analysis-page__date-input"
                    />
                    <NDatePicker
                      v-model:value={searchParams.endTime}
                      type="datetime"
                      placeholder="结束时间"
                      format="yyyy-MM-dd HH:mm:ss"
                      class="exception-analysis-page__date-input"
                    />
                  </div>

                  <div class="exception-analysis-page__filter-group">
                    <NButton type="primary" onClick={() => loadExceptions()} loading={loading.value}>
                      <NIcon component={SearchOutline} class="exception-analysis-page__button-icon" />
                      分析
                    </NButton>
                    <NButton onClick={() => loadExceptions(false)}>
                      <NIcon component={RefreshOutline} class="exception-analysis-page__button-icon" />
                      刷新
                    </NButton>
                  </div>
                </div>
              </div>
            </NCard>

            <NCard
              bordered={false}
              class="exception-analysis-page__card exception-analysis-page__card--table"
              contentStyle={{ padding: 0 }}>
              <div class="exception-analysis-page__table-header">
                <div>
                  <div class="exception-analysis-page__section-title">异常列表</div>
                  <div class="exception-analysis-page__section-desc">
                    按发生次数、影响用户和最近时间排序，点击行查看堆栈与样本日志。
                  </div>
                </div>
                <NTag bordered={false}>{pagination.total} 类异常</NTag>
              </div>
              <NSpin show={loading.value}>
                {analysisData.value?.exceptions && analysisData.value.exceptions.length > 0 ? (
                  <div class="exception-analysis-page__table-shell">
                    <ResultTable
                      columns={columns}
                      data={analysisData.value.exceptions}
                      bordered={false}
                      density="compact"
                      rowKey={(row: any) => row.id || row.message || row.type}
                    />

                    <div class="exception-analysis-page__table-footer">
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
                  </div>
                ) : (
                  <div class="exception-analysis-page__empty-state">
                    <NEmpty description="暂无异常数据" />
                  </div>
                )}
              </NSpin>
            </NCard>
          </div>
        </NScrollbar>

        <NModal
          v-model:show={showExceptionDetail.value}
          preset="card"
          title="异常详情"
          bordered={false}
          class="exception-analysis-page__modal"
          style={{ width: 'min(1200px, 92vw)' }}>
          {selectedException.value && (
            <NSpace vertical size="large">
              <div class="exception-analysis-page__panel">
                <h3 class="exception-analysis-page__section-title">基本信息</h3>
                <NGrid cols={2} xGap={16} yGap={12}>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">异常类型</div>
                    <div class="exception-analysis-page__field-value">{selectedException.value.type}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">服务名称</div>
                    <NTag type="info" bordered={false}>
                      {selectedException.value.service}
                    </NTag>
                  </NGridItem>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">发生次数</div>
                    <div class="exception-analysis-page__emphasis exception-analysis-page__emphasis--danger">
                      {selectedException.value.count.toLocaleString()}
                    </div>
                  </NGridItem>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">影响用户</div>
                    <div class="exception-analysis-page__field-value">
                      {selectedException.value.affectedUsers?.toLocaleString() || '-'}
                    </div>
                  </NGridItem>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">首次发生</div>
                    <div>{dayjs(selectedException.value.firstOccurrence).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="exception-analysis-page__field-label">最近发生</div>
                    <div>{dayjs(selectedException.value.lastOccurrence).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </NGridItem>
                </NGrid>
              </div>

              <div>
                <h3 class="exception-analysis-page__section-title">异常消息</h3>
                <div class="exception-analysis-page__code-shell">
                  <NCode code={selectedException.value.message} language="text" class="exception-analysis-page__code" />
                </div>
              </div>

              {selectedException.value.stackTrace && (
                <div>
                  <h3 class="exception-analysis-page__section-title">堆栈跟踪</h3>
                  <div class="exception-analysis-page__code-shell exception-analysis-page__code-shell--muted">
                    <NScrollbar style={{ maxHeight: '400px' }}>
                      <NCode
                        code={selectedException.value.stackTrace}
                        language="text"
                        class="exception-analysis-page__code"
                      />
                    </NScrollbar>
                  </div>
                </div>
              )}

              {selectedException.value.sampleLogs && selectedException.value.sampleLogs.length > 0 && (
                <div>
                  <h3 class="exception-analysis-page__section-title">关联日志</h3>
                  <NCollapse>
                    {selectedException.value.sampleLogs.map((log, index) => (
                      <NCollapseItem
                        key={index}
                        title={`日志 ${index + 1} - ${dayjs(log.timestamp).format('MM-DD HH:mm:ss')}`}>
                        <div class="exception-analysis-page__panel exception-analysis-page__panel--compact">
                          <NSpace vertical size="small">
                            <div class="exception-analysis-page__meta-grid">
                              <div>
                                <span class="exception-analysis-page__meta-label">时间: </span>
                                <span>{dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}</span>
                              </div>
                              <div>
                                <span class="exception-analysis-page__meta-label">主机: </span>
                                <span>{log.hostname}</span>
                              </div>
                              {log.containerId && (
                                <div>
                                  <span class="exception-analysis-page__meta-label">容器: </span>
                                  <span>{log.containerId}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div class="exception-analysis-page__meta-label exception-analysis-page__meta-label--block">
                                消息:
                              </div>
                              <div class="exception-analysis-page__code-shell exception-analysis-page__code-shell--muted">
                                <NCode code={log.message} language="text" />
                              </div>
                            </div>
                            {log.stack && (
                              <div>
                                <div class="exception-analysis-page__meta-label exception-analysis-page__meta-label--block">
                                  堆栈:
                                </div>
                                <div class="exception-analysis-page__code-shell exception-analysis-page__code-shell--muted">
                                  <NScrollbar style={{ maxHeight: '200px' }}>
                                    <NCode code={log.stack} language="text" />
                                  </NScrollbar>
                                </div>
                              </div>
                            )}
                          </NSpace>
                        </div>
                      </NCollapseItem>
                    ))}
                  </NCollapse>
                </div>
              )}

              {selectedException.value.hourlyTrend && selectedException.value.hourlyTrend.length > 0 && (
                <div>
                  <h3 class="exception-analysis-page__section-title">24小时趋势</h3>
                  <div class="exception-analysis-page__trend-shell">
                    <div class="exception-analysis-page__trend-grid">
                      {selectedException.value.hourlyTrend.map((trend, index) => {
                        const maxCount = Math.max(...selectedException.value!.hourlyTrend!.map((t) => t.count))
                        const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0

                        return (
                          <div key={index} class="exception-analysis-page__trend-column">
                            <div class="exception-analysis-page__trend-value">{trend.count}</div>
                            <div
                              class="exception-analysis-page__trend-bar"
                              style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                            />
                            <div class="exception-analysis-page__trend-time">{dayjs(trend.hour).format('HH:mm')}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </NSpace>
          )}
        </NModal>
      </div>
    )
  }
})
