import { NButton, NCard, NCheckbox, NEmpty, NInput, NSelect, NSpace, NSpin, NTag, NThing, useMessage } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCatalogServices, fetchMetricsSchema, type MetricsDatasetScope } from '@/api'
import DetailDrawer from '@/shared/components/DetailDrawer'
import PageHeader from '@/shared/layout/PageHeader'
import {
  canAccessMetricsDatasetScope,
  getPreferredMetricsDatasetScope,
  getStoredUserInfo
} from '@/services/authSession'
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

type MetricFamilyKey = 'traffic' | 'latency' | 'errors' | 'resources' | 'runtime' | 'business' | 'other'

type MetricFamilyMeta = {
  key: MetricFamilyKey
  label: string
  description: string
  accent: string
  matcher: (item: MetricsCatalogSchemaItem) => boolean
}

type CatalogServiceOption = {
  label: string
  value: string
}

const metricFamilies: MetricFamilyMeta[] = [
  {
    key: 'traffic',
    label: '流量吞吐',
    description: 'QPS、请求量、连接数',
    accent: 'blue',
    matcher: (item) => /qps|throughput|request|traffic|connection|count|total/i.test(`${item.name} ${item.description}`)
  },
  {
    key: 'latency',
    label: '延迟耗时',
    description: '响应时间、P95、duration',
    accent: 'purple',
    matcher: (item) => /latency|duration|response|time|耗时|延迟/i.test(`${item.name} ${item.description}`)
  },
  {
    key: 'errors',
    label: '错误健康',
    description: '错误率、状态、异常',
    accent: 'red',
    matcher: (item) =>
      /error|fail|exception|status|health|panic|错误|失败|异常/i.test(`${item.name} ${item.description}`)
  },
  {
    key: 'resources',
    label: '资源使用',
    description: 'CPU、内存、磁盘、网络',
    accent: 'green',
    matcher: (item) => /cpu|memory|mem|heap|disk|network|load|资源|内存/i.test(`${item.name} ${item.description}`)
  },
  {
    key: 'runtime',
    label: '运行时',
    description: '进程、GC、线程、实例',
    accent: 'orange',
    matcher: (item) => /process|runtime|gc|thread|instance|node|worker/i.test(`${item.name} ${item.description}`)
  },
  {
    key: 'business',
    label: '业务指标',
    description: '订单、任务、自定义埋点',
    accent: 'cyan',
    matcher: (item) => /business|order|payment|job|task|custom|业务|订单|任务/i.test(`${item.name} ${item.description}`)
  }
]

const getMetricFamily = (item: MetricsCatalogSchemaItem): MetricFamilyMeta =>
  metricFamilies.find((family) => family.matcher(item)) || {
    key: 'other',
    label: '其他指标',
    description: '暂未归类的指标',
    accent: 'gray',
    matcher: () => true
  }

const formatLastSeen = (timestamp: number | null) => {
  if (!timestamp) return '暂无样例时间'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '暂无样例时间'

  return date.toLocaleString()
}

