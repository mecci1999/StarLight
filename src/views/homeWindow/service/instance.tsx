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
  NModal
} from 'naive-ui'
import { ref, h, onMounted, watch, computed } from 'vue'
import { fetchServiceInstances } from '@/mock/api'
import type { ServiceInstance } from '@/types/monitor'
import SectionHeader from '@/components/common/SectionHeader'
import { HardwareChipOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'InstanceMonitor',
  setup() {
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
        width: 180,
        render(row: any) {
          const showDetail = () => window.$message.info(`查看实例 ${row.id}`)
          const restart = () => {
            window.$dialog?.warning({
              title: '重启实例',
              content: `确认重启实例 ${row.id} ?`,
              positiveText: '确认',
              negativeText: '取消',
              onPositiveClick: () => {
                window.$message.loading('正在重启...')
                setTimeout(() => {
                  row.status = 'running'
                  row.cpu = Math.min(95, row.cpu || 30)
                  row.memory = Math.min(95, row.memory || 30)
                  window.$message.success('实例重启成功')
                }, 1000)
              }
            })
          }
          return h(NSpace, null, {
            default: () => [
              h(NButton, { size: 'small', type: 'primary', onClick: showDetail }, { default: () => '详情' }),
              h(NButton, { size: 'small', type: 'warning', onClick: restart }, { default: () => '重启' })
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
      instanceData.value = await fetchServiceInstances(selectedService.value)
      loading.value = false
    }

    onMounted(loadInstances)
    watch(selectedService, loadInstances)

    return () => (
      <div class="p-24px h-full">
        <SectionHeader title="实例监控" subtitle="监控服务实例的运行状态和资源使用情况" icon={HardwareChipOutline} />

        {/* 概览统计 */}
        <NGrid cols={4} xGap={16} class="mb-16px">
          <NGridItem>
            <NCard>
              <NStatistic label="总实例数" value={totalInstances.value} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="运行中" value={runningInstances.value} style={{ color: '#18a058' }} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="异常" value={errorInstances.value} style={{ color: '#d03050' }} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="平均CPU" value={avgCpu.value} />
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard>
          <div class="mb-16px">
            <div class="flex items-center justify-between">
              <h3 class="text-16px font-600 text-[--color-text-1] m-0 mb-8px">实例列表 - {selectedService.value}</h3>
              <NSelect v-model:value={selectedService.value} options={serviceOptions} style={{ width: '200px' }} />
            </div>
          </div>
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
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
              rowKey={(row: any) => row.id}
            />
          )}
        </NCard>

        <NModal preset="dialog" title="重启实例" v-model:show={false}></NModal>
      </div>
    )
  }
})
