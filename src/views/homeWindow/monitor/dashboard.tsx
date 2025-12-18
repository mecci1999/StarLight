import {
  NCard,
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NCheckbox,
  NStatistic,
  NIcon,
  NList,
  NListItem,
  NTag,
  NThing
} from 'naive-ui'
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { fetchRealtimeMetrics, fetchMetrics, fetchAlerts } from '@/mock/api'
import GaugeChart from '@/components/charts/GaugeChart'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import PieChart from '@/components/charts/PieChart'
import { LaptopOutline, ServerOutline, PulseOutline, TimeOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'CustomDashboard',
  setup() {
    const showAddModal = ref(false)
    const dashboardName = ref('')
    const selectedWidgets = ref<string[]>([])
    const loading = ref(true)
    const realtimeData = ref<any>({})
    const trendData = ref<any>({})
    const alertsData = ref<any[]>([])
    let timer: any = null

    const widgetOptions = [
      { label: 'CPU Usage', value: 'cpu' },
      { label: 'Memory Usage', value: 'memory' },
      { label: 'QPS Trend', value: 'qps' },
      { label: 'Response Time', value: 'response-time' },
      { label: 'Error Rate', value: 'error-rate' },
      { label: 'Active Connections', value: 'connections' }
    ]

    const loadData = async () => {
      try {
        const [realtime, metrics, alerts] = await Promise.all([
          fetchRealtimeMetrics(),
          fetchMetrics({ serviceId: 'all', timeRange: '1h' }),
          fetchAlerts({ status: 'active' })
        ])
        realtimeData.value = realtime
        trendData.value = metrics
        alertsData.value = alerts
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadData()
      timer = setInterval(loadData, 5000)
    })

    onUnmounted(() => {
      if (timer) clearInterval(timer)
    })

    const handleAddDashboard = () => {
      showAddModal.value = false
      dashboardName.value = ''
      selectedWidgets.value = []
    }

    return () => (
      <div class="p-24px h-full overflow-auto">
        <div class="mb-16px flex justify-between items-center">
          <div>
            <h1 class="text-20px font-600 text-[--color-text-1] m-0">Dashboard</h1>
            <p class="text-14px text-[--color-text-3] mt-4px mb-0">
              Real-time monitoring of system performance and health status.
            </p>
          </div>
          <NSpace>
            <NButton type="primary" onClick={() => (showAddModal.value = true)}>
              + Add Widget
            </NButton>
            <NButton>Edit Layout</NButton>
            <NButton>Refresh</NButton>
          </NSpace>
        </div>

        {/* Overview Stats */}
        <NGrid cols={4} xGap={16} yGap={16} class="mb-16px">
          <NGridItem>
            <NCard>
              <NStatistic label="Total QPS">
                {{
                  prefix: () => <NIcon component={PulseOutline} color="#165dff" />,
                  default: () => realtimeData.value.qps?.toLocaleString() || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Avg Response Time">
                {{
                  prefix: () => <NIcon component={TimeOutline} color="#ff7d00" />,
                  default: () => (realtimeData.value.responseTime ? `${realtimeData.value.responseTime}ms` : '-'),
                  suffix: () => <span class="text-12px text-green-500">↓ 5%</span>
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Active Instances">
                {{
                  prefix: () => <NIcon component={ServerOutline} color="#00b42a" />,
                  default: () => realtimeData.value.activeInstances || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="System Load">
                {{
                  prefix: () => <NIcon component={LaptopOutline} color="#722ed1" />,
                  default: () => realtimeData.value.systemLoad || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        {/* Main Charts */}
        <NGrid cols={4} xGap={16} yGap={16}>
          {/* Gauge Charts */}
          <NGridItem span={1}>
            <NCard title="CPU Usage" contentStyle={{ padding: 0 }}>
              <GaugeChart
                value={realtimeData.value.cpu || 0}
                title="CPU"
                color="#165dff"
                height="250px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>
          <NGridItem span={1}>
            <NCard title="Memory Usage" contentStyle={{ padding: 0 }}>
              <GaugeChart
                value={realtimeData.value.memory || 0}
                title="Memory"
                color="#ff7d00"
                height="250px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard title="QPS Trend" contentStyle={{ padding: 0 }}>
              <LineChart data={trendData.value.qps || []} color="#165dff" height="250px" loading={loading.value} area />
            </NCard>
          </NGridItem>

          {/* Row 2 */}
          <NGridItem span={2}>
            <NCard title="Response Time Trend" contentStyle={{ padding: 0 }}>
              <LineChart
                data={trendData.value.responseTime || []}
                color="#ff7d00"
                height="250px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard title="Service Health Distribution" contentStyle={{ padding: 0 }}>
              <PieChart
                data={realtimeData.value.healthDistribution || []}
                height="250px"
                colors={['#00b42a', '#ff7d00', '#f53f3f']}
                loading={loading.value}
              />
            </NCard>
          </NGridItem>

          {/* Row 3 */}
          <NGridItem span={2}>
            <NCard title="Traffic Distribution" contentStyle={{ padding: 0 }}>
              <BarChart
                data={realtimeData.value.trafficDistribution || []}
                color="#722ed1"
                height="300px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>

          <NGridItem span={2}>
            <NCard
              title="Recent Alerts"
              contentStyle={{ padding: '0 16px 16px 16px' }}
              style={{ height: '358px', overflow: 'auto' }}>
              <NList>
                {alertsData.value.length > 0 ? (
                  alertsData.value.map((alert) => (
                    <NListItem key={alert.id}>
                      <NThing title={alert.service}>
                        {{
                          'header-extra': () => (
                            <NTag type={alert.level === 'critical' ? 'error' : 'warning'} size="small">
                              {alert.level}
                            </NTag>
                          ),
                          default: () => (
                            <div>
                              <div class="text-12px text-gray-500 mb-4px">{alert.time}</div>
                              <div>{alert.message}</div>
                            </div>
                          )
                        }}
                      </NThing>
                    </NListItem>
                  ))
                ) : (
                  <div class="text-center py-20px text-gray-500">No active alerts</div>
                )}
              </NList>
            </NCard>
          </NGridItem>
        </NGrid>

        {/* Add Modal */}
        <NModal v-model:show={showAddModal.value} preset="dialog" title="Add Widget">
          <NForm>
            <NFormItem label="Widget Name">
              <NInput v-model:value={dashboardName.value} placeholder="Enter name" />
            </NFormItem>
            <NFormItem label="Select Metric">
              <div class="grid grid-cols-2 gap-8px">
                {widgetOptions.map((option) => (
                  <NCheckbox
                    key={option.value}
                    value={option.value}
                    checked={selectedWidgets.value.includes(option.value)}
                    onUpdate:checked={(checked: boolean) => {
                      if (checked) {
                        selectedWidgets.value.push(option.value)
                      } else {
                        const index = selectedWidgets.value.indexOf(option.value)
                        if (index > -1) {
                          selectedWidgets.value.splice(index, 1)
                        }
                      }
                    }}>
                    {option.label}
                  </NCheckbox>
                ))}
              </div>
            </NFormItem>
          </NForm>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showAddModal.value = false)}>Cancel</NButton>
            <NButton type="primary" onClick={handleAddDashboard}>
              Confirm
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
