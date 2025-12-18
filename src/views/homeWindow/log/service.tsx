import {
  NCard,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NInput,
  NButton,
  NTag,
  NList,
  NListItem,
  NCheckbox,
  NCheckboxGroup,
  NSpace,
  NSpin,
  NCode,
  NCollapse,
  NCollapseItem,
  NScrollbar
} from 'naive-ui'
import { defineComponent, ref, onMounted, computed } from 'vue'
import { fetchLogs } from '@/mock/api'
import type { LogItem, LogVolume } from '@/types/monitor'
import BarChart from '@/components/charts/BarChart'
import {
  SearchOutline,
  RefreshOutline,
  DownloadOutline,
  PauseCircleOutline,
  PlayCircleOutline
} from '@vicons/ionicons5'

export default defineComponent({
  name: 'LogExplorer',
  setup() {
    const loading = ref(false)
    const logs = ref<LogItem[]>([])
    const volumeData = ref<LogVolume[]>([])
    const searchText = ref('')
    const isLive = ref(false)
    let liveTimer: any = null

    // Facets
    const selectedServices = ref<string[]>([])
    const selectedLevels = ref<string[]>([])

    const serviceOptions = [
      { label: 'api-gateway', value: 'gateway' },
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' },
      { label: 'auth-service', value: 'auth-service' }
    ]

    const levelOptions = [
      { label: 'ERROR', value: 'error' },
      { label: 'WARN', value: 'warn' },
      { label: 'INFO', value: 'info' },
      { label: 'DEBUG', value: 'debug' }
    ]

    const loadLogs = async () => {
      loading.value = true
      const res = await fetchLogs({
        search: searchText.value,
        service: selectedServices.value.join(','),
        level: selectedLevels.value.join(',')
      })
      logs.value = res.logs
      volumeData.value = res.volume
      loading.value = false
    }

    const toggleLive = () => {
      isLive.value = !isLive.value
      if (isLive.value) {
        liveTimer = setInterval(async () => {
          const res = await fetchLogs({})
          logs.value = [res.logs[0], ...logs.value].slice(0, 100) // Simulate stream
        }, 2000)
      } else {
        clearInterval(liveTimer)
      }
    }

    onMounted(loadLogs)

    const chartData = computed(() => {
      return volumeData.value.map((v) => ({
        name: new Date(v.timestamp).getHours() + ':00',
        value: v.count
      }))
    })

    const LogItemRow = (props: { log: LogItem }) => {
      const expanded = ref(false)
      return (
        <div class="border-b border-[--color-border-1] hover:bg-[--color-fill-2] transition-colors">
          <div
            class="flex items-start p-8px gap-12px cursor-pointer text-13px font-mono"
            onClick={() => (expanded.value = !expanded.value)}>
            <div class="w-140px text-[--color-text-3] shrink-0">{props.log.timestamp.split(' ')[1]}</div>
            <div class="w-60px shrink-0">
              <NTag
                size="small"
                type={props.log.level === 'error' ? 'error' : props.log.level === 'warn' ? 'warning' : 'info'}
                class="w-full justify-center font-bold">
                {props.log.level.toUpperCase()}
              </NTag>
            </div>
            <div class="w-120px text-[--color-primary-6] shrink-0 truncate" title={props.log.service}>
              {props.log.service}
            </div>
            <div class="flex-1 text-[--color-text-1] break-all">{props.log.message}</div>
          </div>
          {expanded.value && (
            <div class="p-16px bg-[--color-bg-2] ml-40px mr-16px mb-8px rounded-4px border border-[--color-border-2]">
              <div class="grid grid-cols-2 gap-16px mb-16px text-12px">
                <div>
                  <span class="text-[--color-text-3]">Thread:</span>{' '}
                  <span class="text-[--color-text-1] font-mono">{props.log.thread}</span>
                </div>
                <div>
                  <span class="text-[--color-text-3]">Logger:</span>{' '}
                  <span class="text-[--color-text-1] font-mono">{props.log.logger}</span>
                </div>
                <div>
                  <span class="text-[--color-text-3]">Trace ID:</span>{' '}
                  <span class="text-[--color-primary-6] cursor-pointer hover:underline">trace-{props.log.key}</span>
                </div>
              </div>
              {props.log.stackTrace && <NCode code={props.log.stackTrace} language="java" wordWrap class="text-12px" />}
            </div>
          )}
        </div>
      )
    }

    return () => (
      <div class="h-full flex flex-col bg-[--color-bg-1]">
        {/* Header */}
        <div class="h-60px px-24px flex items-center justify-between border-b border-[--color-border-1]">
          <div class="flex items-center gap-16px flex-1">
            <h2 class="text-18px font-600 m-0">Log Explorer</h2>
            <NInput
              v-model:value={searchText.value}
              placeholder='Search logs (e.g. "error" AND "service:api")'
              class="w-400px"
              onKeyup={(e) => e.key === 'Enter' && loadLogs()}>
              {{ prefix: () => <SearchOutline class="w-16px" /> }}
            </NInput>
            <NButton type="primary" onClick={loadLogs}>
              Search
            </NButton>
          </div>
          <NSpace>
            <NButton onClick={toggleLive} type={isLive.value ? 'error' : 'default'} secondary>
              {{
                icon: () => (isLive.value ? <PauseCircleOutline /> : <PlayCircleOutline />),
                default: () => (isLive.value ? 'Pause Live' : 'Live Tail')
              }}
            </NButton>
            <NButton onClick={loadLogs}>
              <RefreshOutline class="mr-4px" /> Refresh
            </NButton>
            <NButton>
              <DownloadOutline class="mr-4px" /> Export
            </NButton>
          </NSpace>
        </div>

        {/* Content */}
        <div class="flex-1 flex overflow-hidden">
          {/* Sidebar Facets */}
          <div class="w-260px border-r border-[--color-border-1] p-16px bg-[--color-bg-2] flex flex-col gap-24px overflow-y-auto">
            <div>
              <div class="text-12px font-bold text-[--color-text-3] mb-8px uppercase">Time Range</div>
              <NButton block secondary>
                Last 1 Hour
              </NButton>
            </div>

            <div>
              <div class="text-12px font-bold text-[--color-text-3] mb-8px uppercase">Log Level</div>
              <NCheckboxGroup v-model:value={selectedLevels.value} onUpdateValue={loadLogs}>
                <div class="flex flex-col gap-8px">
                  {levelOptions.map((opt) => (
                    <NCheckbox value={opt.value} label={opt.label} />
                  ))}
                </div>
              </NCheckboxGroup>
            </div>

            <div>
              <div class="text-12px font-bold text-[--color-text-3] mb-8px uppercase">Service</div>
              <NCheckboxGroup v-model:value={selectedServices.value} onUpdateValue={loadLogs}>
                <div class="flex flex-col gap-8px">
                  {serviceOptions.map((opt) => (
                    <NCheckbox value={opt.value} label={opt.label} />
                  ))}
                </div>
              </NCheckboxGroup>
            </div>
          </div>

          {/* Main Log View */}
          <div class="flex-1 flex flex-col min-w-0">
            {/* Volume Chart */}
            <div class="h-120px p-16px border-b border-[--color-border-1]">
              <BarChart data={chartData.value} height="100%" color="#165dff" />
            </div>

            {/* Log List */}
            <div class="flex-1 overflow-y-auto relative">
              {loading.value && !isLive.value && (
                <div class="absolute inset-0 bg-[--color-bg-1] opacity-50 z-10 flex items-center justify-center">
                  <NSpin size="large" />
                </div>
              )}
              <div class="flex flex-col">
                {logs.value.map((log) => (
                  <LogItemRow key={log.key} log={log} />
                ))}
              </div>
              {logs.value.length === 0 && !loading.value && (
                <div class="p-40px text-center text-[--color-text-3]">No logs found matching your criteria.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
