import { defineComponent, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NTag,
  NTimeline,
  NTimelineItem,
  NSpin,
  NEmpty,
  NDrawer,
  NDrawerContent
} from 'naive-ui'
import { fetchTraces } from '@/mock/api'
import type { TraceSpan } from '@/types/monitor'
import { TimeOutline, AlertCircleOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'TraceExplorer',
  setup() {
    const traces = ref<TraceSpan[]>([])
    const loading = ref(true)
    const selectedSpan = ref<TraceSpan | null>(null)
    const showDrawer = ref(false)

    onMounted(async () => {
      traces.value = await fetchTraces()
      loading.value = false
    })

    const rootSpan = computed(() => traces.value.find((s) => !s.parentId))
    const totalDuration = computed(() => {
      if (!rootSpan.value) return 0
      const endTimes = traces.value.map((s) => s.startTime + s.duration)
      return Math.max(...endTimes)
    })

    const handleSpanClick = (span: TraceSpan) => {
      selectedSpan.value = span
      showDrawer.value = true
    }

    const WaterfallItem = (props: { span: TraceSpan; depth: number }) => {
      const left = (props.span.startTime / totalDuration.value) * 100
      const width = Math.max((props.span.duration / totalDuration.value) * 100, 0.5) // Min width for visibility

      return (
        <div
          class="relative h-32px flex items-center hover:bg-[--color-fill-2] cursor-pointer group mb-4px"
          onClick={() => handleSpanClick(props.span)}>
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

    // Recursive render helper
    const renderTree = (parentId?: string, depth = 0): any[] => {
      const children = traces.value.filter((s) => s.parentId === parentId).sort((a, b) => a.startTime - b.startTime)
      return children.flatMap((child) => [
        <WaterfallItem span={child} depth={depth} />,
        ...renderTree(child.id, depth + 1)
      ])
    }

    return () => (
      <div class="h-full flex flex-col p-24px">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">Trace Explorer</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">
            Distributed tracing waterfall view for request analysis.
          </p>
        </div>

        <NCard
          class="flex-1 overflow-hidden"
          contentStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {loading.value ? (
            <div class="flex-1 flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="flex-1 overflow-y-auto py-16px">
              {/* Header Scale */}
              <div class="flex h-30px border-b border-[--color-border-1] mb-8px text-12px text-[--color-text-3]">
                <div class="w-200px shrink-0 pl-16px border-r border-[--color-border-1]">Service / Operation</div>
                <div class="flex-1 relative mx-16px">
                  <div class="absolute left-0">0ms</div>
                  <div class="absolute left-1/4">{(totalDuration.value * 0.25).toFixed(0)}ms</div>
                  <div class="absolute left-1/2">{(totalDuration.value * 0.5).toFixed(0)}ms</div>
                  <div class="absolute left-3/4">{(totalDuration.value * 0.75).toFixed(0)}ms</div>
                  <div class="absolute right-0">{totalDuration.value}ms</div>
                </div>
              </div>

              {/* Waterfall Content */}
              {renderTree(undefined)}
            </div>
          )}
        </NCard>

        {/* Trace Details Drawer */}
        <NDrawer v-model:show={showDrawer.value} width={400} placement="right">
          <NDrawerContent title="Span Details">
            {selectedSpan.value && (
              <div class="flex flex-col gap-24px">
                <div class="p-16px bg-[--color-bg-2] rounded-8px">
                  <h3 class="text-16px font-600 m-0 mb-8px">{selectedSpan.value.name}</h3>
                  <div class="flex items-center gap-8px mb-4px">
                    <NTag type={selectedSpan.value.status === 'ok' ? 'success' : 'error'} size="small">
                      {selectedSpan.value.status.toUpperCase()}
                    </NTag>
                    <span class="text-14px text-[--color-text-2]">{selectedSpan.value.service}</span>
                  </div>
                  <div class="text-24px font-mono mt-12px">{selectedSpan.value.duration}ms</div>
                </div>

                <div>
                  <h4 class="text-14px font-bold text-[--color-text-2] uppercase mb-12px">Tags</h4>
                  <div class="grid grid-cols-1 gap-8px">
                    {Object.entries(selectedSpan.value.tags).map(([k, v]) => (
                      <div class="flex justify-between border-b border-[--color-border-1] pb-4px">
                        <span class="text-[--color-text-3] text-13px">{k}</span>
                        <span class="text-[--color-text-1] text-13px font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 class="text-14px font-bold text-[--color-text-2] uppercase mb-12px">Logs</h4>
                  <div class="text-13px text-[--color-text-3] italic">No logs associated with this span.</div>
                </div>
              </div>
            )}
          </NDrawerContent>
        </NDrawer>
      </div>
    )
  }
})
