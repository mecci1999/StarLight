import { defineComponent, ref, onActivated, computed, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  MobileButton,
  MobileCard,
  MobileTag,
  MobileEmpty,
  MobileLoading,
  MobileInput,
  MobileSelect,
  MobileSheet,
  MobileGrid
} from '@/mobile/ui'
import {
  PhArrowsClockwise,
  PhGitBranch,
  PhClock,
  PhWarningCircle,
  PhFunnel,
  PhMagnifyingGlass
} from '@phosphor-icons/vue'
import { searchTraces, getTraceDetails } from '@/api/trace'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import type { TraceSpan } from '@/types/monitor'
import { parseInvestigationContext, resolveInvestigationWindow } from '@/mobile/hooks/investigationContext'
import './MobileTraceExplorer.scss'

export default defineComponent({
  name: 'MobileTraceExplorer',
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const error = ref(false)
    const allTraces = ref<TraceSpan[]>([])
    const searchQuery = ref('')
    const selectedService = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)
    const selectedDurationBucket = ref<string | null>(null)
    const operationFilter = ref('')
    const serviceOptions = ref<{ label: string; value: string }[]>([])
    const pageSize = 20
    const visibleCount = ref(pageSize)
    const hasMore = computed(() => visibleCount.value < filteredTraces.value.length)

    // ---- Span detail drawer state ----
    const showDrawer = ref(false)
    const drawerLoading = ref(false)
    const drawerError = ref(false)
    const drawerTraces = ref<TraceSpan[]>([])
    const selectedSpan = ref<TraceSpan | null>(null)
    const selectedTraceId = ref('')

    const statusOptions = [
      { label: '全部状态', value: '' },
      { label: '正常', value: 'ok' },
      { label: '异常', value: 'error' }
    ]

    const durationBuckets = [
      { label: '全部耗时', value: '' },
      { label: '快 (<100ms)', value: 'fast' },
      { label: '中 (100-500ms)', value: 'medium' },
      { label: '慢 (500ms-1s)', value: 'slow' },
      { label: '非常慢 (>1s)', value: 'very-slow' }
    ]

    const normalizeServiceName = (value?: string | null) => {
      const raw = String(value || '').trim()
      return raw.startsWith('system:') ? raw.slice('system:'.length) : raw
    }

    const loadServiceOptions = async () => {
      try {
        const res: unknown = await fetchCatalogServices({
          page: 1,
          pageSize: 200,
          scope: 'tenant' satisfies MetricsDatasetScope
        })
        const items = isRecord(res) && Array.isArray(res.items) ? res.items : []
        serviceOptions.value = items.flatMap((item) => {
          if (!isRecord(item) || !isRecord(item.identity)) return []
          const id = item.identity.id
          const name = item.identity.name
          const label = typeof name === 'string' ? name : typeof id === 'string' ? id : ''
          return label ? [{ label, value: normalizeServiceName(label) }] : []
        })
      } catch {
        serviceOptions.value = []
      }
    }

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value)

    const buildSearchParams = () => {
      const context = parseInvestigationContext(route.query)
      const params: Record<string, unknown> = {
        limit: 100
      }
      const q = searchQuery.value.trim()
      if (q) {
        if (q.length === 32 || q.length === 16) {
          params.traceId = q
        } else {
          params.service = q
        }
      }
      if (selectedService.value) {
        params.service = normalizeServiceName(selectedService.value)
      }
      if (context.serviceName) params.service = context.serviceName
      const window = resolveInvestigationWindow(context)
      if (window) {
        params.startTime = window.start
        params.endTime = window.end
      }
      return params
    }

    const loadTraces = async () => {
      loading.value = true
      error.value = false
      try {
        const res = await searchTraces(buildSearchParams())
        const raw = Array.isArray(res) ? res : []
        const traceMap = new Map<string, TraceSpan>()
        raw.forEach((span: TraceSpan) => {
          if (!traceMap.has(span.traceId) || (!span.parentId && traceMap.get(span.traceId)?.parentId)) {
            traceMap.set(span.traceId, span)
          }
        })
        allTraces.value = Array.from(traceMap.values()).sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0))
        visibleCount.value = pageSize
      } catch {
        error.value = true
      } finally {
        loading.value = false
      }
    }

    onActivated(() => {
      const context = parseInvestigationContext(route.query)
      if (context.serviceName) selectedService.value = context.serviceName
      loadServiceOptions()
      loadTraces()
    })

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.serviceName !== undefined) selectedService.value = context.serviceName
        if (context.serviceName !== undefined || context.range !== undefined || context.start !== undefined)
          void loadTraces()
      }
    )

    const filteredTraces = computed(() => {
      let result = allTraces.value

      if (selectedStatus.value) {
        result = result.filter((t) => t.status === selectedStatus.value)
      }

      if (operationFilter.value.trim()) {
        const opQ = operationFilter.value.trim().toLowerCase()
        result = result.filter((t) => (t.name || '').toLowerCase().includes(opQ))
      }

      if (selectedDurationBucket.value) {
        result = result.filter((t) => {
          const d = t.duration ?? 0
          switch (selectedDurationBucket.value) {
            case 'fast':
              return d < 100
            case 'medium':
              return d >= 100 && d < 500
            case 'slow':
              return d >= 500 && d < 1000
            case 'very-slow':
              return d >= 1000
            default:
              return true
          }
        })
      }

      return result
    })

    const displayTraces = computed(() => filteredTraces.value.slice(0, visibleCount.value))

    const loadMore = () => {
      visibleCount.value = Math.min(visibleCount.value + pageSize, filteredTraces.value.length)
    }

    const resetFilters = () => {
      selectedService.value = null
      selectedStatus.value = null
      selectedDurationBucket.value = null
      operationFilter.value = ''
      searchQuery.value = ''
      loadTraces()
    }

    const hasActiveFilters = computed(
      () =>
        selectedService.value || selectedStatus.value || selectedDurationBucket.value || operationFilter.value.trim()
    )

    // ---- Stats ----
    const stats = computed(() => {
      const total = filteredTraces.value.length
      const healthy = filteredTraces.value.filter((t) => t.status === 'ok').length
      const errorCount = filteredTraces.value.filter((t) => t.status !== 'ok').length
      const avgDuration =
        total > 0 ? Math.round(filteredTraces.value.reduce((sum, t) => sum + (t.duration ?? 0), 0) / total) : 0
      return { total, healthy, errorCount, avgDuration }
    })

    // ---- Helpers ----
    const statusTagType = (status: string): 'success' | 'danger' | 'default' => {
      return status === 'ok' ? 'success' : status === 'error' ? 'danger' : 'default'
    }

    const statusLabel = (status: string): string => {
      return status === 'ok' ? '正常' : status === 'error' ? '异常' : status || '未知'
    }

    // ---- Span Detail Drawer ----
    const openTrace = async (traceId: string) => {
      selectedTraceId.value = traceId
      showDrawer.value = true
      selectedSpan.value = null
      drawerLoading.value = true
      drawerError.value = false
      try {
        const window = resolveInvestigationWindow(parseInvestigationContext(route.query))
        const spans = await getTraceDetails(
          traceId,
          window ? { startTime: window.start, endTime: window.end } : undefined
        )
        drawerTraces.value = spans.sort((a: TraceSpan, b: TraceSpan) => (a.startTime ?? 0) - (b.startTime ?? 0))
      } catch {
        drawerTraces.value = []
        drawerError.value = true
      } finally {
        drawerLoading.value = false
      }
    }

    const closeDrawer = () => {
      showDrawer.value = false
      selectedSpan.value = null
      drawerTraces.value = []
    }

    const drawerMeta = computed(() => {
      const services = new Set(drawerTraces.value.map((s) => s.service))
      const failed = drawerTraces.value.filter((s) => s.status !== 'ok').length
      return {
        spanCount: drawerTraces.value.length,
        serviceCount: services.size,
        failed
      }
    })

    const rootSpan = computed(() => drawerTraces.value.find((s) => !s.parentId) || drawerTraces.value[0])

    const totalDuration = computed(() => {
      if (drawerTraces.value.length === 0) return 0
      const ends = drawerTraces.value.map((s) => (s.startTime ?? 0) + (s.duration ?? 0))
      const starts = drawerTraces.value.map((s) => s.startTime ?? 0)
      return Math.max(...ends) - Math.min(...starts)
    })

    const formatTime = (ts?: number) => {
      if (!ts) return '-'
      const d = new Date(ts)
      return d.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
    }

    return () => (
      <div class="mobile-trace-explorer">
        {/* ── Header ── */}
        <div class="mobile-trace-explorer__header">
          <div>
            <h2 class="mobile-trace-explorer__title">链路追踪</h2>
          </div>
          <MobileButton
            size="small"
            type="primary"
            class="mobile-trace-explorer__refresh-action"
            onClick={loadTraces}
            loading={loading.value}
            aria-label="刷新链路数据">
            {h(PhArrowsClockwise, { size: 16 })}
          </MobileButton>
        </div>

        {/* ── Stats Grid ── */}
        <div class="mobile-trace-explorer__stats">
          <MobileGrid cols={4} gap="var(--spacing-2)">
            <div>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--total">
                  {h(PhGitBranch, { size: 16 })}
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.total}</div>
                <div class="mobile-trace-explorer__stat-label">总数</div>
              </div>
            </div>
            <div>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--healthy">
                  {h(PhGitBranch, { size: 16 })}
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.healthy}</div>
                <div class="mobile-trace-explorer__stat-label">正常</div>
              </div>
            </div>
            <div>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--duration">
                  {h(PhClock, { size: 16 })}
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.avgDuration}ms</div>
                <div class="mobile-trace-explorer__stat-label">平均耗时</div>
              </div>
            </div>
            <div>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--error">
                  {h(PhWarningCircle, { size: 16 })}
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.errorCount}</div>
                <div class="mobile-trace-explorer__stat-label">异常</div>
              </div>
            </div>
          </MobileGrid>
        </div>

        {/* ── Filters ── */}
        <div class="mobile-trace-explorer__filters">
          <div class="mobile-trace-explorer__filter-header">
            <div class="mobile-trace-explorer__filter-header-left">
              {h(PhFunnel, { size: 14 })}
              <span>筛选</span>
            </div>
            {hasActiveFilters.value ? (
              <MobileButton size="small" onClick={resetFilters}>
                重置
              </MobileButton>
            ) : null}
          </div>

          <div class="mobile-trace-explorer__filter-body">
            <MobileSelect
              modelValue={selectedService.value ?? ''}
              onUpdate:modelValue={(value) => {
                selectedService.value = value ? String(value) : null
              }}
              options={serviceOptions.value}
              placeholder="选择服务"
              clearable
              class="mobile-trace-explorer__filter-select"
            />
            <div class="mobile-trace-explorer__filter-chips">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  class={[
                    'mobile-trace-explorer__filter-chip',
                    selectedStatus.value === opt.value
                      ? 'mobile-trace-explorer__filter-chip--active'
                      : selectedStatus.value
                        ? 'mobile-trace-explorer__filter-chip--dimmed'
                        : ''
                  ]}
                  onClick={() => {
                    selectedStatus.value = selectedStatus.value === opt.value ? null : opt.value
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div class="mobile-trace-explorer__filter-chips">
              {durationBuckets.map((bucket) => (
                <button
                  key={bucket.value}
                  class={[
                    'mobile-trace-explorer__filter-chip',
                    selectedDurationBucket.value === bucket.value
                      ? 'mobile-trace-explorer__filter-chip--active'
                      : selectedDurationBucket.value
                        ? 'mobile-trace-explorer__filter-chip--dimmed'
                        : ''
                  ]}
                  onClick={() => {
                    selectedDurationBucket.value = selectedDurationBucket.value === bucket.value ? null : bucket.value
                  }}>
                  {bucket.label}
                </button>
              ))}
            </div>
            <MobileInput
              modelValue={operationFilter.value}
              onUpdate:modelValue={(value) => {
                operationFilter.value = String(value)
              }}
              placeholder="按操作名称过滤..."
              clearable
              class="mobile-trace-explorer__filter-input">
              {{
                prefix: () => h(PhMagnifyingGlass, { size: 14 })
              }}
            </MobileInput>
          </div>
        </div>

        {/* ── Keyword Search ── */}
        <div class="mobile-trace-explorer__search">
          <MobileInput
            modelValue={searchQuery.value}
            onUpdate:modelValue={(value) => {
              const nextValue = String(value)
              const shouldReload = searchQuery.value.length > 0 && nextValue.length === 0
              searchQuery.value = nextValue
              if (shouldReload) loadTraces()
            }}
            placeholder="搜索 Trace ID 或服务名..."
            clearable
            onEnter={loadTraces}>
            {{
              prefix: () => h(PhMagnifyingGlass, { size: 14 })
            }}
          </MobileInput>
          {searchQuery.value.trim() ? (
            <MobileButton
              size="small"
              class="mobile-trace-explorer__search-btn"
              onClick={() => {
                loadTraces()
              }}>
              搜索
            </MobileButton>
          ) : null}
        </div>

        {/* ── Content ── */}
        {loading.value ? (
          <div class="mobile-trace-explorer__loading">
            <MobileLoading loading={true} size="large" />
          </div>
        ) : error.value ? (
          <MobileEmpty description="数据加载失败" class="mobile-trace-explorer__error">
            {{
              action: () => (
                <MobileButton type="primary" size="small" onClick={loadTraces}>
                  重新加载
                </MobileButton>
              )
            }}
          </MobileEmpty>
        ) : (
          <>
            {displayTraces.value.length === 0 ? (
              <div class="mobile-trace-explorer__empty-state">
                <MobileEmpty description="暂无链路数据" />
              </div>
            ) : (
              <>
                <div class="mobile-trace-explorer__list">
                  {displayTraces.value.map((trace) => (
                    <div
                      key={trace.id || trace.traceId}
                      class="mobile-trace-explorer__list-card-wrapper"
                      role="button"
                      tabindex="0"
                      aria-label={`查看链路详情：${trace.traceId || trace.name || '未知链路'}`}
                      onClick={() => openTrace(trace.traceId)}>
                      <MobileCard size="small" bordered={false} class="mobile-trace-explorer__list-card">
                        <div class="mobile-trace-explorer__card-header">
                          <span class="mobile-trace-explorer__card-time">{formatTime(trace.startTime)}</span>
                          <div class="mobile-trace-explorer__card-header-right">
                            <MobileTag size="small" type={statusTagType(trace.status)}>
                              {statusLabel(trace.status)}
                            </MobileTag>
                          </div>
                        </div>
                        <div class="mobile-trace-explorer__card-main">
                          <div class="mobile-trace-explorer__card-service">{trace.service || '-'}</div>
                          <div class="mobile-trace-explorer__card-operation">{trace.name || '-'}</div>
                        </div>
                        <div class="mobile-trace-explorer__card-footer">
                          <span class="mobile-trace-explorer__card-duration">耗时: {trace.duration ?? '-'}ms</span>
                          <span class="mobile-trace-explorer__card-trace-id">
                            {trace.traceId ? trace.traceId.slice(0, 16) + '...' : '-'}
                          </span>
                        </div>
                      </MobileCard>
                    </div>
                  ))}
                </div>

                {/* ── Infinite Scroll Pagination ── */}
                {hasMore.value ? (
                  <div class="mobile-trace-explorer__pagination">
                    <MobileButton block size="small" onClick={loadMore} class="mobile-trace-explorer__load-more">
                      加载更多 ({visibleCount.value}/{filteredTraces.value.length})
                    </MobileButton>
                  </div>
                ) : null}
              </>
            )}

            {/* ── Span Detail Bottom Sheet ── */}
            <MobileSheet
              show={showDrawer.value}
              onUpdate:show={(val: boolean) => {
                if (val) showDrawer.value = true
                else closeDrawer()
              }}
              position="bottom"
              class="mobile-trace-explorer__drawer"
              title={`链路详情 - ${selectedTraceId.value ? selectedTraceId.value.slice(0, 16) + '...' : ''}`}>
              {drawerLoading.value ? (
                <div class="mobile-trace-explorer__drawer-loading">
                  <MobileLoading loading={true} size="medium" />
                </div>
              ) : drawerTraces.value.length > 0 && rootSpan.value ? (
                <div class="mobile-trace-explorer__drawer-content">
                  {/* Overview */}
                  <div class="mobile-trace-explorer__drawer-meta">
                    <div class="mobile-trace-explorer__drawer-meta-item">
                      <span class="mobile-trace-explorer__drawer-meta-label">总耗时</span>
                      <strong>{totalDuration.value}ms</strong>
                    </div>
                    <div class="mobile-trace-explorer__drawer-meta-item">
                      <span class="mobile-trace-explorer__drawer-meta-label">Span</span>
                      <strong>{drawerMeta.value.spanCount}</strong>
                    </div>
                    <div class="mobile-trace-explorer__drawer-meta-item">
                      <span class="mobile-trace-explorer__drawer-meta-label">服务</span>
                      <strong>{drawerMeta.value.serviceCount}</strong>
                    </div>
                    <div class="mobile-trace-explorer__drawer-meta-item">
                      <span class="mobile-trace-explorer__drawer-meta-label">异常</span>
                      <strong
                        class={
                          drawerMeta.value.failed > 0
                            ? 'mobile-trace-explorer__drawer-meta-error'
                            : 'mobile-trace-explorer__drawer-meta-ok'
                        }>
                        {drawerMeta.value.failed}
                      </strong>
                    </div>
                  </div>

                  {/* Span list */}
                  <div class="mobile-trace-explorer__drawer-spans">
                    {drawerTraces.value.map((span) => (
                      <div
                        key={span.id}
                        class={[
                          'mobile-trace-explorer__drawer-span',
                          selectedSpan.value?.id === span.id ? 'mobile-trace-explorer__drawer-span--selected' : ''
                        ]}
                        onClick={() => {
                          selectedSpan.value = selectedSpan.value?.id === span.id ? null : span
                        }}
                        role="button"
                        tabindex="0"
                        aria-expanded={selectedSpan.value?.id === span.id}
                        aria-label={`查看 Span 详情：${span.name || span.service || span.id}`}
                        onKeydown={(event: KeyboardEvent) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectedSpan.value = selectedSpan.value?.id === span.id ? null : span
                          }
                        }}>
                        <div class="mobile-trace-explorer__drawer-span-header">
                          <div
                            class={[
                              'mobile-trace-explorer__drawer-span-dot',
                              span.status === 'ok'
                                ? 'mobile-trace-explorer__drawer-span-dot--ok'
                                : 'mobile-trace-explorer__drawer-span-dot--error'
                            ]}></div>
                          <span class="mobile-trace-explorer__drawer-span-service">{span.service}</span>
                          <span class="mobile-trace-explorer__drawer-span-duration">{span.duration}ms</span>
                        </div>
                        <div class="mobile-trace-explorer__drawer-span-name">{span.name}</div>

                        {/* Expanded detail */}
                        {selectedSpan.value?.id === span.id ? (
                          <div class="mobile-trace-explorer__drawer-span-detail">
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">Trace ID</span>
                              <span class="mobile-trace-explorer__drawer-span-field-value">{span.traceId}</span>
                            </div>
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">服务</span>
                              <span class="mobile-trace-explorer__drawer-span-field-value">{span.service}</span>
                            </div>
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">操作</span>
                              <span class="mobile-trace-explorer__drawer-span-field-value">{span.name}</span>
                            </div>
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">耗时</span>
                              <span class="mobile-trace-explorer__drawer-span-field-value">{span.duration}ms</span>
                            </div>
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">状态</span>
                              <span
                                class={[
                                  'mobile-trace-explorer__drawer-span-field-value',
                                  span.status === 'ok'
                                    ? 'mobile-trace-explorer__drawer-span-field-value--ok'
                                    : 'mobile-trace-explorer__drawer-span-field-value--error'
                                ]}>
                                {span.status}
                              </span>
                            </div>
                            <div class="mobile-trace-explorer__drawer-span-field">
                              <span class="mobile-trace-explorer__drawer-span-field-label">开始时间</span>
                              <span class="mobile-trace-explorer__drawer-span-field-value">
                                {formatTime(span.startTime)}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : drawerError.value ? (
                <MobileEmpty description="链路详情加载失败" class="mobile-trace-explorer__drawer-empty">
                  {{
                    action: () => (
                      <MobileButton type="primary" size="small" onClick={() => openTrace(selectedTraceId.value)}>
                        重试
                      </MobileButton>
                    )
                  }}
                </MobileEmpty>
              ) : (
                <MobileEmpty description="暂无链路详情" class="mobile-trace-explorer__drawer-empty" />
              )}
            </MobileSheet>
          </>
        )}
      </div>
    )
  }
})
