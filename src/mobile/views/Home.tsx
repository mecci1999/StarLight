import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NStatistic, NGrid, NGridItem, NIcon, NList, NListItem, NThing, NTag, NSpace } from 'naive-ui'
import { PulseOutline, TimeOutline, ServerOutline, WarningOutline } from '@vicons/ionicons5'
import { getServiceStats } from '@/api'

export default defineComponent({
  name: 'MobileHome',
  setup() {
    const stats = ref<any>({})
    const loading = ref(true)

    const loadData = async () => {
      try {
        loading.value = true
        // Mock data for mobile view or fetch real data
        const res = await getServiceStats().catch(() => ({}) as any)

        // Simulated data for mobile visualization
        stats.value = {
          qps: 1250,
          avgRt: 45,
          activeInstances: res?.activeApps || 8,
          alerts: [
            { id: 1, service: 'order-service', level: 'warning', message: 'High CPU Usage' },
            { id: 2, service: 'payment-service', level: 'critical', message: 'Connection Timeout' }
          ]
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadData()
    })

    return () => (
      <div style={{ padding: '16px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#333' }}>StarLight Mobile</h2>

        <NGrid cols={2} xGap={12} yGap={12}>
          <NGridItem>
            <NCard size="small">
              <NStatistic label="Total QPS">
                {{
                  prefix: () => <NIcon component={PulseOutline} color="#165dff" />,
                  default: () => stats.value.qps || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small">
              <NStatistic label="Avg RT (ms)">
                {{
                  prefix: () => <NIcon component={TimeOutline} color="#ff7d00" />,
                  default: () => stats.value.avgRt || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard size="small">
              <NStatistic label="Active Instances">
                {{
                  prefix: () => <NIcon component={ServerOutline} color="#00b42a" />,
                  default: () => stats.value.activeInstances || '-'
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '16px', color: '#666' }}>Active Alerts</h3>

        <NCard size="small">
          <NList>
            {stats.value.alerts?.map((alert: any) => (
              <NListItem key={alert.id}>
                <NThing title={alert.service}>
                  {{
                    'header-extra': () => (
                      <NTag type={alert.level === 'critical' ? 'error' : 'warning'} size="small">
                        {alert.level}
                      </NTag>
                    ),
                    description: () => alert.message,
                    avatar: () => (
                      <NIcon component={WarningOutline} color={alert.level === 'critical' ? '#d03050' : '#f0a020'} />
                    )
                  }}
                </NThing>
              </NListItem>
            ))}
          </NList>
        </NCard>
      </div>
    )
  }
})
