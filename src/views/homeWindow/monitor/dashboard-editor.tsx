import { defineComponent, ref, reactive } from 'vue'
import {
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NIcon,
  NSpace,
  NInputNumber
} from 'naive-ui'
import BaseChart from '@/components/charts/BaseChart'
import { AddOutline, TrashOutline, ResizeOutline } from '@vicons/ionicons5'

// 模拟图表配置生成
const generateChartOption = (type: string, title: string) => {
  const base = {
    title: { text: title },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }] // 启用缩放交互
  }

  if (type === 'line') {
    return {
      ...base,
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: 'line' }]
    }
  } else if (type === 'bar') {
    return {
      ...base,
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'bar' }]
    }
  }

  return base
}

export default defineComponent({
  name: 'DashboardEditor',
  setup() {
    const isEditMode = ref(false)
    const showAddModal = ref(false)
    const newWidget = reactive({
      title: '',
      type: 'line',
      w: 12, // Grid span (24 total)
      h: 300 // px
    })

    const widgets = reactive([
      {
        id: 1,
        title: 'CPU Usage',
        type: 'line',
        span: 12,
        height: 300,
        option: generateChartOption('line', 'CPU Usage')
      },
      {
        id: 2,
        title: 'Memory Usage',
        type: 'bar',
        span: 12,
        height: 300,
        option: generateChartOption('bar', 'Memory Usage')
      }
    ])

    const handleAddWidget = () => {
      widgets.push({
        id: Date.now(),
        title: newWidget.title || 'New Chart',
        type: newWidget.type,
        span: newWidget.w,
        height: newWidget.h,
        option: generateChartOption(newWidget.type, newWidget.title || 'New Chart')
      })
      showAddModal.value = false
    }

    const removeWidget = (id: number) => {
      const index = widgets.findIndex((w) => w.id === id)
      if (index > -1) widgets.splice(index, 1)
    }

    return () => (
      <div class="dashboard-editor p-4">
        <div class="toolbar mb-4 flex justify-between items-center">
          <h2 class="text-xl font-bold">Dashboard Editor</h2>
          <NSpace>
            <NButton onClick={() => (isEditMode.value = !isEditMode.value)}>
              {isEditMode.value ? 'Save Layout' : 'Edit Dashboard'}
            </NButton>
            {isEditMode.value && (
              <NButton type="primary" onClick={() => (showAddModal.value = true)}>
                <NIcon component={AddOutline} class="mr-1" />
                Add Widget
              </NButton>
            )}
          </NSpace>
        </div>

        <NGrid x-gap={12} y-gap={12} cols={24}>
          {widgets.map((widget) => (
            <NGridItem span={widget.span} key={widget.id}>
              <NCard
                title={widget.title}
                closable={isEditMode.value}
                onClose={() => removeWidget(widget.id)}
                bordered={false}
                class="shadow-sm hover:shadow-md transition-shadow">
                {{
                  'header-extra': () =>
                    isEditMode.value && (
                      <div class="flex gap-2">
                        {/* Simple resize controls */}
                        <NButton size="tiny" onClick={() => (widget.span = Math.max(6, widget.span - 6))}>
                          -
                        </NButton>
                        <span class="text-xs leading-6">Width</span>
                        <NButton size="tiny" onClick={() => (widget.span = Math.min(24, widget.span + 6))}>
                          +
                        </NButton>
                      </div>
                    ),
                  default: () => <BaseChart option={widget.option} height={`${widget.height}px`} />
                }}
              </NCard>
            </NGridItem>
          ))}
        </NGrid>

        <NModal v-model:show={showAddModal.value} preset="card" title="Add New Widget" style={{ width: '500px' }}>
          <NForm>
            <NFormItem label="Chart Title">
              <NInput v-model:value={newWidget.title} placeholder="Enter title" />
            </NFormItem>
            <NFormItem label="Chart Type">
              <NSelect
                v-model:value={newWidget.type}
                options={[
                  { label: 'Line Chart', value: 'line' },
                  { label: 'Bar Chart', value: 'bar' }
                ]}
              />
            </NFormItem>
            <NFormItem label="Width (Grid Span 1-24)">
              <NInputNumber v-model:value={newWidget.w} min={1} max={24} />
            </NFormItem>
          </NForm>
          <div class="flex justify-end mt-4">
            <NButton onClick={handleAddWidget} type="primary">
              Add
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
