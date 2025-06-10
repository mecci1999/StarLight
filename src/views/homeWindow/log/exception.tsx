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
  NCode,
  NTabs,
  NTabPane
} from 'naive-ui'
import { ref, h } from 'vue'

export default defineComponent({
  name: 'ExceptionAnalysis',
  setup() {
    const searchText = ref('')
    const selectedService = ref('')
    const selectedType = ref('')
    const dateRange = ref<[number, number] | null>(null)
    const showDetailModal = ref(false)
    const selectedException = ref<any>(null)
    const activeTab = ref('list')

    const serviceOptions = [
      { label: '全部服务', value: '' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    const typeOptions = [
      { label: '全部类型', value: '' },
      { label: 'SQLException', value: 'SQLException' },
      { label: 'NullPointerException', value: 'NullPointerException' },
      { label: 'TimeoutException', value: 'TimeoutException' },
      { label: 'ValidationException', value: 'ValidationException' }
    ]

    const columns = [
      {
        title: '首次出现',
        key: 'firstOccurrence',
        width: 180
      },
      {
        title: '最后出现',
        key: 'lastOccurrence',
        width: 180
      },
      {
        title: '服务',
        key: 'service',
        width: 150
      },
      {
        title: '异常类型',
        key: 'exceptionType',
        width: 180,
        render(row: any) {
          return h(NTag, { type: 'error', size: 'small' }, { default: () => row.exceptionType })
        }
      },
      {
        title: '异常消息',
        key: 'message',
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '出现次数',
        key: 'count',
        width: 100,
        render(row: any) {
          return h(
            'span',
            {
              class: row.count > 10 ? 'text-[--color-error] font-600' : 'text-[--color-text-1]'
            },
            row.count
          )
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render(row: any) {
          const statusMap = {
            active: { type: 'error', text: '活跃' },
            resolved: { type: 'success', text: '已解决' },
            investigating: { type: 'warning', text: '调查中' }
          }
          const config = statusMap[row.status as keyof typeof statusMap]
          return h(NTag, { type: config.type as any, size: 'small' }, { default: () => config.text })
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        render(row: any) {
          return h(NSpace, null, {
            default: () => [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  onClick: () => handleViewDetail(row)
                },
                { default: () => '详情' }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: 'warning'
                },
                { default: () => '标记' }
              )
            ]
          })
        }
      }
    ]

    const exceptionData = ref([
      {
        key: '1',
        firstOccurrence: '2024-01-15 10:30:25',
        lastOccurrence: '2024-01-15 14:30:25',
        service: 'user-service',
        exceptionType: 'SQLException',
        message: 'Connection timeout after 30 seconds',
        count: 23,
        status: 'active',
        stackTrace: `java.sql.SQLException: Connection timeout after 30 seconds\n\tat com.mysql.cj.jdbc.ConnectionImpl.connectOneTryOnly(ConnectionImpl.java:956)\n\tat com.mysql.cj.jdbc.ConnectionImpl.createNewIO(ConnectionImpl.java:826)\n\tat com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:456)\n\tat com.mysql.cj.jdbc.ConnectionImpl.getInstance(ConnectionImpl.java:246)\n\tat com.mysql.cj.jdbc.NonRegisteringDriver.connect(NonRegisteringDriver.java:197)\n\tat java.sql.DriverManager.getConnection(DriverManager.java:664)\n\tat com.example.user.dao.UserDao.getConnection(UserDao.java:45)\n\tat com.example.user.service.UserService.findById(UserService.java:78)`,
        relatedAlerts: ['CPU使用率过高', '数据库连接池告警']
      },
      {
        key: '2',
        firstOccurrence: '2024-01-15 12:15:10',
        lastOccurrence: '2024-01-15 14:25:10',
        service: 'order-service',
        exceptionType: 'NullPointerException',
        message: 'Cannot invoke method on null object',
        count: 8,
        status: 'investigating',
        stackTrace: `java.lang.NullPointerException: Cannot invoke "com.example.order.model.Order.getId()" because "order" is null\n\tat com.example.order.service.OrderService.processOrder(OrderService.java:123)\n\tat com.example.order.controller.OrderController.createOrder(OrderController.java:67)\n\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)`,
        relatedAlerts: ['订单处理异常']
      },
      {
        key: '3',
        firstOccurrence: '2024-01-15 09:45:30',
        lastOccurrence: '2024-01-15 11:20:45',
        service: 'payment-service',
        exceptionType: 'TimeoutException',
        message: 'Payment gateway timeout',
        count: 5,
        status: 'resolved',
        stackTrace: `java.util.concurrent.TimeoutException: Payment gateway timeout\n\tat com.example.payment.gateway.PaymentGateway.processPayment(PaymentGateway.java:89)\n\tat com.example.payment.service.PaymentService.pay(PaymentService.java:156)\n\tat com.example.payment.controller.PaymentController.processPayment(PaymentController.java:45)`,
        relatedAlerts: ['支付网关响应超时']
      }
    ])

    // 聚类分析数据
    const clusterData = ref([
      {
        key: '1',
        cluster: 'Database Connection Issues',
        count: 45,
        services: ['user-service', 'order-service'],
        commonPattern: 'Connection timeout, Pool exhausted',
        severity: 'high'
      },
      {
        key: '2',
        cluster: 'Null Pointer Exceptions',
        count: 23,
        services: ['order-service', 'payment-service'],
        commonPattern: 'Null object reference in business logic',
        severity: 'medium'
      },
      {
        key: '3',
        cluster: 'Validation Errors',
        count: 12,
        services: ['user-service'],
        commonPattern: 'Invalid input format, Missing required fields',
        severity: 'low'
      }
    ])

    const clusterColumns = [
      {
        title: '异常聚类',
        key: 'cluster',
        width: 200
      },
      {
        title: '出现次数',
        key: 'count',
        width: 100
      },
      {
        title: '涉及服务',
        key: 'services',
        width: 200,
        render(row: any) {
          return row.services.map((service: string) =>
            h(NTag, { size: 'small', style: { marginRight: '4px' } }, { default: () => service })
          )
        }
      },
      {
        title: '共同模式',
        key: 'commonPattern',
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '严重程度',
        key: 'severity',
        width: 100,
        render(row: any) {
          const severityMap = {
            high: { type: 'error', text: '高' },
            medium: { type: 'warning', text: '中' },
            low: { type: 'info', text: '低' }
          }
          const config = severityMap[row.severity as keyof typeof severityMap]
          return h(NTag, { type: config.type as any, size: 'small' }, { default: () => config.text })
        }
      }
    ]

    const handleViewDetail = (exception: any) => {
      selectedException.value = exception
      showDetailModal.value = true
    }

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">异常分析</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">聚类展示异常日志、堆栈分析、关联告警</p>
        </div>

        {/* 筛选面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NInput v-model:value={searchText.value} placeholder="搜索异常信息" style={{ width: '200px' }} />
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions}
              placeholder="选择服务"
              style={{ width: '150px' }}
            />
            <NSelect
              v-model:value={selectedType.value}
              options={typeOptions}
              placeholder="选择类型"
              style={{ width: '180px' }}
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary">查询</NButton>
            <NButton>重置</NButton>
          </NSpace>
        </NCard>

        {/* 统计面板 */}
        <div class="grid grid-cols-4 gap-16px mb-16px">
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-error]">36</div>
              <div class="text-14px text-[--color-text-3]">活跃异常</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-warning]">15</div>
              <div class="text-14px text-[--color-text-3]">调查中</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-success]">89</div>
              <div class="text-14px text-[--color-text-3]">已解决</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-info]">3</div>
              <div class="text-14px text-[--color-text-3]">异常聚类</div>
            </div>
          </NCard>
        </div>

        {/* 主要内容 */}
        <NCard>
          <NTabs v-model:value={activeTab.value} type="line">
            <NTabPane name="list" tab="异常列表">
              <NDataTable
                columns={columns}
                data={exceptionData.value}
                pagination={{
                  pageSize: 10,
                  showSizePicker: true,
                  pageSizes: [10, 20, 50]
                }}
                bordered={false}
                singleLine={false}
                rowKey={(row: any) => row.key}
              />
            </NTabPane>

            <NTabPane name="cluster" tab="聚类分析">
              <NDataTable
                columns={clusterColumns}
                data={clusterData.value}
                pagination={false}
                bordered={false}
                singleLine={false}
                rowKey={(row: any) => row.key}
              />
            </NTabPane>
          </NTabs>
        </NCard>

        {/* 异常详情模态框 */}
        <NModal v-model:show={showDetailModal.value} preset="dialog" title="异常详情" style={{ width: '900px' }}>
          {selectedException.value && (
            <div class="space-y-16px">
              <div class="grid grid-cols-2 gap-16px">
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">首次出现</div>
                  <div class="text-14px">{selectedException.value.firstOccurrence}</div>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">最后出现</div>
                  <div class="text-14px">{selectedException.value.lastOccurrence}</div>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">服务</div>
                  <div class="text-14px">{selectedException.value.service}</div>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">出现次数</div>
                  <div class="text-14px font-600">{selectedException.value.count}</div>
                </div>
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">异常类型</div>
                <NTag type="error">{selectedException.value.exceptionType}</NTag>
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">异常消息</div>
                <div class="bg-[--color-bg-2] p-12px rounded-4px text-14px">{selectedException.value.message}</div>
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">堆栈跟踪</div>
                <NCode code={selectedException.value.stackTrace} language="java" wordWrap />
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">关联告警</div>
                <NSpace>
                  {selectedException.value.relatedAlerts.map((alert: string) =>
                    h(NTag, { type: 'warning', size: 'small' }, { default: () => alert })
                  )}
                </NSpace>
              </div>
            </div>
          )}
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showDetailModal.value = false)}>关闭</NButton>
            <NButton type="warning">标记为已解决</NButton>
            <NButton type="primary">创建告警规则</NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
