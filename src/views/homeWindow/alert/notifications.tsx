import {
  NCard,
  NDataTable,
  NTag,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NModal,
  NDescriptions,
  NDescriptionsItem
} from 'naive-ui'
import { ref, h } from 'vue'
import { NotificationsOutline } from '@vicons/ionicons5'
import SectionHeader from '@/components/common/SectionHeader'

export default defineComponent({
  name: 'NotificationHistory',
  setup() {
    const searchText = ref('')
    const selectedChannel = ref('')
    const selectedStatus = ref('')
    const dateRange = ref<[number, number] | null>(null)
    const showDetailModal = ref(false)
    const selectedNotification = ref<any>(null)

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
      {
        title: '发送时间',
        key: 'sendTime',
        width: 180
      },
      {
        title: '告警规则',
        key: 'ruleName',
        width: 200
      },
      {
        title: '服务',
        key: 'service',
        width: 150
      },
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
          const config = channelMap[row.channel as keyof typeof channelMap]
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      {
        title: '接收者',
        key: 'recipient',
        width: 200,
        ellipsis: {
          tooltip: true
        }
      },
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
          const config = statusMap[row.status as keyof typeof statusMap]
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      {
        title: '重试次数',
        key: 'retryCount',
        width: 100
      },
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
                  {
                    size: 'small',
                    type: 'primary',
                    onClick: () => handleViewDetail(row)
                  },
                  { default: () => '详情' }
                ),
                row.status === 'failed'
                  ? h(
                      NButton,
                      {
                        size: 'small',
                        type: 'warning',
                        onClick: () => handleResend(row)
                      },
                      { default: () => '重发' }
                    )
                  : null
              ].filter(Boolean)
          })
        }
      }
    ]

    const notificationData = ref([
      {
        key: '1',
        sendTime: '2024-01-15 14:30:25',
        ruleName: 'CPU使用率过高',
        service: 'user-service',
        channel: 'email',
        recipient: 'admin@example.com, ops@example.com',
        status: 'success',
        retryCount: 0,
        content: 'CPU使用率超过90%，当前值：95%',
        errorMessage: ''
      },
      {
        key: '2',
        sendTime: '2024-01-15 14:25:10',
        ruleName: '内存使用率严重告警',
        service: 'order-service',
        channel: 'slack',
        recipient: '#alerts',
        status: 'success',
        retryCount: 0,
        content: '内存使用率超过80%，当前值：85%',
        errorMessage: ''
      },
      {
        key: '3',
        sendTime: '2024-01-15 14:20:45',
        ruleName: '响应时间过长',
        service: 'payment-service',
        channel: 'webhook',
        recipient: 'https://api.example.com/webhook',
        status: 'failed',
        retryCount: 3,
        content: '响应时间超过5秒，当前值：8.5秒',
        errorMessage: '连接超时：无法连接到目标URL'
      },
      {
        key: '4',
        sendTime: '2024-01-15 14:15:30',
        ruleName: 'QPS异常下降',
        service: 'user-service',
        channel: 'sms',
        recipient: '+86 138****8888',
        status: 'pending',
        retryCount: 1,
        content: 'QPS异常下降，当前值：50/s，正常值：1000/s',
        errorMessage: ''
      },
      {
        key: '5',
        sendTime: '2024-01-15 14:10:15',
        ruleName: '服务重启完成',
        service: 'order-service',
        channel: 'email',
        recipient: 'admin@example.com',
        status: 'success',
        retryCount: 0,
        content: '服务重启完成',
        errorMessage: ''
      }
    ])

    const handleViewDetail = (notification: any) => {
      selectedNotification.value = notification
      showDetailModal.value = true
    }

    const handleResend = (notification: any) => {
      notification.status = 'pending'
      notification.retryCount += 1
      // 模拟重发逻辑
      setTimeout(() => {
        notification.status = 'success'
      }, 2000)
    }

    return () => (
      <div class="p-24px h-full bg-gray-50/50 flex flex-col overflow-hidden">
        <SectionHeader title="通知历史" subtitle="告警触发后的通知记录" icon={NotificationsOutline} />

        {/* 筛选面板 */}
        <NCard bordered={false} class="mb-16px shadow-sm rounded-lg">
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
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary">查询</NButton>
            <NButton>重置</NButton>
            <NButton type="error">批量重发</NButton>
          </NSpace>
        </NCard>

        {/* 统计面板 */}
        <div class="grid grid-cols-4 gap-16px mb-16px">
          <NCard bordered={false} class="shadow-sm rounded-lg">
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-success]">156</div>
              <div class="text-14px text-[--color-text-3]">发送成功</div>
            </div>
          </NCard>
          <NCard bordered={false} class="shadow-sm rounded-lg">
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-error]">8</div>
              <div class="text-14px text-[--color-text-3]">发送失败</div>
            </div>
          </NCard>
          <NCard bordered={false} class="shadow-sm rounded-lg">
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-warning]">3</div>
              <div class="text-14px text-[--color-text-3]">发送中</div>
            </div>
          </NCard>
          <NCard bordered={false} class="shadow-sm rounded-lg">
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-info]">95.2%</div>
              <div class="text-14px text-[--color-text-3]">成功率</div>
            </div>
          </NCard>
        </div>

        {/* 通知列表 */}
        <NCard bordered={false} class="flex-1 shadow-sm rounded-lg" contentStyle={{ padding: 0 }}>
          <div class="p-4 h-full flex flex-col">
            <NDataTable
              class="flex-1"
              flex-height
              columns={columns}
              data={notificationData.value}
              pagination={{
                pageSize: 10,
                showSizePicker: true,
                pageSizes: [10, 20, 50]
              }}
              bordered={false}
              singleLine={false}
              rowKey={(row: any) => row.key}
            />
          </div>
        </NCard>

        {/* 详情模态框 */}
        <NModal v-model:show={showDetailModal.value} preset="dialog" title="通知详情">
          {selectedNotification.value && (
            <NDescriptions labelPlacement="left" bordered>
              <NDescriptionsItem label="发送时间">{selectedNotification.value.sendTime}</NDescriptionsItem>
              <NDescriptionsItem label="告警规则">{selectedNotification.value.ruleName}</NDescriptionsItem>
              <NDescriptionsItem label="服务">{selectedNotification.value.service}</NDescriptionsItem>
              <NDescriptionsItem label="通知渠道">{selectedNotification.value.channel}</NDescriptionsItem>
              <NDescriptionsItem label="接收者">{selectedNotification.value.recipient}</NDescriptionsItem>
              <NDescriptionsItem label="发送状态">
                <NTag
                  type={
                    selectedNotification.value.status === 'success'
                      ? 'success'
                      : selectedNotification.value.status === 'failed'
                        ? 'error'
                        : 'warning'
                  }>
                  {selectedNotification.value.status === 'success'
                    ? '成功'
                    : selectedNotification.value.status === 'failed'
                      ? '失败'
                      : '发送中'}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="重试次数">{selectedNotification.value.retryCount}</NDescriptionsItem>
              <NDescriptionsItem label="通知内容" span={2}>
                <div class="bg-[--color-bg-2] p-12px rounded-4px">{selectedNotification.value.content}</div>
              </NDescriptionsItem>
              {selectedNotification.value.errorMessage && (
                <NDescriptionsItem label="错误信息" span={2}>
                  <div class="bg-[--color-error-bg] text-[--color-error] p-12px rounded-4px">
                    {selectedNotification.value.errorMessage}
                  </div>
                </NDescriptionsItem>
              )}
            </NDescriptions>
          )}
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showDetailModal.value = false)}>关闭</NButton>
            {selectedNotification.value?.status === 'failed' && (
              <NButton type="primary" onClick={() => handleResend(selectedNotification.value)}>
                重发
              </NButton>
            )}
          </div>
        </NModal>
      </div>
    )
  }
})
