/**
 * 异常分析页面
 */
import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
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
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NCollapse,
  NCollapseItem,
  useMessage
} from 'naive-ui'
import {
  SearchOutline,
  RefreshOutline,
  BugOutline,
  TrendingUpOutline,
  AlertCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { LogLevelEnum } from '@/types/logs'
import type { ExceptionAnalysisParams, ExceptionAnalysisResponse, ExceptionGroup, ExceptionTrend } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'ExceptionAnalysis',
  setup() {
    const message = useMessage()

    // 响应式数据
    const loading = ref(false)
    const analysisData = ref<ExceptionAnalysisResponse | null>(null)
    const selectedException = ref<ExceptionGroup | null>(null)
    const showExceptionDetail = ref(false)

    // 搜索参数
    const searchParams = reactive<ExceptionAnalysisParams>({
      service: '',
      startTime: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      minOccurrences: 1,
      groupBy: 'message',
      sortBy: 'count',
      sortOrder: 'desc'
    })

    // 分页信息
    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100]
    })

    // 分组选项
    const groupByOptions = [
      { label: '错误消息', value: 'message' },
      { label: '异常类型', value: 'type' },
      { label: '服务名称', value: 'service' },
      { label: '堆栈位置', value: 'location' }
    ]

    // 排序选项
    const sortByOptions = [
      { label: '发生次数', value: 'count' },
      { label: '最近发生时间', value: 'lastOccurrence' },
      { label: '首次发生时间', value: 'firstOccurrence' },
      { label: '影响用户数', value: 'affectedUsers' }
    ]

    // 排序方向选项
    const sortOrderOptions = [
      { label: '降序', value: 'desc' },
      { label: '升序', value: 'asc' }
    ]

    // 表格列定义
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
              style: { cursor: 'pointer' },
              onClick: () => showExceptionDetails(row)
            },
            [
              h('div', { class: 'font-medium' }, row.message),
              h('div', { class: 'text-xs text-gray-500 mt-1' }, row.type)
            ]
          )
        }
      },
      {
        title: '服务',
        key: 'service',
        width: 120,
        render: (row: ExceptionGroup) => {
          return h(NTag, { size: 'small', type: 'info' }, () => row.service)
        }
      },
      {
        title: '发生次数',
        key: 'count',
        width: 100,
        sorter: true,
        render: (row: ExceptionGroup) => {
          return h('div', { class: 'text-center font-medium' }, row.count.toLocaleString())
        }
      },
      {
        title: '影响用户',
        key: 'affectedUsers',
        width: 100,
        render: (row: ExceptionGroup) => {
          return h('div', { class: 'text-center' }, row.affectedUsers?.toLocaleString() || '-')
        }
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
              color: isIncreasing ? '#f56565' : '#48bb78',
              style: { transform: isIncreasing ? 'none' : 'rotate(180deg)' }
            }),
            h(
              'span',
              {
                style: { color: isIncreasing ? '#f56565' : '#48bb78' }
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
        render: (row: ExceptionGroup) => {
          return dayjs(row.firstOccurrence).format('MM-DD HH:mm')
        }
      },
      {
        title: '最近发生',
        key: 'lastOccurrence',
        width: 150,
        render: (row: ExceptionGroup) => {
          return dayjs(row.lastOccurrence).format('MM-DD HH:mm')
        }
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

    // 计算属性
    const totalExceptions = computed(() => {
      return analysisData.value?.exceptions.reduce((sum, item) => sum + item.count, 0) || 0
    })

    const criticalExceptions = computed(() => {
      return analysisData.value?.exceptions.filter((item) => item.count >= 100).length || 0
    })

    const affectedServices = computed(() => {
      const services = new Set(analysisData.value?.exceptions.map((item) => item.service) || [])
      return services.size
    })

    // 异常分析
    const analyzeExceptions = async (resetPage = true) => {
      if (resetPage) {
        pagination.page = 1
      }

      loading.value = true
      try {
        const response = await api.logs.analyzeExceptions({
          ...searchParams,
          page: pagination.page,
          pageSize: pagination.pageSize
        })

        analysisData.value = response
        pagination.total = response.total
      } catch (error) {
        message.error('异常分析失败')
        console.error('Analyze exceptions error:', error)
      } finally {
        loading.value = false
      }
    }

    // 显示异常详情
    const showExceptionDetails = (exception: ExceptionGroup) => {
      selectedException.value = exception
      showExceptionDetail.value = true
    }

    // 分页变化处理
    const handlePageChange = (page: number) => {
      pagination.page = page
      analyzeExceptions(false)
    }

    const handlePageSizeChange = (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
      analyzeExceptions(false)
    }

    // 生命周期
    onMounted(() => {
      analyzeExceptions()
    })

    return () => (
      <div class="exception-analysis-container">
        {/* 统计概览 */}
        {analysisData.value && (
          <NCard class="mb-4">
            <NGrid cols={4} xGap={16}>
              <NGridItem>
                <NStatistic label="异常总数" value={totalExceptions.value}>
                  {{
                    prefix: () => h(NIcon, { component: BugOutline, color: '#f56565' })
                  }}
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="严重异常" value={criticalExceptions.value}>
                  {{
                    prefix: () => h(NIcon, { component: AlertCircleOutline, color: '#ed8936' })
                  }}
                </NStatistic>
              </NGridItem>
              <NGridItem>
                <NStatistic label="受影响服务" value={affectedServices.value} />
              </NGridItem>
              <NGridItem>
                <NStatistic label="异常类型" value={analysisData.value.exceptions.length} />
              </NGridItem>
            </NGrid>
          </NCard>
        )}

        {/* 搜索和过滤 */}
        <NCard class="mb-4">
          <NSpace vertical size="medium">
            <NSpace size="medium" wrap={false}>
              <NInput
                v-model:value={searchParams.service}
                placeholder="服务名称"
                clearable
                style={{ width: '150px' }}
              />
              <NSelect
                v-model:value={searchParams.groupBy}
                placeholder="分组方式"
                style={{ width: '120px' }}
                options={groupByOptions}
              />
              <NSelect
                v-model:value={searchParams.sortBy}
                placeholder="排序字段"
                style={{ width: '120px' }}
                options={sortByOptions}
              />
              <NSelect
                v-model:value={searchParams.sortOrder}
                placeholder="排序方向"
                style={{ width: '100px' }}
                options={sortOrderOptions}
              />
              <NInput v-model:value={searchParams.minOccurrences} placeholder="最小次数" style={{ width: '120px' }} />
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
            </NSpace>

            <NSpace size="medium">
              <NButton type="primary" onClick={() => analyzeExceptions()} loading={loading.value}>
                <NIcon component={SearchOutline} class="mr-1" />
                分析
              </NButton>

              <NButton onClick={() => analyzeExceptions(false)}>
                <NIcon component={RefreshOutline} class="mr-1" />
                刷新
              </NButton>
            </NSpace>
          </NSpace>
        </NCard>

        {/* 异常列表 */}
        <NCard>
          <NSpin show={loading.value}>
            {analysisData.value?.exceptions && analysisData.value.exceptions.length > 0 ? (
              <>
                <NDataTable
                  columns={columns}
                  data={analysisData.value.exceptions}
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
              <NEmpty description="暂无异常数据" />
            )}
          </NSpin>
        </NCard>

        {/* 异常详情弹窗 */}
        <NModal
          v-model:show={showExceptionDetail.value}
          preset="card"
          title="异常详情"
          style={{ width: '90%', maxWidth: '1200px' }}>
          {selectedException.value && (
            <NSpace vertical size="large">
              {/* 基本信息 */}
              <div>
                <h3>基本信息</h3>
                <NGrid cols={2} xGap={16} yGap={8}>
                  <NGridItem>
                    <div class="text-sm text-gray-500">异常类型</div>
                    <div class="font-medium">{selectedException.value.type}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="text-sm text-gray-500">服务名称</div>
                    <NTag type="info">{selectedException.value.service}</NTag>
                  </NGridItem>
                  <NGridItem>
                    <div class="text-sm text-gray-500">发生次数</div>
                    <div class="font-medium text-red-500">{selectedException.value.count.toLocaleString()}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="text-sm text-gray-500">影响用户</div>
                    <div class="font-medium">{selectedException.value.affectedUsers?.toLocaleString() || '-'}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="text-sm text-gray-500">首次发生</div>
                    <div>{dayjs(selectedException.value.firstOccurrence).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </NGridItem>
                  <NGridItem>
                    <div class="text-sm text-gray-500">最近发生</div>
                    <div>{dayjs(selectedException.value.lastOccurrence).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </NGridItem>
                </NGrid>
              </div>

              {/* 异常消息 */}
              <div>
                <h3>异常消息</h3>
                <NCode code={selectedException.value.message} language="text" />
              </div>

              {/* 堆栈跟踪 */}
              {selectedException.value.stackTrace && (
                <div>
                  <h3>堆栈跟踪</h3>
                  <NScrollbar style={{ maxHeight: '400px' }}>
                    <NCode code={selectedException.value.stackTrace} language="text" />
                  </NScrollbar>
                </div>
              )}

              {/* 示例日志 */}
              {selectedException.value.sampleLogs && selectedException.value.sampleLogs.length > 0 && (
                <div>
                  <h3>示例日志</h3>
                  <NCollapse>
                    {selectedException.value.sampleLogs.map((log, index) => (
                      <NCollapseItem
                        key={index}
                        title={`示例 ${index + 1} - ${dayjs(log.timestamp).format('MM-DD HH:mm:ss')}`}>
                        <NSpace vertical size="small">
                          <div>
                            <span class="text-sm text-gray-500">时间: </span>
                            <span>{dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}</span>
                          </div>
                          <div>
                            <span class="text-sm text-gray-500">主机: </span>
                            <span>{log.hostname}</span>
                          </div>
                          {log.containerId && (
                            <div>
                              <span class="text-sm text-gray-500">容器: </span>
                              <span>{log.containerId}</span>
                            </div>
                          )}
                          <div>
                            <span class="text-sm text-gray-500">消息: </span>
                            <NCode code={log.message} language="text" />
                          </div>
                          {log.stack && (
                            <div>
                              <span class="text-sm text-gray-500">堆栈: </span>
                              <NScrollbar style={{ maxHeight: '200px' }}>
                                <NCode code={log.stack} language="text" />
                              </NScrollbar>
                            </div>
                          )}
                        </NSpace>
                      </NCollapseItem>
                    ))}
                  </NCollapse>
                </div>
              )}

              {/* 趋势分析 */}
              {selectedException.value.hourlyTrend && selectedException.value.hourlyTrend.length > 0 && (
                <div>
                  <h3>24小时趋势</h3>
                  <div class="grid grid-cols-12 gap-2">
                    {selectedException.value.hourlyTrend.map((trend, index) => {
                      const maxCount = Math.max(...selectedException.value!.hourlyTrend!.map((t) => t.count))
                      const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0

                      return (
                        <div key={index} class="text-center">
                          <div class="text-xs text-gray-500 mb-1">{dayjs(trend.hour).format('HH:mm')}</div>
                          <div
                            class="bg-blue-500 rounded-sm mx-auto"
                            style={{
                              width: '20px',
                              height: `${Math.max(height, 2)}px`,
                              minHeight: '2px'
                            }}
                          />
                          <div class="text-xs mt-1">{trend.count}</div>
                        </div>
                      )
                    })}
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
