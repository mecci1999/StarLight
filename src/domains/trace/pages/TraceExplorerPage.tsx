import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NTag,
  NSpin,
  NEmpty,
  NDrawer,
  NDrawerContent,
  NButton,
  NInput,
  NSelect,
  NIcon,
  NGrid,
  NGridItem,
  useMessage
} from 'naive-ui'
import type { TraceSpan } from '@/types/monitor'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import BarChart from '@/components/charts/BarChart'
import { fetchCatalogServices } from '@/api/metrics'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { useTimeStore } from '@/store/useTimeStore'
import { getStoredUserInfo } from '@/services/authSession'
import type { LogOriginType } from '@/types/logs'
import dayjs from 'dayjs'
import * as traceApi from '@/api/trace'
import './TraceExplorerPage.scss'

export default defineComponent({
  name: 'TraceExplorerPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const isAdminUser = Boolean(getStoredUserInfo()?.isAdmin)
    const traceOriginType = (isAdminUser ? 'darwin-app' : 'microservice') as LogOriginType
    const loading = ref(false)
    const traces = ref<TraceSpan[]>([])
    const selectedTraceId = ref<string | null>(null)
    const showDrawer = ref(false)
    const selectedSpan = ref<TraceSpan | null>(null)

    const searchQuery = ref('')
    const selectedService = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)
    const selectedOperation = ref<string | null>(null)
    const selectedDurationBucket = ref<string | null>(null)
    const selectedEnv = ref<string | null>(null)
    const serviceOptions = ref<{ label: string; value: string }[]>([])
    const serviceEnvMap = ref<Record<string, string>>({})

    const normalizeTraceService = (value?: string | null) => {
      const raw = String(value || '').trim()
      return raw.startsWith('system:') ? raw.slice('system:'.length) : raw
    }

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({
          page: 1,
          pageSize: 200,
          scope: traceOriginType === 'darwin-app' ? 'system' : 'tenant'
        })
        const items = Array.isArray(res?.items) ? res.items : []
        serviceOptions.value = items
          .filter((item: any) => !selectedEnv.value || item.identity?.env === selectedEnv.value)
          .map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: normalizeTraceService(item.identity?.name || item.identity?.id)
          }))
        serviceEnvMap.value = Object.fromEntries(
          items.map((item: any) => [
            normalizeTraceService(item.identity?.name || item.identity?.id),
            item.identity?.env || ''
          ])
        )
      } catch (error) {
        console.error('Failed to load trace services:', error)
        serviceOptions.value = []
        serviceEnvMap.value = {}
      }
    }

    const operationOptions = computed(() => [
      { label: '全部操作', value: '' },
      ...Array.from(new Set(traces.value.map((trace) => trace.name).filter(Boolean))).map((value) => ({
        label: value,
        value
      }))
    ])

    const envOptions = computed(() => [
      { label: '全部环境', value: '' },
      ...Array.from(new Set(Object.values(serviceEnvMap.value).filter(Boolean))).map((value) => ({
        label: value,
        value
      }))
    ])

    const durationOptions = [
      { label: '全部耗时', value: '' },
      { label: '0-50ms', value: '0-50' },
      { label: '50-100ms', value: '50-100' },
      { label: '100-250ms', value: '100-250' },
      { label: '250-500ms', value: '250-500' },
      { label: '500ms+', value: '500+' }
    ]

    const statusOptions = [
      { label: '正常', value: 'ok' },
      { label: '异常', value: 'error' }
    ]

    const findOptionLabel = (options: Array<{ label: string; value: string }>, value: string | null) =>
      options.find((option) => option.value === value)?.label || value || ''

    const buildTraceSearchParams = () => ({
      startTime: timeStore.startTime,
      endTime: timeStore.endTime,
      service: normalizeTraceService(selectedService.value) || undefined,
      traceId: searchQuery.value.trim() || undefined,
      operation: selectedOperation.value || undefined,
      limit: 100,
      originType: traceOriginType
    })

    const loadData = async () => {
      loading.value = true
      try {
        const res = await traceApi.searchTraces(buildTraceSearchParams())

        const traceMap = new Map<string, TraceSpan>()
        res.forEach((span: TraceSpan) => {
          if (!traceMap.has(span.traceId) || (!span.parentId && traceMap.get(span.traceId)?.parentId)) {
            traceMap.set(span.traceId, span)
          }
        })

        traces.value = Array.from(traceMap.values())
      } catch (error) {
        console.error('Failed to load traces:', error)
        message.error('加载链路数据失败')
      } finally {
        loading.value = false
      }
    }

    watch(
      () => [timeStore.startTime, timeStore.endTime, selectedService.value, selectedStatus.value, selectedEnv.value],
      () => {
        loadServiceOptions()
        loadData()
      }
    )

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      const routeService = typeof route.query.service === 'string' ? route.query.service : route.query.serviceId
      if (typeof routeService === 'string') {
        selectedService.value = normalizeTraceService(routeService)
      }
      loadServiceOptions()
      loadData()
    })

    const tableData = computed(() => {
      let filtered = traces.value

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (s) =>
            s.traceId.toLowerCase().includes(q) ||
            s.service.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q)
        )
      }

      if (selectedStatus.value) {
        filtered = filtered.filter((s) => s.status === selectedStatus.value)
      }

      if (selectedEnv.value) {
        filtered = filtered.filter((s) => serviceEnvMap.value[s.service] === selectedEnv.value)
      }

      if (selectedOperation.value) {
        filtered = filtered.filter((s) => s.name === selectedOperation.value)
      }

      if (selectedDurationBucket.value) {
        filtered = filtered.filter((s) => {
          if (selectedDurationBucket.value === '0-50') return s.duration >= 0 && s.duration < 50
          if (selectedDurationBucket.value === '50-100') return s.duration >= 50 && s.duration < 100
          if (selectedDurationBucket.value === '100-250') return s.duration >= 100 && s.duration < 250
          if (selectedDurationBucket.value === '250-500') return s.duration >= 250 && s.duration < 500
          if (selectedDurationBucket.value === '500+') return s.duration >= 500
          return true
        })
      }

      return filtered.sort((a, b) => b.startTime - a.startTime)
    })

    const slowThreshold = 500

    const traceSummary = computed(() => {
      const total = tableData.value.length
      const success = tableData.value.filter((item) => item.status === 'ok').length
      const failed = tableData.value.filter((item) => item.status !== 'ok').length
      const avgDuration = total ? Math.round(tableData.value.reduce((sum, item) => sum + item.duration, 0) / total) : 0
      const slow = tableData.value.filter((item) => item.duration >= slowThreshold).length
      return { total, success, failed, slow, avgDuration }
    })

    const slowestTrace = computed(() =>
      tableData.value.length ? tableData.value.reduce((max, item) => (item.duration > max.duration ? item : max)) : null
    )

    const traceHealthNote = computed(() => {
      if (!traceSummary.value.total) return '当前时间范围内暂无链路样本。'
      if (traceSummary.value.failed > 0) return '优先处理异常链路，并从详情抽屉跳转关联日志定位根因。'
      if (traceSummary.value.slow > 0)
        return `发现 ${traceSummary.value.slow} 条超过 ${slowThreshold}ms 的慢链路，建议检查耗时最长操作。`
      return '当前筛选范围内链路状态稳定，可继续缩小服务或操作范围排查。'
    })

    const activeFilters = computed(() => {
      const filters = [
        searchQuery.value.trim() ? `关键词：${searchQuery.value.trim()}` : '',
        selectedService.value ? `服务：${findOptionLabel(serviceOptions.value, selectedService.value)}` : '',
        selectedStatus.value ? `状态：${findOptionLabel(statusOptions, selectedStatus.value)}` : '',
        selectedEnv.value ? `环境：${selectedEnv.value}` : '',
        selectedOperation.value ? `操作：${selectedOperation.value}` : '',
        selectedDurationBucket.value ? `耗时：${findOptionLabel(durationOptions, selectedDurationBucket.value)}` : ''
      ]
      return filters.filter(Boolean)
    })

    const resetFilters = () => {
      searchQuery.value = ''
      selectedService.value = null
      selectedStatus.value = null
      selectedOperation.value = null
      selectedDurationBucket.value = null
      selectedEnv.value = null
      loadData()
    }

    const openSlowestTrace = () => {
      const trace = slowestTrace.value
      if (!trace) return
      openTrace(trace.traceId)
    }

    const durationBuckets = computed(() => {
      const buckets = [
        { name: '0-50ms', min: 0, max: 50 },
        { name: '50-100ms', min: 50, max: 100 },
        { name: '100-250ms', min: 100, max: 250 },
        { name: '250-500ms', min: 250, max: 500 },
        { name: '500ms+', min: 500, max: Number.POSITIVE_INFINITY }
      ]
      return buckets.map((bucket) => ({
        name: bucket.name,
        value: tableData.value.filter((item) => item.duration >= bucket.min && item.duration < bucket.max).length
      }))
    })

    const columns = [
      {
        title: '开始时间',
        key: 'startTime',
        render: (row: TraceSpan) => dayjs(row.startTime).format('HH:mm:ss.SSS')
      },
      {
        title: '服务',
        key: 'service',
        render: (row: TraceSpan) => (
          <NTag size="small" type="info" bordered={false}>
            {row.service}
          </NTag>
        )
      },
      {
        title: '操作',
        key: 'name'
      },
      {
        title: '耗时',
        key: 'duration',
        render: (row: TraceSpan) => `${row.duration}ms`
      },
      {
        title: '状态',
        key: 'status',
        render: (row: TraceSpan) => (
          <NTag type={row.status === 'ok' ? 'success' : 'error'} size="small" bordered={false}>
            {row.status === 'ok' ? '正常' : '异常'}
          </NTag>
        )
      },
      {
        title: 'Trace ID',
        key: 'traceId',
        render: (row: TraceSpan) => (
          <span
            class="trace-explorer-page__link-button"
            onClick={(e) => {
              e.stopPropagation()
              openTrace(row.traceId)
            }}>
            {row.traceId}
          </span>
        )
      }
    ]

    const drawerTraces = ref<TraceSpan[]>([])
    const drawerLoading = ref(false)

    const openTrace = async (traceId: string) => {
      selectedTraceId.value = traceId
      showDrawer.value = true
      selectedSpan.value = null
      drawerLoading.value = true

      try {
        const spans = await traceApi.getTraceDetails(traceId, {
          startTime: timeStore.startTime,
          endTime: timeStore.endTime,
          originType: traceOriginType
        })
        drawerTraces.value = spans.sort((a: TraceSpan, b: TraceSpan) => a.startTime - b.startTime)
      } catch (error) {
        message.error('加载链路详情失败')
      } finally {
        drawerLoading.value = false
      }
    }

    const rootSpan = computed(() => drawerTraces.value.find((s) => !s.parentId) || drawerTraces.value[0])

    const totalDuration = computed(() => {
      if (drawerTraces.value.length === 0) return 0
      const endTimes = drawerTraces.value.map((s) => s.startTime + s.duration)
      const minStartTime = Math.min(...drawerTraces.value.map((s) => s.startTime))
      return Math.max(...endTimes) - minStartTime
    })

    const drawerMeta = computed(() => {
      const services = new Set(drawerTraces.value.map((span) => span.service))
      const failed = drawerTraces.value.filter((span) => span.status !== 'ok').length
      return {
        spanCount: drawerTraces.value.length,
        serviceCount: services.size,
        failed
      }
    })

    const WaterfallItem = (props: { span: TraceSpan; depth: number; rootStart: number }) => {
      const relativeStart = props.span.startTime - props.rootStart
      const duration = totalDuration.value || 1

      const left = Math.max(0, (relativeStart / duration) * 100)
      const width = Math.max((props.span.duration / duration) * 100, 0.5)

      return (
        <div class="trace-explorer-page__waterfall-row" onClick={() => (selectedSpan.value = props.span)}>
          <div class="trace-explorer-page__waterfall-service">
            <div style={{ marginLeft: `${props.depth * 16}px` }} class="trace-explorer-page__waterfall-service-inner">
              <div
                class={[
                  'trace-explorer-page__waterfall-dot',
                  props.span.status === 'ok'
                    ? 'trace-explorer-page__waterfall-dot--ok'
                    : 'trace-explorer-page__waterfall-dot--error'
                ]}></div>
              <span class="trace-explorer-page__waterfall-service-name" title={props.span.service}>
                {props.span.service}
              </span>
            </div>
          </div>

          <div class="trace-explorer-page__waterfall-main">
            <div class="trace-explorer-page__waterfall-axis">
              <div class="trace-explorer-page__waterfall-axis-line"></div>
            </div>
            <div
              class={[
                'trace-explorer-page__waterfall-bar',
                props.span.status === 'ok'
                  ? 'trace-explorer-page__waterfall-bar--ok'
                  : 'trace-explorer-page__waterfall-bar--error'
              ]}
              style={{ '--waterfall-left': `${left}%`, '--waterfall-width': `${width}%` }}>
              <span
                class={[
                  'trace-explorer-page__waterfall-label',
                  props.span.status === 'ok' ? '' : 'trace-explorer-page__waterfall-label--error'
                ]}>
                {props.span.name} <span class="trace-explorer-page__waterfall-duration">({props.span.duration}ms)</span>
              </span>
            </div>
          </div>
        </div>
      )
    }

    const renderTree = (parentId?: string, depth = 0, rootStart = 0): any[] => {
      const children = drawerTraces.value
        .filter((s) => s.parentId === parentId)
        .sort((a, b) => a.startTime - b.startTime)

      if (depth === 0 && children.length === 0 && drawerTraces.value.length > 0) {
        const allIds = new Set(drawerTraces.value.map((s) => s.id))
        const roots = drawerTraces.value.filter((s) => !s.parentId || !allIds.has(s.parentId))
        return roots.flatMap((root) => [
          <WaterfallItem span={root} depth={0} rootStart={root.startTime} />,
          ...renderTree(root.id, 1, root.startTime)
        ])
      }

      return children.flatMap((child) => [
        <WaterfallItem span={child} depth={depth} rootStart={rootStart} />,
        ...renderTree(child.id, depth + 1, rootStart)
      ])
    }

    return () => (
      <div class="trace-explorer-page">
        <PageHeader title="链路追踪" subtitle="检索并分析分布式链路">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={loadData} loading={loading.value}>
                {{
                  icon: () => (
                    <NIcon>
                      <RefreshOutline />
                    </NIcon>
                  ),
                  default: () => '刷新链路'
                }}
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
            loadData()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadData()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadData()
          }}
        />

        <section class="trace-explorer-page__overview-grid">
          <NGrid cols={4} xGap={16} yGap={16} class="trace-explorer-page__summary-grid">
            {[
              { label: '链路总数', value: traceSummary.value.total, tone: 'total', hint: '去重后的 Trace 数' },
              { label: '正常链路', value: traceSummary.value.success, tone: 'success', hint: '状态为 ok' },
              { label: '异常链路', value: traceSummary.value.failed, tone: 'danger', hint: '需要优先排查' },
              { label: '平均耗时', value: `${traceSummary.value.avgDuration}ms`, tone: 'latency', hint: '当前筛选均值' }
            ].map((item) => (
              <NGridItem key={item.label}>
                <NCard
                  bordered={false}
                  class={['trace-explorer-page__summary-card', `trace-explorer-page__summary-card--${item.tone}`]}>
                  <div class="trace-explorer-page__summary-topline">
                    <span class="trace-explorer-page__summary-label">{item.label}</span>
                    <span class="trace-explorer-page__summary-pulse"></span>
                  </div>
                  <div class="trace-explorer-page__summary-value">{item.value}</div>
                  <div class="trace-explorer-page__summary-hint">{item.hint}</div>
                </NCard>
              </NGridItem>
            ))}
          </NGrid>

          <NCard class="trace-explorer-page__distribution-card" bordered={false}>
            <div class="trace-explorer-page__distribution-header">
              <div>
                <div class="trace-explorer-page__distribution-note">耗时分布</div>
                <div class="trace-explorer-page__distribution-desc">{traceHealthNote.value}</div>
              </div>
              {slowestTrace.value ? (
                <button class="trace-explorer-page__slowest-link" onClick={openSlowestTrace}>
                  最慢 {slowestTrace.value.duration}ms
                </button>
              ) : null}
            </div>
            {durationBuckets.value.some((item) => item.value > 0) ? (
              <BarChart data={durationBuckets.value as any} height="220px" variant="monitor" />
            ) : (
              <NEmpty description="暂无耗时分布数据" class="trace-explorer-page__empty-state" />
            )}
          </NCard>
        </section>

        <section class="trace-explorer-page__table-card">
          <div class="trace-explorer-page__table-header">
            <div>
              <div class="trace-explorer-page__section-title">链路检索</div>
              <div class="trace-explorer-page__section-desc">
                按 Trace ID、服务、操作、状态和耗时范围定位慢链路与异常链路。
              </div>
            </div>
            <NTag bordered={false} type={traceSummary.value.failed > 0 ? 'error' : 'success'}>
              {traceSummary.value.failed > 0 ? `${traceSummary.value.failed} 条异常` : '全部正常'}
            </NTag>
          </div>
          <div class="trace-explorer-page__filters">
            <NInput
              v-model:value={searchQuery.value}
              placeholder="搜索链路 ID"
              class="trace-explorer-page__input-wide"
              onKeyup={(e) => e.key === 'Enter' && loadData()}>
              {{ prefix: () => <NIcon component={SearchOutline} /> }}
            </NInput>
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions.value}
              placeholder="服务"
              clearable
              class="trace-explorer-page__select-service"
            />
            <NSelect
              v-model:value={selectedStatus.value}
              options={statusOptions}
              placeholder="状态"
              clearable
              class="trace-explorer-page__select-status"
            />
            <NSelect
              v-model:value={selectedEnv.value}
              options={envOptions.value}
              placeholder="环境"
              clearable
              class="trace-explorer-page__select-env"
            />
            <NSelect
              v-model:value={selectedOperation.value}
              options={operationOptions.value}
              placeholder="操作"
              clearable
              class="trace-explorer-page__select-operation"
            />
            <NSelect
              v-model:value={selectedDurationBucket.value}
              options={durationOptions}
              placeholder="耗时"
              clearable
              class="trace-explorer-page__select-duration"
            />
            <NButton secondary type="primary" onClick={loadData} loading={loading.value}>
              {{
                icon: () => (
                  <NIcon>
                    <RefreshOutline />
                  </NIcon>
                )
              }}
            </NButton>
            <NButton quaternary onClick={resetFilters} disabled={activeFilters.value.length === 0}>
              重置筛选
            </NButton>
          </div>

          <div class="trace-explorer-page__filter-strip">
            {activeFilters.value.length > 0 ? (
              activeFilters.value.map((filter) => (
                <NTag key={filter} size="small" bordered={false} type="info">
                  {filter}
                </NTag>
              ))
            ) : (
              <span class="trace-explorer-page__filter-placeholder">未设置筛选条件，展示当前时间范围内全部链路。</span>
            )}
          </div>

          <div class="trace-explorer-page__table-shell">
            <ResultTable
              columns={columns}
              data={tableData.value}
              loading={loading.value}
              maxHeight="max(360px, calc(100vh - 520px))"
              flexHeight={false}
              row-class-name="trace-explorer-page__row-hover"
              rowKey={(row: any) => row.traceId}
              rowProps={(row: any) => ({
                onClick: () => openTrace(row.traceId)
              })}
              class="trace-explorer-page__table"
            />
          </div>
        </section>

        <NDrawer v-model:show={showDrawer.value} width={800} placement="right">
          <NDrawerContent title={`链路：${selectedTraceId.value}`} closable>
            {drawerLoading.value ? (
              <div class="trace-explorer-page__drawer-loading">
                <NSpin size="large" />
              </div>
            ) : drawerTraces.value.length > 0 && rootSpan.value ? (
              <div class="trace-explorer-page__drawer-shell">
                <div class="trace-explorer-page__drawer-overview">
                  <div>
                    <span class="trace-explorer-page__drawer-overview-label">总耗时</span>
                    <strong>{totalDuration.value}ms</strong>
                  </div>
                  <div>
                    <span class="trace-explorer-page__drawer-overview-label">Span</span>
                    <strong>{drawerMeta.value.spanCount}</strong>
                  </div>
                  <div>
                    <span class="trace-explorer-page__drawer-overview-label">服务</span>
                    <strong>{drawerMeta.value.serviceCount}</strong>
                  </div>
                  <div>
                    <span class="trace-explorer-page__drawer-overview-label">异常</span>
                    <strong
                      class={
                        drawerMeta.value.failed > 0
                          ? 'trace-explorer-page__status-error'
                          : 'trace-explorer-page__status-ok'
                      }>
                      {drawerMeta.value.failed}
                    </strong>
                  </div>
                </div>
                <div class="trace-explorer-page__drawer-scale">
                  <div class="trace-explorer-page__drawer-scale-service">服务 / 操作</div>
                  <div class="trace-explorer-page__drawer-scale-main">
                    <div class="trace-explorer-page__drawer-scale-edge trace-explorer-page__drawer-scale-edge--left">
                      0ms
                    </div>
                    <div class="trace-explorer-page__drawer-scale-edge trace-explorer-page__drawer-scale-edge--right">
                      {totalDuration.value}ms
                    </div>
                  </div>
                </div>

                <div class="trace-explorer-page__drawer-tree">{renderTree(undefined, 0, rootSpan.value.startTime)}</div>

                {selectedSpan.value && (
                  <div class="trace-explorer-page__drawer-detail">
                    <h4 class="trace-explorer-page__drawer-title">{selectedSpan.value.name} 详情</h4>
                    <div class="trace-explorer-page__drawer-grid">
                      <div>
                        服务：<span class="trace-explorer-page__mono-value">{selectedSpan.value.service}</span>
                      </div>
                      <div>
                        耗时：<span class="trace-explorer-page__mono-value">{selectedSpan.value.duration}ms</span>
                      </div>
                      <div>
                        开始时间：
                        <span class="trace-explorer-page__mono-value">
                          {dayjs(selectedSpan.value.startTime).format('HH:mm:ss.SSS')}
                        </span>
                      </div>
                      <div>
                        状态：
                        <span
                          class={
                            selectedSpan.value.status === 'ok'
                              ? 'trace-explorer-page__status-ok'
                              : 'trace-explorer-page__status-error'
                          }>
                          {selectedSpan.value.status}
                        </span>
                      </div>
                    </div>

                    <div class="trace-explorer-page__drawer-actions">
                      <NButton
                        secondary
                        type="primary"
                        onClick={() => {
                          router.push({
                            path: '/home/investigate/logs',
                            query: {
                              service: selectedSpan.value?.service || selectedService.value || undefined,
                              keyword: selectedTraceId.value || undefined,
                              timeRange: timeStore.timeRange
                            }
                          })
                        }}>
                        查看关联日志
                      </NButton>
                    </div>

                    {selectedSpan.value.tags && Object.keys(selectedSpan.value.tags).length > 0 && (
                      <div class="trace-explorer-page__drawer-actions">
                        <h5 class="trace-explorer-page__drawer-title">Tags</h5>
                        <div class="trace-explorer-page__drawer-tags">
                          {Object.entries(selectedSpan.value.tags).map(([key, value]) => (
                            <NTag key={key} size="small" bordered={false}>
                              {key}: {String(value)}
                            </NTag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NEmpty description="No trace details found" class="trace-explorer-page__drawer-empty" />
            )}
          </NDrawerContent>
        </NDrawer>
      </div>
    )
  }
})
