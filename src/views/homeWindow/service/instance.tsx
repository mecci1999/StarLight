import { NCard, NGrid, NGridItem, NStatistic, NProgress, NTag, NDataTable, NSpace, NButton } from 'naive-ui'
import { ref, h } from 'vue'

export default defineComponent({
  name: 'InstanceMonitor',
  setup() {
    const selectedService = ref('user-service')

    const instanceColumns = [
      {
        title: '实例ID',
        key: 'id',
        width: 200
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render(row: any) {
          return h(
            NTag,
            {
              type: row.status === 'running' ? 'success' : 'error'
            },
            {
              default: () => (row.status === 'running' ? '运行中' : '异常')
            }
          )
        }
      },
      {
        title: '节点',
        key: 'node',
        width: 150
      },
      {
        title: 'CPU使用率',
        key: 'cpu',
        width: 120,
        render(row: any) {
          return h(NProgress, {
            type: 'line',
            percentage: row.cpu,
            status: row.cpu > 80 ? 'error' : row.cpu > 60 ? 'warning' : 'success',
            showIndicator: false
          })
        }
      },
      {
        title: '内存使用率',
        key: 'memory',
        width: 120,
        render(row: any) {
          return h(NProgress, {
            type: 'line',
            percentage: row.memory,
            status: row.memory > 80 ? 'error' : row.memory > 60 ? 'warning' : 'success',
            showIndicator: false
          })
        }
      },
      {
        title: '启动时间',
        key: 'startTime',
        width: 180
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        render() {
          return h(NSpace, null, {
            default: () => [
              h(NButton, { size: 'small', type: 'primary' }, { default: () => '详情' }),
              h(NButton, { size: 'small', type: 'warning' }, { default: () => '重启' })
            ]
          })
        }
      }
    ]

    const instanceData = ref([
      {
        key: '1',
        id: 'user-service-001',
        status: 'running',
        node: 'node-01',
        cpu: 45,
        memory: 62,
        startTime: '2024-01-15 10:30:25'
      },
      {
        key: '2',
        id: 'user-service-002',
        status: 'running',
        node: 'node-02',
        cpu: 38,
        memory: 55,
        startTime: '2024-01-15 10:32:10'
      },
      {
        key: '3',
        id: 'user-service-003',
        status: 'error',
        node: 'node-03',
        cpu: 0,
        memory: 0,
        startTime: '2024-01-15 10:35:45'
      }
    ])

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">实例监控</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">监控服务实例的运行状态和资源使用情况</p>
        </div>

        {/* 概览统计 */}
        <NGrid cols={4} xGap={16} class="mb-16px">
          <NGridItem>
            <NCard>
              <NStatistic label="总实例数" value={3} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="运行中" value={2} style={{ color: '#18a058' }} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="异常" value={1} style={{ color: '#d03050' }} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="平均CPU" value="41.5%" />
            </NCard>
          </NGridItem>
        </NGrid>

        {/* 实例列表 */}
        <NCard>
          <div class="mb-16px">
            <h3 class="text-16px font-600 text-[--color-text-1] m-0 mb-8px">实例列表 - {selectedService.value}</h3>
          </div>
          <NDataTable
            columns={instanceColumns}
            data={instanceData.value}
            pagination={{
              pageSize: 10,
              showSizePicker: true,
              pageSizes: [10, 20, 50]
            }}
            bordered={false}
            singleLine={false}
          />
        </NCard>
      </div>
    )
  }
})
