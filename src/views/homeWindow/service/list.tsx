import { NCard, NDataTable, NTag, NButton, NSpace, NInput, NSelect } from 'naive-ui'
import { ref, h } from 'vue'

export default defineComponent({
  name: 'ServiceList',
  setup() {
    const searchValue = ref('')
    const statusFilter = ref('all')

    const columns = [
      {
        title: '服务名称',
        key: 'name',
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
              type: row.status === 'running' ? 'success' : row.status === 'stopped' ? 'error' : 'warning'
            },
            {
              default: () => (row.status === 'running' ? '运行中' : row.status === 'stopped' ? '已停止' : '异常')
            }
          )
        }
      },
      {
        title: '版本',
        key: 'version',
        width: 120
      },
      {
        title: '实例数',
        key: 'instances',
        width: 100
      },
      {
        title: '健康检查',
        key: 'health',
        width: 120,
        render(row: any) {
          return h(
            NTag,
            {
              type: row.health === 'healthy' ? 'success' : 'error'
            },
            {
              default: () => (row.health === 'healthy' ? '健康' : '异常')
            }
          )
        }
      },
      {
        title: '最后更新',
        key: 'lastUpdate',
        width: 180
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render() {
          return h(NSpace, null, {
            default: () => [
              h(NButton, { size: 'small', type: 'primary' }, { default: () => '详情' }),
              h(NButton, { size: 'small' }, { default: () => '日志' }),
              h(NButton, { size: 'small', type: 'warning' }, { default: () => '重启' })
            ]
          })
        }
      }
    ]

    const data = ref([
      {
        key: '1',
        name: 'user-service',
        status: 'running',
        version: 'v1.2.3',
        instances: 3,
        health: 'healthy',
        lastUpdate: '2024-01-15 14:30:25'
      },
      {
        key: '2',
        name: 'order-service',
        status: 'running',
        version: 'v2.1.0',
        instances: 2,
        health: 'healthy',
        lastUpdate: '2024-01-15 14:28:10'
      },
      {
        key: '3',
        name: 'payment-service',
        status: 'error',
        version: 'v1.5.2',
        instances: 1,
        health: 'unhealthy',
        lastUpdate: '2024-01-15 14:25:45'
      }
    ])

    const statusOptions = [
      { label: '全部', value: 'all' },
      { label: '运行中', value: 'running' },
      { label: '已停止', value: 'stopped' },
      { label: '异常', value: 'error' }
    ]

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">服务列表</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">查看和管理所有微服务的运行状态</p>
        </div>

        <NCard class="mb-16px">
          <NSpace class="mb-16px">
            <NInput v-model:value={searchValue.value} placeholder="搜索服务名称" style={{ width: '300px' }} clearable />
            <NSelect v-model:value={statusFilter.value} options={statusOptions} style={{ width: '120px' }} />
            <NButton type="primary">刷新</NButton>
          </NSpace>
        </NCard>

        <NCard>
          <NDataTable
            columns={columns}
            data={data.value}
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
