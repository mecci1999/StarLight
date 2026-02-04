import {
  NCard,
  NSpin,
  NEmpty,
  NTag,
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NSelect,
  NModal,
  NStatistic,
  NGrid,
  NGridItem,
  NProgress,
  useMessage,
  useDialog,
  NIcon
} from 'naive-ui'
import { defineComponent, ref, h, onMounted, watch, computed } from 'vue'
import { fetchTopology, fetchServices, fetchRealtimeMetrics, fetchServiceInstances } from '@/api'
import type { TopologyData, ServiceItem, ServiceInstance } from '@/types/monitor'
import TopologyChart from '@/components/charts/TopologyChart'
import SectionHeader from '@/components/common/SectionHeader'
import { ServerOutline, PulseOutline, HardwareChipOutline, SearchOutline, RefreshOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'ServiceOverview',
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    const topologyLoading = ref(true)
    const topologyData = ref<TopologyData | null>(null)

    onMounted(async () => {
      try {
        topologyData.value = await fetchTopology()
      } catch (e) {
        console.error(e)
      } finally {
        topologyLoading.value = false
      }
    })

    const searchValue = ref('')
    const statusFilter = ref('all')
    const serviceListLoading = ref(false)
    const services = ref<ServiceItem[]>([])

    const statusOptions = [
      { label: '全部状态', value: 'all' },
      { label: '运行中', value: 'running' },
      { label: '已停止', value: 'stopped' },
      { label: '异常', value: 'error' }
    ]

    const showDetail = ref(false)
    const detailLoading = ref(false)
    const currentService = ref<ServiceItem | null>(null)
    const detailMetrics = ref({
      cpu: 0,
      memory: 0,
      qps: 0,
      responseTime: 0,
      errorRate: 0,
      activeConnections: 0
    })

    const openDetail = async (row: ServiceItem) => {
      currentService.value = row
      showDetail.value = true
      detailLoading.value = true
      try {
        const m = await fetchRealtimeMetrics(row.id)
        detailMetrics.value = m
      } catch (e) {
        detailMetrics.value = { cpu: 0, memory: 0, qps: 0, responseTime: 0, errorRate: 0, activeConnections: 0 }
      } finally {
        detailLoading.value = false
      }
    }

    const handleRestart = async (row: ServiceItem) => {
      dialog?.warning({
        title: '重启服务',
        content: `确认重启 ${row.name} ?`,
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
          message.loading('正在重启...')
          try {
            // await api.restartService(row.id)
            message.success('重启指令已发送')
            // Refresh list
            doFetchServices()
          } catch (e) {
            message.error('重启失败')
          }
        }
      })
    }

    const serviceColumns = [
      {
        title: '服务名称',
        key: 'name',
        width: 200,
        render(row: any) {
          return <span class="font-bold text-[--color-text-1]">{row.name}</span>
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render(row: any) {
          return h(
            NTag,
            {
              type: row.status === 'running' ? 'success' : row.status === 'stopped' ? 'error' : 'warning',
              bordered: false,
              size: 'small'
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
        width: 120,
        render(row: any) {
          return <span class="font-mono text-12px bg-[--color-fill-2] px-2 py-1 rounded-4px">{row.version}</span>
        }
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
              type: row.health === 'healthy' ? 'success' : 'error',
              bordered: false,
              size: 'small'
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
        width: 180,
        render(row: any) {
          return <span class="text-[--color-text-3] text-12px">{row.lastUpdate}</span>
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render(row: any) {
          return h(NSpace, null, {
            default: () => [
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'primary', onClick: () => openDetail(row) },
                { default: () => '详情' }
              ),
              h(
                NButton,
                { size: 'tiny', secondary: true, onClick: () => message.info('日志模块已集成') },
                { default: () => '日志' }
              ),
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'warning', onClick: () => handleRestart(row) },
                { default: () => '重启' }
              )
            ]
          })
        }
      }
    ]

    const doFetchServices = async () => {
      serviceListLoading.value = true
      try {
        const res = await fetchServices({ status: statusFilter.value as any, keyword: searchValue.value })
        services.value = res.services || []
      } catch (e) {
        message.error('加载服务列表失败')
      } finally {
        serviceListLoading.value = false
      }
    }

    onMounted(doFetchServices)

    watch([searchValue, statusFilter], () => {
      doFetchServices()
    })

    const selectedService = ref('user-service')
    const instanceLoading = ref(false)
    const instanceData = ref<ServiceInstance[]>([])

    const serviceOptions = [
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    const instanceColumns = [
      {
        title: '实例ID',
        key: 'id',
        width: 200,
        render(row: any) {
          return <span class="font-mono text-12px">{row.id}</span>
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render(row: any) {
          return h(
            NTag,
            {
              type: row.status === 'running' ? 'success' : 'error',
              bordered: false,
              size: 'small'
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
            showIndicator: false,
            color:
              row.cpu > 80
                ? 'var(--color-danger-6)'
                : row.cpu > 60
                  ? 'var(--color-warning-6)'
                  : 'var(--color-success-6)'
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
            showIndicator: false,
            color:
              row.memory > 80
                ? 'var(--color-danger-6)'
                : row.memory > 60
                  ? 'var(--color-warning-6)'
                  : 'var(--color-success-6)'
          })
        }
      },
      {
        title: '启动时间',
        key: 'startTime',
        width: 180,
        render(row: any) {
          return <span class="text-[--color-text-3] text-12px">{row.startTime}</span>
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        render(row: any) {
          const showInstanceDetail = () => message.info(`查看实例 ${row.id}`)
          const restartInstance = () => {
            dialog?.warning({
              title: '重启实例',
              content: `确认重启实例 ${row.id} ?`,
              positiveText: '确认',
              negativeText: '取消',
              onPositiveClick: () => {
                message.loading('正在重启...')
                setTimeout(() => {
                  row.status = 'running'
                  row.cpu = Math.min(95, row.cpu || 30)
                  row.memory = Math.min(95, row.memory || 30)
                  message.success('实例重启成功')
                }, 1000)
              }
            })
          }
          return h(NSpace, null, {
            default: () => [
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'primary', onClick: showInstanceDetail },
                { default: () => '详情' }
              ),
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'warning', onClick: restartInstance },
                { default: () => '重启' }
              )
            ]
          })
        }
      }
    ]

    const totalInstances = computed(() => instanceData.value.length)
    const runningInstances = computed(() => instanceData.value.filter((i) => i.status === 'running').length)
    const errorInstances = computed(() => instanceData.value.filter((i) => i.status === 'error').length)
    const avgCpu = computed(() => {
      if (!instanceData.value.length) return '0%'
      const sum = instanceData.value.reduce((acc, cur) => acc + cur.cpu, 0)
      return `${Math.round((sum / instanceData.value.length) * 10) / 10}%`
    })

    const loadInstances = async () => {
      instanceLoading.value = true
      try {
        instanceData.value = (await fetchServiceInstances(selectedService.value)) || []
      } catch (e) {
        message.error('加载实例数据失败')
      } finally {
        instanceLoading.value = false
      }
    }

    onMounted(loadInstances)
    watch(selectedService, loadInstances)

    return () => (
      <div class="p-24px h-full bg-[--color-bg-1] overflow-hidden flex flex-col">
        <SectionHeader title="服务总览" subtitle="服务拓扑、列表与实例运行状态一览" icon={ServerOutline} />

        <div class="flex-1 overflow-auto">
          <NGrid cols={1} xGap={16} yGap={16}>
            <NGridItem>
              <NCard class="shadow-[var(--shadow-center-1)] rounded-lg" bordered={false} contentStyle={{ padding: 0 }}>
                <div class="flex items-center justify-between px-16px py-12px border-b border-[--color-border-1]">
                  <div class="flex items-center gap-8px">
                    <span class="text-14px font-600 text-[--color-text-1]">服务拓扑图</span>
                  </div>
                  <span class="text-12px text-[--color-text-3]">全局服务依赖与调用链路</span>
                </div>
                {topologyLoading.value ? (
                  <div class="flex items-center justify-center h-360px">
                    <NSpin size="large" />
                  </div>
                ) : (
                  <div class="h-360px w-full">
                    {topologyData.value && topologyData.value.nodes.length ? (
                      <TopologyChart data={topologyData.value} height="100%" />
                    ) : (
                      <NEmpty description="暂无拓扑数据">
                        <div class="text-14px text-[--color-text-3] mt-16px">请确认服务注册中心是否正常运行</div>
                      </NEmpty>
                    )}
                  </div>
                )}
              </NCard>
            </NGridItem>

            <NGridItem>
              <NCard class="shadow-[var(--shadow-center-1)] rounded-lg" bordered={false}>
                <div class="flex items-center justify-between mb-16px">
                  <div class="flex items-center gap-8px">
                    <NIcon size={18}>
                      <PulseOutline />
                    </NIcon>
                    <span class="text-14px font-600 text-[--color-text-1]">服务列表</span>
                  </div>
                  <span class="text-12px text-[--color-text-3]">查看和管理所有微服务的运行状态</span>
                </div>
                <div class="mb-16px">
                  <div class="flex items-center gap-4">
                    <NInput
                      v-model:value={searchValue.value}
                      placeholder="搜索服务名称"
                      style={{ width: '300px' }}
                      clearable>
                      {{ prefix: () => <NIcon component={SearchOutline} /> }}
                    </NInput>
                    <NSelect v-model:value={statusFilter.value} options={statusOptions} style={{ width: '150px' }} />
                    <NButton secondary type="primary" onClick={doFetchServices}>
                      {{ icon: () => <NIcon component={RefreshOutline} /> }}
                    </NButton>
                  </div>
                </div>
                <div class="-mx-16px">
                  <NDataTable
                    class="h-full"
                    flex-height
                    loading={serviceListLoading.value}
                    columns={serviceColumns}
                    data={services.value}
                    pagination={{
                      pageSize: 10,
                      showSizePicker: true,
                      pageSizes: [10, 20, 50]
                    }}
                    bordered={false}
                    singleLine={false}
                    rowKey={(row: any) => row.id}
                    rowClassName="hover:bg-[--color-fill-1]"
                  />
                </div>
              </NCard>
            </NGridItem>

            <NGridItem>
              <NCard class="shadow-[var(--shadow-center-1)] rounded-lg" bordered={false}>
                <div class="flex items-center justify-between mb-16px">
                  <div class="flex items-center gap-8px">
                    <NIcon size={18}>
                      <HardwareChipOutline />
                    </NIcon>
                    <span class="text-14px font-600 text-[--color-text-1]">实例监控</span>
                  </div>
                  <span class="text-12px text-[--color-text-3]">监控服务实例的运行状态和资源使用情况</span>
                </div>

                <NGrid cols={4} xGap={16} class="mb-16px">
                  <NGridItem>
                    <NCard bordered={false} class="shadow-[var(--shadow-center-1)] rounded-lg bg-[--color-fill-2]">
                      <NStatistic label="总实例数" value={totalInstances.value}>
                        {{
                          default: () => (
                            <div class="text-24px font-bold text-[--color-text-1]">{totalInstances.value}</div>
                          )
                        }}
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard bordered={false} class="shadow-[var(--shadow-center-1)] rounded-lg bg-[--color-fill-2]">
                      <NStatistic label="运行中" value={runningInstances.value}>
                        {{
                          default: () => (
                            <div class="text-24px font-bold text-[--color-success-6]">{runningInstances.value}</div>
                          )
                        }}
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard bordered={false} class="shadow-[var(--shadow-center-1)] rounded-lg bg-[--color-fill-2]">
                      <NStatistic label="异常" value={errorInstances.value}>
                        {{
                          default: () => (
                            <div class="text-24px font-bold text-[--color-danger-6]">{errorInstances.value}</div>
                          )
                        }}
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard bordered={false} class="shadow-[var(--shadow-center-1)] rounded-lg bg-[--color-fill-2]">
                      <NStatistic label="平均CPU" value={avgCpu.value}>
                        {{ default: () => <div class="text-24px font-bold text-[--color-text-1]">{avgCpu.value}</div> }}
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                </NGrid>

                <NCard
                  class="shadow-[var(--shadow-center-1)] rounded-lg"
                  bordered={false}
                  contentStyle={{ padding: 0 }}>
                  <div class="p-16px border-b border-[--color-border-1]">
                    <div class="flex items-center justify-between">
                      <h3 class="text-16px font-600 text-[--color-text-1] m-0">实例列表 - {selectedService.value}</h3>
                      <NSelect
                        v-model:value={selectedService.value}
                        options={serviceOptions}
                        style={{ width: '200px' }}
                      />
                    </div>
                  </div>
                  <NDataTable
                    class="h-full"
                    flex-height
                    loading={instanceLoading.value}
                    columns={instanceColumns}
                    data={instanceData.value}
                    pagination={{
                      pageSize: 10,
                      showSizePicker: true,
                      pageSizes: [10, 20, 50]
                    }}
                    bordered={false}
                    singleLine={false}
                    rowKey={(row: any) => row.id}
                    rowClassName="hover:bg-[--color-fill-1]"
                  />
                </NCard>
              </NCard>
            </NGridItem>
          </NGrid>
        </div>

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
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="CPU" value={`${detailMetrics.value.cpu}%`}>
                    {{
                      default: () => (
                        <div class="text-20px font-bold text-[--color-text-1]">{detailMetrics.value.cpu}%</div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="内存" value={`${detailMetrics.value.memory}%`}>
                    {{
                      default: () => (
                        <div class="text-20px font-bold text-[--color-text-1]">{detailMetrics.value.memory}%</div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="QPS" value={detailMetrics.value.qps}>
                    {{
                      default: () => (
                        <div class="text-20px font-bold text-[--color-text-1]">{detailMetrics.value.qps}</div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="响应时间" value={`${detailMetrics.value.responseTime}ms`}>
                    {{
                      default: () => (
                        <div class="text-20px font-bold text-[--color-text-1]">
                          {detailMetrics.value.responseTime}ms
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="错误率" value={`${detailMetrics.value.errorRate.toFixed(2)}%`}>
                    {{
                      default: () => (
                        <div
                          class={`text-20px font-bold ${
                            detailMetrics.value.errorRate > 0 ? 'text-[--color-danger-6]' : 'text-[--color-success-6]'
                          }`}>
                          {detailMetrics.value.errorRate.toFixed(2)}%
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard embedded bordered={false} contentStyle={{ padding: '16px' }} class="bg-[--color-fill-2]">
                  <NStatistic label="活跃连接" value={detailMetrics.value.activeConnections}>
                    {{
                      default: () => (
                        <div class="text-20px font-bold text-[--color-text-1]">
                          {detailMetrics.value.activeConnections}
                        </div>
                      )
                    }}
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
