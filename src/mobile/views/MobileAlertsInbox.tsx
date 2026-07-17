import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import {
  NCard,
  NTag,
  NList,
  NListItem,
  NSpin,
  NEmpty,
  NButton,
  NIcon,
  NSelect,
  NInput,
  NModal,
  NForm,
  NFormItem,
  useMessage
} from 'naive-ui'
import {
  PhCheckCircle,
  PhXCircle,
  PhHand,
  PhUserPlus,
  PhArrowsClockwise,
  PhDownload,
  PhCaretDown,
  PhMagnifyingGlass
} from '@phosphor-icons/vue'
import {
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  suppressAlert,
  assignAlert,
  fetchAlertAssignees
} from '@/api/alerts'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import type { AlertItem } from '@/types/monitor'
import './MobileAlertsInbox.scss'

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return dateStr
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return '刚刚'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}天前`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth}个月前`
}

const TIME_RANGE_OPTIONS = [
  { label: '最近 15 分钟', value: '15m' },
  { label: '最近 1 小时', value: '1h' },
  { label: '最近 4 小时', value: '4h' },
  { label: '最近 1 天', value: '1d' },
  { label: '最近 2 天', value: '2d' },
  { label: '最近 7 天', value: '7d' }
]

const PAGE_SIZE = 15

