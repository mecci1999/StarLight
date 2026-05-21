import { NButton, NCard, NCheckbox, NEmpty, NInput, NSelect, NSpace, NSpin, NTag, NThing, useMessage } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCatalogServices, fetchMetricsSchema, type MetricsDatasetScope } from '@/api'
import DetailDrawer from '@/shared/components/DetailDrawer'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import {
  collectMetricTypes,
  collectMetricUnits,
  filterMetricsCatalog,
  loadMetricsCatalogFallback,
  mapMetricToDashboardPreset,
  type MetricsCatalogSourceMode,
  type MetricsCatalogFilters,
  type MetricsCatalogSchemaItem
} from '../catalogModel'
import { isMetricsExplorerMetricSupported } from '../queryModel'
import './MetricsCatalogPage.scss'

export default defineComponent({
  name: 'MetricsCatalogPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const message = useMessage()
    const loading = ref(false)
    const drawerVisible = ref(false)
    const sourceMode = ref<MetricsCatalogSourceMode | 'unavailable'>('empty')
    const loadError = ref('')
    const datasetScope = ref<MetricsDatasetScope>(
      route.query.scope === 'system' || route.query.scope === 'tenant'
        ? (route.query.scope as MetricsDatasetScope)
        : getPreferredMetricsDatasetScope()
    )
    const serviceOptions = ref<Array<{ label: string; value: string }>>([])
    const allItems = ref<MetricsCatalogSchemaItem[]>([])
    const activeItem = ref<MetricsCatalogSchemaItem | null>(null)
    const filters = ref<MetricsCatalogFilters>({
      keyword: '',
      type: '',
      unit: '',
      hasLabels: false,
      serviceId: ''
    })

    const filteredItems = computed(() => filterMetricsCatalog(allItems.value, filters.value))
    const typeOptions = computed(() => [
      { label: '全部类型', value: '' },
      ...collectMetricTypes(allItems.value).map((value) => ({ label: value, value }))
    ])
    const unitOptions = computed(() => [
      { label: '全部单位', value: '' },
      ...collectMetricUnits(allItems.value).map((value) => ({ label: value, value }))
    ])
    const summaryCards = computed(() => ({
      total: allItems.value.length,
      labeled: allItems.value.filter((item) => item.labelNames.length > 0).length,
      gauges: allItems.value.filter((item) => item.type === 'gauge').length,
      counters: allItems.value.filter((item) => item.type === 'counter').length
    }))

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        serviceOptions.value = (res?.items || [])
          .map((item: any) => ({ label: item.identity?.name, value: item.identity?.id }))
          .filter((item: any) => item.label && item.value)
      } catch (error) {
        console.error('Failed to load metric catalog services:', error)
      }
    }

    const loadCatalog = async () => {
      loading.value = true
      loadError.value = ''
      try {
        const payload = await fetchMetricsSchema({
          serviceId: filters.value.serviceId || undefined,
          scope: datasetScope.value
        })
        const result = loadMetricsCatalogFallback(payload)
        allItems.value = result.items
        sourceMode.value = result.source
        loadError.value = result.source === 'unsupported' ? '指标 schema 响应格式暂不受支持' : ''
      } catch (error) {
        console.error('Failed to load metrics schema:', error)
        allItems.value = []
        sourceMode.value = 'unavailable'
        loadError.value = '指标 schema 暂时不可用，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    const openMetricDetail = (item: MetricsCatalogSchemaItem) => {
      activeItem.value = item
      drawerVisible.value = true
    }

    const openMetricsExplorer = (item: MetricsCatalogSchemaItem) => {
      if (!isMetricsExplorerMetricSupported(item.name)) {
        message.warning('当前指标还不能直接映射到现有指标分析视图')
        return
      }

      router.push({
        path: '/home/investigate/metrics',
        query: {
          serviceId: filters.value.serviceId || undefined,
          scope: datasetScope.value,
          metric: item.name
        }
      })
    }

    const startCardCreation = (item: MetricsCatalogSchemaItem) => {
      const preset = mapMetricToDashboardPreset(item)
      if (!preset) {
        message.warning('当前指标还不能直接映射到现有看板组件，请先到指标分析页查看')
        return
      }

      router.push({
        path: '/home/custom-dashboard',
        query: {
          prefillMetric: preset.metric,
          prefillType: preset.type,
          prefillTitle: item.description && item.description !== '暂无描述' ? item.description : item.name,
          scope: datasetScope.value,
          serviceId: filters.value.serviceId || undefined,
          startAdd: '1'
        }
      })
    }

    const columns = computed(() => [
      {
        title: '指标名',
        key: 'name',
        render: (row: MetricsCatalogSchemaItem) => (
          <div class="metrics-catalog-page__name-cell">
            <button class="metrics-catalog-page__link" type="button" onClick={() => openMetricDetail(row)}>
              {row.name}
            </button>
            <div class="metrics-catalog-page__description">{row.description}</div>
          </div>
        )
      },
      {
        title: '类型',
        key: 'type',
        render: (row: MetricsCatalogSchemaItem) => (
          <NTag size="small" bordered={false}>
            {row.type}
          </NTag>
        )
      },
      {
        title: '单位',
        key: 'unit',
        render: (row: MetricsCatalogSchemaItem) => row.unit || '—'
      },
      {
        title: '标签维度',
        key: 'labels',
        render: (row: MetricsCatalogSchemaItem) => (row.labelNames.length ? row.labelNames.join(', ') : '无')
      },
      {
        title: '样例值',
        key: 'sampleCount',
        render: (row: MetricsCatalogSchemaItem) => row.sampleCount
      },
      {
        title: '推荐图表',
        key: 'recommendation',
        render: (row: MetricsCatalogSchemaItem) => (
          <NTag size="small" bordered={false} type="info">
            {row.recommendation}
          </NTag>
        )
      },
      {
        title: '操作',
        key: 'actions',
        render: (row: MetricsCatalogSchemaItem) => (
          <NSpace size={8}>
            <NButton
              size="small"
              tertiary
              onClick={() => openMetricsExplorer(row)}
              disabled={!isMetricsExplorerMetricSupported(row.name)}>
              去分析
            </NButton>
            <NButton size="small" type="primary" ghost onClick={() => startCardCreation(row)}>
              创建卡片
            </NButton>
          </NSpace>
        )
      }
    ])

    onMounted(async () => {
      await loadServiceOptions()
      await loadCatalog()
    })

    watch(
      () => datasetScope.value,
      async () => {
        filters.value.serviceId = ''
        await loadServiceOptions()
        await loadCatalog()
      }
    )

    watch(
      () => filters.value.serviceId,
      async () => {
        await loadCatalog()
      }
    )

    const renderDetailContent = () => {
      const item = activeItem.value
      if (!item) return null

      return (
        <div class="metrics-catalog-page__detail-panel">
          <div class="metrics-catalog-page__detail-hero">
            <div class="metrics-catalog-page__detail-title">{item.name}</div>
            <div class="metrics-catalog-page__detail-description">{item.description}</div>
            <div class="metrics-catalog-page__detail-meta">
              <NTag size="small" bordered={false}>
                {item.type}
              </NTag>
              <NTag size="small" bordered={false} type="info">
                {item.unit || '无单位'}
              </NTag>
              <NTag size="small" bordered={false} type="success">
                推荐 {item.recommendation}
              </NTag>
            </div>
          </div>

          <NThing title="标签维度">
            {{ default: () => (item.labelNames.length ? item.labelNames.join('、') : '无') }}
          </NThing>

          <NThing title="样例标签值">
            {{
              default: () =>
                Object.keys(item.sampleLabels).length ? (
                  <div class="metrics-catalog-page__sample-labels">
                    {Object.entries(item.sampleLabels).map(([key, values]) => (
                      <div key={key} class="metrics-catalog-page__sample-label-row">
                        <strong>{key}</strong>
                        <span>{values.join('、')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  '暂无样例标签值'
                )
            }}
          </NThing>

          <NThing title="最近活跃情况">
            {{ default: () => (item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : '暂无样例时间') }}
          </NThing>
        </div>
      )
    }

    const renderDetailFooter = () => {
      const item = activeItem.value
      if (!item) return null

      return (
        <NSpace justify="end">
          <NButton onClick={() => openMetricsExplorer(item)} disabled={!isMetricsExplorerMetricSupported(item.name)}>
            去指标分析
          </NButton>
          <NButton type="primary" onClick={() => startCardCreation(item)}>
            创建卡片
          </NButton>
        </NSpace>
      )
    }

    return () => (
      <div class="metrics-catalog-page">
        <PageHeader title="指标目录" subtitle="查看当前可用指标、标签维度、推荐图表，并从这里进入分析或创建卡片。">
          {{
            actions: () => (
              <NSpace>
                <NButton onClick={() => router.push('/home/investigate/metrics')}>前往指标分析</NButton>
              </NSpace>
            )
          }}
        </PageHeader>

        <NCard bordered={false} class="metrics-catalog-page__summary-grid">
          <div class="metrics-catalog-page__summary-card">
            <span>指标总数</span>
            <strong>{summaryCards.value.total}</strong>
          </div>
          <div class="metrics-catalog-page__summary-card">
            <span>带标签维度</span>
            <strong>{summaryCards.value.labeled}</strong>
          </div>
          <div class="metrics-catalog-page__summary-card">
            <span>Gauge</span>
            <strong>{summaryCards.value.gauges}</strong>
          </div>
          <div class="metrics-catalog-page__summary-card">
            <span>Counter</span>
            <strong>{summaryCards.value.counters}</strong>
          </div>
        </NCard>

        <NCard bordered={false} class="metrics-catalog-page__filters">
          <NSpace wrap>
            <NInput
              v-model:value={filters.value.keyword}
              class="metrics-catalog-page__search"
              placeholder="搜索指标名、描述、标签"
            />
            <NSelect
              v-model:value={filters.value.serviceId}
              class="metrics-catalog-page__select"
              options={[{ label: '全部服务', value: '' }, ...serviceOptions.value]}
              placeholder="服务"
              clearable
              disabled={sourceMode.value !== 'schema'}
            />
            <NSelect
              v-model:value={filters.value.type}
              class="metrics-catalog-page__select"
              options={typeOptions.value}
              placeholder="类型"
            />
            <NSelect
              v-model:value={filters.value.unit}
              class="metrics-catalog-page__select"
              options={unitOptions.value}
              placeholder="单位"
            />
            <label class="metrics-catalog-page__checkbox">
              <NCheckbox v-model:checked={filters.value.hasLabels} />
              <span>只看带标签维度</span>
            </label>
          </NSpace>
          <div class="metrics-catalog-page__hint-row">
            <NTag
              size="small"
              bordered={false}
              type={
                sourceMode.value === 'schema' ? 'success' : sourceMode.value === 'unavailable' ? 'error' : 'warning'
              }>
              {sourceMode.value === 'schema'
                ? '实时 schema 元数据'
                : sourceMode.value === 'unsupported'
                  ? 'schema 响应暂不受支持'
                  : sourceMode.value === 'unavailable'
                    ? 'schema 暂不可用'
                    : '暂无 schema 数据'}
            </NTag>
            <span>
              {filteredItems.value.length} 个可用指标
              {sourceMode.value !== 'schema' ? ' · 当前未展示任何 mock 指标' : ''}
            </span>
          </div>
        </NCard>

        <NCard bordered={false} class="metrics-catalog-page__content">
          {loading.value ? (
            <div class="metrics-catalog-page__loading">
              <NSpin size="large" />
            </div>
          ) : filteredItems.value.length ? (
            <ResultTable
              columns={columns.value as any}
              data={filteredItems.value as any}
              density="compact"
              flexHeight={false}
            />
          ) : (
            <NEmpty
              description={
                loadError.value ||
                (sourceMode.value === 'empty'
                  ? '当前还没有可用的指标 schema'
                  : sourceMode.value === 'unsupported'
                    ? '当前 schema 响应格式暂不受支持'
                    : '未找到匹配的指标')
              }
              class="metrics-catalog-page__empty-state"
            />
          )}
        </NCard>

        <DetailDrawer
          show={drawerVisible.value}
          title={activeItem.value?.name || '指标详情'}
          width="md"
          onUpdate:show={(value: boolean) => (drawerVisible.value = value)}>
          {{
            default: renderDetailContent,
            footer: renderDetailFooter
          }}
        </DetailDrawer>
      </div>
    )
  }
})
