import { defineComponent, ref, onActivated, computed, watch, h } from 'vue'
import { useRoute } from 'vue-router'
import { MobileButton, MobileCard, MobileTag, MobileInput, MobileLoading, MobileEmpty } from '@/mobile/ui'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
import { PhEnvelope, PhGlobe, PhDeviceMobile, PhArrowsClockwise, PhCaretDown } from '@phosphor-icons/vue'
import { fetchNotifications, resendNotification } from '@/api/alerts'
import type { MetricsDatasetScope } from '@/api/metrics'
import type { NotificationItem } from '@/types/monitor'
import type { MobileTagType } from '@/mobile/ui/MobileTag'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import { parseInvestigationContext, resolveInvestigationWindow } from '@/mobile/hooks/investigationContext'
import { useActivationRefresh } from '@/mobile/hooks/useActivationRefresh'
import {
  didResendNotificationSucceed,
  getNextRetryCount,
  rollbackRetryCount
} from '@/domains/alerts/notificationCenterModel'
import './MobileNotificationCenter.scss'

const PAGE_SIZE = 15

const formatRelativeTime = (raw: string | undefined): string => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const channelOptions = [
  { label: '全部', value: '' },
  { label: 'Email', value: 'Email' },
  { label: 'Webhook', value: 'Webhook' },
  { label: '站内通知', value: 'InApp' }
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '待发送', value: 'pending' }
]

const channelIconMap: Record<string, any> = {
  Email: PhEnvelope,
  email: PhEnvelope,
  Webhook: PhGlobe,
  webhook: PhGlobe,
  InApp: PhDeviceMobile
}

const channelTypeMap: Record<string, MobileTagType> = {
  Email: 'info',
  email: 'info',
  Webhook: 'warning',
  webhook: 'warning',
  InApp: 'success'
}

const channelLabelMap: Record<string, string> = {
  Email: 'Email',
  email: 'Email',
  Webhook: 'Webhook',
  webhook: 'Webhook',
  InApp: '站内通知'
}

const statusTypeMap: Record<string, MobileTagType> = {
  success: 'success',
  failed: 'danger',
  pending: 'warning'
}

const statusLabelMap: Record<string, string> = {
  success: '成功',
  failed: '失败',
  pending: '发送中'
}

