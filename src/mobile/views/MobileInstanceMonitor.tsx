import { defineComponent, ref, onActivated, computed, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  MobileButton,
  MobileCard,
  MobileTag,
  MobileEmpty,
  MobileLoading,
  MobileSelect,
  MobileGrid,
  MobileProgress,
  MobileDataTable
} from '@/mobile/ui'
import {
  PhArrowsClockwise,
  PhHardDrive,
  PhActivity,
  PhWarningCircle,
  PhGauge,
  PhSquaresFour,
  PhList
} from '@phosphor-icons/vue'
import { fetchCatalogServices, fetchServiceInstances } from '@/api'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import type { ServiceInstance } from '@/types/monitor'
import { parseInvestigationContext } from '@/mobile/hooks/investigationContext'
import './MobileInstanceMonitor.scss'

type SortKey = 'id' | 'status' | 'node' | 'cpu' | 'memory' | 'startTime'
type SortDir = 'asc' | 'desc'

export default defineComponent({
  name: 'MobileInstanceMonitor',
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const error = ref(false)
    const instances = ref<ServiceInstance[]>([])
    const services = ref<{ label: string; value: string }[]>([])
    const servicesError = ref(false)
    const selectedServiceId = ref<string | null>(null)
    const viewMode = ref<'card' | 'table'>('card')
    const sortKey = ref<SortKey>('id')
    const sortDir = ref<SortDir>('asc')

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

    const loadInstances = async () => {
      loading.value = true
      error.value = false
      try {
        if (!selectedServiceId.value) {
          instances.value = []
          return
        }
        const res = await fetchServiceInstances(selectedServiceId.value, { scope: getPreferredMetricsDatasetScope() })
        instances.value = Array.isArray(res) ? res : []
      } catch {
        error.value = true
        instances.value = []
      } finally {
        loading.value = false
      }
    }

    const sortedInstances = computed(() => {
      const list = [...instances.value]
      const dir = sortDir.value === 'asc' ? 1 : -1
      list.sort((a, b) => {
        const key = sortKey.value
        if (key === 'cpu' || key === 'memory') {
          const aVal = typeof a[key] === 'number' ? a[key] : 0
          const bVal = typeof b[key] === 'number' ? b[key] : 0
          return (aVal - bVal) * dir
        }
        const aVal = (a[key] ?? '').toString().toLowerCase()
        const bVal = (b[key] ?? '').toString().toLowerCase()
        if (aVal < bVal) return -1 * dir
        if (aVal > bVal) return 1 * dir
        return 0
      })
      return list
    })

    const toggleSort = (key: SortKey) => {
      if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortKey.value = key
        sortDir.value = 'asc'
      }
    }

    const sortIndicator = (key: SortKey) => {
      if (sortKey.value !== key) return ''
      return sortDir.value === 'asc' ? ' ↑' : ' ↓'
    }

    const stats = computed(() => {
      const total = instances.value.length
      const running = instances.value.filter((i) => i.status === 'running').length
      const errorCount = instances.value.filter((i) => i.status === 'error').length
      const avgCpu =
        total > 0
          ? Math.round(instances.value.reduce((sum, i) => sum + (typeof i.cpu === 'number' ? i.cpu : 0), 0) / total)
          : 0
      return { total, running, error: errorCount, avgCpu }
    })

    onActivated(async () => {
      const context = parseInvestigationContext(route.query)
      if (context.serviceId) selectedServiceId.value = context.serviceId
      await loadServices()
      if (selectedServiceId.value) await loadInstances()
    })

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.serviceId !== undefined) {
          selectedServiceId.value = context.serviceId
          void loadInstances()
        }
      }
    )

    const statusTagType = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
      switch (status) {
        case 'running':
          return 'success'
        case 'error':
          return 'danger'
        default:
          return 'default'
      }
    }

    const statusLabel = (status: string): string => {
      switch (status) {
        case 'running':
          return '运行中'
        case 'error':
          return '异常'
        default:
          return status || '未知'
      }
    }

    const tableColumns = [
      {
        label: '实例ID',
        key: 'id',
        render(_value: unknown, row: Record<string, unknown>) {
          return <span class="mobile-instance-monitor__table-mono">{String(row.id ?? '-')}</span>
        }
      },
      {
        label: '状态',
        key: 'status',
        render(_value: unknown, row: Record<string, unknown>) {
          const status = String(row.status ?? '')
          return (
            <MobileTag size="small" type={statusTagType(status)}>
              {statusLabel(status)}
            </MobileTag>
          )
        }
      },
      {
        label: '节点',
        key: 'node'
      },
      {
        label: 'CPU',
        key: 'cpu',
        render(value: unknown) {
          const val = typeof value === 'number' ? value : 0
          return <span class="mobile-instance-monitor__table-metric">{val}%</span>
        }
      },
      {
        label: '内存',
        key: 'memory',
        render(value: unknown) {
          const val = typeof value === 'number' ? value : 0
          return <span class="mobile-instance-monitor__table-metric">{val}%</span>
        }
      },
      {
        label: '启动时间',
        key: 'startTime',
        render(value: unknown) {
          return <span class="mobile-instance-monitor__table-time">{String(value || '-')}</span>
        }
      }
    ]

    return () => (
      <div class="mobile-instance-monitor">
        <div class="mobile-instance-monitor__header">
          <div>
            <h2 class="mobile-instance-monitor__title">实例监控</h2>
          </div>
          <div class="mobile-instance-monitor__header-actions">
            <MobileButton
              size="small"
              type="primary"
              class="mobile-instance-monitor__refresh-action"
              onClick={loadInstances}
              aria-label="刷新实例数据">
              {h(PhArrowsClockwise, { size: 16 })}
            </MobileButton>
          </div>
        </div>

        <div class="mobile-instance-monitor__service-select">
          <MobileSelect
            modelValue={selectedServiceId.value ?? ''}
            onUpdate:modelValue={(value) => {
              selectedServiceId.value = value ? String(value) : null
              loadInstances()
            }}
            options={services.value}
            placeholder="选择服务"
            clearable
          />
          {servicesError.value && (
            <div class="mobile-instance-monitor__selector-error" role="alert">
              <span>服务列表加载失败</span>
              <MobileButton size="small" type="ghost" onClick={loadServices}>
                重试
              </MobileButton>
            </div>
          )}
        </div>

        {loading.value ? (
          <div class="mobile-instance-monitor__loading">
            <MobileLoading loading={true} size="large" />
          </div>
        ) : error.value ? (
          <MobileEmpty description="数据加载失败" class="mobile-instance-monitor__error">
            {{
              action: () => (
                <MobileButton type="primary" size="small" onClick={loadInstances}>
                  重新加载
                </MobileButton>
              )
            }}
          </MobileEmpty>
        ) : !selectedServiceId.value ? (
          <div class="mobile-instance-monitor__empty-state">
            <MobileEmpty description="请先选择服务" />
          </div>
        ) : instances.value.length === 0 ? (
          <div class="mobile-instance-monitor__empty-state">
            <MobileEmpty description="该服务暂无实例数据" />
          </div>
        ) : (
          <>
            <div class="mobile-instance-monitor__stats">
              <MobileGrid cols={2} gap="var(--spacing-2)">
                <div>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--total">
                      {h(PhHardDrive, { size: 18 })}
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.total}</div>
                    <div class="mobile-instance-monitor__stat-label">总实例</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--running">
                      {h(PhActivity, { size: 18 })}
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.running}</div>
                    <div class="mobile-instance-monitor__stat-label">运行中</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--error">
                      {h(PhWarningCircle, { size: 18 })}
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.error}</div>
                    <div class="mobile-instance-monitor__stat-label">异常</div>
                  </div>
                </div>
                <div>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--cpu">
                      {h(PhGauge, { size: 18 })}
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.avgCpu}%</div>
                    <div class="mobile-instance-monitor__stat-label">平均 CPU</div>
                  </div>
                </div>
              </MobileGrid>
            </div>

            <div class="mobile-instance-monitor__view-toggle">
              <div class="mobile-instance-monitor__view-toggle-actions">
                <MobileButton
                  type={viewMode.value === 'card' ? 'primary' : 'default'}
                  aria-label="卡片视图"
                  onClick={() => {
                    viewMode.value = 'card'
                  }}>
                  {h(PhSquaresFour, { size: 16 })}
                </MobileButton>
                <MobileButton
                  type={viewMode.value === 'table' ? 'primary' : 'default'}
                  aria-label="表格视图"
                  onClick={() => {
                    viewMode.value = 'table'
                  }}>
                  {h(PhList, { size: 16 })}
                </MobileButton>
              </div>
            </div>

            {viewMode.value === 'card' ? (
              <div class="mobile-instance-monitor__list">
                {sortedInstances.value.map((inst) => (
                  <MobileCard key={inst.id} size="small" bordered={false} class="mobile-instance-monitor__list-card">
                    <div class="mobile-instance-monitor__card-header">
                      <span class="mobile-instance-monitor__card-id">{inst.id}</span>
                      <MobileTag size="small" type={statusTagType(inst.status)}>
                        {statusLabel(inst.status)}
                      </MobileTag>
                    </div>
                    <div class="mobile-instance-monitor__card-metrics">
                      <div class="mobile-instance-monitor__metric-row">
                        <span class="mobile-instance-monitor__metric-label">CPU</span>
                        <div class="mobile-instance-monitor__metric-bar">
                          <MobileProgress
                            percentage={inst.cpu ?? 0}
                            strokeWidth={10}
                            trackColor="var(--color-fill-2)"
                            color="var(--color-primary-6)"
                            showPivot={false}
                          />
                        </div>
                        <span class="mobile-instance-monitor__metric-value">{inst.cpu ?? 0}%</span>
                      </div>
                      <div class="mobile-instance-monitor__metric-row">
                        <span class="mobile-instance-monitor__metric-label">内存</span>
                        <div class="mobile-instance-monitor__metric-bar">
                          <MobileProgress
                            percentage={inst.memory ?? 0}
                            strokeWidth={10}
                            trackColor="var(--color-fill-2)"
                            color="var(--color-warning-6)"
                            showPivot={false}
                          />
                        </div>
                        <span class="mobile-instance-monitor__metric-value">{inst.memory ?? 0}%</span>
                      </div>
                    </div>
                    <div class="mobile-instance-monitor__card-footer">
                      <span class="mobile-instance-monitor__card-time">
                        节点: {inst.node || '-'} · 启动: {inst.startTime || '-'}
                      </span>
                    </div>
                  </MobileCard>
                ))}
              </div>
            ) : (
              <div class="mobile-instance-monitor__table-wrapper">
                <div class="mobile-instance-monitor__table-header-row">
                  {tableColumns.map((col) => (
                    <div
                      key={col.key}
                      class="mobile-instance-monitor__table-th"
                      onClick={() => toggleSort(col.key as SortKey)}>
                      <span>
                        {col.label}
                        {sortIndicator(col.key as SortKey)}
                      </span>
                    </div>
                  ))}
                </div>
                <MobileDataTable
                  class="mobile-instance-monitor__table"
                  columns={tableColumns}
                  data={sortedInstances.value.map((instance) => ({ ...instance }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    )
  }
})
