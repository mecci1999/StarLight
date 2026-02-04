/**
 * 日志中心主页面
 */
import { defineComponent, ref, reactive, onMounted, onUnmounted, computed, h } from 'vue'
import {
  NCard,
  NSpace,
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
  NTooltip,
  NTime,
  useMessage
} from 'naive-ui'
import {
  DocumentTextOutline,
  SearchOutline,
  AnalyticsOutline,
  CloudUploadOutline,
  SettingsOutline,
  TrendingUpOutline,
  WarningOutline,
  CheckmarkCircleOutline,
  TimeOutline,
  ServerOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import { LogLevelEnum } from '@/types/logs'
import type { LogEntry } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/common/SectionHeader'

// 导入子组件
import LogService from './service'
import LogException from './exception'
import LogIngest from './ingest'
import LogStream from './stream'
import LogConfig from './config'

export default defineComponent({
  name: 'LogCenter',
  components: {
    LogService,
    LogException,
    LogIngest,
    LogStream,
    LogConfig
  },
  setup() {
    const message = useMessage()
    const router = useRouter()

    // 响应式数据
    const loading = ref(false)
    const activeTab = ref('overview')
    const refreshTimer = ref<NodeJS.Timeout | null>(null)

    // 统计数据
    const stats = reactive({
      totalLogs: 0,
      todayLogs: 0,
      errorRate: 0,
      avgResponseTime: 0,
      topServices: [] as Array<{ service: string; count: number; percentage: number }>,
      levelDistribution: [] as Array<{ level: LogLevelEnum; count: number; percentage: number }>,
      recentLogs: [] as LogEntry[],
      systemHealth: {
        status: 'healthy', // healthy, warning, error
        uptime: '99.9%',
        lastUpdate: ''
      }
    })

    // 快捷操作
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
      },
      {
        title: '系统配置',
        description: '配置日志系统',
        icon: SettingsOutline,
        color: 'var(--color-text-2)',
        action: () => (activeTab.value = 'config')
      }
    ]

    // 获取日志级别颜色
    const getLevelColor = (level: LogLevelEnum) => {
      switch (level) {
        case LogLevelEnum.DEBUG:
          return 'var(--color-text-3)'
        case LogLevelEnum.INFO:
          return 'var(--color-primary-6)'
        case LogLevelEnum.WARN:
          return 'var(--color-warning-6)'
        case LogLevelEnum.ERROR:
          return 'var(--color-danger-6)'
        case LogLevelEnum.FATAL:
          return 'var(--color-danger-7)'
        default:
          return 'var(--color-text-3)'
      }
    }

    // 获取系统健康状态颜色
    const getHealthColor = (status: string) => {
      switch (status) {
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

    // 获取系统健康状态图标
    const getHealthIcon = (status: string) => {
      switch (status) {
        case 'healthy':
          return CheckmarkCircleOutline
        case 'warning':
          return WarningOutline
        case 'error':
          return WarningOutline
        default:
          return CheckmarkCircleOutline
      }
    }

    // 加载统计数据
    const loadStats = async () => {
      loading.value = true

      try {
        // 获取日志统计
        const response = await api.logs.getLogStats({
          startTime: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          endTime: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
          groupBy: ['service', 'level']
        })

        if (response.success && response.data) {
          const data = response.data

          // 更新统计数据
          stats.totalLogs = data.totalLogs || 0
          stats.todayLogs = data.totalLogs || 0 // 临时使用总数
          stats.errorRate = data.errorLogs ? (data.errorLogs / data.totalLogs) * 100 : 0
          stats.avgResponseTime = 0 // 临时设为0

          // 服务分布
          const serviceEntries = Object.entries(data.serviceStats || {})
          stats.topServices = serviceEntries.slice(0, 5).map(([service, count]) => ({
            service,
            count: count as number,
            percentage: ((count as number) / stats.totalLogs) * 100
          }))

          // 级别分布
          const levelEntries = Object.entries(data.levelStats || {})
          stats.levelDistribution = levelEntries.map(([level, count]) => ({
            level: level as LogLevelEnum,
            count: count as number,
            percentage: ((count as number) / stats.totalLogs) * 100
          }))
        }

        // 获取最近日志
        const recentResponse = await api.logs.searchLogs({
          pageSize: 10,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        })

        if (recentResponse.success && recentResponse.data) {
          stats.recentLogs = recentResponse.data.logs || []
        }

        // 更新系统健康状态
        stats.systemHealth.lastUpdate = dayjs().format('YYYY-MM-DD HH:mm:ss')

        // 根据错误率判断系统健康状态
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

    // 刷新数据
    const refreshData = () => {
      loadStats()
      message.success('数据已刷新')
    }

    // 启动自动刷新
    const startAutoRefresh = () => {
      refreshTimer.value = setInterval(() => {
        loadStats()
      }, 30000) // 30秒刷新一次
    }

    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    // 计算错误率状态
    const errorRateStatus = computed(() => {
      if (stats.errorRate < 1) return 'success'
      if (stats.errorRate < 5) return 'warning'
      return 'error'
    })

    // 生命周期
    onMounted(() => {
      loadStats()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return () => (
      <div class="log-center-container h-full bg-gray-50/50 p-24px overflow-auto">
        <NTabs v-model:value={activeTab.value} type="line" size="large" animated>
          {/* 概览页面 */}
          <NTabPane name="overview" tab="概览">
            <div class="flex flex-col gap-16px">
              {/* 页面头部 */}
              <div class="flex justify-between items-start">
                <SectionHeader title="日志中心" subtitle="统一的日志管理和分析平台" icon={DocumentTextOutline} />
                <NButton onClick={refreshData} loading={loading.value} type="primary" secondary>
                  <NIcon component={RefreshOutline} class="mr-1" />
                  刷新
                </NButton>
              </div>

              {/* 系统健康状态 */}
              <NAlert
                type={
                  stats.systemHealth.status === 'healthy'
                    ? 'success'
                    : stats.systemHealth.status === 'warning'
                      ? 'warning'
                      : 'error'
                }
                showIcon
                class="shadow-sm rounded-lg border-0">
                <div class="flex justify-between items-center">
                  <span class="font-medium">
                    系统状态:{' '}
                    {stats.systemHealth.status === 'healthy'
                      ? '健康'
                      : stats.systemHealth.status === 'warning'
                        ? '警告'
                        : '错误'}
                    {stats.systemHealth.uptime && ` | 可用性: ${stats.systemHealth.uptime}`}
                  </span>
                  <span class="text-sm opacity-80">最后更新: {stats.systemHealth.lastUpdate}</span>
                </div>
              </NAlert>

              {/* 核心指标 */}
              <NCard title="核心指标" bordered={false} class="shadow-sm rounded-lg">
                <NGrid cols={4} xGap={16}>
                  <NGridItem>
                    <NStatistic label="总日志数" value={stats.totalLogs.toLocaleString()}>
                      {{
                        prefix: () => h(NIcon, { component: DocumentTextOutline, color: 'var(--color-primary-6)' }),
                        default: () => <span class="text-24px font-bold">{stats.totalLogs.toLocaleString()}</span>
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="今日日志" value={stats.todayLogs.toLocaleString()}>
                      {{
                        prefix: () => h(NIcon, { component: TimeOutline, color: 'var(--color-success-6)' }),
                        default: () => <span class="text-24px font-bold">{stats.todayLogs.toLocaleString()}</span>
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="错误率" value={`${stats.errorRate.toFixed(2)}%`}>
                      {{
                        prefix: () =>
                          h(NIcon, {
                            component: WarningOutline,
                            color: getHealthColor(errorRateStatus.value)
                          }),
                        default: () => (
                          <span
                            class={`text-24px font-bold ${stats.errorRate > 0 ? 'text-[--color-danger-6]' : 'text-[--color-success-6]'}`}>
                            {stats.errorRate.toFixed(2)}%
                          </span>
                        )
                      }}
                    </NStatistic>
                  </NGridItem>
                  <NGridItem>
                    <NStatistic label="平均响应时间" value={`${stats.avgResponseTime}ms`}>
                      {{
                        prefix: () => h(NIcon, { component: TrendingUpOutline, color: 'var(--color-warning-6)' }),
                        default: () => <span class="text-24px font-bold">{stats.avgResponseTime}ms</span>
                      }}
                    </NStatistic>
                  </NGridItem>
                </NGrid>
              </NCard>

              {/* 快捷操作 */}
              <NCard title="快捷操作" bordered={false} class="shadow-sm rounded-lg">
                <NGrid cols={5} xGap={16} yGap={16}>
                  {quickActions.map((action, index) => (
                    <NGridItem key={index}>
                      <div
                        class="p-4 border border-[--color-border-2] bg-[--color-fill-2] rounded-lg cursor-pointer hover:shadow-md transition-all hover:bg-[--color-bg-2] hover:-translate-y-1"
                        onClick={action.action}>
                        <div class="flex flex-col items-center text-center">
                          <div
                            class="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: `rgba(var(--color-primary-6), 0.1)` }}>
                            <NIcon component={action.icon} size={24} color={action.color} />
                          </div>
                          <h4 class="font-medium mb-1 text-[--color-text-1]">{action.title}</h4>
                          <p class="text-xs text-[--color-text-3]">{action.description}</p>
                        </div>
                      </div>
                    </NGridItem>
                  ))}
                </NGrid>
              </NCard>

              <NGrid cols={2} xGap={16}>
                {/* 服务分布 */}
                <NGridItem>
                  <NCard title="Top 5 服务" bordered={false} class="shadow-sm rounded-lg h-full">
                    {stats.topServices.length > 0 ? (
                      <div class="flex flex-col gap-3">
                        {stats.topServices.map((service, index) => (
                          <div
                            key={index}
                            class="flex justify-between items-center p-2 hover:bg-[--color-fill-2] rounded transition-colors">
                            <div class="flex items-center">
                              <div class="w-8 h-8 rounded-full bg-[--color-fill-2] flex items-center justify-center mr-3">
                                <NIcon component={ServerOutline} size={16} color="var(--color-primary-6)" />
                              </div>
                              <span class="font-medium text-[--color-text-1]">{service.service}</span>
                            </div>
                            <div class="flex items-center gap-3">
                              <span class="text-sm text-[--color-text-3] font-mono">
                                {service.count.toLocaleString()}
                              </span>
                              <div class="w-20">
                                <NProgress
                                  type="line"
                                  percentage={service.percentage}
                                  showIndicator={false}
                                  height={6}
                                  color="var(--color-primary-6)"
                                />
                              </div>
                              <span class="text-xs text-[--color-text-3] w-10 text-right">
                                {service.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <NEmpty description="暂无数据" />
                    )}
                  </NCard>
                </NGridItem>

                {/* 日志级别分布 */}
                <NGridItem>
                  <NCard title="日志级别分布" bordered={false} class="shadow-sm rounded-lg h-full">
                    {stats.levelDistribution.length > 0 ? (
                      <div class="flex flex-col gap-3">
                        {stats.levelDistribution.map((level, index) => (
                          <div
                            key={index}
                            class="flex justify-between items-center p-2 hover:bg-[--color-fill-2] rounded transition-colors">
                            <div class="flex items-center">
                              <NTag
                                size="small"
                                color={{ color: getLevelColor(level.level), textColor: '#fff' }}
                                class="mr-2 w-16 justify-center">
                                {level.level}
                              </NTag>
                            </div>
                            <div class="flex items-center gap-3">
                              <span class="text-sm text-[--color-text-3] font-mono">
                                {level.count.toLocaleString()}
                              </span>
                              <div class="w-20">
                                <NProgress
                                  type="line"
                                  percentage={level.percentage}
                                  showIndicator={false}
                                  height={6}
                                  color={getLevelColor(level.level)}
                                />
                              </div>
                              <span class="text-xs text-[--color-text-3] w-10 text-right">
                                {level.percentage.toFixed(1)}%
                              </span>
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

              {/* 最近日志 */}
              <NCard title="最近日志" bordered={false} class="shadow-sm rounded-lg">
                {stats.recentLogs.length > 0 ? (
                  <div class="space-y-2">
                    {stats.recentLogs.map((log, index) => (
                      <div
                        key={index}
                        class="flex items-center justify-between p-3 bg-[--color-bg-2] rounded-lg hover:bg-[--color-fill-2] transition-colors border border-transparent hover:border-[--color-border-2]">
                        <div class="flex items-center space-x-4 overflow-hidden">
                          <NTime
                            time={new Date(log.timestamp)}
                            format="HH:mm:ss"
                            class="font-mono text-[--color-text-3] text-sm whitespace-nowrap"
                          />
                          <NTag
                            size="small"
                            color={{ color: getLevelColor(log.level), textColor: '#fff' }}
                            class="w-16 justify-center shrink-0">
                            {log.level}
                          </NTag>
                          <NTag
                            size="small"
                            bordered={false}
                            class="bg-[--color-fill-3] text-[--color-text-2] shrink-0">
                            {log.service}
                          </NTag>
                          <span class="text-sm text-[--color-text-1] truncate font-mono">{log.message}</span>
                        </div>
                        <NButton
                          size="tiny"
                          secondary
                          onClick={() => {
                            activeTab.value = 'service'
                          }}>
                          详情
                        </NButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NEmpty description="暂无最近日志" />
                )}
              </NCard>
            </div>
          </NTabPane>

          {/* 日志服务 */}
          <NTabPane name="service" tab="日志搜索">
            <LogService />
          </NTabPane>

          {/* 异常分析 */}
          <NTabPane name="exception" tab="异常分析">
            <LogException />
          </NTabPane>

          {/* 日志摄取 */}
          <NTabPane name="ingest" tab="日志摄取">
            <LogIngest />
          </NTabPane>

          {/* 实时流 */}
          <NTabPane name="stream" tab="实时流">
            <LogStream />
          </NTabPane>

          {/* 系统配置 */}
          <NTabPane name="config" tab="系统配置">
            <LogConfig />
          </NTabPane>
        </NTabs>
      </div>
    )
  }
})
