/**
 * 日志中心主页面
 */
import { defineComponent, ref, reactive, onMounted, onUnmounted, computed, h } from 'vue'
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
  NTime
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
import type { LogEntry } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'
import PageHeader from '@/shared/layout/PageHeader'
import { getStoredUserInfo } from '@/services/authSession'
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
    const loading = ref(false)
    const activeTab = ref('overview')
    const refreshTimer = ref<NodeJS.Timeout | null>(null)
    const overviewOriginType = getStoredUserInfo()?.isAdmin ? 'darwin-app' : 'microservice'

    const stats = reactive({
      totalLogs: 0,
      todayLogs: 0,
      errorRate: 0,
      topServices: [] as Array<{ service: string; count: number; percentage: number }>,
      levelDistribution: [] as Array<{ level: LogLevelEnum; count: number; percentage: number }>,
      recentLogs: [] as LogEntry[],
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

    const loadStats = async () => {
      loading.value = true
      try {
        const statsResponse = await api.logs.getLogExplorerStats({
          startTime: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          endTime: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
          groupBy: 'level',
          originType: overviewOriginType
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
          stats.topServices = statsResponse.topServices.slice(0, 5).map((service: any) => ({
            service: service.service,
            count: Number(service.logCount || 0),
            percentage: todayTotal > 0 ? (Number(service.logCount || 0) / todayTotal) * 100 : 0
          }))
        } else {
          const serviceEntries = Object.entries(statsResponse?.serviceStats || {})
          stats.topServices = serviceEntries.slice(0, 5).map(([service, count]) => ({
            service,
            count: count as number,
            percentage: todayTotal > 0 ? ((count as number) / todayTotal) * 100 : 0
          }))
        }

        const levelEntries = Object.entries(statsResponse?.levelStats || {})
        stats.levelDistribution = levelEntries.map(([level, count]) => ({
          level: level as LogLevelEnum,
          count: count as number,
          percentage: todayTotal > 0 ? ((count as number) / todayTotal) * 100 : 0
        }))

        const recentResponse = await api.logs.searchLogsExplorer({
          pageSize: 50,
          sortBy: 'timestamp',
          sortOrder: 'desc',
          originType: overviewOriginType
        })

        const recentItems = Array.isArray(recentResponse?.items) ? recentResponse.items : []
        stats.recentLogs = recentItems.slice(0, 10)
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

    onMounted(() => {
      loadStats()
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
              <div class="log-center-page__hero">
                <PageHeader title="日志中心" subtitle="统一的日志管理和分析平台" />
                <NButton
                  onClick={refreshData}
                  loading={loading.value}
                  type="primary"
                  secondary
                  class="log-center-page__refresh-btn">
                  <NIcon component={RefreshOutline} class="mr-1" />
                  刷新
                </NButton>
              </div>

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
                    {stats.systemHealth.uptime && ` | 可用性: ${stats.systemHealth.uptime}`}
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
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary-6) 10%, transparent)' }}>
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
                    title="Top 5 服务"
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
                              <span class="log-center-page__mono">{service.count.toLocaleString()}</span>
                              <div class="log-center-page__progress-slot">
                                <NProgress
                                  type="line"
                                  percentage={service.percentage}
                                  showIndicator={false}
                                  height={6}
                                  color="var(--color-primary-6)"
                                />
                              </div>
                              <span class="log-center-page__meta-text">{service.percentage.toFixed(1)}%</span>
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
                                class="log-center-page__level-dot"
                                style={{
                                  backgroundColor:
                                    level.level === LogLevelEnum.TRACE
                                      ? '#6b7280'
                                      : level.level === LogLevelEnum.DEBUG
                                        ? '#a21caf'
                                        : level.level === LogLevelEnum.INFO
                                          ? '#15803d'
                                          : level.level === LogLevelEnum.WARN
                                            ? '#ca8a04'
                                            : level.level === LogLevelEnum.ERROR
                                              ? '#dc2626'
                                              : '#7f1d1d'
                                }}></div>
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
                                  color={
                                    level.level === LogLevelEnum.TRACE
                                      ? '#6b7280'
                                      : level.level === LogLevelEnum.DEBUG
                                        ? '#a21caf'
                                        : level.level === LogLevelEnum.INFO
                                          ? '#15803d'
                                          : level.level === LogLevelEnum.WARN
                                            ? '#ca8a04'
                                            : level.level === LogLevelEnum.ERROR
                                              ? '#dc2626'
                                              : '#7f1d1d'
                                  }
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

              <NCard title="最近日志" bordered={false} class="log-center-page__card">
                {stats.recentLogs.length > 0 ? (
                  <div class="log-center-page__recent-list">
                    {stats.recentLogs.map((log, index) => (
                      <div key={index} class="log-center-page__recent-item">
                        <NTag
                          size="small"
                          bordered={false}
                          class="log-center-page__level-tag"
                          style={{
                            backgroundColor: `${log.level === LogLevelEnum.TRACE ? '#f3f4f6' : log.level === LogLevelEnum.DEBUG ? '#f5e8ff' : log.level === LogLevelEnum.INFO ? '#dcfce7' : log.level === LogLevelEnum.WARN ? '#fef3c7' : log.level === LogLevelEnum.ERROR ? '#fee2e2' : '#7f1d1d'}`,
                            color: `${log.level === LogLevelEnum.TRACE ? '#6b7280' : log.level === LogLevelEnum.DEBUG ? '#a21caf' : log.level === LogLevelEnum.INFO ? '#15803d' : log.level === LogLevelEnum.WARN ? '#ca8a04' : log.level === LogLevelEnum.ERROR ? '#dc2626' : '#ffffff'}`
                          }}>
                          {log.level.toUpperCase()}
                        </NTag>
                        <div class="log-center-page__recent-content">
                          <div class="log-center-page__recent-message">{log.message}</div>
                          <div class="log-center-page__recent-meta">
                            <span>{log.service}</span>
                            <span class="log-center-page__recent-time">
                              <NTime time={new Date(log.timestamp)} type="datetime" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NEmpty description="暂无最近日志" />
                )}
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
