import { NCard, NProgress, NTag, NSpace, NButton, NSelect, useMessage, useDialog } from 'naive-ui'
import { defineComponent, ref, h, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchServiceInstances, fetchCatalogServices, type MetricsDatasetScope } from '@/api'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'

import type { ServiceInstance } from '@/types/monitor'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import './InstanceMonitorPage.scss'

export default defineComponent({
  name: 'InstanceMonitorPage',
  setup() {
    const route = useRoute()
    const timeStore = useTimeStore()
    const message = useMessage()
    const dialog = useDialog()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const selectedService = ref('')
    const loading = ref(false)
    const instanceData = ref<ServiceInstance[]>([])
    const serviceOptions = ref<{ label: string; value: string }[]>([])

    const instanceColumns = [
      {
        title: '实例ID',
        key: 'id',
        width: 200,
        render(row: any) {
          return <span class="instance-monitor-page__mono-id">{row.id}</span>
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render(row: any) {
          if (!row.status || row.status === 'unknown') {
            return h(
              NTag,
              {
                type: 'default',
                size: 'small',
                bordered: false
              },
              {
                default: () => '未知'
              }
            )
          }
          return h(
            NTag,
            {
              type: row.status === 'running' ? 'success' : row.status === 'error' ? 'error' : 'default',
              size: 'small',
              bordered: false
            },
            {
              default: () => (row.status === 'running' ? '运行中' : row.status === 'error' ? '异常' : '未知')
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
          if (typeof row.cpu !== 'number') {
            return <span class="instance-monitor-page__unknown-text">未知</span>
          }
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
          if (typeof row.memory !== 'number') {
            return <span class="instance-monitor-page__unknown-text">未知</span>
          }
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
          return <span class="instance-monitor-page__unknown-text">{row.startTime || '未知'}</span>
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        render(row: any) {
          const showDetail = () => message.info(`查看实例 ${row.id}`)
          return h(NSpace, null, {
            default: () => [
              h(
                NButton,
                { size: 'tiny', secondary: true, type: 'primary', onClick: showDetail },
                { default: () => '详情' }
              )
            ]
          })
        }
      }
    ]

    const instanceDataAvailable = ref(false)
    const totalInstances = computed(() => (instanceDataAvailable.value ? instanceData.value.length : null))
    const runningInstances = computed(() =>
      instanceDataAvailable.value ? instanceData.value.filter((i) => i.status === 'running').length : null
    )
    const errorInstances = computed(() =>
      instanceDataAvailable.value ? instanceData.value.filter((i) => i.status === 'error').length : null
    )
    const displayMetric = (value: number | null | undefined) => (typeof value === 'number' ? value : '未知')
    const avgCpu = computed(() => {
      const validCpu = instanceData.value
        .map((item) => item.cpu)
        .filter((value): value is number => typeof value === 'number')
      if (!validCpu.length) return '未知'
      const sum = validCpu.reduce((acc, cur) => acc + cur, 0)
      return `${Math.round((sum / validCpu.length) * 10) / 10}%`
    })

    const selectedServiceLabel = computed(
      () =>
        serviceOptions.value.find((option) => option.value === selectedService.value)?.label || selectedService.value
    )

    const statsCards = computed(() => [
      {
        key: 'total',
        label: '总实例数',
        value: displayMetric(totalInstances.value),
        hint: '当前服务发现到的实例总量',
        tone: 'default'
      },
      {
        key: 'running',
        label: '运行中',
        value: displayMetric(runningInstances.value),
        hint: '状态正常并可接收流量',
        tone: 'success'
      },
      {
        key: 'error',
        label: '异常',
        value: displayMetric(errorInstances.value),
        hint: '需要优先排查的实例',
        tone: 'danger'
      },
      {
        key: 'cpu',
        label: '平均 CPU',
        value: avgCpu.value,
        hint: '仅统计上报 CPU 的实例',
        tone: 'primary'
      }
    ])

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        serviceOptions.value = (res?.items || []).map((item: any) => ({
          label: item.identity?.name,
          value: item.identity?.id
        }))
        if (!selectedService.value || !serviceOptions.value.some((opt) => opt.value === selectedService.value)) {
          selectedService.value = serviceOptions.value[0]?.value || ''
        }
      } catch (e) {
        message.error('加载服务列表失败')
        serviceOptions.value = []
        if (!selectedService.value) selectedService.value = ''
      }
    }

    const loadInstances = async () => {
      if (!selectedService.value) {
        instanceData.value = []
        instanceDataAvailable.value = false
        return
      }
      loading.value = true
      try {
        instanceData.value = (await fetchServiceInstances(selectedService.value, { scope: datasetScope.value })) || []
        instanceDataAvailable.value = true
      } catch (e) {
        message.error('加载实例失败')
        instanceData.value = []
        instanceDataAvailable.value = false
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        selectedService.value = route.query.serviceId
      }
      loadServiceOptions()
      loadInstances()
    })
    watch(selectedService, loadInstances)
    watch(
      () => datasetScope.value,
      () => {
        selectedService.value = ''
        loadServiceOptions()
      }
    )

    return () => (
      <div class="instance-monitor-page">
        <PageHeader title="实例监控" subtitle="监控服务实例的运行状态和资源使用情况">
          {{}}
        </PageHeader>

        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => timeStore.setTimeRange(range)}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadInstances()
          }}
        />

        <section class="instance-monitor-page__stats-grid" aria-label="实例状态摘要">
          {statsCards.value.map((item) => (
            <article
              key={item.key}
              class={['instance-monitor-page__stat-card', `instance-monitor-page__stat-card--${item.tone}`]}>
              <div class="instance-monitor-page__stat-main">
                <span class="instance-monitor-page__stat-label">{item.label}</span>
                <strong class="instance-monitor-page__stat-value">{item.value}</strong>
              </div>
              <span class="instance-monitor-page__stat-hint">{item.hint}</span>
            </article>
          ))}
        </section>

        <NCard class="instance-monitor-page__table-card" bordered={false} contentStyle={{ padding: 0 }}>
          <div class="instance-monitor-page__table-header">
            <div class="instance-monitor-page__table-header-content">
              <div>
                <h3 class="instance-monitor-page__table-title">实例列表</h3>
                <p class="instance-monitor-page__table-desc">
                  {selectedService.value ? `当前服务：${selectedServiceLabel.value}` : '请选择服务查看实例状态'}
                </p>
              </div>
              <label class="instance-monitor-page__service-filter">
                <span class="instance-monitor-page__service-filter-label">服务</span>
                <NSelect
                  class="instance-monitor-page__service-select"
                  v-model:value={selectedService.value}
                  options={serviceOptions.value}
                  filterable
                  clearable={false}
                  placeholder="选择服务"
                />
              </label>
            </div>
          </div>
          <div class="instance-monitor-page__table-scroll">
            <ResultTable
              class="instance-monitor-page__table"
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
              rowClassName="instance-monitor-page__table-row"
              scrollX={1050}
            />
          </div>
        </NCard>
      </div>
    )
  }
})
