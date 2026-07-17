import { defineComponent, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NEmpty,
  NSpin,
  NTag,
  NInput,
  NResult,
  NIcon,
  NGrid,
  NGridItem,
  NSelect,
  NModal
} from 'naive-ui'
import {
  PhArrowsClockwise,
  PhGitBranch,
  PhClock,
  PhWarningCircle,
  PhFunnel,
  PhMagnifyingGlass
} from '@phosphor-icons/vue'
import { searchTraces, getTraceDetails } from '@/api/trace'
import { fetchCatalogServices } from '@/api/metrics'
import type { TraceSpan } from '@/types/monitor'
import './MobileTraceExplorer.scss'

export default defineComponent({
  name: 'MobileTraceExplorer',
  setup() {
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
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: 'tenant' as any })
        const items = Array.isArray((res as any)?.items) ? (res as any).items : []
        serviceOptions.value = items.map((item: any) => ({
          label: item.identity?.name || item.identity?.id,
          value: normalizeServiceName(item.identity?.name || item.identity?.id)
        }))
      } catch {
        serviceOptions.value = []
      }
    }

    const buildSearchParams = () => {
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

    onMounted(() => {
      loadServiceOptions()
      loadTraces()
    })

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
    const statusTagType = (status: string): 'success' | 'error' | 'default' => {
      return status === 'ok' ? 'success' : status === 'error' ? 'error' : 'default'
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
      try {
        const spans = await getTraceDetails(traceId)
        drawerTraces.value = spans.sort((a: TraceSpan, b: TraceSpan) => (a.startTime ?? 0) - (b.startTime ?? 0))
      } catch {
        drawerTraces.value = []
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
          <NButton size="small" secondary type="primary" onClick={loadTraces} loading={loading.value}>
            <NIcon>
              <PhArrowsClockwise />
            </NIcon>
          </NButton>
        </div>

        {/* ── Stats Grid ── */}
        <div class="mobile-trace-explorer__stats">
          <NGrid cols={4} xGap={8} yGap={8}>
            <NGridItem>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--total">
                  <NIcon>
                    <PhGitBranch size={16} />
                  </NIcon>
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.total}</div>
                <div class="mobile-trace-explorer__stat-label">总数</div>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--healthy">
                  <NIcon>
                    <PhGitBranch size={16} />
                  </NIcon>
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.healthy}</div>
                <div class="mobile-trace-explorer__stat-label">正常</div>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--duration">
                  <NIcon>
                    <PhClock size={16} />
                  </NIcon>
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.avgDuration}ms</div>
                <div class="mobile-trace-explorer__stat-label">平均耗时</div>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="mobile-trace-explorer__stat-card">
                <div class="mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--error">
                  <NIcon>
                    <PhWarningCircle size={16} />
                  </NIcon>
                </div>
                <div class="mobile-trace-explorer__stat-value">{stats.value.errorCount}</div>
                <div class="mobile-trace-explorer__stat-label">异常</div>
              </div>
            </NGridItem>
          </NGrid>
        </div>

        {/* ── Filters ── */}
        <div class="mobile-trace-explorer__filters">
          <div class="mobile-trace-explorer__filter-header">
            <div class="mobile-trace-explorer__filter-header-left">
              <NIcon>
                <PhFunnel size={14} />
              </NIcon>
              <span>筛选</span>
            </div>
            {hasActiveFilters.value ? (
              <NButton text size="tiny" onClick={resetFilters}>
                重置
              </NButton>
            ) : null}
          </div>

          <div class="mobile-trace-explorer__filter-body">
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions.value}
              placeholder="选择服务"
              clearable
              size="small"
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
            <NInput
              v-model:value={operationFilter.value}
              placeholder="按操作名称过滤..."
              clearable
              size="small"
              class="mobile-trace-explorer__filter-input">
              {{
                prefix: () => (
                  <NIcon>
                    <PhMagnifyingGlass size={14} />
                  </NIcon>
                )
              }}
            </NInput>
          </div>
        </div>

        {/* ── Keyword Search ── */}
        <div class="mobile-trace-explorer__search">
          <NInput
            v-model:value={searchQuery.value}
            placeholder="搜索 Trace ID 或服务名..."
            clearable
            size="small"
            onClear={loadTraces}
            onKeydown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') loadTraces()
            }}>
            {{
              prefix: () => <NIcon component={PhMagnifyingGlass} size={14} />
            }}
          </NInput>
          {searchQuery.value.trim() ? (
            <NButton
              text
              size="tiny"
              class="mobile-trace-explorer__search-btn"
              onClick={() => {
                loadTraces()
              }}>
              搜索
            </NButton>
          ) : null}
        </div>

        {/* ── Content ── */}
        {loading.value ? (
          <div class="mobile-trace-explorer__loading">
            <NSpin size="large" />
          </div>
        ) : error.value ? (
          <NResult
            status="500"
            title="数据加载失败"
            description="请检查网络连接后重试"
            class="mobile-trace-explorer__error">
            {{
              footer: () => (
                <NButton type="primary" size="small" onClick={loadTraces}>
                  重新加载
                </NButton>
              )
            }}
          </NResult>
        ) : (
          <>
            {displayTraces.value.length === 0 ? (
              <div class="mobile-trace-explorer__empty-state">
                <NEmpty description="暂无链路数据" />
              </div>
            ) : (
              <>
                <div class="mobile-trace-explorer__list">
                  {displayTraces.value.map((trace) => (
                    <div
                      key={trace.id || trace.traceId}
                      class="mobile-trace-explorer__list-card-wrapper"
                      onClick={() => openTrace(trace.traceId)}>
                      <NCard size="small" bordered={false} class="mobile-trace-explorer__list-card">
                        <div class="mobile-trace-explorer__card-header">
                          <span class="mobile-trace-explorer__card-time">{formatTime(trace.startTime)}</span>
                          <div class="mobile-trace-explorer__card-header-right">
                            <NTag size="tiny" bordered={false} type={statusTagType(trace.status)}>
                              {statusLabel(trace.status)}
                            </NTag>
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
                      </NCard>
                    </div>
                  ))}
                </div>

                {/* ── Infinite Scroll Pagination ── */}
                {hasMore.value ? (
                  <div class="mobile-trace-explorer__pagination">
                    <NButton quaternary block size="small" onClick={loadMore} class="mobile-trace-explorer__load-more">
                      加载更多 ({visibleCount.value}/{filteredTraces.value.length})
                    </NButton>
                  </div>
                ) : null}
              </>
            )}

            {/* ── Span Detail Bottom Sheet ── */}
            <NModal
              v-model:show={showDrawer.value}
              preset="card"
              class="mobile-trace-explorer__drawer"
              title={`链路详情 - ${selectedTraceId.value ? selectedTraceId.value.slice(0, 16) + '...' : ''}`}
              closable
              onClose={closeDrawer}
              onMaskClick={closeDrawer}>
              {drawerLoading.value ? (
                <div class="mobile-trace-explorer__drawer-loading">
                  <NSpin size="medium" />
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
              ) : (
                <NEmpty description="暂无链路详情" class="mobile-trace-explorer__drawer-empty" />
              )}
            </NModal>
          </>
        )}
      </div>
    )
  }
})
