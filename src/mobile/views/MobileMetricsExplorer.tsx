import { defineComponent, ref, onActivated, computed, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MobileButton, MobileCard, MobileEmpty, MobileLoading, MobileSelect } from '@/mobile/ui'
import { PhArrowsClockwise, PhClock } from '@phosphor-icons/vue'
import { fetchMetricsExplorer, fetchCatalogServices } from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import LineChart from '@/components/charts/LineChart'
import type { MetricsAnalysisData } from '@/types/monitor'
import { parseInvestigationContext } from '@/mobile/hooks/investigationContext'
import './MobileMetricsExplorer.scss'

type TimeRangeKey = '15m' | '1h' | '4h' | '1d' | '7d'
type MetricKey = 'cpu' | 'memory' | 'qps' | 'responseTime'

interface TimeRangeChip {
  key: TimeRangeKey
  label: string
  value: string
}

const TIME_RANGE_CHIPS: TimeRangeChip[] = [
  { key: '15m', label: '15分', value: '-15m' },
  { key: '1h', label: '1时', value: '-1h' },
  { key: '4h', label: '4时', value: '-4h' },
  { key: '1d', label: '1天', value: '-1d' },
  { key: '7d', label: '7天', value: '-7d' }
]

const isMetricTimeRange = (value: string | undefined): value is TimeRangeKey =>
  TIME_RANGE_CHIPS.some((chip) => chip.key === value)

const METRIC_OPTIONS: { key: MetricKey; label: string; color: string; dotClass: string; unit: string }[] = [
  {
    key: 'cpu',
    label: 'CPU',
    color: 'var(--color-primary-6)',
    dotClass: 'mobile-metrics-explorer__chart-dot--cpu',
    unit: '%'
  },
  {
    key: 'memory',
    label: '内存',
    color: 'var(--color-warning-6)',
    dotClass: 'mobile-metrics-explorer__chart-dot--memory',
    unit: '%'
  },
  {
    key: 'qps',
    label: 'QPS',
    color: 'var(--color-success-6)',
    dotClass: 'mobile-metrics-explorer__chart-dot--qps',
    unit: ''
  },
  {
    key: 'responseTime',
    label: '响应时间',
    color: 'var(--color-danger-6)',
    dotClass: 'mobile-metrics-explorer__chart-dot--response',
    unit: 'ms'
  }
]

