import {
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NTag,
  NDataTable,
  NSpace,
  NButton,
  NSelect,
  NSpin,
  useMessage,
  useDialog
} from 'naive-ui'
import { defineComponent, ref, h, onMounted, watch, computed } from 'vue'
import { fetchServiceInstances } from '@/api'
import type { ServiceInstance } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { HardwareChipOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'InstanceMonitor',
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    const selectedService = ref('user-service')
    const loading = ref(false)
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
              size: 'small',
              bordered: false
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
          const showDetail = () => message.info(`查看实例 ${row.id}`)
          const restart = () => {
            dialog?.warning({
              title: '重启实例',
              content: `确认重启实例 ${row.id} ?`,
              positiveText: '确认',
              negativeText: '取消',
              onPositiveClick: async () => {
                message.loading('正在重启...')
                // TODO: Call real restart API
                // await api.restartInstance(row.id)
                // For now just wait a bit to simulate network delay if API not ready
                // But we should remove explicit mock logic that modifies local state directly
                try {
                  // await restartInstanceApi(row.id)
                  message.success('重启指令已发送')
                  // Refresh list
                  loadInstances()
                } catch (e) {
                  message.error('重启失败')
                }
              }
            })
          }
          return h(NSpace, null, {
            default: () => [
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'primary', onClick: showDetail },
                { default: () => '详情' }
              ),
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'warning', onClick: restart },
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
      loading.value = true
      try {
        instanceData.value = (await fetchServiceInstances(selectedService.value)) || []
      } catch (e) {
        message.error('加载实例失败')
        instanceData.value = []
      } finally {
        loading.value = false
      }
    }

    onMounted(loadInstances)
    watch(selectedService, loadInstances)

    return () => (
      <div class="p-24px h-full bg-[--color-bg-1] overflow-hidden flex flex-col">
        <SectionHeader title="实例监控" subtitle="监控服务实例的运行状态和资源使用情况" icon={HardwareChipOutline} />

        {/* 概览统计 */}
        <NGrid cols={4} xGap={16} class="mb-16px">
          <NGridItem>
            <NCard bordered={false} class="shadow-sm rounded-lg bg-[--color-fill-2]">
              <NStatistic label="总实例数" value={totalInstances.value}>
                {{ default: () => <div class="text-24px font-bold text-[--color-text-1]">{totalInstances.value}</div> }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="shadow-sm rounded-lg bg-[--color-fill-2]">
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
            <NCard bordered={false} class="shadow-sm rounded-lg bg-[--color-fill-2]">
              <NStatistic label="异常" value={errorInstances.value}>
                {{
                  default: () => <div class="text-24px font-bold text-[--color-danger-6]">{errorInstances.value}</div>
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="shadow-sm rounded-lg bg-[--color-fill-2]">
              <NStatistic label="平均CPU" value={avgCpu.value}>
                {{ default: () => <div class="text-24px font-bold text-[--color-text-1]">{avgCpu.value}</div> }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard class="flex-1 shadow-sm rounded-lg" bordered={false} contentStyle={{ padding: 0 }}>
          <div class="p-16px border-b border-[--color-border-1]">
            <div class="flex items-center justify-between">
              <h3 class="text-16px font-600 text-[--color-text-1] m-0">实例列表 - {selectedService.value}</h3>
              <NSelect v-model:value={selectedService.value} options={serviceOptions} style={{ width: '200px' }} />
            </div>
          </div>
          <NDataTable
            class="h-full"
            flex-height
            loading={loading.value}
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
      </div>
    )
  }
})
