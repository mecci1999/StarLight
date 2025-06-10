import { NCard, NDataTable, NTag, NSpace, NButton, NInput, NSelect, NDatePicker } from 'naive-ui'
import { ref, h } from 'vue'

export default defineComponent({
  name: 'AlertList',
  setup() {
    const searchText = ref('')
    const selectedService = ref('')
    const selectedLevel = ref('')
    const dateRange = ref<[number, number] | null>(null)

    const serviceOptions = [
      { label: '全部服务', value: '' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    const levelOptions = [
      { label: '全部等级', value: '' },
      { label: '严重', value: 'critical' },
      { label: '警告', value: 'warning' },
      { label: '信息', value: 'info' }
    ]

    const columns = [
      {
        title: '告警时间',
        key: 'time',
        width: 180
      },
      {
        title: '服务名称',
        key: 'service',
        width: 150
      },
      {
        title: '告警等级',
        key: 'level',
        width: 100,
        render(row: any) {
          const levelMap = {
            critical: { type: 'error', text: '严重' },
            warning: { type: 'warning', text: '警告' },
            info: { type: 'info', text: '信息' }
          }
          const config = levelMap[row.level as keyof typeof levelMap]
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      {
        title: '告警内容',
        key: 'message',
        ellipsis: {
          tooltip: true
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
            suppressed: { type: 'default', text: '已抑制' }
          }
          const config = statusMap[row.status as keyof typeof statusMap]
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      {
        title: '持续时间',
        key: 'duration',
        width: 120
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render(row: any) {
          return h(NSpace, null, {
            default: () =>
              [
                h(NButton, { size: 'small', type: 'primary' }, { default: () => '详情' }),
                row.status === 'active'
                  ? h(NButton, { size: 'small', type: 'warning' }, { default: () => '确认' })
                  : null,
                h(NButton, { size: 'small', type: 'error' }, { default: () => '抑制' })
              ].filter(Boolean)
          })
        }
      }
    ]

    const alertData = ref([
      {
        key: '1',
        time: '2024-01-15 14:30:25',
        service: 'user-service',
        level: 'critical',
        message: 'CPU使用率超过90%，当前值：95%',
        status: 'active',
        duration: '15分钟'
      },
      {
        key: '2',
        time: '2024-01-15 14:25:10',
        service: 'order-service',
        level: 'warning',
        message: '内存使用率超过80%，当前值：85%',
        status: 'active',
        duration: '20分钟'
      },
      {
        key: '3',
        time: '2024-01-15 14:20:45',
        service: 'payment-service',
        level: 'critical',
        message: '响应时间超过5秒，当前值：8.5秒',
        status: 'resolved',
        duration: '10分钟'
      },
      {
        key: '4',
        time: '2024-01-15 14:15:30',
        service: 'user-service',
        level: 'warning',
        message: 'QPS异常下降，当前值：50/s，正常值：1000/s',
        status: 'suppressed',
        duration: '5分钟'
      },
      {
        key: '5',
        time: '2024-01-15 14:10:15',
        service: 'order-service',
        level: 'info',
        message: '服务重启完成',
        status: 'resolved',
        duration: '1分钟'
      }
    ])

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">告警列表</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">展示所有触发的告警，支持按时间、服务、等级等筛选</p>
        </div>

        {/* 筛选面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NInput v-model:value={searchText.value} placeholder="搜索告警内容" style={{ width: '200px' }} />
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions}
              placeholder="选择服务"
              style={{ width: '150px' }}
            />
            <NSelect
              v-model:value={selectedLevel.value}
              options={levelOptions}
              placeholder="选择等级"
              style={{ width: '120px' }}
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary">查询</NButton>
            <NButton>重置</NButton>
            <NButton type="error">批量确认</NButton>
          </NSpace>
        </NCard>

        {/* 告警统计 */}
        <div class="grid grid-cols-4 gap-16px mb-16px">
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-error]">7</div>
              <div class="text-14px text-[--color-text-3]">活跃告警</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-error]">2</div>
              <div class="text-14px text-[--color-text-3]">严重告警</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-warning]">3</div>
              <div class="text-14px text-[--color-text-3]">警告告警</div>
            </div>
          </NCard>
          <NCard>
            <div class="text-center">
              <div class="text-24px font-600 text-[--color-success]">15</div>
              <div class="text-14px text-[--color-text-3]">今日已解决</div>
            </div>
          </NCard>
        </div>

        {/* 告警列表 */}
        <NCard>
          <NDataTable
            columns={columns}
            data={alertData.value}
            pagination={{
              pageSize: 10,
              showSizePicker: true,
              pageSizes: [10, 20, 50]
            }}
            bordered={false}
            singleLine={false}
            rowKey={(row: any) => row.key}
          />
        </NCard>
      </div>
    )
  }
})