export default defineComponent({
  name: 'MobileMetricsExplorer',
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const error = ref(false)
    const data = ref<MetricsAnalysisData | null>(null)
    const services = ref<{ label: string; value: string }[]>([])
    const servicesError = ref(false)
    const selectedServiceId = ref<string | null>(null)
    const timeRange = ref<TimeRangeKey>('1h')
    const selectedMetrics = ref<MetricKey[]>(['cpu', 'memory', 'qps', 'responseTime'])

    const loadServices = async () => {
      servicesError.value = false
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: getPreferredMetricsDatasetScope() })
        const items = res?.items || []
        services.value = items.map((item: Record<string, unknown>) => ({
          label: (item.identity as Record<string, string>)?.name || '-',
          value: (item.identity as Record<string, string>)?.id || ''
        }))
      } catch {
        services.value = []
        servicesError.value = true
      }
    }

    const loadMetrics = async () => {
      loading.value = true
      error.value = false
      try {
        if (!selectedServiceId.value) {
          data.value = null
          return
        }
        const context = parseInvestigationContext(route.query)
        const chip = TIME_RANGE_CHIPS.find((c) => c.key === timeRange.value)
        const res = await fetchMetricsExplorer({
          serviceId: selectedServiceId.value,
          ...(context.start !== undefined && context.end !== undefined
            ? { startTime: context.start, endTime: context.end }
            : { timeRange: context.range ? `-${context.range}` : chip?.value }),
          scope: getPreferredMetricsDatasetScope()
        })
        data.value = res as MetricsAnalysisData
      } catch {
        error.value = true
        data.value = null
      } finally {
        loading.value = false
      }
    }

    onActivated(async () => {
      const context = parseInvestigationContext(route.query)
      if (context.serviceId) selectedServiceId.value = context.serviceId
      if (isMetricTimeRange(context.range)) timeRange.value = context.range
      await loadServices()
      if (selectedServiceId.value) await loadMetrics()
    })

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.serviceId !== undefined) selectedServiceId.value = context.serviceId
        if (isMetricTimeRange(context.range)) timeRange.value = context.range
        if (context.serviceId !== undefined || context.range !== undefined || context.start !== undefined)
          void loadMetrics()
      }
    )

    // ── KPI latest values ──

    const latestValues = computed(() => {
      if (!data.value) return { cpu: null, memory: null, qps: null, responseTime: null }
      const series = data.value.series

      const getLast = (arr: Array<{ data: Array<{ value: number | null }> }>) => {
        if (!arr || arr.length === 0 || !arr[0]?.data?.length) return null
        const points = arr[0].data.filter((p) => p.value !== null)
        return points.length > 0 ? points[points.length - 1].value : null
      }

      return {
        cpu: getLast(series.cpu),
        memory: getLast(series.memory),
        qps: getLast(series.qps),
        responseTime: getLast(series.responseTime)
      }
    })

    const formatValue = (val: number | null, unit: string): string => {
      if (val === null || val === undefined) return '-'
      if (unit === '%') return `${Math.round(val)}%`
      if (unit === 'ms') return `${Math.round(val)}ms`
      return `${Math.round(val)}`
    }

    // ── Chart data ──

    const chartDataFor = (metricKey: MetricKey) => {
      if (!data.value) return []
      const seriesArr = data.value.series[metricKey]
      if (!seriesArr || seriesArr.length === 0) return []
      return (seriesArr[0].data || [])
        .filter((p) => p.value !== null)
        .map((p) => ({ timestamp: p.timestamp, value: p.value! }))
    }

    const toggleMetric = (key: MetricKey) => {
      const idx = selectedMetrics.value.indexOf(key)
      if (idx >= 0) {
        if (selectedMetrics.value.length > 1) {
          selectedMetrics.value = selectedMetrics.value.filter((m) => m !== key)
        }
      } else {
        selectedMetrics.value = [...selectedMetrics.value, key]
      }
    }

    const isMetricSelected = (key: MetricKey) => selectedMetrics.value.includes(key)

    return () => (
      <div class="mobile-metrics-explorer">
        <div class="mobile-metrics-explorer__header">
          <div>
            <h2 class="mobile-metrics-explorer__title">指标分析</h2>
          </div>
          <MobileButton
            size="small"
            type="primary"
            class="mobile-metrics-explorer__refresh-action"
            onClick={loadMetrics}
            aria-label="刷新指标数据">
            {h(PhArrowsClockwise, { size: 16 })}
          </MobileButton>
        </div>

        <div class="mobile-metrics-explorer__service-select">
          <MobileSelect
            modelValue={selectedServiceId.value ?? ''}
            onUpdate:modelValue={(v) => {
              selectedServiceId.value = v as string
              loadMetrics()
            }}
            options={services.value}
            placeholder="选择服务"
            clearable
          />
          {servicesError.value && (
            <div class="mobile-metrics-explorer__selector-error" role="alert">
              <span>服务列表加载失败</span>
              <MobileButton size="small" type="ghost" onClick={loadServices}>
                重试
              </MobileButton>
            </div>
          )}
        </div>

        <div class="mobile-metrics-explorer__time-chips">
          {TIME_RANGE_CHIPS.map((chip) => (
            <MobileButton
              key={chip.key}
              size="small"
              type={timeRange.value === chip.key ? 'primary' : 'default'}
              onClick={() => {
                timeRange.value = chip.key
                loadMetrics()
              }}>
              {chip.label}
            </MobileButton>
          ))}
        </div>

        {loading.value ? (
          <div class="mobile-metrics-explorer__loading">
            <MobileLoading />
          </div>
        ) : error.value ? (
          <MobileEmpty description="数据加载失败，请检查网络连接后重试" class="mobile-metrics-explorer__error">
            <MobileButton type="primary" size="small" onClick={loadMetrics}>
              重新加载
            </MobileButton>
          </MobileEmpty>
        ) : !selectedServiceId.value ? (
          <div class="mobile-metrics-explorer__empty-state">
            <MobileEmpty description="请先选择服务" />
          </div>
        ) : !data.value ? (
          <div class="mobile-metrics-explorer__empty-state">
            <MobileEmpty description="暂无指标数据" />
          </div>
        ) : (
          <>
            <div class="mobile-metrics-explorer__metrics-grid">
              <MobileCard size="small" bordered={false} class="mobile-metrics-explorer__metric-card">
                <div class="mobile-metrics-explorer__metric-header">
                  <span class="mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--cpu" />
                  <span class="mobile-metrics-explorer__metric-name">CPU</span>
                </div>
                <div class="mobile-metrics-explorer__metric-value">{formatValue(latestValues.value.cpu, '%')}</div>
              </MobileCard>

              <MobileCard size="small" bordered={false} class="mobile-metrics-explorer__metric-card">
                <div class="mobile-metrics-explorer__metric-header">
                  <span class="mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--memory" />
                  <span class="mobile-metrics-explorer__metric-name">内存</span>
                </div>
                <div class="mobile-metrics-explorer__metric-value">{formatValue(latestValues.value.memory, '%')}</div>
              </MobileCard>

              <MobileCard size="small" bordered={false} class="mobile-metrics-explorer__metric-card">
                <div class="mobile-metrics-explorer__metric-header">
                  <span class="mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--qps" />
                  <span class="mobile-metrics-explorer__metric-name">QPS</span>
                </div>
                <div class="mobile-metrics-explorer__metric-value">{formatValue(latestValues.value.qps, '')}</div>
              </MobileCard>

              <MobileCard size="small" bordered={false} class="mobile-metrics-explorer__metric-card">
                <div class="mobile-metrics-explorer__metric-header">
                  <span class="mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--response" />
                  <span class="mobile-metrics-explorer__metric-name">响应时间</span>
                </div>
                <div class="mobile-metrics-explorer__metric-value">
                  {formatValue(latestValues.value.responseTime, 'ms')}
                </div>
              </MobileCard>
            </div>

            <div class="mobile-metrics-explorer__charts-section">
              <div class="mobile-metrics-explorer__section-header">
                <div class="mobile-metrics-explorer__section-title">
                  {h(PhClock, { size: 16 })}
                  <span>趋势图表</span>
                </div>
              </div>

              <div class="mobile-metrics-explorer__metric-selector">
                {METRIC_OPTIONS.map((opt) => (
                  <MobileButton
                    key={opt.key}
                    size="small"
                    type={isMetricSelected(opt.key) ? 'primary' : 'default'}
                    onClick={() => toggleMetric(opt.key)}>
                    {opt.label}
                  </MobileButton>
                ))}
              </div>

              <div class="mobile-metrics-explorer__charts">
                {METRIC_OPTIONS.filter((opt) => isMetricSelected(opt.key)).map((opt) => {
                  const chartData = chartDataFor(opt.key)
                  return (
                    <MobileCard key={opt.key} size="small" bordered={false} class="mobile-metrics-explorer__chart-card">
                      <div class="mobile-metrics-explorer__chart-header">
                        <div class="mobile-metrics-explorer__chart-title">
                          <span class={['mobile-metrics-explorer__chart-dot', opt.dotClass]} />
                          <span>{opt.label} 趋势</span>
                        </div>
                      </div>
                      <div class="mobile-metrics-explorer__chart-body">
                        {chartData.length > 0 ? (
                          <LineChart
                            data={chartData}
                            color={opt.color}
                            height="200px"
                            variant="monitor"
                            area
                            loading={loading.value}
                          />
                        ) : (
                          <MobileEmpty
                            description={`暂无${opt.label}数据`}
                            class="mobile-metrics-explorer__empty-state"
                          />
                        )}
                      </div>
                    </MobileCard>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
})
