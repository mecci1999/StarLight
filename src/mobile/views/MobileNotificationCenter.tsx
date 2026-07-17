import { defineComponent, ref, onMounted, computed, watch, h } from 'vue'
import { NCard, NTag, NButton, NInput, NSpin, NEmpty, NIcon, useMessage } from 'naive-ui'
import { PhEnvelope, PhGlobe, PhDeviceMobile, PhArrowsClockwise, PhCaretDown } from '@phosphor-icons/vue'
import { fetchNotifications, resendNotification } from '@/api/alerts'
import type { MetricsDatasetScope } from '@/api/metrics'
import type { NotificationItem } from '@/types/monitor'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
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

const channelTypeMap: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
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

const statusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  success: 'success',
  failed: 'error',
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
    const message = useMessage()
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
        const res = await fetchNotifications({
          keyword: '',
          channel: '',
          status: '',
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
        message.success('重发成功')
      } catch (e) {
        notification.status = previousStatus || 'failed'
        notification.retryCount = rollbackRetryCount(notification.retryCount, previousRetryCount)
        message.error('重发失败')
      }
    }

    const handleBatchResend = async () => {
      const items = notificationData.value.filter((item) => item.status === 'failed')
      if (!items.length) {
        message.info('当前没有可重发的失败通知')
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
    onMounted(() => {
      loadNotifications()
    })

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
            <NButton
              size="tiny"
              quaternary
              onClick={loadNotifications}
              class="mobile-notification-center__refresh-btn"
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
        <div class="mobile-notification-center__summary-grid">
          {[
            { label: '总计', value: notificationData.value.length, color: 'var(--color-text-1)' },
            { label: '成功', value: successCount.value, color: 'var(--color-success-6)' },
            { label: '失败', value: failedCount.value, color: 'var(--color-danger-6)' },
            { label: '成功率', value: successRate.value, color: 'var(--color-primary-6)' }
          ].map((item) => (
            <NCard key={item.label} size="small" bordered={false} class="mobile-notification-center__summary-card">
              <div class="mobile-notification-center__summary-value" style={{ color: item.color }}>
                {item.value}
              </div>
              <div class="mobile-notification-center__summary-label">{item.label}</div>
            </NCard>
          ))}
        </div>

        {/* ── Search bar ─────────────────────── */}
        <div class="mobile-notification-center__search">
          <NInput
            v-model:value={searchText.value}
            placeholder="搜索通知内容"
            clearable
            size="small"
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
                <NButton
                  key={chip.value}
                  size="tiny"
                  round
                  type={active ? 'primary' : 'default'}
                  ghost={!active}
                  onClick={() => {
                    selectedChannel.value = chip.value
                  }}>
                  {chip.label}
                </NButton>
              )
            })}
          </div>

          {/* Status chips */}
          <div class="mobile-notification-center__chip-row">
            {statusOptions.map((chip) => {
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
        </div>

        {/* ── Batch action bar ───────────────── */}
        {failedCount.value > 0 && (
          <div class="mobile-notification-center__action-bar">
            <div class="mobile-notification-center__action-stats">
              <NTag type="error" size="small" bordered={false}>
                失败 {failedCount.value}
              </NTag>
              <NTag type="warning" size="small" bordered={false}>
                等待中 {pendingCount.value}
              </NTag>
            </div>
            <NButton size="small" type="error" secondary onClick={handleBatchResend}>
              批量重发
            </NButton>
          </div>
        )}

        {/* ── Content ────────────────────────── */}
        {loading.value ? (
          <div class="mobile-notification-center__loading">
            <NSpin size="large" />
          </div>
        ) : loadError.value ? (
          <div class="mobile-notification-center__error">
            <NEmpty description={loadError.value} />
            <NButton size="small" onClick={loadNotifications} class="mobile-notification-center__retry-btn">
              重试
            </NButton>
          </div>
        ) : notificationData.value.length === 0 ? (
          <div class="mobile-notification-center__empty">
            <NEmpty description="暂无通知记录" />
            <p class="mobile-notification-center__empty-hint">
              {searchText.value || selectedChannel.value || selectedStatus.value
                ? '调整筛选条件可能找到更多结果'
                : '暂无告警通知，系统运行正常'}
            </p>
          </div>
        ) : (
          <div class="mobile-notification-center__list-wrapper">
            <NCard size="small" bordered={false} class="mobile-notification-center__list-card">
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
                    <div class="mobile-notification-center__item-row" onClick={() => toggleExpand(item.key)}>
                      <div class="mobile-notification-center__item-icon">
                        <NIcon size={18}>{h(channelIconMap[item.channel] || PhEnvelope)}</NIcon>
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
                          <NTag size="tiny" type={chType as any} bordered={false}>
                            {chLabel}
                          </NTag>
                          <NTag size="tiny" type={stType as any} bordered={false}>
                            {stLabel}
                          </NTag>
                          <span class="mobile-notification-center__item-service">{item.service}</span>
                        </div>
                      </div>
                      <NIcon
                        size={16}
                        class={[
                          'mobile-notification-center__expand-icon',
                          isExpanded && 'mobile-notification-center__expand-icon--open'
                        ]}>
                        <PhCaretDown />
                      </NIcon>
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
                            <NTag size="tiny" type={stType as any} bordered={false}>
                              {stLabel}
                            </NTag>
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
                            <NButton size="small" type="warning" secondary onClick={() => handleResend(item)}>
                              重新发送
                            </NButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </NCard>

            {/* Load more */}
            {hasMore.value && (
              <div class="mobile-notification-center__load-more">
                <NButton text type="primary" onClick={loadMore}>
                  加载更多 ({notificationData.value.length - displayCount.value} 条)
                </NButton>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
})
