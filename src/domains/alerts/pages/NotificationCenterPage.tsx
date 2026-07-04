import {
  NCard,
  NTag,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDescriptions,
  NDescriptionsItem,
  NGrid,
  NGridItem,
  NEmpty,
  NSpin
} from 'naive-ui'
import { ref, h, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import DetailDrawer from '@/shared/components/DetailDrawer'
import { fetchNotifications, resendNotification } from '@/api/alerts'
import type { MetricsDatasetScope } from '@/api/metrics'
import type { NotificationItem } from '@/types/monitor'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import {
  didResendNotificationSucceed,
  getNextRetryCount,
  rollbackRetryCount
} from '@/domains/alerts/notificationCenterModel'
import './NotificationCenterPage.scss'

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

export default defineComponent({
  name: 'NotificationCenterPage',
  setup() {
    const route = useRoute()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const searchText = ref('')
    const selectedChannel = ref('')
    const selectedStatus = ref('')
    const serviceIdFilter = ref(route.query.serviceId as string | undefined)
    const showDetailDrawer = ref(false)
    const selectedNotification = ref<any>(null)
    const loading = ref(false)
    const loadError = ref('')
    const allNotifications = ref<NotificationItem[]>([])
    const notificationData = ref<NotificationItem[]>([])

    const applyNotificationFilters = () => {
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
    }

    const loadNotifications = async () => {
      loading.value = true
      loadError.value = ''
      try {
        const res = await fetchNotifications({
          keyword: '',
          channel: '',
          status: '',
          serviceId: serviceIdFilter.value,
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
        applyNotificationFilters()
      } catch (e) {
        console.error(e)
        allNotifications.value = []
        notificationData.value = []
        loadError.value = '通知历史加载失败，请检查告警服务或稍后重试。'
      } finally {
        loading.value = false
      }
    }

    const syncServiceIdFilterFromRoute = () => {
      serviceIdFilter.value = typeof route.query.serviceId === 'string' ? route.query.serviceId : undefined
    }

    const successCount = computed(() => notificationData.value.filter((item) => item.status === 'success').length)
    const failedCount = computed(() => notificationData.value.filter((item) => item.status === 'failed').length)
    const pendingCount = computed(() => notificationData.value.filter((item) => item.status === 'pending').length)
    const failedItems = computed(() => notificationData.value.filter((item) => item.status === 'failed'))
    const channelSummary = computed(() => {
      const counts = new Map<string, number>()
      allNotifications.value.forEach((item) => {
        counts.set(item.channel, (counts.get(item.channel) || 0) + 1)
      })
      return channelOptions.slice(1).map((option) => ({
        channel: option.value,
        label: option.label,
        count: counts.get(option.value) || 0
      }))
    })
    const successRate = computed(() => {
      const total = notificationData.value.length
      if (!total) return '0%'
      return `${((successCount.value / total) * 100).toFixed(1)}%`
    })

    onMounted(() => {
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        serviceIdFilter.value = route.query.serviceId
      }
      loadNotifications()
    })

    watch(
      () => [searchText.value, selectedChannel.value, selectedStatus.value],
      () => {
        applyNotificationFilters()
      }
    )

    watch(
      () => route.query.serviceId,
      () => {
        syncServiceIdFilterFromRoute()
        loadNotifications()
      }
    )

    const channelOptions = [
      { label: '全部渠道', value: '' },
      { label: 'Email', value: 'Email' },
      { label: 'Webhook', value: 'Webhook' },
      { label: '站内通知', value: 'InApp' }
    ]

    const statusOptions = [
      { label: '全部状态', value: '' },
      { label: '发送成功', value: 'success' },
      { label: '发送失败', value: 'failed' },
      { label: '发送中', value: 'pending' }
    ]

    const columns = [
      { title: '发送时间', key: 'sendTime', width: 140 },
      {
        title: '通知内容',
        key: 'content',
        width: 360,
        ellipsis: { tooltip: true },
        render(row: any) {
          return (
            <div class="notification-center-page__content-cell">
              <strong>{row.ruleName}</strong>
              <span>{row.content}</span>
            </div>
          )
        }
      },
      { title: '服务', key: 'service', width: 120 },
      {
        title: '渠道',
        key: 'channel',
        width: 100,
        render(row: any) {
          const channelMap: Record<string, { type: any; text: string }> = {
            Email: { type: 'info', text: 'Email' },
            email: { type: 'info', text: 'Email' },
            Webhook: { type: 'warning', text: 'Webhook' },
            webhook: { type: 'warning', text: 'Webhook' },
            InApp: { type: 'success', text: '站内通知' }
          }
          const config = channelMap[row.channel] || { type: 'default', text: row.channel || '未知' }
          return h(NTag, { type: config.type, size: 'small', bordered: false }, { default: () => config.text })
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 80,
        render(row: any) {
          const statusMap: Record<string, { type: any; text: string }> = {
            success: { type: 'success', text: '成功' },
            failed: { type: 'error', text: '失败' },
            pending: { type: 'warning', text: '发送中' }
          }
          const config = statusMap[row.status] || { type: 'default', text: row.status || '未知' }
          return h(NTag, { type: config.type, size: 'small', bordered: false }, { default: () => config.text })
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        render(row: any) {
          return (
            <div class="notification-center-page__table-actions">
              <NButton size="small" type="primary" secondary onClick={() => handleViewDetail(row)}>
                详情
              </NButton>
              {row.status === 'failed' ? (
                <NButton size="small" type="warning" secondary onClick={() => handleResend(row)}>
                  重发
                </NButton>
              ) : null}
            </div>
          )
        }
      }
    ]

    const handleViewDetail = (notification: any) => {
      selectedNotification.value = notification
      showDetailDrawer.value = true
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
        window.$message.success('重发成功')
      } catch (e) {
        notification.status = previousStatus || 'failed'
        notification.retryCount = rollbackRetryCount(notification.retryCount, previousRetryCount)
        window.$message.error('重发失败')
      }
    }

    const handleBatchResend = async () => {
      const items = notificationData.value.filter((item) => item.status === 'failed')
      if (!items.length) {
        window.$message.info('当前没有可重发的失败通知')
        return
      }
      for (const item of items) {
        await handleResend(item)
      }
      await loadNotifications()
    }

    return () => (
      <div class="notification-center-page">
        <PageHeader title="通知历史" subtitle="告警触发后的通知记录与投递结果" />

        <section class="notification-center-page__toolbar-card">
          <div class="notification-center-page__toolbar-primary">
            <NInput
              v-model:value={searchText.value}
              placeholder="搜索通知内容"
              clearable
              style={{ width: '200px' }}
              onClear={loadNotifications}
            />
            <NSelect
              v-model:value={selectedChannel.value}
              options={channelOptions}
              placeholder="渠道"
              style={{ width: '120px' }}
            />
            <NSelect
              v-model:value={selectedStatus.value}
              options={statusOptions}
              placeholder="状态"
              style={{ width: '110px' }}
            />
          </div>
          <div class="notification-center-page__toolbar-secondary">
            <NButton loading={loading.value} onClick={loadNotifications}>
              刷新
            </NButton>
          </div>
        </section>

        <NGrid cols={4} xGap={16} class="notification-center-page__summary-grid">
          {[
            { label: '总通知数', value: notificationData.value.length },
            { label: '发送成功', value: successCount.value },
            { label: '发送失败', value: failedCount.value },
            { label: '成功率', value: successRate.value }
          ].map((item) => (
            <NGridItem key={item.label}>
              <NCard bordered={false} class="notification-center-page__summary-card">
                <div class="notification-center-page__summary-label">{item.label}</div>
                <div class="notification-center-page__summary-value">{item.value}</div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>

        <NCard bordered={false} class="notification-center-page__action-card">
          <div class="notification-center-page__action-row">
            <div class="notification-center-page__action-copy">
              <div class="notification-center-page__action-title">通知操作</div>
              <div class="notification-center-page__action-desc">对当前筛选范围内的失败通知进行批量重发。</div>
            </div>
            <NSpace class="notification-center-page__action-buttons">
              <NButton type="primary" onClick={handleBatchResend} disabled={failedCount.value === 0}>
                批量重发失败通知
              </NButton>
              <NTag type="info" bordered={false}>
                待发送：{pendingCount.value}
              </NTag>
              <NTag type={failedCount.value > 0 ? 'error' : 'success'} bordered={false}>
                失败：{failedCount.value}
              </NTag>
            </NSpace>
          </div>
        </NCard>

        <section class="notification-center-page__table-card">
          <div class="notification-center-page__table-header">
            <div>
              <div class="notification-center-page__section-title">通知清单</div>
              <div class="notification-center-page__section-desc">
                渠道汇总：
                {channelSummary.value
                  .filter((c) => c.count > 0)
                  .map((c) => `${c.label}（${c.count}）`)
                  .join(' · ') || '暂无'}
              </div>
            </div>
          </div>
          {loading.value ? (
            <div class="notification-center-page__table-loading">
              <NSpin size="large" />
            </div>
          ) : loadError.value ? (
            <NEmpty description={loadError.value} class="notification-center-page__empty-state">
              {{
                extra: () => (
                  <NButton type="primary" secondary onClick={loadNotifications}>
                    重试加载
                  </NButton>
                )
              }}
            </NEmpty>
          ) : (
            <div class="notification-center-page__table-shell">
              <ResultTable
                class="notification-center-page__table"
                loading={false}
                columns={columns}
                data={notificationData.value}
                pagination={{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }}
                bordered={false}
                singleLine={false}
                flexHeight={false}
                rowKey={(row: any) => row.key}
              />
            </div>
          )}
        </section>

        <DetailDrawer
          show={showDetailDrawer.value}
          title="通知详情"
          width="md"
          onUpdate:show={(value: boolean) => {
            showDetailDrawer.value = value
          }}>
          {selectedNotification.value && (
            <NDescriptions column={1} bordered>
              <NDescriptionsItem label="发送时间">{selectedNotification.value.sendTime}</NDescriptionsItem>
              <NDescriptionsItem label="告警规则">{selectedNotification.value.ruleName}</NDescriptionsItem>
              <NDescriptionsItem label="服务">{selectedNotification.value.service}</NDescriptionsItem>
              <NDescriptionsItem label="通知渠道">{selectedNotification.value.channel}</NDescriptionsItem>
              <NDescriptionsItem label="发送状态">{selectedNotification.value.status}</NDescriptionsItem>
              <NDescriptionsItem label="通知内容">{selectedNotification.value.content}</NDescriptionsItem>
            </NDescriptions>
          )}
        </DetailDrawer>
      </div>
    )
  }
})
