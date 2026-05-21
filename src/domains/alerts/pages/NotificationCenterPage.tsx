import {
  NCard,
  NTag,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NDescriptions,
  NDescriptionsItem,
  NGrid,
  NGridItem,
  NEmpty
} from 'naive-ui'
import { ref, h, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTimeStore } from '@/store/useTimeStore'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import DetailDrawer from '@/shared/components/DetailDrawer'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
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

export default defineComponent({
  name: 'NotificationCenterPage',
  setup() {
    const route = useRoute()
    const timeStore = useTimeStore()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const searchText = ref('')
    const selectedChannel = ref('')
    const selectedStatus = ref('')
    const serviceIdFilter = ref(route.query.serviceId as string | undefined)
    const dateRange = ref<[number, number] | null>(null)
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
          scope: datasetScope.value,
          startTime: dateRange.value?.[0] || timeStore.startTime,
          endTime: dateRange.value?.[1] || timeStore.endTime
        })
        allNotifications.value = (res || []).map((item: any, index: number) => ({
          key: item.id || `notification-${index}`,
          sendTime: item.sentAt || item.sendTime || '-',
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
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        serviceIdFilter.value = route.query.serviceId
      }
      loadNotifications()
    })

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => {
        loadNotifications()
      }
    )

    watch(
      () => [searchText.value, selectedChannel.value, selectedStatus.value],
      () => {
        applyNotificationFilters()
      }
    )

    const channelOptions = [
      { label: '全部渠道', value: '' },
      { label: '邮件', value: 'email' },
      { label: 'Slack', value: 'slack' },
      { label: 'Webhook', value: 'webhook' },
      { label: '短信', value: 'sms' }
    ]

    const statusOptions = [
      { label: '全部状态', value: '' },
      { label: '发送成功', value: 'success' },
      { label: '发送失败', value: 'failed' },
      { label: '发送中', value: 'pending' }
    ]

    const columns = [
      { title: '发送时间', key: 'sendTime', width: 180 },
      { title: '告警规则', key: 'ruleName', width: 200 },
      { title: '服务', key: 'service', width: 150 },
      {
        title: '通知渠道',
        key: 'channel',
        width: 100,
        render(row: any) {
          const channelMap = {
            email: { type: 'info', text: '邮件' },
            slack: { type: 'success', text: 'Slack' },
            webhook: { type: 'warning', text: 'Webhook' },
            sms: { type: 'error', text: '短信' }
          }
          const config = channelMap[row.channel as keyof typeof channelMap] || {
            type: 'default',
            text: row.channel || '未知'
          }
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      { title: '接收者', key: 'recipient', width: 200, ellipsis: { tooltip: true } },
      {
        title: '发送状态',
        key: 'status',
        width: 100,
        render(row: any) {
          const statusMap = {
            success: { type: 'success', text: '成功' },
            failed: { type: 'error', text: '失败' },
            pending: { type: 'warning', text: '发送中' }
          }
          const config = statusMap[row.status as keyof typeof statusMap] || {
            type: 'default',
            text: row.status || '未知'
          }
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      { title: '重试次数', key: 'retryCount', width: 100 },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        render(row: any) {
          return h(NSpace, null, {
            default: () =>
              [
                h(
                  NButton,
                  { size: 'small', type: 'primary', onClick: () => handleViewDetail(row) },
                  { default: () => '详情' }
                ),
                row.status === 'failed'
                  ? h(
                      NButton,
                      { size: 'small', type: 'warning', onClick: () => handleResend(row) },
                      { default: () => '重发' }
                    )
                  : null
              ].filter(Boolean)
          })
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

    const handleReset = async () => {
      searchText.value = ''
      serviceIdFilter.value = undefined
      selectedChannel.value = ''
      selectedStatus.value = ''
      dateRange.value = null
      await loadNotifications()
    }

    const handleBatchResend = async () => {
      const failedItems = notificationData.value.filter((item) => item.status === 'failed')
      if (!failedItems.length) {
        window.$message.info('当前没有可重发的失败通知')
        return
      }

      for (const item of failedItems) {
        await handleResend(item)
      }
      await loadNotifications()
    }

    watch(
      () => route.query.serviceId,
      () => {
        syncServiceIdFilterFromRoute()
        loadNotifications()
      }
    )

    return () => (
      <div class="notification-center-page">
        <PageHeader title="通知历史" subtitle="告警触发后的通知记录与投递结果" />
        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => {
            timeStore.setTimeRange(range)
            loadNotifications()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadNotifications()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadNotifications()
          }}
        />

        <NCard bordered={false} class="notification-center-page__channel-card">
          <div class="notification-center-page__section-note">渠道列表</div>
          <div class="notification-center-page__channel-actions">
            {channelSummary.value.map((item) => (
              <NButton
                secondary
                type={selectedChannel.value === item.channel ? 'primary' : 'default'}
                onClick={() => {
                  selectedChannel.value = selectedChannel.value === item.channel ? '' : item.channel
                  applyNotificationFilters()
                }}>
                {item.label}（{item.count}）
              </NButton>
            ))}
          </div>
        </NCard>

        <NCard bordered={false} class="notification-center-page__filter-card">
          <NSpace>
            <NInput v-model:value={searchText.value} placeholder="搜索告警规则" style={{ width: '200px' }} />
            <NSelect
              v-model:value={selectedChannel.value}
              options={channelOptions}
              placeholder="选择渠道"
              style={{ width: '120px' }}
            />
            <NSelect
              v-model:value={selectedStatus.value}
              options={statusOptions}
              placeholder="选择状态"
              style={{ width: '120px' }}
            />
            <NDatePicker v-model:value={dateRange.value} type="daterange" clearable style={{ width: '240px' }} />
            <NButton type="primary" onClick={loadNotifications}>
              搜索
            </NButton>
            <NButton onClick={handleReset}>重置</NButton>
          </NSpace>
        </NCard>

        <NGrid cols={4} xGap={16} class="notification-center-page__summary-grid">
          <NGridItem>
            <NCard bordered={false} class="notification-center-page__summary-card">
              <NDescriptions column={1} labelPlacement="top">
                <NDescriptionsItem label="总通知数">{notificationData.value.length}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="notification-center-page__summary-card">
              <NDescriptions column={1} labelPlacement="top">
                <NDescriptionsItem label="发送成功">{successCount.value}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="notification-center-page__summary-card">
              <NDescriptions column={1} labelPlacement="top">
                <NDescriptionsItem label="发送失败">{failedCount.value}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="notification-center-page__summary-card">
              <NDescriptions column={1} labelPlacement="top">
                <NDescriptionsItem label="成功率">{successRate.value}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard bordered={false} class="notification-center-page__batch-card">
          <NSpace>
            <NButton type="primary" onClick={handleBatchResend} disabled={failedCount.value === 0}>
              批量重发失败通知
            </NButton>
            <NTag type="info">待发送：{pendingCount.value}</NTag>
            <NTag type={failedCount.value > 0 ? 'error' : 'success'}>失败：{failedCount.value}</NTag>
          </NSpace>
        </NCard>

        <NCard bordered={false} class="notification-center-page__failed-card">
          <div class="notification-center-page__section-note">失败面板</div>
          {loadError.value && !loading.value ? (
            <NEmpty description={loadError.value} class="notification-center-page__empty-state">
              {{
                extra: () => (
                  <NButton type="primary" secondary onClick={loadNotifications}>
                    重试加载
                  </NButton>
                )
              }}
            </NEmpty>
          ) : failedItems.value.length ? (
            <div class="notification-center-page__failed-list">
              {failedItems.value.map((item) => (
                <div class="notification-center-page__failed-item" key={item.key}>
                  <div class="notification-center-page__failed-item-header">
                    <div>
                      <div class="notification-center-page__failed-item-title">{item.ruleName}</div>
                      <div class="notification-center-page__failed-item-meta">
                        {item.channel} · {item.recipient} · {item.sendTime}
                      </div>
                      <div class="notification-center-page__failed-item-error">{item.errorMessage || '发送失败'}</div>
                    </div>
                    <NButton size="small" type="warning" onClick={() => handleResend(item)}>
                      重发
                    </NButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NEmpty description="暂无失败通知" class="notification-center-page__empty-state" />
          )}
        </NCard>

        <NCard bordered={false} class="notification-center-page__table-card" contentStyle={{ padding: 0 }}>
          <div class="notification-center-page__table-shell">
            {loadError.value && !loading.value ? (
              <NEmpty description={loadError.value} class="notification-center-page__empty-state" />
            ) : (
              <ResultTable
                class="notification-center-page__table"
                loading={loading.value}
                columns={columns}
                data={notificationData.value}
                pagination={{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }}
                rowKey={(row: any) => row.key}
              />
            )}
          </div>
        </NCard>

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
              <NDescriptionsItem label="接收者">{selectedNotification.value.recipient}</NDescriptionsItem>
              <NDescriptionsItem label="发送状态">{selectedNotification.value.status}</NDescriptionsItem>
              <NDescriptionsItem label="重试次数">{selectedNotification.value.retryCount}</NDescriptionsItem>
              <NDescriptionsItem label="通知内容">{selectedNotification.value.content}</NDescriptionsItem>
              <NDescriptionsItem label="错误信息">{selectedNotification.value.errorMessage || '-'}</NDescriptionsItem>
            </NDescriptions>
          )}
        </DetailDrawer>
      </div>
    )
  }
})