export default defineComponent({
  name: 'MobileAlertsInbox',
  setup() {
    const message = useMessage()
    const timeStore = useTimeStore()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())

    // ── State ──────────────────────────────────
    const loading = ref(true)
    const error = ref(false)
    const alerts = ref<AlertItem[]>([])
    const allAlerts = ref<AlertItem[]>([])

    const selectedService = ref('')
    const selectedLevel = ref<string[]>([])
    const selectedStatus = ref('')
    const selectedAssignee = ref('')
    const keyword = ref('')
    const timeRangeValue = ref<string>('1h')

    const serviceOptions = ref([{ label: '全部服务', value: '' }])
    const assigneeOptions = ref([{ label: '全部处理人', value: '' }])

    const selectedAlert = ref<AlertItem | null>(null)

    const showAssignModal = ref(false)
    const assigningAlert = ref<AlertItem | null>(null)
    const assignForm = ref({ assigneeUserId: '' })

    const showConfirmModal = ref(false)
    const confirmAction = ref<{ type: 'acknowledge' | 'resolve' | 'suppress'; alert: AlertItem } | null>(null)

    const expandingAlertId = ref<string | null>(null)

    const displayCount = ref(PAGE_SIZE)

    // ── Computed ────────────────────────────────
    const activeCount = computed(() => allAlerts.value.filter((a) => a.status === 'active').length)
    const resolvedCount = computed(() => allAlerts.value.filter((a) => a.status === 'resolved').length)
    const suppressedCount = computed(() => allAlerts.value.filter((a) => a.status === 'suppressed').length)

    const visibleAlerts = computed(() => alerts.value.slice(0, displayCount.value))
    const hasMore = computed(() => alerts.value.length > displayCount.value)

    const keywordResultCount = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return null
      return alerts.value.length
    })

    interface ActiveFilter {
      key: string
      label: string
      value: string
    }

    const activeFilters = computed<ActiveFilter[]>(() => {
      const filters: ActiveFilter[] = []
      if (selectedStatus.value) {
        const label =
          {
            active: '活跃',
            pending: '等待持续时间',
            resolved: '已解决',
            suppressed: '已静默'
          }[selectedStatus.value] || selectedStatus.value
        filters.push({ key: 'status', label: '状态', value: label })
      }
      if (selectedAssignee.value) {
        const opt = assigneeOptions.value.find((o) => o.value === selectedAssignee.value)
        filters.push({ key: 'assignee', label: '处理人', value: opt?.label || selectedAssignee.value })
      }
      if (keyword.value.trim()) {
        filters.push({ key: 'keyword', label: '关键词', value: keyword.value.trim() })
      }
      return filters
    })

    const hasActiveFilters = computed(() => activeFilters.value.length > 0)

    const clearAllFilters = () => {
      selectedStatus.value = ''
      selectedAssignee.value = ''
      keyword.value = ''
    }

    const removeFilter = (key: string) => {
      if (key === 'status') selectedStatus.value = ''
      if (key === 'assignee') selectedAssignee.value = ''
      if (key === 'keyword') keyword.value = ''
    }

    // ── Helpers ─────────────────────────────────
    const levelType = (level: AlertItem['level']): 'error' | 'warning' | 'info' | 'default' => {
      switch (level) {
        case 'critical':
          return 'error'
        case 'warning':
          return 'warning'
        case 'info':
          return 'info'
        default:
          return 'default'
      }
    }

    const levelLabel = (level: AlertItem['level']): string => {
      switch (level) {
        case 'critical':
          return '严重'
        case 'warning':
          return '警告'
        case 'info':
          return '提示'
        default:
          return level
      }
    }

    const statusLabel = (status: AlertItem['status']): string => {
      switch (status) {
        case 'active':
          return '活跃'
        case 'pending':
          return '等待持续时间'
        case 'resolved':
          return '已解决'
        case 'suppressed':
          return '已静默'
        default:
          return status
      }
    }

    const statusType = (status: AlertItem['status']): 'error' | 'success' | 'warning' | 'default' => {
      switch (status) {
        case 'active':
          return 'error'
        case 'resolved':
          return 'success'
        case 'suppressed':
          return 'default'
        case 'pending':
          return 'warning'
        default:
          return 'default'
      }
    }

    // ── Data loading ────────────────────────────
    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        const items = res?.items || []
        serviceOptions.value = [
          { label: '全部服务', value: '' },
          ...items.map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: item.identity?.id || ''
          }))
        ]
      } catch (e) {
        console.error('Failed to fetch services', e)
      }
    }

    const loadAssignees = async () => {
      try {
        const users = await fetchAlertAssignees()
        assigneeOptions.value = [
          { label: '全部处理人', value: '' },
          { label: '未指派', value: '__unassigned__' },
          ...users.map((user) => ({ label: user.nickname, value: user.userId }))
        ]
      } catch (e) {
        console.error('Failed to fetch alert assignees', e)
      }
    }

    const applyLevelFilter = (data: AlertItem[]): AlertItem[] => {
      if (selectedLevel.value.length === 0) return data
      return data.filter((item) => selectedLevel.value.includes(item.level))
    }

    const applyStatusFilter = (data: AlertItem[]): AlertItem[] => {
      if (!selectedStatus.value) return data
      return data.filter((item) => item.status === selectedStatus.value)
    }

    const applyKeywordFilter = (data: AlertItem[]): AlertItem[] => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return data
      return data.filter((item) => {
        return (
          (item.message || '').toLowerCase().includes(kw) ||
          (item.service || '').toLowerCase().includes(kw) ||
          (item.id || '').toLowerCase().includes(kw)
        )
      })
    }

    const applyAssigneeFilter = (data: AlertItem[]): AlertItem[] => {
      if (!selectedAssignee.value) return data
      if (selectedAssignee.value === '__unassigned__') {
        return data.filter((item) => !item.assigneeUserId)
      }
      return data.filter((item) => item.assigneeUserId === selectedAssignee.value)
    }

    const applyAllFilters = (data: AlertItem[]): AlertItem[] => {
      let filtered = data
      filtered = applyLevelFilter(filtered)
      filtered = applyStatusFilter(filtered)
      filtered = applyKeywordFilter(filtered)
      filtered = applyAssigneeFilter(filtered)
      return filtered
    }

    const loadAlerts = async () => {
      loading.value = true
      error.value = false
      try {
        const list = await fetchAlerts({
          serviceId: selectedService.value,
          scope: datasetScope.value,
          startTime: timeStore.startTime,
          endTime: timeStore.endTime
        })
        allAlerts.value = Array.isArray(list) ? list : []
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
      } catch (e) {
        console.error('Failed to load alerts:', e)
        error.value = true
      } finally {
        loading.value = false
      }
    }

    const onTimeRangeChange = (value: string) => {
      timeRangeValue.value = value
      timeStore.setTimeRange(value as any)
    }

    const loadMore = () => {
      displayCount.value = Math.min(displayCount.value + PAGE_SIZE, alerts.value.length)
    }

    // ── Actions ─────────────────────────────────
    const toggleExpand = (alertId: string) => {
      expandingAlertId.value = expandingAlertId.value === alertId ? null : alertId
      if (expandingAlertId.value) {
        selectedAlert.value = alerts.value.find((a) => a.id === alertId) || null
      }
    }

    const openAssignModal = (alert: AlertItem) => {
      assigningAlert.value = alert
      assignForm.value.assigneeUserId = alert.assigneeUserId || ''
      showAssignModal.value = true
    }

    const handleAssign = async () => {
      if (!assigningAlert.value) return
      const matched = assigneeOptions.value.find((item) => item.value === assignForm.value.assigneeUserId)
      try {
        await assignAlert(assigningAlert.value.id, {
          assigneeUserId: assignForm.value.assigneeUserId || '',
          assigneeName: assignForm.value.assigneeUserId ? matched?.label || '' : ''
        })
        showAssignModal.value = false
        await loadAlerts()
        message.success('告警处理人已更新')
      } catch {
        message.error('更新告警处理人失败')
      }
    }

    const openConfirmModal = (type: 'acknowledge' | 'resolve' | 'suppress', alert: AlertItem) => {
      confirmAction.value = { type, alert }
      showConfirmModal.value = true
    }

    const quickAcknowledge = (e: Event, alert: AlertItem) => {
      e.stopPropagation()
      openConfirmModal('acknowledge', alert)
    }

    const quickResolve = (e: Event, alert: AlertItem) => {
      e.stopPropagation()
      openConfirmModal('resolve', alert)
    }

    const executeConfirmAction = async () => {
      if (!confirmAction.value) return
      const { type, alert } = confirmAction.value
      try {
        if (type === 'acknowledge') await acknowledgeAlert(alert.id)
        else if (type === 'resolve') await resolveAlert(alert.id)
        else if (type === 'suppress') await suppressAlert(alert.id)

        showConfirmModal.value = false
        confirmAction.value = null
        await loadAlerts()

        const labels = {
          acknowledge: '告警已确认',
          resolve: '告警已解决',
          suppress: '告警已静默'
        }
        message.success(labels[type])
      } catch {
        message.error('操作失败，请重试')
      }
    }

    const confirmActionTitle = computed(() => {
      if (!confirmAction.value) return ''
      const labels = {
        acknowledge: '确认告警',
        resolve: '解决告警',
        suppress: '静默告警'
      }
      return labels[confirmAction.value.type]
    })

    const confirmActionContent = computed(() => {
      if (!confirmAction.value) return ''
      const labels = {
        acknowledge: '确认已收到此告警通知？',
        resolve: '确认将此告警标记为已解决？',
        suppress: '确认静默此告警？静默后不会重复通知。'
      }
      return labels[confirmAction.value.type]
    })

    const handleExport = () => {
      const data = allAlerts.value
      if (data.length === 0) {
        message.warning('暂无告警数据可导出')
        return
      }
      const headers = ['ID', '时间', '服务', '等级', '消息', '状态', '处理人']
      const rows = data.map((item) =>
        [
          item.id,
          item.time,
          item.service || '-',
          item.level,
          `"${(item.message || '').replace(/"/g, '""')}"`,
          item.status,
          item.assigneeName || '未指派'
        ].join(',')
      )
      const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `alerts_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      message.success('告警数据已导出')
    }

    // ── Lifecycle ───────────────────────────────
    onMounted(() => {
      loadServiceOptions()
      loadAssignees()
      loadAlerts()
    })

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => loadAlerts()
    )

    watch(
      () => [selectedLevel.value, selectedStatus.value, selectedAssignee.value],
      () => {
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
      },
      { deep: true }
    )

    let keywordTimer: ReturnType<typeof setTimeout> | null = null
    watch(keyword, () => {
      if (keywordTimer) clearTimeout(keywordTimer)
      keywordTimer = setTimeout(() => {
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
      }, 300)
    })

    return () => (
      <div class="mobile-alerts-inbox">
        {/* ── Header ─────────────────────────── */}
        <header class="mobile-alerts-inbox__header">
          <h2 class="mobile-alerts-inbox__title">告警收件箱</h2>
          <div class="mobile-alerts-inbox__header-actions">
            <NButton size="tiny" quaternary onClick={handleExport} class="mobile-alerts-inbox__export-btn">
              {{
                icon: () => (
                  <NIcon size={16}>
                    <PhDownload />
                  </NIcon>
                )
              }}
            </NButton>
            <NButton
              size="tiny"
              quaternary
              onClick={loadAlerts}
              class="mobile-alerts-inbox__refresh-btn"
              loading={loading.value}>
              {{
                icon: () => (
                  <NIcon size={16}>
                    <PhArrowsClockwise />
                  </NIcon>
                )
              }}
            </NButton>
          </div>
        </header>

        {/* ── Summary grid ───────────────────── */}
        <div class="mobile-alerts-inbox__summary-grid">
          {[
            { label: '总计', value: allAlerts.value.length, color: 'var(--color-text-1)' },
            { label: '活跃', value: activeCount.value, color: 'var(--color-danger-6)' },
            { label: '已解决', value: resolvedCount.value, color: 'var(--color-success-6)' },
            { label: '已静默', value: suppressedCount.value, color: 'var(--color-text-3)' }
          ].map((item, idx) => (
            <NCard key={idx} size="small" bordered={false} class="mobile-alerts-inbox__summary-card">
              <div class="mobile-alerts-inbox__summary-value" style={{ color: item.color }}>
                {item.value}
              </div>
              <div class="mobile-alerts-inbox__summary-label">{item.label}</div>
            </NCard>
          ))}
        </div>

        {/* ── Filters ────────────────────────── */}
        <div class="mobile-alerts-inbox__filters">
          <NSelect
            v-model:value={timeRangeValue.value}
            options={TIME_RANGE_OPTIONS}
            placeholder="时间范围"
            size="small"
            class="mobile-alerts-inbox__time-select"
            onUpdate:value={onTimeRangeChange}
          />

          <NSelect
            v-model:value={selectedService.value}
            options={serviceOptions.value}
            placeholder="全部服务"
            size="small"
            clearable
            class="mobile-alerts-inbox__service-select"
          />

          <div class="mobile-alerts-inbox__level-chips">
            {[
              { label: '严重', value: 'critical' },
              { label: '警告', value: 'warning' },
              { label: '提示', value: 'info' }
            ].map((chip) => {
              const active = selectedLevel.value.includes(chip.value)
              return (
                <NButton
                  key={chip.value}
                  size="tiny"
                  round
                  type={active ? 'primary' : 'default'}
                  ghost={!active}
                  onClick={() => {
                    const i = selectedLevel.value.indexOf(chip.value)
                    if (i >= 0) {
                      selectedLevel.value.splice(i, 1)
                    } else {
                      selectedLevel.value.push(chip.value)
                    }
                  }}>
                  {chip.label}
                </NButton>
              )
            })}
          </div>

          <NButton size="small" type="primary" onClick={loadAlerts} class="mobile-alerts-inbox__query-btn">
            查询
          </NButton>
        </div>

        {/* ── Status filter chips ───────────── */}
        <div class="mobile-alerts-inbox__status-chips">
          {[
            { label: '全部', value: '' },
            { label: '活跃', value: 'active' },
            { label: '待处理', value: 'pending' },
            { label: '已解决', value: 'resolved' },
            { label: '已屏蔽', value: 'suppressed' }
          ].map((chip) => {
            const active = selectedStatus.value === chip.value
            return (
              <NButton
                key={chip.value}
                size="tiny"
                round
                type={active ? 'primary' : 'default'}
                ghost={!active}
                onClick={() => {
                  selectedStatus.value = chip.value
                }}>
                {chip.label}
              </NButton>
            )
          })}
        </div>

        {/* ── Keyword search + Assignee filter ── */}
        <div class="mobile-alerts-inbox__search-row">
          <NInput
            v-model:value={keyword.value}
            placeholder="搜索告警内容、服务…"
            size="small"
            clearable
            class="mobile-alerts-inbox__search-input"
            onClear={() => {
              keyword.value = ''
            }}>
            {{
              prefix: () => (
                <NIcon size={16}>
                  <PhMagnifyingGlass />
                </NIcon>
              )
            }}
          </NInput>

          <NSelect
            v-model:value={selectedAssignee.value}
            options={assigneeOptions.value}
            placeholder="全部处理人"
            size="small"
            clearable
            class="mobile-alerts-inbox__assignee-select"
          />
        </div>

        {/* ── Keyword result count or active filter chips ── */}
        {hasActiveFilters.value && (
          <div class="mobile-alerts-inbox__active-filters">
            {activeFilters.value.map((filter) => (
              <div key={filter.key} class="mobile-alerts-inbox__filter-chip">
                <span class="mobile-alerts-inbox__filter-chip-label">{filter.label}:</span>
                <span class="mobile-alerts-inbox__filter-chip-value">{filter.value}</span>
                <NButton
                  size="tiny"
                  quaternary
                  class="mobile-alerts-inbox__filter-chip-close"
                  onClick={() => removeFilter(filter.key)}>
                  {{
                    icon: () => (
                      <NIcon size={14}>
                        <PhXCircle />
                      </NIcon>
                    )
                  }}
                </NButton>
              </div>
            ))}
            <NButton
              size="tiny"
              quaternary
              type="primary"
              class="mobile-alerts-inbox__filter-clear-all"
              onClick={clearAllFilters}>
              清除全部
            </NButton>
          </div>
        )}

        {keywordResultCount.value !== null && (
          <div class="mobile-alerts-inbox__search-result-count">
            找到 <strong>{keywordResultCount.value}</strong> 条结果
          </div>
        )}

        {/* ── Content ────────────────────────── */}
        {loading.value ? (
          <div class="mobile-alerts-inbox__loading">
            <NSpin size="large" />
          </div>
        ) : error.value ? (
          <div class="mobile-alerts-inbox__error">
            <NEmpty description="加载失败，请重试" />
            <NButton size="small" onClick={loadAlerts} class="mobile-alerts-inbox__retry-btn">
              重试
            </NButton>
          </div>
        ) : alerts.value.length === 0 ? (
          <div class="mobile-alerts-inbox__empty">
            <NEmpty description="暂无告警数据" />
            <p class="mobile-alerts-inbox__empty-hint">
              {selectedLevel.value.length > 0 || selectedService.value
                ? '调整筛选条件可能找到更多结果'
                : '暂无告警，系统运行正常'}
            </p>
          </div>
        ) : (
          <div class="mobile-alerts-inbox__list-wrapper">
            <NCard size="small" bordered={false} class="mobile-alerts-inbox__list-card">
              <NList>
                {visibleAlerts.value.map((alert) => {
                  const isExpanded = expandingAlertId.value === alert.id
                  return (
                    <NListItem key={alert.id}>
                      <div class="mobile-alerts-inbox__card" onClick={() => toggleExpand(alert.id)}>
                        <div
                          class={[
                            'mobile-alerts-inbox__card-accent',
                            `mobile-alerts-inbox__card-accent--${alert.level}`
                          ]}
                        />
                        <div class="mobile-alerts-inbox__card-header">
                          <span class="mobile-alerts-inbox__card-service">{alert.service}</span>
                          <div class="mobile-alerts-inbox__card-tags">
                            <NTag size="small" type={levelType(alert.level)} bordered={false}>
                              {levelLabel(alert.level)}
                            </NTag>
                            <NTag size="small" type={statusType(alert.status) as any} bordered={false}>
                              {statusLabel(alert.status)}
                            </NTag>
                          </div>
                        </div>
                        <div class="mobile-alerts-inbox__card-msg">{alert.message || '无详情'}</div>
                        <div class="mobile-alerts-inbox__card-meta">
                          <span class="mobile-alerts-inbox__card-time">{relativeTime(alert.time)}</span>
                          {alert.status === 'active' && (
                            <div class="mobile-alerts-inbox__card-actions">
                              <NButton
                                size="tiny"
                                type="primary"
                                secondary
                                class="mobile-alerts-inbox__card-action-btn"
                                onClick={(e: MouseEvent) => quickAcknowledge(e, alert)}>
                                确认
                              </NButton>
                              <NButton
                                size="tiny"
                                type="success"
                                secondary
                                class="mobile-alerts-inbox__card-action-btn"
                                onClick={(e: MouseEvent) => quickResolve(e, alert)}>
                                解决
                              </NButton>
                            </div>
                          )}
                        </div>
                        {isExpanded && (
                          <div class="mobile-alerts-inbox__detail-panel">
                            <div class="mobile-alerts-inbox__detail-grid">
                              <div class="mobile-alerts-inbox__detail-item">
                                <span class="mobile-alerts-inbox__detail-label">状态</span>
                                <NTag size="small" type={statusType(alert.status) as any} bordered={false}>
                                  {statusLabel(alert.status)}
                                </NTag>
                              </div>
                              <div class="mobile-alerts-inbox__detail-item">
                                <span class="mobile-alerts-inbox__detail-label">处理人</span>
                                <span class="mobile-alerts-inbox__detail-value">{alert.assigneeName || '未指派'}</span>
                              </div>
                              <div class="mobile-alerts-inbox__detail-item">
                                <span class="mobile-alerts-inbox__detail-label">时间</span>
                                <span class="mobile-alerts-inbox__detail-value">
                                  {alert.time ? new Date(alert.time).toLocaleString('zh-CN', { hour12: false }) : '-'}
                                </span>
                              </div>
                              {alert.duration && (
                                <div class="mobile-alerts-inbox__detail-item">
                                  <span class="mobile-alerts-inbox__detail-label">持续时间</span>
                                  <span class="mobile-alerts-inbox__detail-value">{alert.duration}</span>
                                </div>
                              )}
                              <div class="mobile-alerts-inbox__detail-item mobile-alerts-inbox__detail-item--full">
                                <span class="mobile-alerts-inbox__detail-label">告警内容</span>
                                <span class="mobile-alerts-inbox__detail-value">{alert.message || '无'}</span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div class="mobile-alerts-inbox__detail-actions">
                              {alert.status === 'active' && (
                                <NButton
                                  size="small"
                                  type="primary"
                                  secondary
                                  onClick={() => openConfirmModal('acknowledge', alert)}>
                                  {{
                                    icon: () => (
                                      <NIcon size={16}>
                                        <PhHand />
                                      </NIcon>
                                    )
                                  }}
                                  确认
                                </NButton>
                              )}
                              {alert.status === 'active' && (
                                <NButton
                                  size="small"
                                  type="success"
                                  secondary
                                  onClick={() => openConfirmModal('resolve', alert)}>
                                  {{
                                    icon: () => (
                                      <NIcon>
                                        <PhCheckCircle />
                                      </NIcon>
                                    )
                                  }}
                                  解决
                                </NButton>
                              )}
                              <NButton size="small" secondary onClick={() => openConfirmModal('suppress', alert)}>
                                {{
                                  icon: () => (
                                    <NIcon>
                                      <PhXCircle />
                                    </NIcon>
                                  )
                                }}
                                静默
                              </NButton>
                              <NButton size="small" secondary onClick={() => openAssignModal(alert)}>
                                {{
                                  icon: () => (
                                    <NIcon size={16}>
                                      <PhUserPlus />
                                    </NIcon>
                                  )
                                }}
                                指派
                              </NButton>
                            </div>
                          </div>
                        )}
                      </div>
                    </NListItem>
                  )
                })}
              </NList>
            </NCard>

            {/* Load more */}
            {hasMore.value && (
              <div class="mobile-alerts-inbox__load-more">
                <NButton text type="primary" onClick={loadMore}>
                  加载更多 ({alerts.value.length - displayCount.value} 条)
                </NButton>
              </div>
            )}
          </div>
        )}

        {/* ── Assign modal ───────────────────── */}
        <NModal
          v-model:show={showAssignModal.value}
          preset="dialog"
          title="指派告警处理人"
          positiveText="保存"
          negativeText="取消"
          onPositiveClick={handleAssign}>
          <NForm>
            <NFormItem label="处理人">
              <NSelect
                v-model:value={assignForm.value.assigneeUserId}
                options={assigneeOptions.value.filter((item) => item.value !== '' && item.value !== '__unassigned__')}
                clearable
                placeholder="选择处理人"
              />
            </NFormItem>
          </NForm>
        </NModal>

        {/* ── Confirm action modal ───────────── */}
        <NModal
          v-model:show={showConfirmModal.value}
          preset="dialog"
          title={confirmActionTitle.value}
          type="warning"
          positiveText="确认"
          negativeText="取消"
          onPositiveClick={executeConfirmAction}>
          <div class="mobile-alerts-inbox__confirm-content">{confirmActionContent.value}</div>
        </NModal>
      </div>
    )
  }
})