const getServiceOption = (item: unknown): CatalogServiceOption | null => {
  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>
  const identity =
    record.identity && typeof record.identity === 'object' ? (record.identity as Record<string, unknown>) : null
  const label = identity?.name
  const value = identity?.id

  if (typeof label !== 'string' || typeof value !== 'string' || !label || !value) return null

  return { label, value }
}

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
    const serviceOptions = ref<CatalogServiceOption[]>([])
    const allItems = ref<MetricsCatalogSchemaItem[]>([])
    const activeItem = ref<MetricsCatalogSchemaItem | null>(null)
    const activeFamily = ref<MetricFamilyKey | 'all'>('all')
    const filters = ref<MetricsCatalogFilters>({
      keyword: '',
      type: '',
      unit: '',
      hasLabels: false,
      serviceId: ''
    })

    const scopeOptions = computed(() =>
      [
        { label: '用户接入', value: 'tenant' as const },
        { label: 'Darwin 系统', value: 'system' as const }
      ].filter((item) => canAccessMetricsDatasetScope(item.value, getStoredUserInfo()))
    )
    const selectedServiceLabel = computed(
      () => serviceOptions.value.find((item) => item.value === filters.value.serviceId)?.label || '全部服务'
    )
    const filteredItems = computed(() => filterMetricsCatalog(allItems.value, filters.value))
    const visibleItems = computed(() =>
      activeFamily.value === 'all'
        ? filteredItems.value
        : filteredItems.value.filter((item) => getMetricFamily(item).key === activeFamily.value)
    )
    const typeOptions = computed(() => [
      { label: '全部类型', value: '' },
      ...collectMetricTypes(allItems.value).map((value) => ({ label: value, value }))
    ])
    const unitOptions = computed(() => [
      { label: '全部单位', value: '' },
      ...collectMetricUnits(allItems.value).map((value) => ({ label: value, value }))
    ])
    const familyOptions = computed(() => {
      const counts = new Map<MetricFamilyKey, number>()
      filteredItems.value.forEach((item) => {
        const family = getMetricFamily(item).key
        counts.set(family, (counts.get(family) || 0) + 1)
      })

      return [
        {
          key: 'all' as const,
          label: '全部指标',
          description: '当前筛选下的完整集合',
          count: filteredItems.value.length,
          accent: 'black'
        },
        ...metricFamilies.map((family) => ({
          key: family.key,
          label: family.label,
          description: family.description,
          count: counts.get(family.key) || 0,
          accent: family.accent
        })),
        {
          key: 'other' as const,
          label: '其他指标',
          description: '暂未归类的指标',
          count: counts.get('other') || 0,
          accent: 'gray'
        }
      ].filter((item) => item.key === 'all' || item.count > 0)
    })
    const summaryCards = computed(() => ({
      total: allItems.value.length,
      visible: visibleItems.value.length,
      labeled: allItems.value.filter((item) => item.labelNames.length > 0).length,
      services: new Set(allItems.value.flatMap((item) => item.sourceServices)).size,
      latestSeen: allItems.value.reduce<number | null>((latest, item) => {
        if (!item.lastSeenAt) return latest
        if (!latest) return item.lastSeenAt
        return Math.max(latest, item.lastSeenAt)
      }, null)
    }))
    const activeFamilyMeta = computed(() => {
      if (!activeItem.value) return null
      return getMetricFamily(activeItem.value)
    })
    const activeQueryPreview = computed(() => {
      const item = activeItem.value
      if (!item) return ''

      return JSON.stringify(
        {
          scope: datasetScope.value,
          subject: filters.value.serviceId
            ? { type: 'service', id: filters.value.serviceId, name: selectedServiceLabel.value }
            : { type: item.subjectKinds.includes('service') ? 'service' : 'system' },
          metricRef: item.name,
          aggregation: item.allowedAggregations[0] || 'latest',
          timeRange: '-15m',
          visualizationHint: item.recommendation
        },
        null,
        2
      )
    })

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        serviceOptions.value = Array.isArray(res?.items) ? res.items.map(getServiceOption).filter(Boolean) : []
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

    const selectMetric = (item: MetricsCatalogSchemaItem) => {
      activeItem.value = item
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

    const resetFilters = () => {
      filters.value.keyword = ''
      filters.value.type = ''
      filters.value.unit = ''
      filters.value.hasLabels = false
      activeFamily.value = 'all'
    }

    const renderMetricMeta = (item: MetricsCatalogSchemaItem) => (
      <div class="metrics-catalog-page__metric-meta">
        <NTag size="small" bordered={false} type="info">
          {item.type || 'unknown'}
        </NTag>
        <NTag size="small" bordered={false}>
          {item.unit || '无单位'}
        </NTag>
        <NTag size="small" bordered={false} type="success">
          {item.recommendation}
        </NTag>
        {item.labelNames.length > 0 ? (
          <NTag size="small" bordered={false} type="warning">
            {item.labelNames.length} 个标签维度
          </NTag>
        ) : null}
      </div>
    )

    const renderDetailContent = () => {
      const item = activeItem.value
      if (!item) return null

      return (
        <div class="metrics-catalog-page__detail-panel">
          <div class="metrics-catalog-page__detail-hero">
            <div class="metrics-catalog-page__detail-kicker">{activeFamilyMeta.value?.label || '指标详情'}</div>
            <div class="metrics-catalog-page__detail-title">{item.name}</div>
            <div class="metrics-catalog-page__detail-description">{item.description}</div>
            {renderMetricMeta(item)}
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

          <NThing title="查询预览">
            {{ default: () => <pre class="metrics-catalog-page__query-code">{activeQueryPreview.value}</pre> }}
          </NThing>

          <NThing title="最近活跃情况">{{ default: () => formatLastSeen(item.lastSeenAt) }}</NThing>
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

    onMounted(async () => {
      await loadServiceOptions()
      await loadCatalog()
    })

    watch(
      () => datasetScope.value,
      async () => {
        filters.value.serviceId = ''
        activeFamily.value = 'all'
        await loadServiceOptions()
        await loadCatalog()
      }
    )

    watch(
      () => filters.value.serviceId,
      async () => {
        activeFamily.value = 'all'
        await loadCatalog()
      }
    )

    watch(
      () => visibleItems.value,
      (items) => {
        if (!items.length) {
          activeItem.value = null
          return
        }

        if (!activeItem.value || !items.some((item) => item.name === activeItem.value?.name)) {
          activeItem.value = items[0]
        }
      },
      { immediate: true }
    )

    return () => (
      <div class="metrics-catalog-page">
        <PageHeader title="指标目录" subtitle="按范围、服务和指标家族快速定位可用指标，并直接进入分析或创建卡片。">
          {{
            actions: () => (
              <NSpace>
                <NButton onClick={() => router.push('/home/investigate/metrics')}>前往指标分析</NButton>
              </NSpace>
            )
          }}
        </PageHeader>

        <section class="metrics-catalog-page__hero">
          <div class="metrics-catalog-page__hero-copy">
            <div class="metrics-catalog-page__eyebrow">Metric Discovery</div>
            <h2>先锁定服务，再选择指标，最后确认标签维度。</h2>
            <p>
              当前范围为 <strong>{datasetScope.value === 'system' ? 'Darwin 系统' : '用户接入'}</strong>，服务为{' '}
              <strong>{selectedServiceLabel.value}</strong>。目录会展示 schema 可识别的指标、推荐图表和查询预览。
            </p>
          </div>
          <div class="metrics-catalog-page__hero-stats">
            <div>
              <span>全部指标</span>
              <strong>{summaryCards.value.total}</strong>
            </div>
            <div>
              <span>当前结果</span>
              <strong>{summaryCards.value.visible}</strong>
            </div>
            <div>
              <span>标签覆盖</span>
              <strong>{summaryCards.value.labeled}</strong>
            </div>
            <div>
              <span>关联服务</span>
              <strong>{summaryCards.value.services || '—'}</strong>
            </div>
          </div>
        </section>

        <NCard bordered={false} class="metrics-catalog-page__filters">
          <div class="metrics-catalog-page__filter-grid">
            <NInput
              v-model:value={filters.value.keyword}
              class="metrics-catalog-page__search"
              placeholder="搜索指标名、描述、标签，例如 cpu / latency / service"
              clearable
            />
            <NSelect
              v-model:value={datasetScope.value}
              options={scopeOptions.value}
              placeholder="指标范围"
              class="metrics-catalog-page__select"
            />
            <NSelect
              v-model:value={filters.value.serviceId}
              options={[{ label: '全部服务', value: '' }, ...serviceOptions.value]}
              placeholder="选择服务"
              clearable
              disabled={sourceMode.value !== 'schema'}
              class="metrics-catalog-page__select"
            />
            <NSelect
              v-model:value={filters.value.type}
              options={typeOptions.value}
              placeholder="类型"
              class="metrics-catalog-page__select"
            />
            <NSelect
              v-model:value={filters.value.unit}
              options={unitOptions.value}
              placeholder="单位"
              class="metrics-catalog-page__select"
            />
            <label class="metrics-catalog-page__checkbox">
              <NCheckbox v-model:checked={filters.value.hasLabels} />
              <span>只看带标签维度</span>
            </label>
          </div>
          <div class="metrics-catalog-page__hint-row">
            <NSpace size={8} align="center">
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
              <span>{summaryCards.value.visible} 个匹配指标</span>
              <span>最近样例：{formatLastSeen(summaryCards.value.latestSeen)}</span>
            </NSpace>
            <NButton text size="small" onClick={resetFilters}>
              清空筛选
            </NButton>
          </div>
        </NCard>

        <section class="metrics-catalog-page__workspace">
          <aside class="metrics-catalog-page__family-rail">
            {familyOptions.value.map((family) => (
              <button
                key={family.key}
                type="button"
                class={[
                  'metrics-catalog-page__family-item',
                  `metrics-catalog-page__family-item--${family.accent}`,
                  activeFamily.value === family.key ? 'metrics-catalog-page__family-item--active' : ''
                ]}
                onClick={() => (activeFamily.value = family.key)}>
                <span>
                  <strong>{family.label}</strong>
                  <small>{family.description}</small>
                </span>
                <em>{family.count}</em>
              </button>
            ))}
          </aside>

          <NCard bordered={false} class="metrics-catalog-page__metric-list">
            {loading.value ? (
              <div class="metrics-catalog-page__loading">
                <NSpin size="large" />
              </div>
            ) : visibleItems.value.length ? (
              <div class="metrics-catalog-page__metric-grid">
                {visibleItems.value.map((item) => {
                  const family = getMetricFamily(item)
                  const selected = activeItem.value?.name === item.name

                  return (
                    <article
                      key={item.name}
                      class={[
                        'metrics-catalog-page__metric-card',
                        `metrics-catalog-page__metric-card--${family.accent}`,
                        selected ? 'metrics-catalog-page__metric-card--active' : ''
                      ]}
                      onClick={() => selectMetric(item)}>
                      <div class="metrics-catalog-page__metric-card-top">
                        <NTag size="small" bordered={false}>
                          {family.label}
                        </NTag>
                        <span>{formatLastSeen(item.lastSeenAt)}</span>
                      </div>
                      <button
                        class="metrics-catalog-page__metric-name"
                        type="button"
                        onClick={() => openMetricDetail(item)}>
                        {item.name}
                      </button>
                      <p>{item.description}</p>
                      {renderMetricMeta(item)}
                      <div class="metrics-catalog-page__metric-card-footer">
                        <span>{item.sampleCount ? `${item.sampleCount} 个样例` : '暂无样例'}</span>
                        <NSpace size={8}>
                          <NButton
                            size="small"
                            tertiary
                            onClick={(event: MouseEvent) => {
                              event.stopPropagation()
                              openMetricsExplorer(item)
                            }}
                            disabled={!isMetricsExplorerMetricSupported(item.name)}>
                            分析
                          </NButton>
                          <NButton
                            size="small"
                            type="primary"
                            ghost
                            onClick={(event: MouseEvent) => {
                              event.stopPropagation()
                              startCardCreation(item)
                            }}>
                            创建卡片
                          </NButton>
                        </NSpace>
                      </div>
                    </article>
                  )
                })}
              </div>
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

          <aside class="metrics-catalog-page__inspector">
            {activeItem.value ? (
              <NCard bordered={false} class="metrics-catalog-page__inspector-card">
                <div class="metrics-catalog-page__inspector-kicker">Selected Metric</div>
                <h3>{activeItem.value.name}</h3>
                <p>{activeItem.value.description}</p>
                {renderMetricMeta(activeItem.value)}

                <div class="metrics-catalog-page__inspector-section">
                  <span>标签维度</span>
                  <strong>{activeItem.value.labelNames.length ? activeItem.value.labelNames.join('、') : '无'}</strong>
                </div>
                <div class="metrics-catalog-page__inspector-section">
                  <span>支持聚合</span>
                  <strong>{activeItem.value.allowedAggregations.join('、') || 'latest'}</strong>
                </div>
                <div class="metrics-catalog-page__inspector-section">
                  <span>查询预览</span>
                  <pre class="metrics-catalog-page__query-code">{activeQueryPreview.value}</pre>
                </div>

                <NSpace vertical size={10}>
                  <NButton block type="primary" onClick={() => startCardCreation(activeItem.value!)}>
                    用这个指标创建卡片
                  </NButton>
                  <NButton
                    block
                    onClick={() => openMetricsExplorer(activeItem.value!)}
                    disabled={!isMetricsExplorerMetricSupported(activeItem.value.name)}>
                    进入指标分析
                  </NButton>
                  <NButton block tertiary onClick={() => openMetricDetail(activeItem.value!)}>
                    查看完整详情
                  </NButton>
                </NSpace>
              </NCard>
            ) : (
              <NCard
                bordered={false}
                class="metrics-catalog-page__inspector-card metrics-catalog-page__inspector-card--empty">
                <NEmpty description="选择一个指标后，这里会展示标签、聚合和查询预览" />
              </NCard>
            )}
          </aside>
        </section>

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