export default defineComponent({
  name: 'MobileNotificationCenter',
  setup() {
    const route = useRoute()
    const message = mobileFeedback
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())

    // ── State ──────────────────────────────────
    const searchText = ref('')
    const selectedChannel = ref('')
    const selectedStatus = ref('')
    const loading = ref(false)
    const loadError = ref('')
    const allNotifications = ref<NotificationItem[]>([])
    const notificationData = ref<NotificationItem[]>([])
    const displayCount = ref(PAGE_SIZE)
    const expandingId = ref<string | null>(null)

    // ── Computed ───────────────────────────────
    const visibleNotifications = computed(() => notificationData.value.slice(0, displayCount.value))
    const hasMore = computed(() => notificationData.value.length > displayCount.value)

    const successCount = computed(() => notificationData.value.filter((item) => item.status === 'success').length)
    const failedCount = computed(() => notificationData.value.filter((item) => item.status === 'failed').length)
    const pendingCount = computed(() => notificationData.value.filter((item) => item.status === 'pending').length)

    const successRate = computed(() => {
      const total = notificationData.value.length
      if (!total) return '0%'
      return `${((successCount.value / total) * 100).toFixed(1)}%`
    })

    // ── Filtering ──────────────────────────────
    const applyFilters = () => {
      notificationData.value = allNotifications.value.filter((item) => {
        if (selectedChannel.value && item.channel !== selectedChannel.value) return false
        if (selectedStatus.value && item.status !== selectedStatus.value) return false
        if (searchText.value) {
          const keyword = searchText.value.toLowerCase()
          const haystack = [item.ruleName, item.service, item.recipient, item.content]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(keyword)) return false
        }
        return true
      })
      displayCount.value = PAGE_SIZE
      expandingId.value = null
    }

    // ── Data loading ───────────────────────────
    const loadNotifications = async () => {
      loading.value = true
      loadError.value = ''
      try {
        const context = parseInvestigationContext(route.query)
        const window = resolveInvestigationWindow(context)
        const res = await fetchNotifications({
          keyword: context.keyword || '',
          channel: '',
          status: '',
          ...(context.serviceId ? { serviceId: context.serviceId } : {}),
          ...(window ? { startTime: window.start, endTime: window.end } : {}),
          scope: datasetScope.value
        })
        allNotifications.value = (res || []).map((item: any, index: number) => ({
          key: item.id || `notification-${index}`,
          sendTime: formatRelativeTime(item.sentAt || item.sendTime),
          ruleName: item.type || item.ruleName || '系统通知',
          service: item.service || '系统',
          channel: item.channel,
          recipient: item.target || item.recipient || '-',
          status: item.status === 'sent' || item.status === 'delivered' ? 'success' : item.status,
          retryCount: item.retryCount || 0,
          content: item.content,
          errorMessage: item.errorMessage || ''
        }))
        applyFilters()
      } catch (e) {
        console.error(e)
        allNotifications.value = []
        notificationData.value = []
        loadError.value = '通知历史加载失败，请检查告警服务或稍后重试。'
      } finally {
        loading.value = false
      }
    }

    const shouldRefreshOnActivation = useActivationRefresh(30_000, {
      contextKey: () => route.fullPath
    })

    // ── Actions ────────────────────────────────
    const toggleExpand = (key: string) => {
      expandingId.value = expandingId.value === key ? null : key
    }

    const handleResend = async (notification: any) => {
      const previousStatus = notification.status
      const previousRetryCount = notification.retryCount
      notification.status = 'pending'
      notification.retryCount = getNextRetryCount(notification.retryCount)
      try {
        const result = await resendNotification(notification.key)
        if (!didResendNotificationSucceed(result)) {
          throw new Error('notification resend rejected')
        }
        await loadNotifications()
        mobileFeedback.success('重发成功')
      } catch (e) {
        notification.status = previousStatus || 'failed'
        notification.retryCount = rollbackRetryCount(notification.retryCount, previousRetryCount)
        mobileFeedback.error('重发失败')
      }
    }

    const handleBatchResend = async () => {
      const items = notificationData.value.filter((item) => item.status === 'failed')
      if (!items.length) {
        mobileFeedback.info('当前没有可重发的失败通知')
        return
      }
      for (const item of items) {
        await handleResend(item)
      }
      await loadNotifications()
    }

    const loadMore = () => {
      displayCount.value = Math.min(displayCount.value + PAGE_SIZE, notificationData.value.length)
    }

    // ── Lifecycle ───────────────────────────────
    onActivated(() => {
      const context = parseInvestigationContext(route.query)
      if (context.keyword !== undefined) searchText.value = context.keyword
      if (shouldRefreshOnActivation()) void loadNotifications()
    })

    watch(
      () => route.query,
      () => {
        const context = parseInvestigationContext(route.query)
        if (context.keyword !== undefined) searchText.value = context.keyword
        if (
          context.keyword !== undefined ||
          context.serviceId !== undefined ||
          context.range !== undefined ||
          context.start !== undefined
        )
          void loadNotifications()
      }
    )

    watch(
      () => [searchText.value, selectedChannel.value, selectedStatus.value],
      () => {
        applyFilters()
      }
    )

    // ── Render ────────────────────────────────
    return () => (
      <div class="mobile-notification-center">
        {/* ── Header ─────────────────────────── */}
        <header class="mobile-notification-center__header">
          <h2 class="mobile-notification-center__title">通知历史</h2>
          <div class="mobile-notification-center__header-actions">
            <MobileButton
              size="small"
              onClick={loadNotifications}
              class="mobile-notification-center__refresh-btn"
              loading={loading.value}
              icon={() => h(PhArrowsClockwise, { size: 16 })}
            />
          </div>
        </header>

        {/* ── Summary grid ───────────────────── */}
        <div class="mobile-notification-center__summary-grid">
          {[
            { label: '总计', value: notificationData.value.length, tone: 'total' },
            { label: '成功', value: successCount.value, tone: 'success' },
            { label: '失败', value: failedCount.value, tone: 'danger' },
            { label: '成功率', value: successRate.value, tone: 'primary' }
          ].map((item) => (
            <MobileCard key={item.label} size="small" bordered={false} class="mobile-notification-center__summary-card">
              <div
                class={`mobile-notification-center__summary-value mobile-notification-center__summary-value--${item.tone}`}>
                {item.value}
              </div>
              <div class="mobile-notification-center__summary-label">{item.label}</div>
            </MobileCard>
          ))}
        </div>

        {/* ── Search bar ─────────────────────── */}
        <div class="mobile-notification-center__search">
          <MobileInput
            modelValue={searchText.value}
            onUpdate:modelValue={(v) => {
              searchText.value = v as string
            }}
            placeholder="搜索通知内容"
            clearable
            class="mobile-notification-center__search-input"
          />
        </div>

        {/* ── Filter chips ───────────────────── */}
        <div class="mobile-notification-center__filters">
          {/* Channel chips */}
          <div class="mobile-notification-center__chip-row">
            {channelOptions.map((chip) => {
              const active = selectedChannel.value === chip.value
              return (
                <MobileButton
                  key={chip.value}
                  size="small"
                  type={active ? 'primary' : 'ghost'}
                  onClick={() => {
                    selectedChannel.value = chip.value
                  }}>
                  {chip.label}
                </MobileButton>
              )
            })}
          </div>

          {/* Status chips */}
          <div class="mobile-notification-center__chip-row">
            {statusOptions.map((chip) => {
              const active = selectedStatus.value === chip.value
              return (
                <MobileButton
                  key={chip.value}
                  size="small"
                  type={active ? 'primary' : 'ghost'}
                  onClick={() => {
                    selectedStatus.value = chip.value
                  }}>
                  {chip.label}
                </MobileButton>
              )
            })}
          </div>
        </div>

        {/* ── Batch action bar ───────────────── */}
        {failedCount.value > 0 && (
          <div class="mobile-notification-center__action-bar">
            <div class="mobile-notification-center__action-stats">
              <MobileTag type="danger" size="small" plain={false}>
                失败 {failedCount.value}
              </MobileTag>
              <MobileTag type="warning" size="small" plain={false}>
                等待中 {pendingCount.value}
              </MobileTag>
            </div>
            <MobileButton size="small" type="danger" onClick={handleBatchResend}>
              批量重发
            </MobileButton>
          </div>
        )}

        {/* ── Content ────────────────────────── */}
        {loading.value ? (
          <div class="mobile-notification-center__loading">
            <MobileLoading size="large" loading={true} />
          </div>
        ) : loadError.value ? (
          <div class="mobile-notification-center__error">
            <MobileEmpty description={loadError.value}>
              <MobileButton size="small" onClick={loadNotifications} class="mobile-notification-center__retry-btn">
                重试
              </MobileButton>
            </MobileEmpty>
          </div>
        ) : notificationData.value.length === 0 ? (
          <div class="mobile-notification-center__empty">
            <MobileEmpty description="暂无通知记录" />
            <p class="mobile-notification-center__empty-hint">
              {searchText.value || selectedChannel.value || selectedStatus.value
                ? '调整筛选条件可能找到更多结果'
                : '暂无告警通知，系统运行正常'}
            </p>
          </div>
        ) : (
          <div class="mobile-notification-center__list-wrapper">
            <MobileCard size="small" bordered={false} class="mobile-notification-center__list-card">
              {visibleNotifications.value.map((item) => {
                const isExpanded = expandingId.value === item.key
                const chType = channelTypeMap[item.channel] || 'default'
                const chLabel = channelLabelMap[item.channel] || item.channel
                const stType = statusTypeMap[item.status] || 'default'
                const stLabel = statusLabelMap[item.status] || item.status

                return (
                  <div
                    key={item.key}
                    class={[
                      'mobile-notification-center__item',
                      isExpanded && 'mobile-notification-center__item--expanded'
                    ]}>
                    {/* Collapsed row */}
                    <div
                      class="mobile-notification-center__item-row"
                      role="button"
                      tabindex="0"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? '收起' : '展开'}通知：${item.ruleName}`}
                      onClick={() => toggleExpand(item.key)}
                      onKeydown={(event: KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleExpand(item.key)
                        }
                      }}>
                      <div class="mobile-notification-center__item-icon">
                        {h(channelIconMap[item.channel] || PhEnvelope, { size: 18 })}
                      </div>
                      <div class="mobile-notification-center__item-body">
                        <div class="mobile-notification-center__item-top">
                          <span class="mobile-notification-center__item-rule">{item.ruleName}</span>
                          <span class="mobile-notification-center__item-time">{item.sendTime}</span>
                        </div>
                        <div class="mobile-notification-center__item-meta">
                          <span class="mobile-notification-center__item-content">{item.content}</span>
                        </div>
                        <div class="mobile-notification-center__item-tags">
                          <MobileTag size="small" type={chType} plain={false}>
                            {chLabel}
                          </MobileTag>
                          <MobileTag size="small" type={stType} plain={false}>
                            {stLabel}
                          </MobileTag>
                          <span class="mobile-notification-center__item-service">{item.service}</span>
                        </div>
                      </div>
                      {h(PhCaretDown, {
                        size: 16,
                        class: [
                          'mobile-notification-center__expand-icon',
                          isExpanded && 'mobile-notification-center__expand-icon--open'
                        ]
                      })}
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div class="mobile-notification-center__detail-panel">
                        <div class="mobile-notification-center__detail-grid">
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">发送时间</span>
                            <span class="mobile-notification-center__detail-value">{item.sendTime}</span>
                          </div>
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">通知渠道</span>
                            <span class="mobile-notification-center__detail-value">{chLabel}</span>
                          </div>
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">发送状态</span>
                            <MobileTag size="small" type={stType} plain={false}>
                              {stLabel}
                            </MobileTag>
                          </div>
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">重试次数</span>
                            <span class="mobile-notification-center__detail-value">{item.retryCount || 0}</span>
                          </div>
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">服务名称</span>
                            <span class="mobile-notification-center__detail-value">{item.service}</span>
                          </div>
                          <div class="mobile-notification-center__detail-item">
                            <span class="mobile-notification-center__detail-label">接收人</span>
                            <span class="mobile-notification-center__detail-value">{item.recipient}</span>
                          </div>
                          <div class="mobile-notification-center__detail-item mobile-notification-center__detail-item--full">
                            <span class="mobile-notification-center__detail-label">通知内容</span>
                            <span class="mobile-notification-center__detail-value">{item.content || '无'}</span>
                          </div>
                          {item.errorMessage && (
                            <div class="mobile-notification-center__detail-item mobile-notification-center__detail-item--full">
                              <span class="mobile-notification-center__detail-label">错误信息</span>
                              <span class="mobile-notification-center__detail-value mobile-notification-center__detail-value--error">
                                {item.errorMessage}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Detail actions */}
                        {item.status === 'failed' && (
                          <div class="mobile-notification-center__detail-actions">
                            <MobileButton size="small" type="danger" onClick={() => handleResend(item)}>
                              重新发送
                            </MobileButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </MobileCard>

            {/* Load more */}
            {hasMore.value && (
              <div class="mobile-notification-center__load-more">
                <MobileButton type="ghost" onClick={loadMore}>
                  加载更多 ({notificationData.value.length - displayCount.value} 条)
                </MobileButton>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
})
