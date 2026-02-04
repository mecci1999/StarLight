import {
  NCard,
  NDataTable,
  NTag,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NSpin,
  NProgress,
  NTooltip,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { ref, h, defineComponent, watch, onMounted } from 'vue'
import { fetchAlerts, resolveAlert, suppressAlert } from '@/api/alerts'
import { getAppKeys } from '@/api/metrics'
import type { AlertItem } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { AlertCircleOutline, CheckmarkCircleOutline, WarningOutline, CloseCircleOutline } from '@vicons/ionicons5'
import { useTimeStore } from '@/store/useTimeStore'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'AlertList',
  setup() {
    const timeStore = useTimeStore()
    const searchText = ref('')
    const selectedService = ref('')
    const selectedLevel = ref('')

    const serviceOptions = ref([{ label: 'All Services', value: '' }])

    const fetchServices = async () => {
      try {
        const keys = await getAppKeys()
        if (keys && Array.isArray(keys)) {
          serviceOptions.value = [
            { label: 'All Services', value: '' },
            ...keys.map((k: any) => ({
              label: typeof k === 'string' ? k : k.name || k.appKey,
              value: typeof k === 'string' ? k : k.appKey
            }))
          ]
        }
      } catch (e) {
        console.error('Failed to fetch services', e)
      }
    }

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
          const handleAck = async () => {
            try {
              await resolveAlert(row.id)
              row.status = 'resolved'
              window.$message.success('Alert resolved')
            } catch (e) {
              window.$message.error('Failed to resolve alert')
            }
          }
          const handleSuppress = async () => {
            try {
              await suppressAlert(row.id)
              row.status = 'suppressed'
              window.$message.info('Alert suppressed')
            } catch (e) {
              window.$message.error('Failed to suppress alert')
            }
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
      try {
        const list = await fetchAlerts({
          level: selectedLevel.value,
          serviceId: selectedService.value,
          keyword: searchText.value,
          startTime: timeStore.startTime,
          endTime: timeStore.endTime
        })
        alertData.value = list
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    const handleReset = async () => {
      searchText.value = ''
      selectedService.value = ''
      selectedLevel.value = ''
      await handleQuery()
    }

    watch(() => [timeStore.startTime, timeStore.endTime], handleQuery)

    onMounted(() => {
      handleQuery()
      fetchServices()
    })

    return () => (
      <div class="p-24px h-full flex flex-col bg-gray-50/50 overflow-hidden">
        <SectionHeader
          title="Alert History"
          subtitle="Comprehensive view of all system alerts and incidents."
          icon={AlertCircleOutline}
        />

        {/* Filters */}
        <NCard class="mb-16px shadow-sm rounded-lg" bordered={false} contentStyle={{ padding: '16px' }}>
          <div class="flex justify-between items-center">
            <NSpace>
              <NInput v-model:value={searchText.value} placeholder="Search alerts..." style={{ width: '240px' }} />
              <NSelect
                v-model:value={selectedService.value}
                options={serviceOptions.value}
                placeholder="Service"
                style={{ width: '160px' }}
              />
              <NSelect
                v-model:value={selectedLevel.value}
                options={levelOptions}
                placeholder="Severity"
                style={{ width: '140px' }}
              />
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
          <NCard size="small" bordered={false} class="shadow-[var(--shadow-center-1)]">
            <div class="text-[--color-text-3] text-xs font-medium uppercase tracking-wider">Total Alerts</div>
            <div class="text-2xl font-bold mt-1">{alertData.value.length}</div>
          </NCard>
          <NCard size="small" bordered={false} class="shadow-[var(--shadow-center-1)]">
            <div class="text-[--color-text-3] text-xs font-medium uppercase tracking-wider">Critical</div>
            <div class="text-2xl font-bold mt-1 text-[--color-danger-6]">
              {alertData.value.filter((a) => a.level === 'critical').length}
            </div>
          </NCard>
          <NCard size="small" bordered={false} class="shadow-[var(--shadow-center-1)]">
            <div class="text-[--color-text-3] text-xs font-medium uppercase tracking-wider">Active</div>
            <div class="text-2xl font-bold mt-1 text-[--color-warning-6]">
              {alertData.value.filter((a) => a.status === 'active').length}
            </div>
          </NCard>
          <NCard size="small" bordered={false} class="shadow-[var(--shadow-center-1)]">
            <div class="text-[--color-text-3] text-xs font-medium uppercase tracking-wider">Resolved</div>
            <div class="text-2xl font-bold mt-1 text-[--color-success-6]">
              {alertData.value.filter((a) => a.status === 'resolved').length}
            </div>
          </NCard>
        </div>

        <NCard class="flex-1 shadow-[var(--shadow-center-1)] rounded-lg" bordered={false} contentStyle={{ padding: 0 }}>
          <NDataTable
            columns={columns}
            data={alertData.value}
            loading={loading.value}
            flex-height={true}
            style={{ height: '100%' }}
            virtual-scroll
          />
        </NCard>
      </div>
    )
  }
})
