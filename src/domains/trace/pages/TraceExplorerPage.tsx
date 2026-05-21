import { defineComponent, ref, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NTag,
  NSpin,
  NEmpty,
  NDrawer,
  NDrawerContent,
  NButton,
  NSpace,
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

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200 })
        const items = Array.isArray(res?.items) ? res.items : []
        serviceOptions.value = items
          .filter((item: any) => !selectedEnv.value || item.identity?.env === selectedEnv.value)
          .map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: item.identity?.id || ''
          }))
        serviceEnvMap.value = Object.fromEntries(
          items.map((item: any) => [item.identity?.id || '', item.identity?.env || ''])
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

    const loadData = async () => {
      loading.value = true
      try {
        const res = await traceApi.searchTraces({
          startTime: timeStore.startTime,
          endTime: timeStore.endTime,
          service: selectedService.value || undefined,
          traceId: searchQuery.value || undefined,
          limit: 100
        })

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
        selectedService.value = routeService
      }
      loadServiceOptions()
      loadData()
    })

    const tableData = computed(() => {
      let filtered = traces.value

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (s) => s.traceId.includes(q) || s.service.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
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

    const traceSummary = computed(() => {
      const total = tableData.value.length
      const success = tableData.value.filter((item) => item.status === 'ok').length
      const failed = tableData.value.filter((item) => item.status !== 'ok').length
      const avgDuration = total ? Math.round(tableData.value.reduce((sum, item) => sum + item.duration, 0) / total) : 0
      return { total, success, failed, avgDuration }
    })

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
        const spans = await traceApi.getTraceDetails(traceId)
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
        <PageHeader title="链路追踪" subtitle="检索并分析分布式链路" />
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

        <NGrid cols={4} xGap={16} class="trace-explorer-page__summary-grid">
          {[
            { label: '链路总数', value: traceSummary.value.total },
            { label: '正常链路', value: traceSummary.value.success },
            { label: '异常链路', value: traceSummary.value.failed },
            { label: '平均耗时', value: `${traceSummary.value.avgDuration}ms` }
          ].map((item) => (
            <NGridItem key={item.label}>
              <NCard bordered={false} class="trace-explorer-page__summary-card">
                <div class="trace-explorer-page__summary-label">{item.label}</div>
                <div class="trace-explorer-page__summary-value">{item.value}</div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>

        <NCard class="trace-explorer-page__distribution-card" bordered={false}>
          <div class="trace-explorer-page__distribution-note">耗时分布</div>
          {durationBuckets.value.some((item) => item.value > 0) ? (
            <BarChart data={durationBuckets.value as any} height="220px" variant="monitor" />
          ) : (
            <NEmpty description="暂无耗时分布数据" class="trace-explorer-page__empty-state" />
          )}
        </NCard>

        <NCard
          class="trace-explorer-page__table-card"
          contentStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              options={[
                { label: '正常', value: 'ok' },
                { label: '异常', value: 'error' }
              ]}
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
          </div>

          <ResultTable
            columns={columns}
            data={tableData.value}
            loading={loading.value}
            row-class-name="trace-explorer-page__row-hover"
            rowKey={(row: any) => row.traceId}
            rowProps={(row: any) => ({
              onClick: () => openTrace(row.traceId)
            })}
            class="trace-explorer-page__table"
          />
        </NCard>

        <NDrawer v-model:show={showDrawer.value} width={800} placement="right">
          <NDrawerContent title={`链路：${selectedTraceId.value}`} closable>
            {drawerLoading.value ? (
              <div class="trace-explorer-page__drawer-loading">
                <NSpin size="large" />
              </div>
            ) : drawerTraces.value.length > 0 && rootSpan.value ? (
              <div class="trace-explorer-page__drawer-shell">
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
