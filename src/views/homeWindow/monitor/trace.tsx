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
  NIcon,
  useMessage
} from 'naive-ui'
import type { TraceSpan } from '@/types/monitor'
import {
  TimeOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  GitNetworkOutline,
  SearchOutline,
  FilterOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import SectionHeader from '@/components/common/SectionHeader'
import { useTimeStore } from '@/store/useTimeStore'
import dayjs from 'dayjs'
import * as traceApi from '@/api/trace'

export default defineComponent({
  name: 'TraceExplorer',
  setup() {
    const timeStore = useTimeStore()
    const message = useMessage()
    const loading = ref(false)
    const traces = ref<TraceSpan[]>([])
    const selectedTraceId = ref<string | null>(null)
    const showDrawer = ref(false)
    const selectedSpan = ref<TraceSpan | null>(null)

    // Filters
    const searchQuery = ref('')
    const selectedService = ref<string | null>(null)
    const selectedStatus = ref<string | null>(null)

    const loadData = async () => {
      loading.value = true
      try {
        const res = await traceApi.searchTraces({
          startTime: timeStore.startTime,
          endTime: timeStore.endTime,
          service: selectedService.value || undefined,
          traceId: searchQuery.value || undefined,
          limit: 100
        })

        // Group by traceId to only show root spans or distinct traces in the list
        // Since searchTraces returns flat spans, we need to process them
        // For the list view, we prefer root spans, or the first span of a trace if root is missing
        const traceMap = new Map<string, TraceSpan>()
        res.forEach((span: TraceSpan) => {
          if (!traceMap.has(span.traceId) || (!span.parentId && traceMap.get(span.traceId)?.parentId)) {
            traceMap.set(span.traceId, span)
          }
        })

        traces.value = Array.from(traceMap.values())

        if (traces.value.length === 0 && !searchQuery.value && !selectedService.value) {
          // Fallback to mock data only if completely empty and no filters (for demo purposes)
          // Or better: just show empty state
        }
      } catch (error) {
        console.error('Failed to load traces:', error)
        message.error('加载链路数据失败')
      } finally {
        loading.value = false
      }
    }

    watch(() => [timeStore.startTime, timeStore.endTime, selectedService.value, selectedStatus.value], loadData)

    onMounted(() => {
      loadData()
    })

    // Computed for Table
    const tableData = computed(() => {
      let filtered = traces.value

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (s) => s.traceId.includes(q) || s.service.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
      }

      // Status filter is applied client-side for now
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
          <NTag size="small" type="info" bordered={false}>
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
          <NTag type={row.status === 'ok' ? 'success' : 'error'} size="small" bordered={false}>
            {row.status.toUpperCase()}
          </NTag>
        )
      },
      {
        title: 'Trace ID',
        key: 'traceId',
        render: (row: TraceSpan) => (
          <span
            class="font-mono text-xs cursor-pointer text-[--color-primary-6] hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              openTrace(row.traceId)
            }}>
            {row.traceId}
          </span>
        )
      }
    ]

    const drawerTraces = ref<TraceSpan[]>([])
    const drawerLoading = ref(false)

    const openTrace = async (traceId: string) => {
      selectedTraceId.value = traceId
      showDrawer.value = true
      selectedSpan.value = null
      drawerLoading.value = true

      try {
        const spans = await traceApi.getTraceDetails(traceId)
        drawerTraces.value = spans.sort((a: TraceSpan, b: TraceSpan) => a.startTime - b.startTime)
      } catch (error) {
        message.error('加载链路详情失败')
      } finally {
        drawerLoading.value = false
      }
    }

    // Drawer Logic (Waterfall)
    const rootSpan = computed(() => drawerTraces.value.find((s) => !s.parentId) || drawerTraces.value[0])

    const totalDuration = computed(() => {
      if (drawerTraces.value.length === 0) return 0
      const endTimes = drawerTraces.value.map((s) => s.startTime + s.duration)
      const minStartTime = Math.min(...drawerTraces.value.map((s) => s.startTime))
      return Math.max(...endTimes) - minStartTime
    })

    const WaterfallItem = (props: { span: TraceSpan; depth: number; rootStart: number }) => {
      const relativeStart = props.span.startTime - props.rootStart
      // Avoid division by zero
      const duration = totalDuration.value || 1

      const left = Math.max(0, (relativeStart / duration) * 100)
      const width = Math.max((props.span.duration / duration) * 100, 0.5)

      return (
        <div
          class="relative h-32px flex items-center hover:bg-[--color-fill-2] cursor-pointer group mb-4px rounded-4px transition-colors"
          onClick={() => (selectedSpan.value = props.span)}>
          {/* Tree Structure Line */}
          <div class="w-200px shrink-0 pl-16px flex items-center border-r border-[--color-border-1] h-full truncate">
            <div style={{ marginLeft: `${props.depth * 16}px` }} class="flex items-center gap-8px truncate">
              <div
                class={`w-8px h-8px rounded-full ${props.span.status === 'ok' ? 'bg-[--color-success-5]' : 'bg-[--color-danger-5]'}`}></div>
              <span class="text-13px font-medium truncate text-[--color-text-1]" title={props.span.service}>
                {props.span.service}
              </span>
            </div>
          </div>

          {/* Waterfall Bar */}
          <div class="flex-1 h-full relative mx-16px group">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full h-1px bg-[--color-border-1] opacity-50"></div>
            </div>
            <div
              class={`absolute h-24px top-4px rounded-6px shadow-sm flex items-center px-2 transition-all duration-200 
                ${
                  props.span.status === 'ok'
                    ? 'bg-[--color-primary-1] border border-[--color-primary-2] hover:bg-[--color-primary-2]'
                    : 'bg-[--color-danger-1] border border-[--color-danger-2] hover:bg-[--color-danger-2]'
                }`}
              style={{ left: `${left}%`, width: `${width}%` }}>
              <span
                class={`text-12px whitespace-nowrap overflow-hidden text-ellipsis ${props.span.status === 'ok' ? 'text-[--color-primary-6]' : 'text-[--color-danger-6]'}`}>
                {props.span.name} <span class="opacity-75 text-10px">({props.span.duration}ms)</span>
              </span>
            </div>
          </div>
        </div>
      )
    }

    const renderTree = (parentId?: string, depth = 0, rootStart = 0): any[] => {
      // Find children
      const children = drawerTraces.value
        .filter((s) => s.parentId === parentId)
        .sort((a, b) => a.startTime - b.startTime)

      // If no root found by parentId (e.g. strict match failed), just render flat list for robustness if depth is 0
      if (depth === 0 && children.length === 0 && drawerTraces.value.length > 0) {
        // Try to find inferred roots (spans with no parent in the current set)
        const allIds = new Set(drawerTraces.value.map((s) => s.id))
        const roots = drawerTraces.value.filter((s) => !s.parentId || !allIds.has(s.parentId))
        return roots.flatMap((root) => [
          <WaterfallItem span={root} depth={0} rootStart={root.startTime} />,
          ...renderTree(root.id, 1, root.startTime) // Use own start time as base for sub-tree if multiple roots
        ])
      }

      return children.flatMap((child) => [
        <WaterfallItem span={child} depth={depth} rootStart={rootStart} />,
        ...renderTree(child.id, depth + 1, rootStart)
      ])
    }

    return () => (
      <div class="h-full flex flex-col p-24px bg-[--color-bg-1] overflow-hidden">
        <SectionHeader
          title="Trace Explorer"
          subtitle="Search and analyze distributed traces."
          icon={GitNetworkOutline}
        />

        <NCard
          class="flex-1 flex flex-col shadow-sm rounded-lg"
          contentStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <div class="flex gap-4 mb-4">
            <NInput
              v-model:value={searchQuery.value}
              placeholder="Search Trace ID"
              class="w-300px"
              onKeyup={(e) => e.key === 'Enter' && loadData()}>
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
            <NButton secondary type="primary" onClick={loadData} loading={loading.value}>
              {{
                icon: () => (
                  <NIcon>
                    <RefreshOutline />
                  </NIcon>
                )
              }}
            </NButton>
          </div>

          <NDataTable
            columns={columns}
            data={tableData.value}
            loading={loading.value}
            row-class-name="cursor-pointer hover:bg-[--color-fill-1]"
            rowProps={(row) => ({
              onClick: () => openTrace(row.traceId)
            })}
            flex-height
            class="flex-1"
          />
        </NCard>

        {/* Trace Details Drawer */}
        <NDrawer v-model:show={showDrawer.value} width={800} placement="right">
          <NDrawerContent title={`Trace: ${selectedTraceId.value}`} closable>
            {drawerLoading.value ? (
              <div class="h-full flex items-center justify-center">
                <NSpin size="large" />
              </div>
            ) : drawerTraces.value.length > 0 && rootSpan.value ? (
              <div class="h-full flex flex-col">
                <div class="flex h-30px border-b border-[--color-border-1] mb-8px text-12px text-[--color-text-3]">
                  <div class="w-200px shrink-0 pl-16px border-r border-[--color-border-1]">Service / Operation</div>
                  <div class="flex-1 relative mx-16px">
                    <div class="absolute left-0">0ms</div>
                    <div class="absolute right-0">{totalDuration.value}ms</div>
                  </div>
                </div>

                <div class="flex-1 overflow-y-auto">
                  {/* Pass rootSpan start time as global reference */}
                  {renderTree(undefined, 0, rootSpan.value.startTime)}
                </div>

                {selectedSpan.value && (
                  <div class="h-250px border-t border-[--color-border-1] p-4 bg-[--color-bg-2] overflow-y-auto">
                    <h4 class="font-bold mb-2 text-[--color-text-1]">{selectedSpan.value.name} Details</h4>
                    <div class="grid grid-cols-2 gap-4 text-13px text-[--color-text-2]">
                      <div>
                        Service: <span class="font-mono text-[--color-text-1]">{selectedSpan.value.service}</span>
                      </div>
                      <div>
                        Duration: <span class="font-mono text-[--color-text-1]">{selectedSpan.value.duration}ms</span>
                      </div>
                      <div>
                        Start Time:{' '}
                        <span class="font-mono text-[--color-text-1]">
                          {dayjs(selectedSpan.value.startTime).format('HH:mm:ss.SSS')}
                        </span>
                      </div>
                      <div>
                        Status:
                        <NTag size="tiny" type={selectedSpan.value.status === 'ok' ? 'success' : 'error'} class="ml-2">
                          {selectedSpan.value.status}
                        </NTag>
                      </div>
                    </div>
                    <div class="mt-3">
                      <h5 class="font-bold text-xs uppercase text-[--color-text-3] mb-1">Tags</h5>
                      <pre class="text-xs bg-[--color-fill-2] p-2 rounded text-[--color-text-2] overflow-x-auto">
                        {JSON.stringify(selectedSpan.value.tags, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NEmpty description="Trace details not found" />
            )}
          </NDrawerContent>
        </NDrawer>
      </div>
    )
  }
})
