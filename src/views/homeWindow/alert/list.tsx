import {
  NCard,
  NDataTable,
  NTag,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NSpin,
  NProgress,
  NTooltip,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { ref, h } from 'vue'
import { fetchAlerts } from '@/mock/api'
import type { AlertItem } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { AlertCircleOutline, CheckmarkCircleOutline, WarningOutline, CloseCircleOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'AlertList',
  setup() {
    const searchText = ref('')
    const selectedService = ref('')
    const selectedLevel = ref('')
    const dateRange = ref<[number, number] | null>(null)

    const serviceOptions = [
      { label: 'All Services', value: '' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    const levelOptions = [
      { label: 'All Levels', value: '' },
      { label: 'Critical', value: 'critical' },
      { label: 'Warning', value: 'warning' },
      { label: 'Info', value: 'info' }
    ]

    const columns = [
      {
        title: 'Time',
        key: 'time',
        width: 180,
        render(row: any) {
          return <div class="text-13px font-mono">{row.time}</div>
        }
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        render(row: any) {
          const statusMap = {
            active: { type: 'error', text: 'Active', icon: AlertCircleOutline },
            resolved: { type: 'success', text: 'Resolved', icon: CheckmarkCircleOutline },
            suppressed: { type: 'default', text: 'Suppressed', icon: CloseCircleOutline }
          }
          const config = statusMap[row.status as keyof typeof statusMap]
          return (
            <NTag type={config.type as any} size="small" round bordered={false}>
              {{
                icon: () => h(config.icon),
                default: () => config.text
              }}
            </NTag>
          )
        }
      },
      {
        title: 'Severity',
        key: 'level',
        width: 100,
        render(row: any) {
          const levelMap = {
            critical: { color: '#d03050', text: 'CRITICAL' },
            warning: { color: '#f0a020', text: 'WARNING' },
            info: { color: '#2080f0', text: 'INFO' }
          }
          const config = levelMap[row.level as keyof typeof levelMap]
          return (
            <div class="flex items-center gap-6px">
              <div class="w-8px h-8px rounded-full" style={{ backgroundColor: config.color }}></div>
              <span class="font-bold text-12px" style={{ color: config.color }}>
                {config.text}
              </span>
            </div>
          )
        }
      },
      {
        title: 'Alert Message',
        key: 'message',
        render(row: any) {
          return (
            <div>
              <div class="font-medium text-[--color-text-1]">{row.message}</div>
              <div class="text-12px text-[--color-text-3] mt-2px">Service: {row.service}</div>
            </div>
          )
        }
      },
      {
        title: 'Duration',
        key: 'duration',
        width: 120,
        render(row: any) {
          return <span class="font-mono text-13px">{row.duration}</span>
        }
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 150,
        render(row: any) {
          const handleAck = () => {
            row.status = 'resolved'
            window.$message.success('Alert resolved')
          }
          const handleSuppress = () => {
            row.status = 'suppressed'
            window.$message.info('Alert suppressed')
          }
          return (
            <div class="flex gap-8px">
              {row.status === 'active' && (
                <NButton size="tiny" type="success" secondary onClick={handleAck}>
                  Resolve
                </NButton>
              )}
              <NButton size="tiny" secondary onClick={handleSuppress}>
                Mute
              </NButton>
            </div>
          )
        }
      }
    ]

    const loading = ref(false)
    const alertData = ref<AlertItem[]>([])

    const handleQuery = async () => {
      loading.value = true
      const list = await fetchAlerts({ level: selectedLevel.value as any })
      alertData.value = list.filter((i) => (searchText.value ? i.message.includes(searchText.value) : true))
      loading.value = false
    }

    const handleReset = async () => {
      searchText.value = ''
      selectedService.value = ''
      selectedLevel.value = ''
      await handleQuery()
    }

    handleQuery()

    return () => (
      <div class="p-24px h-full flex flex-col">
        <SectionHeader
          title="Alert History"
          subtitle="Comprehensive view of all system alerts and incidents."
          icon={AlertCircleOutline}
        />

        {/* Filters */}
        <NCard class="mb-16px" contentStyle={{ padding: '16px' }}>
          <div class="flex justify-between items-center">
            <NSpace>
              <NInput v-model:value={searchText.value} placeholder="Search alerts..." style={{ width: '240px' }} />
              <NSelect
                v-model:value={selectedService.value}
                options={serviceOptions}
                placeholder="Service"
                style={{ width: '160px' }}
              />
              <NSelect
                v-model:value={selectedLevel.value}
                options={levelOptions}
                placeholder="Severity"
                style={{ width: '140px' }}
              />
              <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            </NSpace>
            <NSpace>
              <NButton type="primary" onClick={handleQuery}>
                Search
              </NButton>
              <NButton onClick={handleReset}>Reset</NButton>
            </NSpace>
          </div>
        </NCard>

        {/* Alert Stats */}
        <div class="grid grid-cols-4 gap-16px mb-16px">
          <NCard contentStyle={{ padding: '16px' }}>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-12px text-[--color-text-3] uppercase font-bold">Active Alerts</div>
                <div class="text-28px font-700 text-[--color-error] mt-4px">7</div>
              </div>
              <AlertCircleOutline class="text-32px text-[--color-error] opacity-20" />
            </div>
            <NProgress type="line" percentage={30} showIndicator={false} color="#d03050" height={4} class="mt-12px" />
          </NCard>
          <NCard contentStyle={{ padding: '16px' }}>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-12px text-[--color-text-3] uppercase font-bold">Critical</div>
                <div class="text-28px font-700 text-[--color-error] mt-4px">2</div>
              </div>
              <WarningOutline class="text-32px text-[--color-error] opacity-20" />
            </div>
            <div class="text-12px text-[--color-text-3] mt-12px">Avg Resolution: 15m</div>
          </NCard>
          <NCard contentStyle={{ padding: '16px' }}>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-12px text-[--color-text-3] uppercase font-bold">Warning</div>
                <div class="text-28px font-700 text-[--color-warning] mt-4px">3</div>
              </div>
              <WarningOutline class="text-32px text-[--color-warning] opacity-20" />
            </div>
            <div class="text-12px text-[--color-text-3] mt-12px">Avg Resolution: 45m</div>
          </NCard>
          <NCard contentStyle={{ padding: '16px' }}>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-12px text-[--color-text-3] uppercase font-bold">Resolved Today</div>
                <div class="text-28px font-700 text-[--color-success] mt-4px">15</div>
              </div>
              <CheckmarkCircleOutline class="text-32px text-[--color-success] opacity-20" />
            </div>
            <div class="text-12px text-[--color-text-3] mt-12px">
              Efficiency: <span class="text-green-500">+12%</span>
            </div>
          </NCard>
        </div>

        {/* Alert List */}
        <NCard class="flex-1" contentStyle={{ padding: 0 }}>
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
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
              rowKey={(row: any) => row.id}
              class="h-full"
              flex-height
            />
          )}
        </NCard>
      </div>
    )
  }
})
