import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NSpace,
  NInput,
  NSelect,
  NSpin,
  NModal,
  NStatistic,
  NGrid,
  NGridItem
} from 'naive-ui'
import { ref, h, onMounted, watch } from 'vue'
import { fetchServices } from '@/mock/api'
import type { ServiceItem } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { PulseOutline } from '@vicons/ionicons5'
import { fetchRealtimeMetrics } from '@/mock/api'

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
        render(row: any) {
          return h(NSpace, null, {
            default: () => [
              h(NButton, { size: 'small', type: 'primary', onClick: () => openDetail(row) }, { default: () => '详情' }),
              h(
                NButton,
                { size: 'small', onClick: () => window.$message.info('日志模块暂未开放') },
                { default: () => '日志' }
              ),
              h(
                NButton,
                { size: 'small', type: 'warning', onClick: () => handleRestart(row) },
                { default: () => '重启' }
              )
            ]
          })
        }
      }
    ]

    const loading = ref(false)
    const data = ref<ServiceItem[]>([])

    const statusOptions = [
      { label: '全部', value: 'all' },
      { label: '运行中', value: 'running' },
      { label: '已停止', value: 'stopped' },
      { label: '异常', value: 'error' }
    ]

    const doFetch = async () => {
      loading.value = true
      const res = await fetchServices({ status: statusFilter.value as any, keyword: searchValue.value })
      data.value = res.services
      loading.value = false
    }

    onMounted(doFetch)
    watch([searchValue, statusFilter], () => {
      doFetch()
    })

    const showDetail = ref(false)
    const detailLoading = ref(false)
    const currentService = ref<ServiceItem | null>(null)
    const detailMetrics = ref({ cpu: 0, memory: 0, qps: 0, responseTime: 0, errorRate: 0, activeConnections: 0 })

    const openDetail = async (row: ServiceItem) => {
      currentService.value = row
      showDetail.value = true
      detailLoading.value = true
      const m = await fetchRealtimeMetrics(row.id)
      detailMetrics.value = m
      detailLoading.value = false
    }

    const handleRestart = async (row: ServiceItem) => {
      window.$dialog?.warning({
        title: '重启服务',
        content: `确认重启 ${row.name} ?`,
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: () => {
          window.$message.loading('正在重启...')
          setTimeout(() => {
            row.status = 'running'
            row.health = 'healthy'
            window.$message.success('重启成功')
          }, 1200)
        }
      })
    }

    return () => (
      <div class="p-24px h-full bg-gray-50/50 overflow-hidden flex flex-col">
        <SectionHeader title="服务列表" subtitle="查看和管理所有微服务的运行状态" icon={PulseOutline} />

        <NCard class="mb-16px shadow-sm rounded-lg" bordered={false}>
          <NSpace>
            <NInput v-model:value={searchValue.value} placeholder="搜索服务名称" style={{ width: '300px' }} clearable />
            <NSelect v-model:value={statusFilter.value} options={statusOptions} style={{ width: '120px' }} />
            <NButton type="primary" onClick={doFetch}>
              刷新
            </NButton>
          </NSpace>
        </NCard>

        <NCard class="flex-1 shadow-sm rounded-lg" bordered={false} contentStyle={{ padding: 0 }}>
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
            <NDataTable
              class="h-full"
              flex-height
              columns={columns}
              data={data.value}
              pagination={{
                pageSize: 10,
                showSizePicker: true,
                pageSizes: [10, 20, 50]
              }}
              bordered={false}
              singleLine={false}
              rowKey={(row: any) => row.id}
            />
          )}
        </NCard>

        <NModal
          v-model:show={showDetail.value}
          preset="card"
          style={{ width: '720px' }}
          title={currentService.value?.name}
          bordered={false}
          class="shadow-lg rounded-lg">
          {detailLoading.value ? (
            <div class="py-32px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
            <NGrid cols={3} xGap={16} yGap={16}>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="CPU" value={`${detailMetrics.value.cpu}%`}>
                    {{ default: () => <div class="text-20px font-bold">{detailMetrics.value.cpu}%</div> }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="内存" value={`${detailMetrics.value.memory}%`}>
                    {{ default: () => <div class="text-20px font-bold">{detailMetrics.value.memory}%</div> }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="QPS" value={detailMetrics.value.qps}>
                    {{ default: () => <div class="text-20px font-bold">{detailMetrics.value.qps}</div> }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="响应时间" value={`${detailMetrics.value.responseTime}ms`}>
                    {{ default: () => <div class="text-20px font-bold">{detailMetrics.value.responseTime}ms</div> }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="错误率" value={`${detailMetrics.value.errorRate.toFixed(2)}%`}>
                    {{
                      default: () => (
                        <div
                          class={`text-20px font-bold ${detailMetrics.value.errorRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {detailMetrics.value.errorRate.toFixed(2)}%
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }}>
                  <NStatistic label="活跃连接" value={detailMetrics.value.activeConnections}>
                    {{ default: () => <div class="text-20px font-bold">{detailMetrics.value.activeConnections}</div> }}
                  </NStatistic>
                </NCard>
              </NGridItem>
            </NGrid>
          )}
        </NModal>
      </div>
    )
  }
})
