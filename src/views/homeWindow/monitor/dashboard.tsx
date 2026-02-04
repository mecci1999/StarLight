import { defineComponent, ref, reactive, onMounted, onUnmounted, watch, markRaw } from 'vue'
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
  NSwitch,
  NEmpty,
  useMessage,
  NInputNumber
} from 'naive-ui'
import BaseChart from '@/components/charts/BaseChart'
import { AddOutline, SaveOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import api from '@/api'
import { useTimeStore } from '@/store/useTimeStore'
import { graphic } from 'echarts/core'

export default defineComponent({
  name: 'CustomDashboard',
  setup() {
    const timeStore = useTimeStore()
    const message = useMessage()
    const isEditMode = ref(false)
    const showAddModal = ref(false)
    const loading = ref(false)
    const timer = ref<any>(null)
    const appKeys = ref<any[]>([])

    // New widget form state
    const newWidget = reactive({
      title: '',
      type: 'line',
      span: 12,
      height: 300,
      appKey: '',
      metric: 'cpu'
    })

    // Dashboard widgets state
    const widgets = reactive<any[]>([])

    // Fetch available AppKeys
    const fetchAppKeys = async () => {
      try {
        const res = await api.metrics.getAppKeys()
        if (res && Array.isArray((res as any).appKeys)) {
          appKeys.value = (res as any).appKeys
        } else if (Array.isArray(res)) {
          appKeys.value = res
        }
      } catch (error) {
        console.error('Failed to fetch app keys:', error)
      }
    }

    // Load layout from localStorage
    const loadLayout = () => {
      const saved = localStorage.getItem('starlight_custom_dashboard_layout')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          widgets.splice(0, widgets.length, ...parsed)
        } catch (e) {
          console.error('Failed to parse dashboard layout', e)
        }
      } else {
        // Default widgets
        widgets.push(
          { id: 1, title: 'CPU Trend', type: 'line', span: 12, height: 300, metric: 'cpu', appKey: '' },
          { id: 2, title: 'Memory Usage', type: 'bar', span: 12, height: 300, metric: 'memory', appKey: '' }
        )
      }
    }

    const saveLayout = () => {
      // Only save structural config, not data/options
      const layoutToSave = widgets.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        span: w.span,
        height: w.height,
        metric: w.metric,
        appKey: w.appKey
      }))
      localStorage.setItem('starlight_custom_dashboard_layout', JSON.stringify(layoutToSave))
      isEditMode.value = false
      message.success('仪表盘布局已保存')
    }

    // Load or refresh data
    const refreshData = async () => {
      loading.value = true
      try {
        // Fetch data for all widgets in parallel
        await Promise.all(
          widgets.map(async (widget) => {
            // Determine appKey (widget specific or default first available)
            const targetAppKey = widget.appKey || (appKeys.value.length > 0 ? appKeys.value[0].appKey : null)

            if (!targetAppKey) {
              widget.option = markRaw(generateEmptyOption(widget.title, 'No AppKey selected'))
              return
            }

            const res = await api.metrics.queryMetrics({
              appKey: targetAppKey,
              startTime: timeStore.startTime,
              endTime: timeStore.endTime,
              step: '1m', // adjust based on time range
              metrics: [widget.metric || 'cpu']
            })

            const seriesData = (res as any)[widget.metric || 'cpu'] || []

            // Generate chart option with real data
            widget.option = markRaw(generateChartOption(widget.type, widget.title, seriesData))
          })
        )
      } catch (error) {
        console.error('Failed to refresh dashboard data:', error)
      } finally {
        loading.value = false
      }
    }

    // Generate chart options helper
    const generateChartOption = (type: string, title: string, data: any[] = []) => {
      const isDark = document.documentElement.dataset.theme === 'dark'

      // 清新配色方案
      const colors = [
        ['#2080f0', '#e8f3ff'], // Blue
        ['#18a058', '#e8ffea'], // Green
        ['#f0a020', '#fff7e8'], // Orange
        ['#d03050', '#ffece8'], // Red
        ['#8a2be2', '#f3e8ff'] // Purple
      ]

      const primaryColor = '#2080f0'
      const textColor = isDark ? '#c5c5c5' : '#4e5969'
      const axisLineColor = isDark ? '#484849' : '#e5e6eb'
      const splitLineColor = isDark ? '#333' : '#f2f3f5'

      const base = {
        title: {
          text: title,
          left: 'left',
          textStyle: {
            color: isDark ? '#fff' : '#1d2129',
            fontSize: 14,
            fontWeight: 600
          }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          borderColor: isDark ? '#444' : '#eee',
          textStyle: {
            color: isDark ? '#eee' : '#333'
          },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
        },
        grid: { left: '2%', right: '3%', bottom: '10%', top: '18%', containLabel: true },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            type: 'slider',
            height: 16,
            bottom: 5,
            borderColor: 'transparent',
            backgroundColor: isDark ? '#333' : '#f5f5f5',
            fillerColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(32,128,240,0.1)',
            handleStyle: {
              color: primaryColor
            },
            textStyle: { color: 'transparent' }
          }
        ]
      }

      const xAxisData = data.map((d) => new Date(d.timestamp).toLocaleTimeString())
      const seriesValues = data.map((d) => d.value)

      // Common Axis Style
      const axisStyle = {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textColor, fontSize: 11 },
        splitLine: {
          show: true,
          lineStyle: { color: splitLineColor, type: 'dashed' }
        }
      }

      if (type === 'line') {
        return {
          ...base,
          xAxis: {
            type: 'category',
            data: xAxisData,
            boundaryGap: false,
            axisLine: { show: true, lineStyle: { color: axisLineColor } },
            axisTick: { show: false },
            axisLabel: { color: textColor, margin: 12 }
          },
          yAxis: {
            type: 'value',
            ...axisStyle
          },
          series: [
            {
              data: seriesValues,
              type: 'line',
              smooth: true,
              symbol: 'none', // 默认不显示点，鼠标hover时显示
              lineStyle: {
                width: 3,
                shadowColor: 'rgba(32,128,240,0.3)',
                shadowBlur: 10,
                color: new graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#2080f0' },
                  { offset: 1, color: '#00d4ff' }
                ])
              },
              areaStyle: {
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(32,128,240,0.2)' },
                  { offset: 1, color: 'rgba(32,128,240,0)' }
                ])
              }
            }
          ]
        }
      } else if (type === 'bar') {
        return {
          ...base,
          xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: textColor }
          },
          yAxis: {
            type: 'value',
            ...axisStyle
          },
          series: [
            {
              data: seriesValues,
              type: 'bar',
              barWidth: '40%',
              itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#2080f0' },
                  { offset: 1, color: '#60a5fa' }
                ])
              }
            }
          ]
        }
      } else if (type === 'pie') {
        const lastValue = seriesValues.length ? seriesValues[seriesValues.length - 1] : 0
        return {
          title: {
            text: title,
            left: 'center',
            top: 'center',
            textStyle: {
              fontSize: 12,
              color: textColor,
              fontWeight: 400
            },
            subtext: lastValue.toFixed(1) + '%',
            subtextStyle: {
              fontSize: 20,
              color: isDark ? '#fff' : '#1d2129',
              fontWeight: 700
            }
          },
          tooltip: { trigger: 'item' },
          series: [
            {
              name: title,
              type: 'pie',
              radius: ['60%', '75%'],
              center: ['50%', '50%'],
              itemStyle: {
                borderRadius: 8,
                borderColor: isDark ? '#1f1f1f' : '#fff',
                borderWidth: 2
              },
              label: { show: false },
              data: [
                { value: lastValue, name: 'Used', itemStyle: { color: '#2080f0' } },
                { value: 100 - lastValue, name: 'Free', itemStyle: { color: isDark ? '#333' : '#f0f0f0' } }
              ]
            }
          ]
        }
      }
      return base
    }

    const generateEmptyOption = (title: string, msg: string) => {
      return {
        title: { text: title, left: 'center' },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: msg,
            fontSize: 14,
            fill: '#999'
          }
        }
      }
    }

    watch(() => [timeStore.startTime, timeStore.endTime], refreshData)

    onMounted(async () => {
      await fetchAppKeys()
      loadLayout()
      refreshData()
      timer.value = setInterval(refreshData, 30000)
    })

    onUnmounted(() => {
      if (timer.value) clearInterval(timer.value)
    })

    const handleAddWidget = () => {
      widgets.push({
        id: Date.now(),
        title: newWidget.title || 'New Chart',
        type: newWidget.type,
        span: newWidget.span,
        height: newWidget.height,
        metric: newWidget.metric,
        appKey: newWidget.appKey,
        option: {}
      })
      showAddModal.value = false
      refreshData()
    }

    const removeWidget = (id: number) => {
      const index = widgets.findIndex((w) => w.id === id)
      if (index > -1) widgets.splice(index, 1)
    }

    const adjustSpan = (widget: any, delta: number) => {
      const newSpan = widget.span + delta
      if (newSpan >= 6 && newSpan <= 24) {
        widget.span = newSpan
      }
    }

    return () => (
      <div class="p-6 h-full overflow-auto bg-[--color-bg-1]">
        <div class="mb-4 flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-[--color-text-1]">Custom Dashboard</h1>
            <p class="text-sm text-[--color-text-3]">Design your own monitoring view</p>
          </div>
          <NSpace>
            <NButton
              type={isEditMode.value ? 'primary' : 'default'}
              onClick={() => {
                if (isEditMode.value) {
                  saveLayout()
                } else {
                  isEditMode.value = true
                }
              }}>
              <NIcon component={isEditMode.value ? SaveOutline : CreateOutline} class="mr-2" />
              {isEditMode.value ? 'Save Layout' : 'Edit Dashboard'}
            </NButton>
            {isEditMode.value && (
              <NButton type="info" onClick={() => (showAddModal.value = true)}>
                <NIcon component={AddOutline} class="mr-2" />
                Add Widget
              </NButton>
            )}
          </NSpace>
        </div>

        {widgets.length === 0 ? (
          <div class="flex justify-center items-center h-64 border-2 border-dashed border-[--color-border-2] rounded-lg">
            <NEmpty description="No widgets yet. Click 'Edit Dashboard' then 'Add Widget' to start.">
              {{
                extra: () => (
                  <NButton
                    onClick={() => {
                      isEditMode.value = true
                      showAddModal.value = true
                    }}>
                    Create First Widget
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        ) : (
          <NGrid x-gap={12} y-gap={12} cols={24}>
            {widgets.map((widget) => (
              <NGridItem span={widget.span} key={widget.id}>
                <NCard
                  title={widget.title}
                  closable={isEditMode.value}
                  onClose={() => removeWidget(widget.id)}
                  size="small"
                  class={`transition-all duration-300 ${isEditMode.value ? 'ring-2 ring-[--color-primary-1] cursor-move' : ''} shadow-sm rounded-lg`}>
                  {{
                    'header-extra': () =>
                      isEditMode.value && (
                        <NSpace size="small">
                          <NButton size="tiny" circle onClick={() => adjustSpan(widget, -6)}>
                            -
                          </NButton>
                          <span class="text-xs text-[--color-text-3]">W: {widget.span}</span>
                          <NButton size="tiny" circle onClick={() => adjustSpan(widget, 6)}>
                            +
                          </NButton>
                        </NSpace>
                      ),
                    default: () => (
                      <BaseChart option={widget.option} height={`${widget.height}px`} loading={loading.value} />
                    )
                  }}
                </NCard>
              </NGridItem>
            ))}
          </NGrid>
        )}

        <NModal v-model:show={showAddModal.value} preset="card" title="Add Widget" style={{ width: '500px' }}>
          <NForm labelPlacement="left" labelWidth={100}>
            <NFormItem label="Title">
              <NInput v-model:value={newWidget.title} placeholder="Chart Title" />
            </NFormItem>
            <NFormItem label="Metric">
              <NSelect
                v-model:value={newWidget.metric}
                options={[
                  { label: 'CPU Usage', value: 'cpu' },
                  { label: 'Memory Usage', value: 'memory' },
                  { label: 'QPS', value: 'qps' },
                  { label: 'Response Time', value: 'responseTime' },
                  { label: 'Error Rate', value: 'errorRate' }
                ]}
              />
            </NFormItem>
            <NFormItem label="Service (AppKey)">
              <NSelect
                v-model:value={newWidget.appKey}
                options={appKeys.value.map((k) => ({ label: k.name || k.keyName || k.appKey, value: k.appKey }))}
                placeholder="Default (First Available)"
                clearable
              />
            </NFormItem>
            <NFormItem label="Type">
              <NSelect
                v-model:value={newWidget.type}
                options={[
                  { label: 'Line Chart', value: 'line' },
                  { label: 'Bar Chart', value: 'bar' },
                  { label: 'Pie Chart', value: 'pie' }
                ]}
              />
            </NFormItem>
            <NFormItem label="Width (1-24)">
              <NInputNumber v-model:value={newWidget.span} min={6} max={24} />
            </NFormItem>
            <NFormItem label="Height (px)">
              <NInputNumber v-model:value={newWidget.height} step={50} />
            </NFormItem>
          </NForm>
          {{
            footer: () => (
              <div class="flex justify-end gap-2">
                <NButton onClick={() => (showAddModal.value = false)}>Cancel</NButton>
                <NButton type="primary" onClick={handleAddWidget}>
                  Add Widget
                </NButton>
              </div>
            )
          }}
        </NModal>
      </div>
    )
  }
})
