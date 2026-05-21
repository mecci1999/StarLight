import {
  NCard,
  NGrid,
  NGridItem,
  NSelect,
  NDatePicker,
  NSpace,
  NButton,
  NSpin,
  NEmpty,
  NInput,
  useMessage
} from 'naive-ui'
import { ref, onMounted, computed, defineComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMetricsExplorer, fetchCatalogServices, queryMetricCards, type MetricsDatasetScope } from '@/api'
import type { MetricsAnalysisData } from '@/types/monitor'
import dayjs from 'dayjs'
import PageHeader from '@/shared/layout/PageHeader'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import { useTimeStore } from '@/store/useTimeStore'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import TableResultPanel from '@/domains/metrics/components/TableResultPanel'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import {
  adaptCardResultsToMetricsAnalysisData,
  buildMetricsExplorerCardQueries,
  hasUsableMetricsExplorerCardResults,
  resolveMetricsExplorerMetricPreset
} from '@/domains/metrics/queryModel'
import './MetricsExplorerPage.scss'

export default defineComponent({
  name: 'MetricsExplorerPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const initialScope =
      route.query.scope === 'system' || route.query.scope === 'tenant'
        ? (route.query.scope as MetricsDatasetScope)
        : getPreferredMetricsDatasetScope()
    const datasetScope = ref<MetricsDatasetScope>(initialScope)
    const selectedAppKey = ref<string | null>(null)
    const focusedMetric = ref<string | null>(typeof route.query.metric === 'string' ? route.query.metric : null)
    const dateRange = ref<[number, number] | null>(null)
    const chartMode = ref<'line' | 'bar' | 'area' | 'table'>('line')
    const loading = ref(false)
    const metrics = ref<MetricsAnalysisData | null>(null)
    const services = ref<{ id: string; name: string }[]>([])
    const savedViews = ref<
      Array<{
        key: string
        name: string
        serviceId: string | null
        dateRange: [number, number] | null
        timeRange: string
      }>
    >([])
    const saveName = ref('')

    const serviceOptions = computed(() =>
      services.value.map((service) => ({
        label: service.name,
        value: service.id
      }))
    )

    const tableRows = computed(() => {
      if (!metrics.value) return []
      const source = [
        ...(metrics.value.series.cpu || []).map((series: any) => ({
          metric: series.name || 'CPU',
          points: series.data || []
        })),
        ...(metrics.value.series.memory || []).map((series: any) => ({
          metric: series.name || '内存',
          points: series.data || []
        })),
        ...(metrics.value.series.qps || []).map((series: any) => ({
          metric: series.name || 'QPS',
          points: series.data || []
        })),
        ...(metrics.value.series.responseTime || []).map((series: any) => ({
          metric: series.name || '响应时间',
          points: series.data || []
        }))
      ]
      return source.flatMap((item) =>
        item.points.map((point: any) => ({
          metric: item.metric,
          timestamp: point.timestamp,
          value: point.value
        }))
      )
    })

    const toBarData = (points: Array<{ timestamp: number; value: number }>) =>
      points.map((point) => ({
        name: dayjs(point.timestamp).format('HH:mm'),
        value: point.value
      }))

    const requestStatsSeries = computed(() =>
      (metrics.value?.requestStats || []).map((item) => ({
        name: item.name,
        value: item.value
      }))
    )

    const tableColumns = computed(() => {
      const sample = tableRows.value[0]
      const keys = sample ? Object.keys(sample) : ['metric', 'timestamp', 'value']
      return keys.map((key) => {
        if (key === 'timestamp') {
          return {
            title: '时间',
            key,
            render: (row: any) => new Date(row.timestamp).toLocaleString()
          }
        }
        if (key === 'metric') {
          return { title: '指标', key }
        }
        return { title: '值', key }
      })
    })

    const STORAGE_KEY = 'starlight_metrics_saved_views'

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        services.value = (res?.items || []).map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name
        }))
        if (!selectedAppKey.value && services.value.length) {
          selectedAppKey.value = String(route.query.serviceId || services.value[0].id)
        }
      } catch (error) {
        console.error('Failed to load service options:', error)
      }
    }

    const toRelativeTimeRange = () => {
      const endTime = dateRange.value?.[1] || timeStore.endTime || Date.now()
      const startTime = dateRange.value?.[0] || timeStore.startTime || endTime - 3600 * 1000
      const diffMs = Math.max(60000, endTime - startTime)
      const diffMinutes = Math.round(diffMs / 60000)
      if (diffMinutes < 60) return `-${diffMinutes}m`
      const diffHours = Math.round(diffMinutes / 60)
      if (diffHours < 24) return `-${diffHours}h`
      const diffDays = Math.round(diffHours / 24)
      return `-${diffDays}d`
    }

    const loadSavedViews = () => {
      if (typeof localStorage === 'undefined') return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        savedViews.value = raw ? JSON.parse(raw) : []
      } catch (error) {
        console.error('Failed to load saved metric views:', error)
      }
    }

    const persistSavedViews = () => {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews.value))
    }

    const saveCurrentView = () => {
      const name = saveName.value.trim() || `视图 ${savedViews.value.length + 1}`
      savedViews.value.unshift({
        key: `${Date.now()}`,
        name,
        serviceId: selectedAppKey.value,
        dateRange: dateRange.value,
        timeRange: timeStore.timeRange
      })
      persistSavedViews()
      saveName.value = ''
      message.success('已保存视图')
    }

    const exportCurrentView = () => {
      if (!tableRows.value.length) {
        message.warning('当前没有可导出的数据')
        return
      }
      const headers = ['metric', 'timestamp', 'value']
      const lines = [headers.join(',')]
      tableRows.value.forEach((row: any) => {
        lines.push([row.metric, row.timestamp, row.value].map((value) => JSON.stringify(value)).join(','))
      })
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `metrics-export-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('导出成功')
    }

    const loadMetrics = async () => {
      loading.value = true
      try {
        const queryRequest = buildMetricsExplorerCardQueries({
          scope: datasetScope.value,
          serviceId: selectedAppKey.value || undefined,
          timeRange: toRelativeTimeRange(),
          refreshGenerationId: `${Date.now()}`,
          metricRef: focusedMetric.value
        })
        const res = await queryMetricCards(queryRequest)
        if (!hasUsableMetricsExplorerCardResults(res)) {
          throw new Error('v2 query gateway returned no usable card results')
        }
        metrics.value = adaptCardResultsToMetricsAnalysisData(res)
      } catch (error) {
        console.error('Failed to load metrics via query gateway, fallback to legacy explorer:', error)
        try {
          const legacy = await fetchMetricsExplorer({
            serviceId: selectedAppKey.value || undefined,
            timeRange: toRelativeTimeRange(),
            scope: datasetScope.value
          })
          metrics.value = legacy
        } catch (legacyError) {
          console.error('Failed to load metrics:', legacyError)
          metrics.value = null
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        selectedAppKey.value = route.query.serviceId
      }
      if (route.query.metric && typeof route.query.metric === 'string') {
        focusedMetric.value = route.query.metric
      }
      await loadServiceOptions()
      loadSavedViews()
      await loadMetrics()
    })

    watch(
      () => datasetScope.value,
      async () => {
        selectedAppKey.value = null
        await loadServiceOptions()
        await loadMetrics()
      }
    )

    return () => (
      <div class="metrics-explorer-page">
        <PageHeader title="指标分析" subtitle="历史趋势、热力与对比分析">
          {{
            actions: () => (
              <NButton
                onClick={() =>
                  router.push({ path: '/home/investigate/metrics/catalog', query: { scope: datasetScope.value } })
                }>
                浏览指标目录
              </NButton>
            )
          }}
        </PageHeader>
        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => {
            timeStore.setTimeRange(range)
            loadMetrics()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadMetrics()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadMetrics()
          }}
        />

        <NCard class="metrics-explorer-page__toolbar" bordered={false}>
          <NSpace>
            <NSelect
              v-model:value={selectedAppKey.value}
              options={serviceOptions.value}
              style={{ width: '200px' }}
              placeholder="选择服务"
              disabled={serviceOptions.value.length === 0}
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NSelect
              v-model:value={chartMode.value}
              options={[
                { label: '折线模式', value: 'line' },
                { label: '柱状模式', value: 'bar' },
                { label: '面积模式', value: 'area' },
                { label: '表格模式', value: 'table' }
              ]}
              style={{ width: '160px' }}
            />
            <NInput v-model:value={saveName.value} placeholder="保存当前视图名称" style={{ width: '220px' }} />
            <NButton type="primary" onClick={loadMetrics} disabled={!selectedAppKey.value}>
              查询
            </NButton>
            <NButton onClick={saveCurrentView} disabled={!selectedAppKey.value}>
              保存视图
            </NButton>
            <NButton onClick={exportCurrentView}>导出</NButton>
          </NSpace>
        </NCard>

        <NCard class="metrics-explorer-page__saved-views" bordered={false}>
          <div class="metrics-explorer-page__saved-note">已保存视图</div>
          {savedViews.value.length ? (
            <div class="metrics-explorer-page__saved-actions">
              {savedViews.value.map((view) => (
                <NButton
                  secondary
                  onClick={() => {
                    selectedAppKey.value = view.serviceId
                    if (view.timeRange) {
                      timeStore.setTimeRange(view.timeRange as any)
                    }
                    dateRange.value = view.dateRange
                    focusedMetric.value = null
                    loadMetrics()
                  }}>
                  {view.name}
                </NButton>
              ))}
            </div>
          ) : (
            <NEmpty description="暂无已保存视图" class="metrics-explorer-page__empty-state" />
          )}
        </NCard>

        <NCard bordered={false} class="metrics-explorer-page__content">
          {loading.value ? (
            <div class="metrics-explorer-page__loading">
              <NSpin size="large" />
            </div>
          ) : null}

          {!loading.value && !metrics.value && (
            <NEmpty description="暂无数据，请选择应用后查询" class="metrics-explorer-page__empty-state" />
          )}

          {metrics.value ? (
            chartMode.value === 'table' ? (
              <TableResultPanel
                columns={tableColumns.value as any}
                data={tableRows.value as any}
                rowKey={(row: any) => `${row.metric}-${row.timestamp}`}
              />
            ) : (
              <NGrid cols={2} xGap={16} yGap={16}>
                {!focusedMetric.value || resolveMetricsExplorerMetricPreset(focusedMetric.value) === 'cpu' ? (
                  <NGridItem>
                    <NCard
                      title="CPU 使用率趋势"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      {chartMode.value === 'bar' ? (
                        <BarChart
                          data={toBarData(metrics.value.series.cpu?.[0]?.data || [])}
                          height="280px"
                          variant="monitor"
                        />
                      ) : (
                        <LineChart
                          series={metrics.value.series.cpu}
                          title=""
                          height="280px"
                          area={chartMode.value === 'area'}
                          variant="monitor"
                          showLegend
                        />
                      )}
                    </NCard>
                  </NGridItem>
                ) : null}
                {!focusedMetric.value || resolveMetricsExplorerMetricPreset(focusedMetric.value) === 'memory' ? (
                  <NGridItem>
                    <NCard
                      title="内存使用率趋势"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      {chartMode.value === 'bar' ? (
                        <BarChart
                          data={toBarData(metrics.value.series.memory?.[0]?.data || [])}
                          height="280px"
                          variant="monitor"
                        />
                      ) : (
                        <LineChart
                          series={metrics.value.series.memory}
                          title=""
                          height="280px"
                          area={chartMode.value === 'area'}
                          variant="monitor"
                          showLegend
                        />
                      )}
                    </NCard>
                  </NGridItem>
                ) : null}
                {!focusedMetric.value || resolveMetricsExplorerMetricPreset(focusedMetric.value) === 'qps' ? (
                  <NGridItem>
                    <NCard
                      title="QPS 趋势"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      {chartMode.value === 'bar' ? (
                        <BarChart
                          data={toBarData(metrics.value.series.qps?.[0]?.data || [])}
                          height="280px"
                          variant="monitor"
                        />
                      ) : (
                        <LineChart
                          series={metrics.value.series.qps}
                          title=""
                          height="280px"
                          area={chartMode.value === 'area'}
                          variant="monitor"
                          showLegend
                        />
                      )}
                    </NCard>
                  </NGridItem>
                ) : null}
                {!focusedMetric.value || resolveMetricsExplorerMetricPreset(focusedMetric.value) === 'responseTime' ? (
                  <NGridItem>
                    <NCard
                      title="响应时间趋势"
                      bordered={false}
                      headerStyle={{ padding: '16px 0' }}
                      contentStyle={{ padding: 0 }}>
                      {chartMode.value === 'bar' ? (
                        <BarChart
                          data={toBarData(metrics.value.series.responseTime?.[0]?.data || [])}
                          height="280px"
                          variant="monitor"
                        />
                      ) : (
                        <LineChart
                          series={metrics.value.series.responseTime}
                          title=""
                          height="280px"
                          area={chartMode.value === 'area'}
                          variant="monitor"
                          showLegend
                        />
                      )}
                    </NCard>
                  </NGridItem>
                ) : null}
                {!focusedMetric.value || resolveMetricsExplorerMetricPreset(focusedMetric.value) === 'requestStats' ? (
                  <NGridItem span={2}>
                    <NCard title="请求统计" bordered={false} headerStyle={{ padding: '16px 0' }}>
                      <BarChart data={metrics.value.requestStats} height="260px" variant="monitor" />
                    </NCard>
                  </NGridItem>
                ) : null}
              </NGrid>
            )
          ) : null}
        </NCard>
      </div>
    )
  }
})
