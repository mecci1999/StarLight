import { defineComponent, ref, onActivated, onUnmounted, computed, watch, h, inject } from 'vue'
import {
  MobileButton,
  MobileCard,
  MobileTag,
  MobileEmpty,
  MobileLoading,
  MobileInput,
  MobileSelect,
  MobileSheet,
  MobileList,
  MobileListItem
} from '@/mobile/ui'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
import {
  PhCheckCircle,
  PhXCircle,
  PhHand,
  PhUserPlus,
  PhArrowsClockwise,
  PhDownload,
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
import type { MobileTagType } from '@/mobile/ui/MobileTag'
import type { TimeRangeKey } from '@/store/useTimeStore'
import { MOBILE_ALERT_BADGE_REFRESH_KEY } from '@/mobile/layout/MobileLayout'
import {
  investigationQuery,
  parseInvestigationContext,
  resolveInvestigationWindow
} from '@/mobile/hooks/investigationContext'
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

const LEVEL_FILTERS: Array<{ label: string; value: AlertItem['level'] }> = [
  { label: '严重', value: 'critical' },
  { label: '警告', value: 'warning' },
  { label: '提示', value: 'info' }
]

const PAGE_SIZE = 15

type AlertActionResponse = boolean | { success?: boolean }

const isStandardTimeRange = (value: TimeRangeKey): value is Exclude<TimeRangeKey, 'custom'> => value !== 'custom'

const isSuccessfulAction = (result: AlertActionResponse) =>
  result === true || (typeof result === 'object' && result.success === true)

export default defineComponent({
  name: 'MobileAlertsInbox',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const refreshAlertBadge = inject(MOBILE_ALERT_BADGE_REFRESH_KEY)

    // ── State ──────────────────────────────────
    const loading = ref(true)
    const error = ref(false)
    const alerts = ref<AlertItem[]>([])
    const allAlerts = ref<AlertItem[]>([])

    const selectedService = ref('')
    const selectedLevel = ref<AlertItem['level'][]>([])
    const selectedStatus = ref('')
    const selectedAssignee = ref('')
    const keyword = ref('')
    const timeRangeValue = ref<Exclude<TimeRangeKey, 'custom'> | ''>(
      isStandardTimeRange(timeStore.timeRange) ? timeStore.timeRange : ''
    )

    const serviceOptions = ref([{ label: '全部服务', value: '' }])
    const assigneeOptions = ref([{ label: '全部处理人', value: '' }])

    const selectedAlert = ref<AlertItem | null>(null)

    const showAssignModal = ref(false)
    const assigningAlert = ref<AlertItem | null>(null)
    const assignForm = ref({ assigneeUserId: '' })

    const showConfirmModal = ref(false)
    const confirmAction = ref<{ type: 'acknowledge' | 'resolve' | 'suppress'; alert: AlertItem } | null>(null)

    const expandingAlertId = ref<string | null>(null)
    const pendingIncidentId = ref<string | null>(null)

    const displayCount = ref(PAGE_SIZE)
    let alertRequestId = 0

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
      if (selectedService.value) {
        const option = serviceOptions.value.find((item) => item.value === selectedService.value)
        filters.push({ key: 'service', label: '服务', value: option?.label || selectedService.value })
      }
      if (selectedLevel.value.length > 0) {
        filters.push({ key: 'level', label: '级别', value: selectedLevel.value.map(levelLabel).join('、') })
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
      selectedService.value = ''
      selectedLevel.value = []
      selectedStatus.value = ''
      selectedAssignee.value = ''
      keyword.value = ''
    }

    const removeFilter = (key: string) => {
      if (key === 'service') selectedService.value = ''
      if (key === 'level') selectedLevel.value = []
      if (key === 'status') selectedStatus.value = ''
      if (key === 'assignee') selectedAssignee.value = ''
      if (key === 'keyword') keyword.value = ''
    }

    // ── Helpers ─────────────────────────────────
    const levelType = (level: AlertItem['level']): MobileTagType => {
      switch (level) {
        case 'critical':
          return 'danger'
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

    const statusType = (status: AlertItem['status']): MobileTagType => {
      switch (status) {
        case 'active':
          return 'danger'
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

    const applyServiceFilter = (data: AlertItem[]): AlertItem[] => {
      if (!selectedService.value) return data
      return data.filter((item) => item.serviceId === selectedService.value)
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
      filtered = applyServiceFilter(filtered)
      filtered = applyLevelFilter(filtered)
      filtered = applyStatusFilter(filtered)
      filtered = applyKeywordFilter(filtered)
      filtered = applyAssigneeFilter(filtered)
      return filtered
    }

    const expandIncidentFromRoute = () => {
      if (!pendingIncidentId.value) return
      const matchedAlert = alerts.value.find((alert) => alert.id === pendingIncidentId.value)
      if (matchedAlert) {
        expandingAlertId.value = matchedAlert.id
        selectedAlert.value = matchedAlert
        pendingIncidentId.value = null
      }
    }

    const loadAlerts = async () => {
      const requestId = ++alertRequestId
      const scope = datasetScope.value
      const context = parseInvestigationContext(route.query)
      const window = resolveInvestigationWindow(context)
      const startTime = window?.start ?? timeStore.startTime
      const endTime = window?.end ?? timeStore.endTime
      loading.value = true
      error.value = false
      try {
        const list = await fetchAlerts({
          scope,
          startTime,
          endTime
        })
        if (requestId !== alertRequestId) return
        allAlerts.value = Array.isArray(list) ? list : []
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
        expandIncidentFromRoute()
      } catch (e) {
        if (requestId !== alertRequestId) return
        console.error('Failed to load alerts:', e)
        error.value = true
      } finally {
        if (requestId === alertRequestId) loading.value = false
      }
    }

    const onTimeRangeChange = (value: Exclude<TimeRangeKey, 'custom'>) => {
      timeRangeValue.value = value
      timeStore.setTimeRange(value)
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
        const result = await assignAlert(assigningAlert.value.id, {
          assigneeUserId: assignForm.value.assigneeUserId || '',
          assigneeName: assignForm.value.assigneeUserId ? matched?.label || '' : ''
        })
        if (!isSuccessfulAction(result)) {
          mobileFeedback.error('更新告警处理人失败')
          return
        }
        showAssignModal.value = false
        await loadAlerts()
        await refreshAlertBadge?.()
        mobileFeedback.success('告警处理人已更新')
      } catch {
        mobileFeedback.error('更新告警处理人失败')
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
        const result =
          type === 'acknowledge'
            ? await acknowledgeAlert(alert.id)
            : type === 'resolve'
              ? await resolveAlert(alert.id)
              : await suppressAlert(alert.id)
        if (!isSuccessfulAction(result)) {
          mobileFeedback.error('操作未完成，请稍后重试')
          return
        }

        showConfirmModal.value = false
        confirmAction.value = null
        await loadAlerts()
        await refreshAlertBadge?.()

        const labels = {
          acknowledge: '告警已确认',
          resolve: '告警已解决',
          suppress: '告警已静默'
        }
        mobileFeedback.success(labels[type])
      } catch {
        mobileFeedback.error('操作失败，请重试')
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
        mobileFeedback.warning('暂无告警数据可导出')
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
      mobileFeedback.success('告警数据已导出')
    }

    const investigateAlert = (alert: AlertItem, path: string, requiresServiceId = false) => {
      if (requiresServiceId && !alert.serviceId) return
      const alertTime = new Date(alert.time).getTime()
      const investigationWindowMs = 15 * 60_000
      router.push({
        path,
        query: investigationQuery({
          ...(alert.serviceId ? { serviceId: alert.serviceId } : {}),
          ...(alert.service ? { serviceName: alert.service } : {}),
          ...(Number.isFinite(alertTime)
            ? { start: Math.max(1, alertTime - investigationWindowMs), end: alertTime + investigationWindowMs }
            : {}),
          ...(alert.message ? { keyword: alert.message } : {}),
          incidentId: alert.id
        })
      })
    }

    // ── Lifecycle ───────────────────────────────
    onActivated(() => {
      const queryValue = (value: unknown) => (typeof value === 'string' ? value : '')
      const context = parseInvestigationContext(route.query)
      keyword.value = context.keyword ?? queryValue(route.query.keyword)
      pendingIncidentId.value = context.incidentId ?? queryValue(route.query.incidentId) ?? null
      loadServiceOptions()
      loadAssignees()
      loadAlerts()
      refreshAlertBadge?.()
    })

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => loadAlerts()
    )

    watch(
      () => timeStore.timeRange,
      (range) => {
        timeRangeValue.value = isStandardTimeRange(range) ? range : ''
      }
    )

    watch(
      () => [route.query.keyword, route.query.incidentId],
      ([nextKeyword, nextIncidentId]) => {
        const context = parseInvestigationContext(route.query)
        keyword.value = context.keyword ?? (typeof nextKeyword === 'string' ? nextKeyword : '')
        pendingIncidentId.value = context.incidentId ?? (typeof nextIncidentId === 'string' ? nextIncidentId : null)
        expandIncidentFromRoute()
      }
    )

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.serviceId !== undefined) selectedService.value = context.serviceId
        if (context.keyword !== undefined) keyword.value = context.keyword
        if (context.incidentId !== undefined) pendingIncidentId.value = context.incidentId
        if (
          context.serviceId !== undefined ||
          context.keyword !== undefined ||
          context.incidentId !== undefined ||
          context.range !== undefined ||
          context.start !== undefined
        )
          void loadAlerts()
      }
    )

    watch(
      () => [selectedService.value, selectedLevel.value, selectedStatus.value, selectedAssignee.value],
      () => {
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
        expandIncidentFromRoute()
      },
      { deep: true }
    )

    let keywordTimer: ReturnType<typeof setTimeout> | null = null
    watch(keyword, () => {
      if (keywordTimer) clearTimeout(keywordTimer)
      keywordTimer = setTimeout(() => {
        alerts.value = applyAllFilters(allAlerts.value)
        displayCount.value = PAGE_SIZE
        expandIncidentFromRoute()
      }, 300)
    })

    onUnmounted(() => {
      if (keywordTimer) clearTimeout(keywordTimer)
    })

    return () => (
      <div class="mobile-alerts-inbox">
        {/* ── Header ─────────────────────────── */}
        <header class="mobile-alerts-inbox__header">
          <h2 class="mobile-alerts-inbox__title">告警收件箱</h2>
          <div class="mobile-alerts-inbox__header-actions">
            <MobileButton
              size="small"
              type="ghost"
              onClick={handleExport}
              class="mobile-alerts-inbox__export-btn"
              icon={() => h(PhDownload, { size: 16 })}
            />
            <MobileButton
              size="small"
              type="ghost"
              onClick={loadAlerts}
              class="mobile-alerts-inbox__refresh-btn"
              loading={loading.value}
              icon={() => h(PhArrowsClockwise, { size: 16 })}
            />
          </div>
        </header>

        {/* ── Summary grid ───────────────────── */}
        <div class="mobile-alerts-inbox__summary-grid">
          {[
            { label: '总计', value: allAlerts.value.length, tone: 'default' },
            { label: '活跃', value: activeCount.value, tone: 'danger' },
            { label: '已解决', value: resolvedCount.value, tone: 'success' },
            { label: '已静默', value: suppressedCount.value, tone: 'muted' }
          ].map((item, idx) => (
            <MobileCard key={idx} size="small" bordered={false} class="mobile-alerts-inbox__summary-card">
              <div class={`mobile-alerts-inbox__summary-value mobile-alerts-inbox__summary-value--${item.tone}`}>
                {item.value}
              </div>
              <div class="mobile-alerts-inbox__summary-label">{item.label}</div>
            </MobileCard>
          ))}
        </div>

        {/* ── Filters ────────────────────────── */}
        <div class="mobile-alerts-inbox__filters">
          <section class="mobile-alerts-inbox__filter-group" aria-label="范围筛选">
            <span class="mobile-alerts-inbox__filter-label">范围</span>
            <div class="mobile-alerts-inbox__filter-controls">
              <MobileSelect
                v-model:modelValue={timeRangeValue.value}
                options={TIME_RANGE_OPTIONS}
                placeholder={timeStore.timeRange === 'custom' ? '自定义时间' : '时间范围'}
                class="mobile-alerts-inbox__time-select"
                onUpdate:modelValue={onTimeRangeChange}
              />
              <MobileSelect
                v-model:modelValue={selectedService.value}
                options={serviceOptions.value}
                placeholder="全部服务"
                clearable
                class="mobile-alerts-inbox__service-select"
              />
            </div>
          </section>
          <section class="mobile-alerts-inbox__filter-group" aria-label="生命周期筛选">
            <span class="mobile-alerts-inbox__filter-label">生命周期</span>
            <div class="mobile-alerts-inbox__chip-row">
              {[
                { label: '全部', value: '' },
                { label: '活跃', value: 'active' },
                { label: '待处理', value: 'pending' },
                { label: '已解决', value: 'resolved' },
                { label: '已静默', value: 'suppressed' }
              ].map((chip) => {
                const active = selectedStatus.value === chip.value
                return (
                  <MobileButton
                    key={chip.value}
                    size="small"
                    type={active ? 'primary' : 'ghost'}
                    aria-pressed={active}
                    onClick={() => (selectedStatus.value = chip.value)}>
                    {chip.label}
                  </MobileButton>
                )
              })}
            </div>
          </section>
          <section class="mobile-alerts-inbox__filter-group" aria-label="严重程度筛选">
            <span class="mobile-alerts-inbox__filter-label">严重程度</span>
            <div class="mobile-alerts-inbox__chip-row">
              {LEVEL_FILTERS.map((chip) => {
                const active = selectedLevel.value.includes(chip.value)
                return (
                  <MobileButton
                    key={chip.value}
                    size="small"
                    type={active ? 'primary' : 'ghost'}
                    aria-pressed={active}
                    onClick={() => {
                      const i = selectedLevel.value.indexOf(chip.value)
                      if (i >= 0) {
                        selectedLevel.value.splice(i, 1)
                      } else {
                        selectedLevel.value.push(chip.value)
                      }
                    }}>
                    {chip.label}
                  </MobileButton>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── Advanced filters ───────────────── */}
        <div class="mobile-alerts-inbox__advanced-filters">
          <span class="mobile-alerts-inbox__filter-label">高级</span>
          <div class="mobile-alerts-inbox__search-row">
            <MobileInput
              v-model:modelValue={keyword.value}
              placeholder="搜索告警内容、服务…"
              clearable
              class="mobile-alerts-inbox__search-input"
              leftIcon={() => h(PhMagnifyingGlass, { size: 16 })}
            />

            <MobileSelect
              v-model:modelValue={selectedAssignee.value}
              options={assigneeOptions.value}
              placeholder="全部处理人"
              clearable
              class="mobile-alerts-inbox__assignee-select"
            />
          </div>
        </div>

        {/* ── Keyword result count or active filter chips ── */}
        {hasActiveFilters.value && (
          <div class="mobile-alerts-inbox__active-filters">
            {activeFilters.value.map((filter) => (
              <div key={filter.key} class="mobile-alerts-inbox__filter-chip">
                <span class="mobile-alerts-inbox__filter-chip-label">{filter.label}:</span>
                <span class="mobile-alerts-inbox__filter-chip-value">{filter.value}</span>
                <MobileButton
                  size="small"
                  type="ghost"
                  class="mobile-alerts-inbox__filter-chip-close"
                  icon={() => h(PhXCircle, { size: 14 })}
                  onClick={(event: MouseEvent) => {
                    event.stopPropagation()
                    removeFilter(filter.key)
                  }}
                />
              </div>
            ))}
            <MobileButton
              size="small"
              type="ghost"
              class="mobile-alerts-inbox__filter-clear-all"
              onClick={clearAllFilters}>
              清除全部
            </MobileButton>
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
            <MobileLoading loading={loading.value} size="36px" />
          </div>
        ) : error.value ? (
          <div class="mobile-alerts-inbox__error">
            <MobileEmpty description="加载失败，请重试" />
            <MobileButton size="small" onClick={loadAlerts} class="mobile-alerts-inbox__retry-btn">
              重试
            </MobileButton>
          </div>
        ) : alerts.value.length === 0 ? (
          <div class="mobile-alerts-inbox__empty">
            <MobileEmpty description={hasActiveFilters.value ? '没有匹配当前筛选条件的告警' : '暂无告警数据'}>
              {hasActiveFilters.value && (
                <MobileButton size="small" type="default" onClick={clearAllFilters}>
                  清除筛选条件
                </MobileButton>
              )}
            </MobileEmpty>
            <p class="mobile-alerts-inbox__empty-hint">
              {hasActiveFilters.value ? '清除或调整筛选条件后可查看当前时间范围内的告警' : '暂无告警，系统运行正常'}
            </p>
          </div>
        ) : (
          <div class="mobile-alerts-inbox__list-wrapper">
            <MobileCard size="small" bordered={false} class="mobile-alerts-inbox__list-card">
              <MobileList>
                {visibleAlerts.value.map((alert) => {
                  const isExpanded = expandingAlertId.value === alert.id
                  return (
                    <MobileListItem key={alert.id}>
                      <div class="mobile-alerts-inbox__card" onClick={() => toggleExpand(alert.id)}>
                        <div class="mobile-alerts-inbox__card-header">
                          <span class="mobile-alerts-inbox__card-service">{alert.service}</span>
                          <div class="mobile-alerts-inbox__card-tags">
                            <MobileTag size="small" type={levelType(alert.level)}>
                              {levelLabel(alert.level)}
                            </MobileTag>
                            <MobileTag size="small" type={statusType(alert.status)}>
                              {statusLabel(alert.status)}
                            </MobileTag>
                          </div>
                        </div>
                        <div class="mobile-alerts-inbox__card-msg">{alert.message || '无详情'}</div>
                        <div class="mobile-alerts-inbox__card-meta">
                          <span class="mobile-alerts-inbox__card-time">{relativeTime(alert.time)}</span>
                          {alert.status === 'active' && (
                            <div class="mobile-alerts-inbox__card-actions">
                              <MobileButton
                                size="small"
                                type="primary"
                                class="mobile-alerts-inbox__card-action-btn"
                                onClick={(e: MouseEvent) => quickAcknowledge(e, alert)}>
                                确认
                              </MobileButton>
                              <MobileButton
                                size="small"
                                type="default"
                                class="mobile-alerts-inbox__card-action-btn"
                                onClick={(e: MouseEvent) => quickResolve(e, alert)}>
                                解决
                              </MobileButton>
                            </div>
                          )}
                        </div>
                        {isExpanded && (
                          <div class="mobile-alerts-inbox__detail-panel">
                            <div class="mobile-alerts-inbox__detail-grid">
                              <div class="mobile-alerts-inbox__detail-item">
                                <span class="mobile-alerts-inbox__detail-label">状态</span>
                                <MobileTag size="small" type={statusType(alert.status)}>
                                  {statusLabel(alert.status)}
                                </MobileTag>
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
                                <MobileButton
                                  size="small"
                                  type="primary"
                                  icon={() => h(PhHand, { size: 16 })}
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    openConfirmModal('acknowledge', alert)
                                  }}>
                                  确认
                                </MobileButton>
                              )}
                              {alert.status === 'active' && (
                                <MobileButton
                                  size="small"
                                  type="default"
                                  icon={() => h(PhCheckCircle, { size: 16 })}
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    openConfirmModal('resolve', alert)
                                  }}>
                                  解决
                                </MobileButton>
                              )}
                              {alert.status === 'active' && (
                                <MobileButton
                                  size="small"
                                  type="default"
                                  icon={() => h(PhXCircle, { size: 16 })}
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    openConfirmModal('suppress', alert)
                                  }}>
                                  静默
                                </MobileButton>
                              )}
                              <MobileButton
                                size="small"
                                type="ghost"
                                icon={() => h(PhUserPlus, { size: 16 })}
                                onClick={(event: MouseEvent) => {
                                  event.stopPropagation()
                                  openAssignModal(alert)
                                }}>
                                指派
                              </MobileButton>
                              {alert.service && (
                                <MobileButton
                                  size="small"
                                  type="ghost"
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    investigateAlert(alert, '/mobile/log-center')
                                  }}>
                                  查日志
                                </MobileButton>
                              )}
                              {alert.service && (
                                <MobileButton
                                  size="small"
                                  type="ghost"
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    investigateAlert(alert, '/mobile/trace-explorer')
                                  }}>
                                  查链路
                                </MobileButton>
                              )}
                              {alert.serviceId && (
                                <MobileButton
                                  size="small"
                                  type="ghost"
                                  onClick={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    investigateAlert(alert, `/mobile/service-detail-v2/${alert.serviceId}`, true)
                                  }}>
                                  服务详情
                                </MobileButton>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </MobileListItem>
                  )
                })}
              </MobileList>
            </MobileCard>

            {/* Load more */}
            {hasMore.value && (
              <div class="mobile-alerts-inbox__load-more">
                <MobileButton type="primary" onClick={loadMore}>
                  加载更多 ({alerts.value.length - displayCount.value} 条)
                </MobileButton>
              </div>
            )}
          </div>
        )}

        {/* ── Assign modal ───────────────────── */}
        <MobileSheet
          show={showAssignModal.value}
          onUpdate:show={(v) => (showAssignModal.value = v)}
          position="bottom"
          title="指派告警处理人">
          <div class="mobile-alerts-inbox__assign-form">
            <div class="mobile-alerts-inbox__assign-label">处理人</div>
            <MobileSelect
              v-model:modelValue={assignForm.value.assigneeUserId}
              options={assigneeOptions.value.filter((item) => item.value !== '' && item.value !== '__unassigned__')}
              clearable
              placeholder="选择处理人"
            />
          </div>
          <div class="mobile-alerts-inbox__sheet-actions">
            <MobileButton block onClick={() => (showAssignModal.value = false)}>
              取消
            </MobileButton>
            <MobileButton block type="primary" onClick={handleAssign}>
              保存
            </MobileButton>
          </div>
        </MobileSheet>

        {/* ── Confirm action modal ───────────── */}
        <MobileSheet
          show={showConfirmModal.value}
          onUpdate:show={(v) => (showConfirmModal.value = v)}
          position="bottom"
          title={confirmActionTitle.value}>
          <div class="mobile-alerts-inbox__confirm-content">{confirmActionContent.value}</div>
          <div class="mobile-alerts-inbox__sheet-actions">
            <MobileButton block onClick={() => (showConfirmModal.value = false)}>
              取消
            </MobileButton>
            <MobileButton
              block
              type={confirmAction.value?.type === 'suppress' ? 'danger' : 'primary'}
              onClick={executeConfirmAction}>
              确认
            </MobileButton>
          </div>
        </MobileSheet>
      </div>
    )
  }
})
