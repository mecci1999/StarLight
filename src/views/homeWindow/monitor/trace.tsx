import { defineComponent, ref, onMounted, computed, watch, h } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NTag,
  NSpin,
  NEmpty,
  NDrawer,
  NDrawerContent,
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NSelect,
  NIcon
} from 'naive-ui'
import type { TraceSpan } from '@/types/monitor'
import {
  TimeOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  GitNetworkOutline,
  SearchOutline,
  FilterOutline
} from '@vicons/ionicons5'
import SectionHeader from '@/components/common/SectionHeader'
import { useTimeStore } from '@/store/useTimeStore'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'TraceExplorer',
  setup() {
    const timeStore = useTimeStore()
    const loading = ref(false)
    const traces = ref<TraceSpan[]>([])
    const selectedTraceId = ref<string | null>(null)
    const showDrawer = ref(false)
    const selectedSpan = ref<TraceSpan | null>(null) // For detail view inside drawer

    // Filters
    const searchQuery = ref('')
    const selectedService = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)

    // Mock Data Generation
    const generateMockTraces = () => {
      const services = [
        'frontend-app',
        'auth-service',
        'user-service',
        'payment-service',
        'notification-service',
        'database'
      ]
      const operations = ['GET /api/users', 'POST /login', 'GET /products', 'POST /checkout', 'db.query', 'redis.get']
      const mockData: TraceSpan[] = []

      // Generate 50 traces within the last hour
      const now = Date.now()
      for (let i = 0; i < 50; i++) {
        const traceId = Math.random().toString(36).substring(2, 15)
        const startTime = now - Math.floor(Math.random() * 3600 * 1000) // Random time in last hour
        const duration = Math.floor(Math.random() * 500) + 10 // 10ms to 510ms
        const service = services[Math.floor(Math.random() * services.length)]
        const name = operations[Math.floor(Math.random() * operations.length)]
        const status = Math.random() > 0.9 ? 'error' : 'ok'

        // Root span
        const rootId = Math.random().toString(36).substring(2, 10)
        mockData.push({
          id: rootId,
          traceId,
          name,
          service,
          startTime,
          duration,
          status,
          tags: {
            'http.method': name.split(' ')[0] || 'INTERNAL',
            'http.status_code': status === 'ok' ? '200' : '500',
            env: 'production'
          }
        })

        // Child spans (1-3 children)
        const numChildren = Math.floor(Math.random() * 3)
        for (let j = 0; j < numChildren; j++) {
          mockData.push({
            id: Math.random().toString(36).substring(2, 10),
            traceId,
            parentId: rootId, // Simplified parent linkage to root
            name: 'db.query',
            service: 'database',
            startTime: startTime + Math.floor(Math.random() * duration),
            duration: Math.floor(duration / 2),
            status: 'ok',
            tags: {
              'db.statement': 'SELECT * FROM users',
              'db.type': 'sql'
            }
          })
        }
      }
      return mockData
    }

    const allTraces = ref<TraceSpan[]>([])

    const loadData = () => {
      loading.value = true
      // Simulate fetch
      setTimeout(() => {
        if (allTraces.value.length === 0) {
          allTraces.value = generateMockTraces()
        }
        // Filter by timeStore
        traces.value = allTraces.value.filter(
          (t) => t.startTime >= timeStore.startTime && t.startTime <= timeStore.endTime
        )
        loading.value = false
      }, 500)
    }

    watch(() => [timeStore.startTime, timeStore.endTime], loadData)

    onMounted(() => {
      loadData()
    })

    // Computed for Table (Root spans only)
    const rootSpans = computed(() => {
      let filtered = traces.value.filter((s) => !s.parentId)

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (s) => s.traceId.includes(q) || s.service.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
      }
      if (selectedService.value) {
        filtered = filtered.filter((s) => s.service === selectedService.value)
      }
      if (selectedStatus.value) {
        filtered = filtered.filter((s) => s.status === selectedStatus.value)
      }
      return filtered.sort((a, b) => b.startTime - a.startTime)
    })

    const columns = [
      {
        title: 'Start Time',
        key: 'startTime',
        render: (row: TraceSpan) => dayjs(row.startTime).format('HH:mm:ss.SSS')
      },
      {
        title: 'Service',
        key: 'service',
        render: (row: TraceSpan) => (
          <NTag size="small" type="info">
            {row.service}
          </NTag>
        )
      },
      {
        title: 'Operation',
        key: 'name'
      },
      {
        title: 'Duration',
        key: 'duration',
        render: (row: TraceSpan) => `${row.duration}ms`
      },
      {
        title: 'Status',
        key: 'status',
        render: (row: TraceSpan) => (
          <NTag type={row.status === 'ok' ? 'success' : 'error'} size="small">
            {row.status.toUpperCase()}
          </NTag>
        )
      },
      {
        title: 'Trace ID',
        key: 'traceId',
        render: (row: TraceSpan) => (
          <span
            class="font-mono text-xs cursor-pointer text-blue-500"
            onClick={(e) => {
              e.stopPropagation()
              openTrace(row.traceId)
            }}>
            {row.traceId}
          </span>
        )
      }
    ]

    const openTrace = (traceId: string) => {
      selectedTraceId.value = traceId
      showDrawer.value = true
      selectedSpan.value = null
    }

    // Drawer Logic (Waterfall)
    const traceSpans = computed(() => {
      if (!selectedTraceId.value) return []
      return traces.value.filter((s) => s.traceId === selectedTraceId.value).sort((a, b) => a.startTime - b.startTime)
    })

    const rootSpan = computed(() => traceSpans.value.find((s) => !s.parentId))
    const totalDuration = computed(() => {
      if (!rootSpan.value) return 0
      // Calculate max end time
      const endTimes = traceSpans.value.map((s) => s.startTime + s.duration)
      const minStartTime = Math.min(...traceSpans.value.map((s) => s.startTime))
      return Math.max(...endTimes) - minStartTime
    })

    const WaterfallItem = (props: { span: TraceSpan; depth: number; rootStart: number }) => {
      const relativeStart = props.span.startTime - props.rootStart
      const left = (relativeStart / totalDuration.value) * 100
      const width = Math.max((props.span.duration / totalDuration.value) * 100, 0.5)

      return (
        <div
          class="relative h-32px flex items-center hover:bg-[--color-fill-2] cursor-pointer group mb-4px"
          onClick={() => (selectedSpan.value = props.span)}>
          {/* Tree Structure Line */}
          <div class="w-200px shrink-0 pl-16px flex items-center border-r border-[--color-border-1] h-full truncate">
            <div style={{ marginLeft: `${props.depth * 16}px` }} class="flex items-center gap-8px truncate">
              <div
                class={`w-8px h-8px rounded-full ${props.span.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span class="text-13px font-medium truncate" title={props.span.service}>
                {props.span.service}
              </span>
            </div>
          </div>

          {/* Waterfall Bar */}
          <div class="flex-1 h-full relative mx-16px">
            <div
              class={`absolute h-20px top-6px rounded-4px ${props.span.status === 'ok' ? 'bg-[--color-primary-5]' : 'bg-[--color-danger-5]'} opacity-80 group-hover:opacity-100 transition-opacity`}
              style={{ left: `${left}%`, width: `${width}%` }}></div>
            <span
              class="absolute text-12px text-[--color-text-2] ml-8px whitespace-nowrap"
              style={{ left: `${left + width}%`, top: '6px' }}>
              {props.span.name} ({props.span.duration}ms)
            </span>
          </div>
        </div>
      )
    }

    const renderTree = (parentId?: string, depth = 0, rootStart = 0): any[] => {
      const children = traceSpans.value.filter((s) => s.parentId === parentId).sort((a, b) => a.startTime - b.startTime)
      return children.flatMap((child) => [
        <WaterfallItem span={child} depth={depth} rootStart={rootStart} />,
        ...renderTree(child.id, depth + 1, rootStart)
      ])
    }

    return () => (
      <div class="h-full flex flex-col p-24px bg-gray-50/50 overflow-hidden">
        <SectionHeader
          title="Trace Explorer"
          subtitle="Search and analyze distributed traces."
          icon={GitNetworkOutline}
        />

        <NCard
          class="flex-1 flex flex-col"
          contentStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <div class="flex gap-4 mb-4">
            <NInput
              v-model:value={searchQuery.value}
              placeholder="Search by Trace ID, Service, Operation"
              class="w-300px">
              {{ prefix: () => <NIcon component={SearchOutline} /> }}
            </NInput>
            <NSelect
              v-model:value={selectedService.value}
              options={[
                'frontend-app',
                'auth-service',
                'user-service',
                'payment-service',
                'notification-service',
                'database'
              ].map((s) => ({ label: s, value: s }))}
              placeholder="Service"
              clearable
              class="w-200px"
            />
            <NSelect
              v-model:value={selectedStatus.value}
              options={[
                { label: 'OK', value: 'ok' },
                { label: 'Error', value: 'error' }
              ]}
              placeholder="Status"
              clearable
              class="w-150px"
            />
          </div>

          <NDataTable
            columns={columns}
            data={rootSpans.value}
            loading={loading.value}
            row-class-name="cursor-pointer"
            rowProps={(row) => ({
              onClick: () => openTrace(row.traceId)
            })}
            flex-height
            class="flex-1"
          />
        </NCard>

        {/* Trace Details Drawer */}
        <NDrawer v-model:show={showDrawer.value} width={800} placement="right">
          <NDrawerContent title={`Trace: ${selectedTraceId.value}`}>
            {traceSpans.value.length > 0 && rootSpan.value ? (
              <div class="h-full flex flex-col">
                <div class="flex h-30px border-b border-[--color-border-1] mb-8px text-12px text-[--color-text-3]">
                  <div class="w-200px shrink-0 pl-16px border-r border-[--color-border-1]">Service / Operation</div>
                  <div class="flex-1 relative mx-16px">
                    <div class="absolute left-0">0ms</div>
                    <div class="absolute right-0">{totalDuration.value}ms</div>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto">{renderTree(undefined, 0, rootSpan.value.startTime)}</div>

                {selectedSpan.value && (
                  <div class="h-200px border-t border-[--color-border-1] p-4 bg-gray-50 overflow-y-auto">
                    <h4 class="font-bold mb-2">{selectedSpan.value.name} Details</h4>
                    <div class="grid grid-cols-2 gap-4">
                      <div>Service: {selectedSpan.value.service}</div>
                      <div>Duration: {selectedSpan.value.duration}ms</div>
                      <div>Start Time: {dayjs(selectedSpan.value.startTime).format('HH:mm:ss.SSS')}</div>
                      <div>Status: {selectedSpan.value.status}</div>
                    </div>
                    <div class="mt-2">
                      <h5 class="font-bold text-xs uppercase text-gray-500">Tags</h5>
                      <pre class="text-xs bg-gray-100 p-2 rounded mt-1">
                        {JSON.stringify(selectedSpan.value.tags, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NEmpty description="Trace not found" />
            )}
          </NDrawerContent>
        </NDrawer>
      </div>
    )
  }
})
