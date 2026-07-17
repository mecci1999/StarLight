import { defineComponent, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NEmpty,
  NSpin,
  NTag,
  NSelect,
  NResult,
  NGrid,
  NGridItem,
  NProgress,
  NIcon,
  NButtonGroup,
  NDataTable
} from 'naive-ui'
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
import type { ServiceInstance } from '@/types/monitor'
import './MobileInstanceMonitor.scss'

type TimeRange = '1h' | '4h' | '1d' | '7d'

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: '1h', label: '1小时' },
  { key: '4h', label: '4小时' },
  { key: '1d', label: '1天' },
  { key: '7d', label: '7天' }
]

type SortKey = 'id' | 'status' | 'node' | 'cpu' | 'memory' | 'startTime'
type SortDir = 'asc' | 'desc'

export default defineComponent({
  name: 'MobileInstanceMonitor',
  setup() {
    const loading = ref(false)
    const error = ref(false)
    const instances = ref<ServiceInstance[]>([])
    const services = ref<{ label: string; value: string }[]>([])
    const selectedServiceId = ref<string | null>(null)
    const viewMode = ref<'card' | 'table'>('card')
    const timeRange = ref<TimeRange>('1h')
    const sortKey = ref<SortKey>('id')
    const sortDir = ref<SortDir>('asc')

    const loadServices = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200 })
        const items = res?.items || []
        services.value = items.map((item: Record<string, unknown>) => ({
          label: (item.identity as Record<string, string>)?.name || '-',
          value: (item.identity as Record<string, string>)?.id || ''
        }))
      } catch {
        services.value = []
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
        const res = await fetchServiceInstances(selectedServiceId.value)
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

    onMounted(loadServices)

    const statusTagType = (status: string): 'success' | 'error' | 'warning' | 'default' => {
      switch (status) {
        case 'running':
          return 'success'
        case 'error':
          return 'error'
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
        title: '实例ID',
        key: 'id',
        width: 140,
        ellipsis: { tooltip: true },
        render(row: ServiceInstance) {
          return <span class="mobile-instance-monitor__table-mono">{row.id}</span>
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 72,
        render(row: ServiceInstance) {
          return (
            <NTag size="small" bordered={false} type={statusTagType(row.status)}>
              {statusLabel(row.status)}
            </NTag>
          )
        }
      },
      {
        title: '节点',
        key: 'node',
        width: 100,
        ellipsis: { tooltip: true }
      },
      {
        title: 'CPU',
        key: 'cpu',
        width: 80,
        render(row: ServiceInstance) {
          const val = typeof row.cpu === 'number' ? row.cpu : 0
          return <span class="mobile-instance-monitor__table-metric">{val}%</span>
        }
      },
      {
        title: '内存',
        key: 'memory',
        width: 80,
        render(row: ServiceInstance) {
          const val = typeof row.memory === 'number' ? row.memory : 0
          return <span class="mobile-instance-monitor__table-metric">{val}%</span>
        }
      },
      {
        title: '启动时间',
        key: 'startTime',
        width: 130,
        ellipsis: { tooltip: true },
        render(row: ServiceInstance) {
          return <span class="mobile-instance-monitor__table-time">{row.startTime || '-'}</span>
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
            <NButton size="small" secondary type="primary" onClick={loadInstances}>
              <NIcon>
                <PhArrowsClockwise />
              </NIcon>
            </NButton>
          </div>
        </div>

        <div class="mobile-instance-monitor__service-select">
          <NSelect
            v-model:value={selectedServiceId.value}
            options={services.value}
            placeholder="选择服务"
            filterable
            clearable
            size="small"
            onUpdateValue={loadInstances}
          />
        </div>

        <div class="mobile-instance-monitor__time-range">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <NButton
              key={opt.key}
              size="tiny"
              type={timeRange.value === opt.key ? 'primary' : 'default'}
              secondary={timeRange.value !== opt.key}
              onClick={() => {
                timeRange.value = opt.key
              }}>
              {opt.label}
            </NButton>
          ))}
        </div>

        {loading.value ? (
          <div class="mobile-instance-monitor__loading">
            <NSpin size="large" />
          </div>
        ) : error.value ? (
          <NResult
            status="500"
            title="数据加载失败"
            description="请检查网络连接后重试"
            class="mobile-instance-monitor__error">
            {{
              footer: () => (
                <NButton type="primary" size="small" onClick={loadInstances}>
                  重新加载
                </NButton>
              )
            }}
          </NResult>
        ) : !selectedServiceId.value ? (
          <div class="mobile-instance-monitor__empty-state">
            <NEmpty description="请先选择服务" />
          </div>
        ) : instances.value.length === 0 ? (
          <div class="mobile-instance-monitor__empty-state">
            <NEmpty description="该服务暂无实例数据" />
          </div>
        ) : (
          <>
            <div class="mobile-instance-monitor__stats">
              <NGrid cols={2} xGap={8} yGap={8}>
                <NGridItem>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--total">
                      <NIcon>
                        <PhHardDrive size={18} />
                      </NIcon>
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.total}</div>
                    <div class="mobile-instance-monitor__stat-label">总实例</div>
                  </div>
                </NGridItem>
                <NGridItem>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--running">
                      <NIcon>
                        <PhActivity size={18} />
                      </NIcon>
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.running}</div>
                    <div class="mobile-instance-monitor__stat-label">运行中</div>
                  </div>
                </NGridItem>
                <NGridItem>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--error">
                      <NIcon>
                        <PhWarningCircle size={18} />
                      </NIcon>
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.error}</div>
                    <div class="mobile-instance-monitor__stat-label">异常</div>
                  </div>
                </NGridItem>
                <NGridItem>
                  <div class="mobile-instance-monitor__stat-card">
                    <div class="mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--cpu">
                      <NIcon>
                        <PhGauge size={18} />
                      </NIcon>
                    </div>
                    <div class="mobile-instance-monitor__stat-value">{stats.value.avgCpu}%</div>
                    <div class="mobile-instance-monitor__stat-label">平均 CPU</div>
                  </div>
                </NGridItem>
              </NGrid>
            </div>

            <div class="mobile-instance-monitor__view-toggle">
              <NButtonGroup size="small">
                <NButton
                  type={viewMode.value === 'card' ? 'primary' : 'default'}
                  onClick={() => {
                    viewMode.value = 'card'
                  }}>
                  <NIcon>
                    <PhSquaresFour />
                  </NIcon>
                </NButton>
                <NButton
                  type={viewMode.value === 'table' ? 'primary' : 'default'}
                  onClick={() => {
                    viewMode.value = 'table'
                  }}>
                  <NIcon>
                    <PhList />
                  </NIcon>
                </NButton>
              </NButtonGroup>
            </div>

            {viewMode.value === 'card' ? (
              <div class="mobile-instance-monitor__list">
                {sortedInstances.value.map((inst) => (
                  <NCard key={inst.id} size="small" bordered={false} class="mobile-instance-monitor__list-card">
                    <div class="mobile-instance-monitor__card-header">
                      <span class="mobile-instance-monitor__card-id">{inst.id}</span>
                      <NTag size="small" bordered={false} type={statusTagType(inst.status)}>
                        {statusLabel(inst.status)}
                      </NTag>
                    </div>
                    <div class="mobile-instance-monitor__card-metrics">
                      <div class="mobile-instance-monitor__metric-row">
                        <span class="mobile-instance-monitor__metric-label">CPU</span>
                        <div class="mobile-instance-monitor__metric-bar">
                          <NProgress
                            type="line"
                            percentage={inst.cpu ?? 0}
                            height={10}
                            border-radius="5px"
                            fill-border-radius="5px"
                            rail-color="var(--color-fill-2)"
                            color="var(--color-primary-6)"
                            indicator-placement="inside"
                            processing
                          />
                        </div>
                        <span class="mobile-instance-monitor__metric-value">{inst.cpu ?? 0}%</span>
                      </div>
                      <div class="mobile-instance-monitor__metric-row">
                        <span class="mobile-instance-monitor__metric-label">内存</span>
                        <div class="mobile-instance-monitor__metric-bar">
                          <NProgress
                            type="line"
                            percentage={inst.memory ?? 0}
                            height={10}
                            border-radius="5px"
                            fill-border-radius="5px"
                            rail-color="var(--color-fill-2)"
                            color="var(--color-warning-6)"
                            indicator-placement="inside"
                            processing
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
                  </NCard>
                ))}
              </div>
            ) : (
              <div class="mobile-instance-monitor__table-wrapper">
                <div class="mobile-instance-monitor__table-header-row">
                  {tableColumns.map((col) => (
                    <div
                      key={col.key}
                      class="mobile-instance-monitor__table-th"
                      style={{ width: col.width ? `${col.width}px` : undefined }}
                      onClick={() => toggleSort(col.key as SortKey)}>
                      <span>
                        {col.title}
                        {sortIndicator(col.key as SortKey)}
                      </span>
                    </div>
                  ))}
                </div>
                <NDataTable
                  class="mobile-instance-monitor__table"
                  columns={tableColumns}
                  data={sortedInstances.value}
                  rowKey={(row: ServiceInstance) => row.id}
                  size="small"
                  bordered={false}
                  singleLine={false}
                  pagination={{ pageSize: 10 }}
                  scrollX={600}
                />
              </div>
            )}
          </>
        )}
      </div>
    )
  }
})
