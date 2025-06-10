import { NCard, NDataTable, NTag, NSpace, NButton, NInput, NSelect, NDatePicker, NModal, NCode } from 'naive-ui'
import { ref, h } from 'vue'

export default defineComponent({
  name: 'ServiceLogs',
  setup() {
    const searchText = ref('')
    const selectedService = ref('')
    const selectedLevel = ref('')
    const dateRange = ref<[number, number] | null>(null)
    const showDetailModal = ref(false)
    const selectedLog = ref<any>(null)

    const serviceOptions = [
      { label: '全部服务', value: '' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' },
      { label: 'gateway-service', value: 'gateway-service' }
    ]

    const levelOptions = [
      { label: '全部级别', value: '' },
      { label: 'ERROR', value: 'error' },
      { label: 'WARN', value: 'warn' },
      { label: 'INFO', value: 'info' },
      { label: 'DEBUG', value: 'debug' }
    ]

    const columns = [
      {
        title: '时间',
        key: 'timestamp',
        width: 180
      },
      {
        title: '服务',
        key: 'service',
        width: 150
      },
      {
        title: '级别',
        key: 'level',
        width: 80,
        render(row: any) {
          const levelMap = {
            error: { type: 'error', text: 'ERROR' },
            warn: { type: 'warning', text: 'WARN' },
            info: { type: 'info', text: 'INFO' },
            debug: { type: 'default', text: 'DEBUG' }
          }
          const config = levelMap[row.level as keyof typeof levelMap]
          return h(NTag, { type: config.type as any, size: 'small' }, { default: () => config.text })
        }
      },
      {
        title: '消息',
        key: 'message',
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '线程',
        key: 'thread',
        width: 120
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        render(row: any) {
          return h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleViewDetail(row)
            },
            { default: () => '详情' }
          )
        }
      }
    ]

    const logData = ref([
      {
        key: '1',
        timestamp: '2024-01-15 14:30:25.123',
        service: 'user-service',
        level: 'error',
        message: 'Failed to connect to database: Connection timeout',
        thread: 'http-nio-8080-exec-1',
        logger: 'com.example.user.service.UserService',
        stackTrace: `java.sql.SQLException: Connection timeout\n\tat com.mysql.cj.jdbc.ConnectionImpl.connectOneTryOnly(ConnectionImpl.java:956)\n\tat com.mysql.cj.jdbc.ConnectionImpl.createNewIO(ConnectionImpl.java:826)\n\tat com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:456)\n\tat com.mysql.cj.jdbc.ConnectionImpl.getInstance(ConnectionImpl.java:246)\n\tat com.mysql.cj.jdbc.NonRegisteringDriver.connect(NonRegisteringDriver.java:197)`
      },
      {
        key: '2',
        timestamp: '2024-01-15 14:29:45.456',
        service: 'order-service',
        level: 'warn',
        message: 'High memory usage detected: 85% of heap space used',
        thread: 'scheduler-1',
        logger: 'com.example.order.monitor.MemoryMonitor',
        stackTrace: ''
      },
      {
        key: '3',
        timestamp: '2024-01-15 14:29:12.789',
        service: 'payment-service',
        level: 'info',
        message: 'Payment processed successfully for order #12345',
        thread: 'http-nio-8081-exec-3',
        logger: 'com.example.payment.service.PaymentService',
        stackTrace: ''
      },
      {
        key: '4',
        timestamp: '2024-01-15 14:28:58.012',
        service: 'gateway-service',
        level: 'debug',
        message: 'Routing request to user-service: GET /api/users/123',
        thread: 'reactor-http-nio-2',
        logger: 'com.example.gateway.filter.LoggingFilter',
        stackTrace: ''
      },
      {
        key: '5',
        timestamp: '2024-01-15 14:28:30.345',
        service: 'user-service',
        level: 'error',
        message: 'Validation failed: Invalid email format',
        thread: 'http-nio-8080-exec-2',
        logger: 'com.example.user.controller.UserController',
        stackTrace: ''
      }
    ])

    const handleViewDetail = (log: any) => {
      selectedLog.value = log
      showDetailModal.value = true
    }

    const handleDownload = () => {
      // 模拟下载日志
      console.log('下载日志文件')
    }

    const handleRefresh = () => {
      // 模拟刷新日志
      console.log('刷新日志数据')
    }

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">服务日志</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">按服务查看日志，支持搜索、过滤、分页、下载</p>
        </div>

        {/* 筛选面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NInput v-model:value={searchText.value} placeholder="搜索日志内容" style={{ width: '200px' }} />
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions}
              placeholder="选择服务"
              style={{ width: '150px' }}
            />
            <NSelect
              v-model:value={selectedLevel.value}
              options={levelOptions}
              placeholder="选择级别"
              style={{ width: '120px' }}
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary">查询</NButton>
            <NButton onClick={handleRefresh}>刷新</NButton>
            <NButton onClick={handleDownload}>下载</NButton>
          </NSpace>
        </NCard>

        {/* 统计面板 */}
        <div class="grid grid-cols-4 gap-16px mb-16px">
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-error]">23</div>
              <div class="text-14px text-[--color-text-3]">错误日志</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-warning]">156</div>
              <div class="text-14px text-[--color-text-3]">警告日志</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-info]">2,345</div>
              <div class="text-14px text-[--color-text-3]">信息日志</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-success]">8,912</div>
              <div class="text-14px text-[--color-text-3]">调试日志</div>
            </div>
          </NCard>
        </div>

        {/* 日志列表 */}
        <NCard>
          <NDataTable
            columns={columns}
            data={logData.value}
            pagination={{
              pageSize: 20,
              showSizePicker: true,
              pageSizes: [20, 50, 100]
            }}
            bordered={false}
            singleLine={false}
            rowKey={(row: any) => row.key}
            maxHeight={600}
            virtualScroll
          />
        </NCard>

        {/* 日志详情模态框 */}
        <NModal v-model:show={showDetailModal.value} preset="dialog" title="日志详情" style={{ width: '800px' }}>
          {selectedLog.value && (
            <div class="space-y-16px">
              <div class="grid grid-cols-2 gap-16px">
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">时间</div>
                  <div class="text-14px">{selectedLog.value.timestamp}</div>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">服务</div>
                  <div class="text-14px">{selectedLog.value.service}</div>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">级别</div>
                  <NTag
                    type={
                      selectedLog.value.level === 'error'
                        ? 'error'
                        : selectedLog.value.level === 'warn'
                          ? 'warning'
                          : selectedLog.value.level === 'info'
                            ? 'info'
                            : 'default'
                    }
                    size="small">
                    {selectedLog.value.level.toUpperCase()}
                  </NTag>
                </div>
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">线程</div>
                  <div class="text-14px">{selectedLog.value.thread}</div>
                </div>
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">Logger</div>
                <div class="text-14px font-mono">{selectedLog.value.logger}</div>
              </div>

              <div>
                <div class="text-14px text-[--color-text-3] mb-4px">消息</div>
                <div class="bg-[--color-bg-2] p-12px rounded-4px text-14px">{selectedLog.value.message}</div>
              </div>

              {selectedLog.value.stackTrace && (
                <div>
                  <div class="text-14px text-[--color-text-3] mb-4px">堆栈跟踪</div>
                  <NCode code={selectedLog.value.stackTrace} language="java" wordWrap />
                </div>
              )}
            </div>
          )}
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showDetailModal.value = false)}>关闭</NButton>
            <NButton type="primary">复制</NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
