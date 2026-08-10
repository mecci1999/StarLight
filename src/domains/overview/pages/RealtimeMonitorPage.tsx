import { NCard, NIcon, NGrid, NGridItem, NStatistic, NProgress, NSpace, NButton, NSpin, NEmpty, NTag } from 'naive-ui'
import { ref, onMounted, onUnmounted, defineComponent, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import PageHeader from '@/shared/layout/PageHeader'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import ScopeBar from '@/shared/components/ScopeBar'
import { RefreshOutline } from '@vicons/ionicons5'
import { useTimeStore } from '@/store/useTimeStore'
import LineChart from '@/components/charts/LineChart'
import type { MetricPoint } from '@/types/monitor'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import type { MetricsDatasetScope } from '@/api'
import './RealtimeMonitorPage.scss'

export default defineComponent({
  name: 'RealtimeMonitorPage',
  setup() {
    const route = useRoute()
    const timeStore = useTimeStore()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const selectedService = ref<string | null>(null)
    const refreshInterval = ref<NodeJS.Timeout | null>(null)
    const loading = ref(false)
    const loadError = ref('')
    const appKeys = ref<any[]>([])

    const realtimeData = ref<{
      cpu: number | null
      memory: number | null
      qps: number | null
      responseTime: number | null
      errorRate: number | null
      activeConnections: number | null
    }>({
      cpu: null,
      memory: null,
      qps: null,
      responseTime: null,
      errorRate: null,
      activeConnections: null
    })
    const realtimeSeries = ref<{ cpu: MetricPoint[]; memory: MetricPoint[]; responseTime: MetricPoint[] } | null>(null)
    const systemStatus = ref<
      Array<{
        name: string
        status: 'healthy' | 'warning' | 'critical' | 'unknown'
        value: number | null
        unit: string
      }>
    >([])
    const serviceOptionsError = ref(false)

    const getPrimarySeries = (groups: Array<{ data: MetricPoint[] }> | undefined) => {
      return Array.isArray(groups) && groups.length > 0 ? groups[0].data || [] : []
    }

    const serviceOptions = computed(() => {
      return appKeys.value.map((app) => ({
        label: app.name || app.keyName || app.appKey,
        value: app.appKey
      }))
    })

    const fetchServiceOptions = async () => {
      try {
        const res = await api.metrics.fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        const items = res?.items || []
        appKeys.value = items.map((item: any) => ({
          appKey: item.identity?.id,
          name: item.identity?.name,
          keyName: item.identity?.name
        }))

        if (appKeys.value.length > 0 && !selectedService.value) {
          selectedService.value = appKeys.value[0].appKey
          updateRealtimeData()
        } else if (selectedService.value) {
          updateRealtimeData()
        }
        serviceOptionsError.value = false
      } catch (error) {
        console.error('Failed to fetch catalog services:', error)
        appKeys.value = []
        serviceOptionsError.value = true
      }
    }

    const updateRealtimeData = async () => {
      if (!selectedService.value) return

      loading.value = true
      loadError.value = ''
      try {
        const [detail, runtime, incidents, metricsAnalysis] = await Promise.all([
          api.metrics.fetchServiceDetailSummary(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchServiceRuntime(selectedService.value, { scope: datasetScope.value }),
          api.metrics.fetchOverviewIncidents({ timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value }),
          api.metrics.fetchMetricsExplorer({ serviceId: selectedService.value, scope: datasetScope.value })
        ])

        const summary = detail?.summary || {}
        realtimeData.value = {
          cpu: summary.cpu ?? null,
          memory: summary.memory ?? null,
          qps: summary.qps ?? null,
          responseTime: summary.responseTime ?? null,
          errorRate: summary.errorRate ?? null,
          activeConnections: summary.activeConnections ?? null
        }

        realtimeSeries.value = {
          cpu: getPrimarySeries(metricsAnalysis?.series?.cpu),
          memory: getPrimarySeries(metricsAnalysis?.series?.memory),
          responseTime: getPrimarySeries(metricsAnalysis?.series?.responseTime)
        }

        const hasIncidentData = Array.isArray(incidents)
        const relevantIncidents = hasIncidentData
          ? incidents.filter((item: any) => !item.serviceId || item.serviceId === selectedService.value)
          : []

        systemStatus.value = [
          {
            name: '实例运行',
            status: Array.isArray(runtime?.instances) && runtime.instances.length > 0 ? 'healthy' : 'unknown',
            value: Array.isArray(runtime?.instances) ? runtime.instances.length : null,
            unit: 'instances'
          },
          {
            name: 'Metrics 采集',
            status: runtime?.ingestStatus?.metrics === true ? 'healthy' : 'unknown',
            value: runtime?.ingestStatus?.metrics === true ? 1 : null,
            unit: 'ok'
          },
          {
            name: 'Logs 采集',
            status: runtime?.ingestStatus?.logs === true ? 'healthy' : 'unknown',
            value: runtime?.ingestStatus?.logs === true ? 1 : null,
            unit: 'ok'
          },
          {
            name: '活跃事件',
            status: hasIncidentData ? (relevantIncidents.length > 0 ? 'critical' : 'healthy') : 'unknown',
            value: hasIncidentData ? relevantIncidents.length : null,
            unit: 'count'
          }
        ]
      } catch (error) {
        console.error('Failed to update realtime data:', error)
        realtimeSeries.value = null
        systemStatus.value = []
        realtimeData.value = {
          cpu: null,
          memory: null,
          qps: null,
          responseTime: null,
          errorRate: null,
          activeConnections: null
        }
        loadError.value = '实时监控数据加载失败，请检查服务状态或稍后重试。'
      } finally {
        loading.value = false
      }
    }

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => {
        updateRealtimeData()
      }
    )

    watch(
      () => timeStore.isLive,
      (val) => {
        if (val) {
          updateRealtimeData()
          refreshInterval.value = setInterval(updateRealtimeData, 5000)
        } else if (refreshInterval.value) {
          clearInterval(refreshInterval.value)
          refreshInterval.value = null
        }
      }
    )

    watch(
      () => datasetScope.value,
      () => {
        selectedService.value = null
        fetchServiceOptions()
      }
    )

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        selectedService.value = route.query.serviceId
      }
      fetchServiceOptions()
      if (timeStore.isLive) {
        refreshInterval.value = setInterval(updateRealtimeData, 5000)
      }
    })

    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
    })

    const getCpuStatus = (cpu: number) => {
      if (cpu > 80) return 'error'
      if (cpu > 60) return 'warning'
      return 'success'
    }

    const getMemoryStatus = (memory: number) => {
      if (memory > 80) return 'error'
      if (memory > 60) return 'warning'
      return 'success'
    }

    const getResponseTimeColor = (time: number) => {
      if (time > 150) return 'var(--color-danger-6)'
      if (time > 100) return 'var(--color-warning-6)'
      return 'var(--color-success-6)'
    }

    const displayMetric = (value: number | null | undefined, suffix = '', digits?: number) => {
      if (typeof value !== 'number') return '未知'
      if (typeof digits === 'number') return `${value.toFixed(digits)}${suffix}`
      return `${value}${suffix}`
    }

    const scopeValue = computed(() => ({
      service: selectedService.value,
      env: null,
      region: null
    }))

    const handleScopeChange = (value: { service?: string | null }) => {
      selectedService.value = value.service || null
      updateRealtimeData()
    }

    const handleTimeRangeChange = (range: any) => {
      timeStore.setTimeRange(range)
    }

    const handleLiveChange = (value: boolean) => {
      timeStore.isLive = value
      if (value) {
        timeStore.refreshTime()
      }
    }

    return () => (
      <div class="realtime-monitor-page">
        <PageHeader title="基础设施概览" subtitle="系统性能与健康状态指标">
          {{
            actions: () => (
              <NButton type="primary" onClick={updateRealtimeData} disabled={!selectedService.value}>
                {{ icon: () => <NIcon component={RefreshOutline} />, default: () => '刷新数据' }}
              </NButton>
            )
          }}
        </PageHeader>

        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={handleTimeRangeChange}
          onUpdate:live={handleLiveChange}
          onRefresh={() => {
            timeStore.refreshTime()
            updateRealtimeData()
          }}
        />

        <ScopeBar
          value={scopeValue.value}
          options={{ services: serviceOptions.value as any }}
          mode="service"
          onUpdate:value={handleScopeChange}
        />

        {loading.value && !realtimeData.value.cpu ? (
          <div class="realtime-monitor-page__loading">
            <NSpin size="large" />
          </div>
        ) : null}

        {!selectedService.value && serviceOptionsError.value && !loading.value ? (
          <NEmpty description="服务列表暂时不可用，请稍后重试" class="realtime-monitor-page__empty-state">
            {{
              extra: () => (
                <NButton type="primary" secondary onClick={fetchServiceOptions}>
                  重试加载
                </NButton>
              )
            }}
          </NEmpty>
        ) : !selectedService.value && !loading.value ? (
          <NEmpty description="请选择服务查看数据" class="realtime-monitor-page__empty-state" />
        ) : loadError.value && !loading.value ? (
          <NEmpty description={loadError.value} class="realtime-monitor-page__empty-state">
            {{
              extra: () => (
                <NButton type="primary" secondary onClick={updateRealtimeData}>
                  重试加载
                </NButton>
              )
            }}
          </NEmpty>
        ) : (
          <>
            <NGrid cols={3} xGap={16} class="realtime-monitor-page__metrics-grid">
              <NGridItem>
                <NCard bordered={false} class="realtime-monitor-page__hero-card">
                  <div class="realtime-monitor-page__hero-card-content">
                    <div class="realtime-monitor-page__hero-label">CPU 使用率</div>
                    {typeof realtimeData.value.cpu === 'number' ? (
                      <NProgress
                        type="circle"
                        percentage={realtimeData.value.cpu}
                        status={getCpuStatus(realtimeData.value.cpu)}
                        strokeWidth={8}
                        railColor="rgba(0,0,0,0.05)"
                        style={{ width: '120px', margin: '16px auto' }}
                      />
                    ) : (
                      <div class="realtime-monitor-page__hero-placeholder">未知</div>
                    )}
                    <div class="realtime-monitor-page__hero-value">{displayMetric(realtimeData.value.cpu, '%', 1)}</div>
                  </div>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard bordered={false} class="realtime-monitor-page__hero-card">
                  <div class="realtime-monitor-page__hero-card-content">
                    <div class="realtime-monitor-page__hero-label">内存使用率</div>
                    {typeof realtimeData.value.memory === 'number' ? (
                      <NProgress
                        type="circle"
                        percentage={realtimeData.value.memory}
                        status={getMemoryStatus(realtimeData.value.memory)}
                        strokeWidth={8}
                        railColor="rgba(0,0,0,0.05)"
                        style={{ width: '120px', margin: '16px auto' }}
                      />
                    ) : (
                      <div class="realtime-monitor-page__hero-placeholder">未知</div>
                    )}
                    <div class="realtime-monitor-page__hero-value">
                      {displayMetric(realtimeData.value.memory, '%', 1)}
                    </div>
                  </div>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard bordered={false} class="realtime-monitor-page__hero-card">
                  <div class="realtime-monitor-page__hero-card-content realtime-monitor-page__hero-card-content--error-rate">
                    <div class="realtime-monitor-page__hero-label realtime-monitor-page__hero-label--wide">错误率</div>
                    <div
                      class="realtime-monitor-page__error-rate-value"
                      style={{
                        color:
                          typeof realtimeData.value.errorRate === 'number'
                            ? realtimeData.value.errorRate > 1
                              ? 'var(--color-danger-6)'
                              : 'var(--color-success-6)'
                            : 'var(--color-text-3)'
                      }}>
                      {displayMetric(realtimeData.value.errorRate, '%', 2)}
                    </div>
                    <div class="realtime-monitor-page__error-rate-badge">最新值</div>
                  </div>
                </NCard>
              </NGridItem>
            </NGrid>

            <NGrid cols={3} xGap={16} class="realtime-monitor-page__stats-grid">
              <NGridItem>
                <NCard>
                  <NStatistic
                    label="QPS（请求/秒）"
                    value={
                      typeof realtimeData.value.qps === 'number' ? realtimeData.value.qps.toLocaleString() : '未知'
                    }
                    style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }}
                  />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard>
                  <NStatistic
                    label="平均响应时间"
                    value={displayMetric(realtimeData.value.responseTime, 'ms', 0)}
                    style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color:
                        typeof realtimeData.value.responseTime === 'number'
                          ? getResponseTimeColor(realtimeData.value.responseTime)
                          : 'var(--color-text-3)'
                    }}
                  />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard>
                  <NStatistic
                    label="活跃连接数"
                    value={
                      typeof realtimeData.value.activeConnections === 'number'
                        ? realtimeData.value.activeConnections.toLocaleString()
                        : '未知'
                    }
                    style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }}
                  />
                </NCard>
              </NGridItem>
            </NGrid>

            {realtimeSeries.value ? (
              <NGrid cols={2} xGap={16} yGap={16}>
                <NGridItem>
                  <NCard title="CPU 实时趋势" bordered={false}>
                    <LineChart
                      data={realtimeSeries.value.cpu}
                      title=""
                      height="240px"
                      area
                      variant="monitor"
                      mutedGrid
                    />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="内存实时趋势" bordered={false}>
                    <LineChart
                      data={realtimeSeries.value.memory}
                      title=""
                      height="240px"
                      area
                      variant="monitor"
                      mutedGrid
                    />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="QPS 当前值" bordered={false}>
                    <div class="realtime-monitor-page__qps-panel">
                      <div class="realtime-monitor-page__qps-panel-content">
                        <div class="realtime-monitor-page__qps-panel-value">
                          {displayMetric(realtimeData.value.qps)}
                        </div>
                        <div class="realtime-monitor-page__qps-panel-label">当前采样 QPS</div>
                      </div>
                    </div>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="响应时间趋势" bordered={false}>
                    <LineChart
                      data={realtimeSeries.value.responseTime}
                      title=""
                      height="240px"
                      variant="monitor"
                      mutedGrid
                    />
                  </NCard>
                </NGridItem>
              </NGrid>
            ) : null}

            <NCard class="realtime-monitor-page__system-card" title="系统状态" bordered={false}>
              <NSpace>
                {systemStatus.value.length ? (
                  systemStatus.value.map((item: any) => (
                    <NTag
                      type={
                        item.status === 'healthy'
                          ? 'success'
                          : item.status === 'critical'
                            ? 'error'
                            : item.status === 'warning'
                              ? 'warning'
                              : 'default'
                      }
                      bordered={false}>
                      {item.name}: {item.status}
                    </NTag>
                  ))
                ) : (
                  <NEmpty description="暂无系统状态数据" />
                )}
              </NSpace>
            </NCard>
          </>
        )}
      </div>
    )
  }
})
