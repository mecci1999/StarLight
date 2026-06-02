import {
  NCard,
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NStatistic,
  NIcon,
  NList,
  NListItem,
  NTag,
  NThing,
  NEmpty,
  NSpin
} from 'naive-ui'
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchCatalogServices,
  fetchMetricsExplorer,
  fetchMetricsSchema,
  previewMetricCard,
  compileMetricQuery,
  validateMetricQuery,
  queryMetricCards,
  getDashboardState,
  saveDashboardState,
  fetchOverviewSummary,
  fetchRealtimeOverview,
  type MetricsDatasetScope
} from '@/api'
import { fetchAlerts } from '@/api/alerts'
import GaugeChart from '@/components/charts/GaugeChart'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import PieChart from '@/components/charts/PieChart'
import { LaptopOutline, ServerOutline, PulseOutline, TimeOutline } from '@vicons/ionicons5'
import {
  canAccessMetricsDatasetScope,
  canUseMetricsSourceKind,
  getPreferredMetricsDatasetScope,
  getStoredUserInfo
} from '@/services/authSession'
import {
  filterMetricsCatalog,
  loadMetricsCatalogFallback,
  type MetricsCatalogSourceMode,
  type MetricsCatalogFilters,
  type MetricsCatalogSchemaItem
} from '@/domains/metrics/catalogModel'
import { resolveCustomDashboardRouteContext } from '@/domains/overview/customDashboardRouteModel'
import {
  buildCustomDashboardQuerySpec,
  createCustomDashboardDraftFromQuerySpec,
  createDefaultCustomDashboardWidgetDraft,
  createLocalCompiledScript,
  parseQuerySpecJson,
  resolveLegacyMetricRef,
  validateCustomDashboardDraft,
  type CustomDashboardWidgetDraft
} from '@/domains/overview/customDashboardPreviewModel'
import type { CardData, QuerySpec } from '@/domains/metrics/queryModel'
import './CustomDashboardPage.scss'

type QueryDashboardWidget = {
  id: string
  title: string
  query: QuerySpec
  visualization: NonNullable<QuerySpec['visualizationHint']>
  sourceMode?: CustomDashboardCardSourceMode
}

type CustomDashboardCardSourceMode = 'form-builder' | 'query-statement'

export default defineComponent({
  name: 'CustomDashboardPage',
  props: {
    pageTitle: { type: String, default: '监控面板' },
    pageSubtitle: { type: String, default: '支持按需组合展示内容与监控摘要' },
    storageKey: { type: String, default: 'starlight_dashboard_layout' },
    templateStorageKey: { type: String, default: 'starlight_dashboard_templates' },
    startInEditMode: { type: Boolean, default: false },
    useDefaultTemplate: { type: Boolean, default: false },
    hideControls: { type: Boolean, default: false }
  },
  setup(props) {
    const route = useRoute()
    const showAddModal = ref(false)
    const message = useMessage()
    const routeContext = computed(() =>
      resolveCustomDashboardRouteContext(route.query as Record<string, unknown>, getPreferredMetricsDatasetScope())
    )
    const datasetScope = ref<MetricsDatasetScope>(routeContext.value.datasetScope)
    const isEditMode = ref(props.startInEditMode)
    const loading = ref(true)
    const realtimeData = ref<any>({})
    const trendData = ref<any>({})
    const alertsData = ref<any[]>([])
    const services = ref<Array<{ id: string; name: string }>>([])
    const customWidgets = ref<QueryDashboardWidget[]>([])
    const editingWidgetId = ref<string | null>(null)
    const cardSourceMode = ref<CustomDashboardCardSourceMode>('form-builder')
    const widgetForm = ref<CustomDashboardWidgetDraft>(
      createDefaultCustomDashboardWidgetDraft(routeContext.value.serviceId || '', routeContext.value.datasetScope)
    )
    const catalogLoading = ref(false)
    const catalogSourceMode = ref<MetricsCatalogSourceMode | 'unavailable'>('empty')
    const catalogLoadError = ref('')
    const catalogItems = ref<MetricsCatalogSchemaItem[]>([])
    const serviceOptions = computed(() =>
      services.value.map((service) => ({
        label: service.name,
        value: service.id
      }))
    )
    const catalogFilters = ref<MetricsCatalogFilters>({
      keyword: '',
      type: '',
      unit: '',
      hasLabels: false,
      serviceId: routeContext.value.serviceId
    })
    const previewLoading = ref(false)
    const previewData = ref<any>(null)
    const previewError = ref('')
    const widgetResults = ref<Record<string, CardData | null>>({})
    const advancedMode = ref(false)
    const compiledScript = ref('')
    const rawQueryScript = ref('')
    const scriptLanguage = ref('queryspec-json')
    const scriptValidation = ref<{ valid: boolean; issues: string[]; supported: boolean } | null>(null)
    const scriptLoading = ref(false)
    const applyingJsonConfiguration = ref(false)
    const isAdminUser = computed(() => Boolean(getStoredUserInfo()?.isAdmin))
    const dashboardHydrated = ref(false)
    let timer: any = null

    const visualizationOptions = [
      { label: '数值卡', value: 'number' },
      { label: '折线图', value: 'line' },
      { label: '柱状图', value: 'bar' },
      { label: '环图', value: 'donut' },
      { label: '表格', value: 'table' }
    ]

    const sourceKindOptions = computed(() =>
      [
        { label: '自动判断', value: 'auto' as const },
        { label: '用户接入指标', value: 'sdk' as const },
        { label: 'Darwin 系统指标', value: 'darwin-event' as const }
      ].filter((item) => canUseMetricsSourceKind(item.value, getStoredUserInfo()))
    )

    const scopeOptions = computed(() =>
      [
        { label: '用户接入', value: 'tenant' as const },
        { label: 'Darwin 系统', value: 'system' as const }
      ].filter((item) => canAccessMetricsDatasetScope(item.value, getStoredUserInfo()))
    )

    const subjectTypeOptions = [
      { label: '全局系统', value: 'system' as const },
      { label: '指定服务', value: 'service' as const }
    ]

    const aggregationOptions = [
      { label: '最新值', value: 'latest' as const },
      { label: '平均值', value: 'avg' as const },
      { label: '求和', value: 'sum' as const },
      { label: '最大值', value: 'max' as const },
      { label: 'P95', value: 'p95' as const }
    ]
    const queryTimeRangeOptions = [
      { label: '15 分钟', value: '-15m' },
      { label: '1 小时', value: '-1h' },
      { label: '4 小时', value: '-4h' },
      { label: '1 天', value: '-1d' },
      { label: '7 天', value: '-7d' },
      { label: '30 天', value: '-30d' }
    ]

    const mappedCatalogItems = computed(() =>
      filterMetricsCatalog(catalogItems.value, catalogFilters.value)
        .map((item) => ({ item }))
        .slice(0, 20)
    )
    const metricRefOptions = computed(() =>
      catalogItems.value.map((item) => ({
        label: `${item.name}${item.description && item.description !== '暂无描述' ? ` · ${item.description}` : ''}`,
        value: item.name
      }))
    )
    const receivedCatalogItems = computed(() => catalogItems.value.filter((item) => item.sampleCount > 0))
    const catalogStats = computed(() => {
      const items = catalogItems.value
      const latestSeenAt = items
        .map((item) => item.lastSeenAt || 0)
        .filter((timestamp) => timestamp > 0)
        .sort((a, b) => b - a)[0]
      const services = new Set(items.flatMap((item) => item.sourceServices || []))
      const labels = new Set(items.flatMap((item) => item.labelNames || []))
      return {
        total: items.length,
        received: receivedCatalogItems.value.length,
        services: services.size,
        labels: labels.size,
        latestSeenAt: latestSeenAt || null
      }
    })
    const selectedMetricSchema = computed(
      () => catalogItems.value.find((item) => item.name === widgetForm.value.metricRef) || null
    )
    const schemaHintText = computed(() => {
      if (!selectedMetricSchema.value) return ''
      const parts = []
      if (selectedMetricSchema.value.recommendedVisualizations.length) {
        parts.push(`推荐展示：${selectedMetricSchema.value.recommendedVisualizations.join(' / ')}`)
      }
      if (selectedMetricSchema.value.allowedAggregations.length) {
        parts.push(`推荐聚合：${selectedMetricSchema.value.allowedAggregations.join(' / ')}`)
      }
      if (selectedMetricSchema.value.labelNames.length) {
        parts.push(`可分组字段：${selectedMetricSchema.value.labelNames.join(', ')}`)
      }
      return parts.join(' · ')
    })

    const formatSeenAt = (timestamp: number | null) => {
      if (!timestamp) return '暂无样本'
      const normalized = timestamp < 10000000000 ? timestamp * 1000 : timestamp
      return new Date(normalized).toLocaleString()
    }

    const getMetricFreshnessType = (item: MetricsCatalogSchemaItem) => {
      if (!item.lastSeenAt) return 'default'
      const normalized = item.lastSeenAt < 10000000000 ? item.lastSeenAt * 1000 : item.lastSeenAt
      const ageMs = Date.now() - normalized
      if (ageMs <= 15 * 60 * 1000) return 'success'
      if (ageMs <= 24 * 60 * 60 * 1000) return 'warning'
      return 'default'
    }

    const getMetricFreshnessLabel = (item: MetricsCatalogSchemaItem) => {
      if (!item.lastSeenAt) return '未收到样本'
      const normalized = item.lastSeenAt < 10000000000 ? item.lastSeenAt * 1000 : item.lastSeenAt
      const ageMs = Math.max(0, Date.now() - normalized)
      if (ageMs < 60 * 1000) return '刚刚收到'
      if (ageMs < 60 * 60 * 1000) return `${Math.floor(ageMs / 60000)} 分钟前`
      if (ageMs < 24 * 60 * 60 * 1000) return `${Math.floor(ageMs / 3600000)} 小时前`
      return formatSeenAt(item.lastSeenAt)
    }

    const renderMetricSampleLabels = (item: MetricsCatalogSchemaItem) => {
      const entries = Object.entries(item.sampleLabels || {}).slice(0, 4)
      if (!entries.length) return <span class="custom-dashboard-page__metric-muted">暂无标签样本</span>
      return entries.map(([label, values]) => (
        <span class="custom-dashboard-page__label-sample" key={label}>
          {label}: {(values || []).slice(0, 3).join(' / ') || '-'}
        </span>
      ))
    }

    const applyRouteContext = (context: ReturnType<typeof resolveCustomDashboardRouteContext>) => {
      const scopeChanged = datasetScope.value !== context.datasetScope
      const serviceChanged = catalogFilters.value.serviceId !== context.serviceId

      datasetScope.value = context.datasetScope
      catalogFilters.value.serviceId = context.serviceId
      widgetForm.value.scope = context.datasetScope
      widgetForm.value.serviceId = context.serviceId
      widgetForm.value.subjectType = context.serviceId ? 'service' : 'system'

      if (context.prefillMetric) {
        const metricRef = resolveLegacyMetricRef(context.prefillMetric)
        if (metricRef) {
          widgetForm.value.metric = context.prefillMetric as CustomDashboardWidgetDraft['metric']
          widgetForm.value.metricRef = metricRef
        }
      }
      if (context.prefillType) {
        widgetForm.value.type = context.prefillType as CustomDashboardWidgetDraft['type']
        if (context.prefillType === 'stat') widgetForm.value.visualization = 'number'
        if (context.prefillType === 'trend') widgetForm.value.visualization = 'line'
        if (context.prefillType === 'distribution') widgetForm.value.visualization = 'bar'
      }
      if (context.prefillTitle) {
        widgetForm.value.title = context.prefillTitle
      }
      if (context.startAdd) {
        showAddModal.value = true
      }

      return { scopeChanged, serviceChanged }
    }

    const getLatestAverage = (groups: any[] = []) => {
      if (!groups.length) return null
      const values = groups
        .map((group: any) => {
          const points = group?.data || []
          const latestValue = points[points.length - 1]?.value
          return typeof latestValue === 'number' ? latestValue : null
        })
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))

      if (!values.length) return null
      return Math.round(values.reduce((sum: number, value: number) => sum + value, 0) / values.length)
    }

    const loadData = async () => {
      try {
        const [overview, metrics, catalog, alerts, realtime] = await Promise.all([
          fetchOverviewSummary({ scope: datasetScope.value }),
          fetchMetricsExplorer({ scope: datasetScope.value }),
          fetchCatalogServices({ page: 1, pageSize: 50, scope: datasetScope.value }),
          fetchAlerts({ status: 'active', scope: datasetScope.value }),
          fetchRealtimeOverview(undefined, { scope: datasetScope.value })
        ])

        const catalogItems = catalog?.items || []
        const healthDistribution = [
          {
            name: 'Healthy',
            value: catalogItems.filter((item: any) => item.identity?.healthStatus === 'healthy').length
          },
          {
            name: 'Warning',
            value: catalogItems.filter((item: any) => item.identity?.healthStatus === 'degraded').length
          },
          {
            name: 'Critical',
            value: catalogItems.filter((item: any) => item.identity?.healthStatus === 'critical').length
          }
        ]

        const trafficDistribution = catalogItems
          .filter((item: any) => typeof item.qps === 'number')
          .slice(0, 5)
          .map((item: any) => ({
            name: item.identity?.name,
            value: item.qps
          }))

        const instanceCounts = catalogItems
          .map((item: any) => item.instanceCount)
          .filter((value: unknown): value is number => typeof value === 'number')

        realtimeData.value = {
          cpu: metrics?.series?.cpu?.length ? getLatestAverage(metrics?.series?.cpu || []) : null,
          memory: metrics?.series?.memory?.length ? getLatestAverage(metrics?.series?.memory || []) : null,
          totalRequests: overview?.totals?.totalRequests ?? null,
          p95Latency: overview?.totals?.p95Latency ?? null,
          errorRate: overview?.totals?.errorRate ?? null,
          activeConnections: realtime?.summary?.activeConnections ?? null,
          activeInstances: instanceCounts.length
            ? instanceCounts.reduce((sum: number, item: number) => sum + item, 0)
            : null,
          systemLoad:
            realtime?.summary?.cpu ??
            (metrics?.series?.cpu?.length ? getLatestAverage(metrics?.series?.cpu || []) : null),
          healthDistribution,
          trafficDistribution
        }
        trendData.value = metrics
        alertsData.value = Array.isArray(alerts) ? alerts : []

        if (customWidgets.value.length) {
          const allowedWidgets = customWidgets.value.filter((widget) => canExecuteQuery(widget.query))
          const requests = Object.values(
            allowedWidgets.reduce(
              (groups, widget) => {
                const timeRange = widget.query.timeRange || '-1h'
                const key = `${widget.query.scope}:${timeRange}`
                if (!groups[key]) {
                  groups[key] = {
                    refreshGenerationId: `${Date.now()}`,
                    context: {
                      scope: widget.query.scope,
                      timeRange,
                      autoRefresh: false
                    },
                    cards: []
                  }
                }
                groups[key].cards.push({
                  cardId: widget.id,
                  priority: 'high' as const,
                  query: widget.query
                })
                return groups
              },
              {} as Record<
                string,
                {
                  refreshGenerationId: string
                  context: { scope: MetricsDatasetScope; timeRange: string; autoRefresh: boolean }
                  cards: Array<{ cardId: string; priority: 'high'; query: QuerySpec }>
                }
              >
            )
          )
          const responses = await Promise.all(requests.map((request) => queryMetricCards(request)))
          widgetResults.value = Object.fromEntries(
            responses
              .flatMap((response) => response?.items || [])
              .filter((item: any) => item.status === 'success' || item.status === 'partial')
              .map((item: any) => [item.cardId, item.data || null])
          )
        } else {
          widgetResults.value = {}
        }
      } finally {
        loading.value = false
      }
    }

    const loadMetricCatalog = async () => {
      catalogLoading.value = true
      catalogLoadError.value = ''
      try {
        const payload = await fetchMetricsSchema({
          scope: datasetScope.value,
          serviceId: catalogFilters.value.serviceId || undefined
        })
        const result = loadMetricsCatalogFallback(payload)
        catalogItems.value = result.items
        catalogSourceMode.value = result.source
        catalogLoadError.value = result.source === 'unsupported' ? '指标 schema 响应格式暂不受支持' : ''
      } catch (error) {
        console.error('Failed to load dashboard metric catalog:', error)
        catalogItems.value = []
        catalogSourceMode.value = 'unavailable'
        catalogLoadError.value = '指标 schema 暂时不可用，请稍后重试'
      } finally {
        catalogLoading.value = false
      }
    }

    const restoreDashboardWidgets = async () => {
      try {
        const saved = await getDashboardState<QueryDashboardWidget[]>(props.storageKey, [])
        customWidgets.value = Array.isArray(saved)
          ? saved.filter((widget) => widget?.query && canExecuteQuery(widget.query))
          : []
      } catch (error) {
        console.error('Failed to restore custom dashboard widgets:', error)
        customWidgets.value = []
      } finally {
        dashboardHydrated.value = true
      }
    }

    const persistDashboardWidgets = async () => {
      if (!dashboardHydrated.value) return
      try {
        await saveDashboardState(props.storageKey, customWidgets.value)
      } catch (error) {
        console.error('Failed to persist custom dashboard widgets:', error)
      }
    }

    const canExecuteQuery = (query: QuerySpec) =>
      canAccessMetricsDatasetScope(query.scope, getStoredUserInfo()) &&
      canUseMetricsSourceKind((query.sourceKind || 'auto') as NonNullable<QuerySpec['sourceKind']>, getStoredUserInfo())

    const applyCatalogMetric = (item: MetricsCatalogSchemaItem) => {
      widgetForm.value.metricRef = item.name
      widgetForm.value.scope =
        item.scope.includes('system') && canAccessMetricsDatasetScope('system', getStoredUserInfo())
          ? datasetScope.value
          : 'tenant'
      widgetForm.value.sourceKind = item.sourceKind === 'mixed' ? 'auto' : item.sourceKind
      widgetForm.value.subjectType = item.subjectKinds.includes('service')
        ? 'service'
        : item.subjectKinds[0] || 'system'
      widgetForm.value.aggregation = item.allowedAggregations[0] || 'avg'
      widgetForm.value.groupBy = []
      widgetForm.value.visualization = item.recommendedVisualizations[0] || 'line'
      if (!widgetForm.value.title.trim()) {
        widgetForm.value.title = item.description && item.description !== '暂无描述' ? item.description : item.name
      }
    }

    const switchCardSourceMode = (nextMode: CustomDashboardCardSourceMode) => {
      if (cardSourceMode.value === nextMode) return
      cardSourceMode.value = nextMode
      previewData.value = null
      previewError.value = ''
      scriptValidation.value = null
      if (nextMode === 'query-statement' && !rawQueryScript.value.trim()) {
        const query = buildCustomDashboardQuerySpec(widgetForm.value, datasetScope.value)
        rawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query }, null, 2)
      }
    }

    const resetModalAssistState = () => {
      previewData.value = null
      previewError.value = ''
      compiledScript.value = ''
      rawQueryScript.value = ''
      scriptLanguage.value = 'queryspec-json'
      scriptValidation.value = null
      advancedMode.value = false
      editingWidgetId.value = null
      cardSourceMode.value = 'form-builder'
    }

    const resetWidgetForm = () => {
      widgetForm.value = createDefaultCustomDashboardWidgetDraft(routeContext.value.serviceId || '', datasetScope.value)
    }

    const openAddWidgetModal = () => {
      resetModalAssistState()
      resetWidgetForm()
      applyRouteContext(routeContext.value)
      showAddModal.value = true
    }

    const closeWidgetModal = () => {
      showAddModal.value = false
      resetModalAssistState()
      resetWidgetForm()
    }

    const openEditWidgetModal = (widget: QueryDashboardWidget) => {
      resetModalAssistState()
      editingWidgetId.value = widget.id
      cardSourceMode.value = widget.sourceMode || 'form-builder'
      widgetForm.value = createCustomDashboardDraftFromQuerySpec(widget.query, {
        ...createDefaultCustomDashboardWidgetDraft(
          routeContext.value.serviceId || '',
          widget.query.scope || datasetScope.value
        ),
        title: widget.title
      })
      widgetForm.value.title = widget.title
      rawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query: widget.query }, null, 2)
      compiledScript.value = rawQueryScript.value
      showAddModal.value = true
    }

    const getActiveDraftQuery = () => {
      if (cardSourceMode.value === 'form-builder') {
        const validation = validateCustomDashboardDraft(widgetForm.value)
        return { query: buildCustomDashboardQuerySpec(widgetForm.value, datasetScope.value), validation }
      }

      const parsed = parseQuerySpecJson(rawQueryScript.value)
      return {
        query: parsed.query,
        validation: {
          valid: Boolean(parsed.query),
          issues: parsed.issues.length ? parsed.issues : parsed.query ? [] : ['请先输入 QuerySpec JSON']
        }
      }
    }

    const runPreview = async () => {
      previewLoading.value = true
      previewError.value = ''
      try {
        const { query, validation } = getActiveDraftQuery()
        scriptValidation.value = { ...validation, supported: false }
        if (!validation.valid) {
          previewData.value = null
          previewError.value = validation.issues.join('；')
          return
        }

        if (!query) {
          previewData.value = null
          previewError.value = '当前组件类型暂不支持脚本预览'
          return
        }

        const result = await previewMetricCard(query, query.scope)
        previewData.value = result.data || null
        if (!result.data) {
          previewError.value = result.supported
            ? '预览接口已返回，但当前没有可展示的数据'
            : '当前环境未提供专用预览接口，已尝试查询网关回退'
        }
      } catch (error) {
        console.error('Failed to run custom dashboard preview:', error)
        previewData.value = null
        previewError.value = '预览失败，请稍后重试'
      } finally {
        previewLoading.value = false
      }
    }

    const runAdvancedInspection = async () => {
      scriptLoading.value = true
      try {
        const { query, validation } = getActiveDraftQuery()
        if (!query) {
          scriptValidation.value = { ...validation, supported: false }
          compiledScript.value =
            cardSourceMode.value === 'form-builder'
              ? createLocalCompiledScript(widgetForm.value, datasetScope.value)
              : rawQueryScript.value
          scriptLanguage.value = 'queryspec-json'
          return
        }

        const [validateResult, compileResult] = await Promise.all([
          validateMetricQuery(query, query.scope),
          compileMetricQuery(query, query.scope)
        ])
        scriptValidation.value = {
          valid: validateResult.valid,
          issues: validateResult.issues,
          supported: validateResult.supported
        }
        compiledScript.value = compileResult.script
        scriptLanguage.value = compileResult.language
      } catch (error) {
        console.error('Failed to inspect custom dashboard script mode:', error)
        scriptValidation.value = {
          valid: false,
          issues: ['脚本校验失败，请稍后重试'],
          supported: false
        }
        compiledScript.value = createLocalCompiledScript(widgetForm.value, datasetScope.value)
        scriptLanguage.value = 'queryspec-json'
      } finally {
        scriptLoading.value = false
      }
    }

    const applyJsonConfiguration = () => {
      const result = parseQuerySpecJson(compiledScript.value)
      if (!result.query) {
        scriptValidation.value = { valid: false, issues: result.issues, supported: false }
        return
      }

      applyingJsonConfiguration.value = true
      widgetForm.value = createCustomDashboardDraftFromQuerySpec(result.query, widgetForm.value)
      compiledScript.value = JSON.stringify({ type: 'queryspec', version: 1, query: result.query }, null, 2)
      rawQueryScript.value = compiledScript.value
      scriptLanguage.value = 'queryspec-json'
      scriptValidation.value = { valid: true, issues: ['JSON 配置已应用到表单，可继续预览或保存。'], supported: false }
      previewData.value = null
      previewError.value = ''
      message.success('JSON 配置已应用')
    }

    onMounted(() => {
      applyRouteContext(routeContext.value)
      restoreDashboardWidgets().finally(() => {
        loadData()
      })
      timer = setInterval(loadData, 5000)
    })

    watch(routeContext, (context) => {
      const { scopeChanged, serviceChanged } = applyRouteContext(context)
      if (showAddModal.value && serviceChanged && !scopeChanged) {
        loadMetricCatalog()
      } else if (!showAddModal.value && (scopeChanged || serviceChanged)) {
        catalogItems.value = []
      }
    })

    watch(
      () => showAddModal.value,
      (visible) => {
        if (!visible) {
          resetModalAssistState()
          return
        }
        if (!catalogItems.value.length) {
          loadMetricCatalog()
        }
      }
    )

    watch(
      () => [
        cardSourceMode.value,
        widgetForm.value.title,
        widgetForm.value.metricRef,
        widgetForm.value.visualization,
        widgetForm.value.aggregation,
        widgetForm.value.subjectType,
        widgetForm.value.serviceId,
        widgetForm.value.scope,
        widgetForm.value.sourceKind,
        JSON.stringify(widgetForm.value.groupBy || []),
        rawQueryScript.value
      ],
      () => {
        previewData.value = null
        previewError.value = ''
        if (applyingJsonConfiguration.value) {
          applyingJsonConfiguration.value = false
          return
        }
        scriptValidation.value = null
        compiledScript.value = ''
      }
    )

    watch(
      () => datasetScope.value,
      () => {
        loadData()
        if (showAddModal.value) {
          loadMetricCatalog()
        } else {
          catalogItems.value = []
        }
      }
    )

    watch(
      () => customWidgets.value,
      () => {
        persistDashboardWidgets()
      },
      { deep: true }
    )

    onUnmounted(() => {
      if (timer) clearInterval(timer)
    })

    const getMetricLabel = (metricRef: string) => {
      return catalogItems.value.find((item) => item.name === metricRef)?.description || metricRef
    }

    const getCatalogEmptyDescription = () => {
      if (catalogLoadError.value) return catalogLoadError.value
      if (catalogSourceMode.value === 'empty') return '暂无可直接映射到现有卡片流程的指标'
      if (catalogSourceMode.value === 'unsupported') return '当前 schema 响应格式暂不受支持'
      return '暂无可直接映射到现有卡片流程的指标'
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    const renderPreviewBody = () => {
      const activeRawQuery =
        cardSourceMode.value === 'query-statement' ? parseQuerySpecJson(rawQueryScript.value).query : null
      const activeVisualization = activeRawQuery?.visualizationHint || widgetForm.value.visualization
      const activeMetricRef = activeRawQuery?.metricRef || widgetForm.value.metricRef

      if (previewLoading.value) {
        return (
          <div class="custom-dashboard-page__preview-loading">
            <NSpin size="small" />
          </div>
        )
      }

      if (previewError.value) {
        return <NEmpty description={previewError.value} class="custom-dashboard-page__preview-empty" />
      }

      if (!previewData.value) {
        return (
          <NEmpty description="点击“预览查询”后查看当前卡片数据效果" class="custom-dashboard-page__preview-empty" />
        )
      }

      if (previewData.value.kind === 'number') {
        return activeVisualization === 'donut' ? (
          <GaugeChart
            value={typeof previewData.value.value === 'number' ? previewData.value.value : 0}
            color="var(--color-primary-6)"
            height="220px"
            loading={previewLoading.value}
          />
        ) : (
          <NStatistic label={getMetricLabel(activeMetricRef)} value={previewData.value.value ?? '未知'} />
        )
      }

      if (previewData.value.kind === 'timeseries') {
        return activeVisualization === 'bar' ? (
          <BarChart
            data={(previewData.value.series?.[0]?.points || []).map((point: any) => ({
              name: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: point.value
            }))}
            height="220px"
            variant="monitor"
          />
        ) : (
          <LineChart
            series={(previewData.value.series || []).map((series: any) => ({
              name: series.name,
              data: series.points
            }))}
            title=""
            height="220px"
            area={activeVisualization === 'line'}
            variant="monitor"
            showLegend
          />
        )
      }

      if (previewData.value.kind === 'distribution') {
        return activeVisualization === 'donut' ? (
          <PieChart data={previewData.value.items || []} height="220px" variant="monitor" />
        ) : (
          <BarChart data={previewData.value.items || []} height="220px" variant="monitor" />
        )
      }

      if (previewData.value.kind === 'table') {
        return (
          <NList>
            {(previewData.value.rows || []).slice(0, 5).map((row: any, index: number) => (
              <NListItem key={`${index}`}>
                <div>{JSON.stringify(row)}</div>
              </NListItem>
            ))}
          </NList>
        )
      }

      return <NEmpty description="当前预览结果暂不支持直接展示" class="custom-dashboard-page__preview-empty" />
    }

    const handleAddDashboard = async () => {
      const title = widgetForm.value.title.trim()
      if (!title) {
        message.warning('请输入组件名称')
        return
      }

      const { query, validation: localValidation } = getActiveDraftQuery()
      if (!query) {
        message.warning(localValidation.issues[0] || '当前查询配置还不能生成卡片')
        return
      }

      const validation = await validateMetricQuery(query, query.scope)
      if (!validation.valid) {
        message.warning(validation.issues[0] || '当前查询配置未通过校验')
        return
      }

      const wasEditing = Boolean(editingWidgetId.value)
      const nextWidget: QueryDashboardWidget = {
        id: editingWidgetId.value || `query-card-${Date.now()}`,
        title,
        query,
        visualization: query.visualizationHint || widgetForm.value.visualization,
        sourceMode: cardSourceMode.value
      }

      if (editingWidgetId.value) {
        customWidgets.value = customWidgets.value.map((widget) =>
          widget.id === editingWidgetId.value ? nextWidget : widget
        )
      } else {
        customWidgets.value.push(nextWidget)
      }

      closeWidgetModal()
      message.success(wasEditing ? '组件配置已更新' : '组件已添加到面板')
    }

    const removeWidget = (id: string) => {
      customWidgets.value = customWidgets.value.filter((widget) => widget.id !== id)
      const nextResults = { ...widgetResults.value }
      delete nextResults[id]
      widgetResults.value = nextResults
      message.success('组件已移除')
    }

    const renderStoredQueryWidget = (widget: QueryDashboardWidget) => {
      const data = widgetResults.value[widget.id]
      if (!data) {
        return <NEmpty description="当前暂无查询结果" class="custom-dashboard-page__preview-empty" />
      }

      if (data.kind === 'number') {
        return widget.visualization === 'donut' ? (
          <GaugeChart
            value={typeof data.value === 'number' ? data.value : 0}
            color="var(--color-primary-6)"
            height="240px"
            loading={loading.value}
          />
        ) : (
          <NStatistic label={widget.title} value={data.value ?? '未知'} />
        )
      }

      if (data.kind === 'timeseries') {
        return widget.visualization === 'bar' ? (
          <BarChart
            data={(data.series?.[0]?.points || []).map((point: any) => ({
              name: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: point.value
            }))}
            color="#165dff"
            height="240px"
            loading={loading.value}
          />
        ) : (
          <LineChart
            series={(data.series || []).map((series: any) => ({
              name: series.name,
              data: series.points
            }))}
            title=""
            height="240px"
            variant="monitor"
            showLegend
            area={widget.visualization === 'line'}
          />
        )
      }

      if (data.kind === 'distribution') {
        return widget.visualization === 'donut' ? (
          <PieChart data={data.items || []} height="240px" variant="monitor" />
        ) : (
          <BarChart data={data.items || []} color="#722ed1" height="240px" loading={loading.value} />
        )
      }

      if (data.kind === 'table') {
        return (
          <NList>
            {(data.rows || []).slice(0, 5).map((row: any, index: number) => (
              <NListItem key={`${widget.id}-${index}`}>
                <div>{JSON.stringify(row)}</div>
              </NListItem>
            ))}
          </NList>
        )
      }

      return <NEmpty description="当前结果暂不支持展示" class="custom-dashboard-page__preview-empty" />
    }

    return () => (
      <div class="custom-dashboard-page">
        <div class="custom-dashboard-page__header">
          <div>
            <h1 class="custom-dashboard-page__title">{props.pageTitle}</h1>
            <p class="custom-dashboard-page__subtitle">{props.pageSubtitle}</p>
          </div>
          {!props.hideControls && (
            <NSpace>
              <NButton type="primary" onClick={openAddWidgetModal}>
                添加组件
              </NButton>
              <NButton onClick={() => (isEditMode.value = !isEditMode.value)}>
                {isEditMode.value ? '完成编辑' : '编辑布局'}
              </NButton>
              <NButton onClick={loadData}>刷新数据</NButton>
            </NSpace>
          )}
        </div>

        <NGrid cols={4} xGap={16} yGap={16} class="custom-dashboard-page__stats-grid">
          <NGridItem>
            <NCard>
              <NStatistic label="请求总量">
                {{
                  prefix: () => <NIcon component={PulseOutline} color="#165dff" />,
                  default: () => displayMetric(realtimeData.value.totalRequests)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="P95 延迟">
                {{
                  prefix: () => <NIcon component={TimeOutline} color="#ff7d00" />,
                  default: () => displayMetric(realtimeData.value.p95Latency, 'ms')
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="活跃实例数">
                {{
                  prefix: () => <NIcon component={ServerOutline} color="#00b42a" />,
                  default: () => displayMetric(realtimeData.value.activeInstances)
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="系统负载">
                {{
                  prefix: () => <NIcon component={LaptopOutline} color="#722ed1" />,
                  default: () => displayMetric(realtimeData.value.systemLoad, '%')
                }}
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <NGrid cols={4} xGap={16} yGap={16}>
          <NGridItem span={1}>
            <NCard title="CPU 使用率" contentStyle={{ padding: 0 }}>
              {typeof realtimeData.value.cpu === 'number' ? (
                <GaugeChart
                  value={realtimeData.value.cpu}
                  color="var(--color-primary-6)"
                  height="250px"
                  loading={loading.value}
                />
              ) : (
                <div class="custom-dashboard-page__empty-panel">未知</div>
              )}
            </NCard>
          </NGridItem>
          <NGridItem span={1}>
            <NCard title="内存使用率" contentStyle={{ padding: 0 }}>
              {typeof realtimeData.value.memory === 'number' ? (
                <GaugeChart
                  value={realtimeData.value.memory}
                  color="var(--color-warning-6)"
                  height="250px"
                  loading={loading.value}
                />
              ) : (
                <div class="custom-dashboard-page__empty-panel">未知</div>
              )}
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard title="QPS 趋势" contentStyle={{ padding: 0 }}>
              <LineChart data={trendData.value.qps || []} color="#165dff" height="250px" loading={loading.value} area />
            </NCard>
          </NGridItem>

          <NGridItem span={2}>
            <NCard title="响应时间趋势" contentStyle={{ padding: 0 }}>
              <LineChart
                data={trendData.value.responseTime || []}
                color="#ff7d00"
                height="250px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>
          <NGridItem span={2}>
            <NCard title="服务健康分布" contentStyle={{ padding: 0 }}>
              <PieChart
                data={realtimeData.value.healthDistribution || []}
                height="250px"
                colors={['var(--color-success-6)', 'var(--color-warning-6)', 'var(--color-danger-6)']}
                variant="monitor"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>

          <NGridItem span={2}>
            <NCard title="流量分布" contentStyle={{ padding: 0 }}>
              <BarChart
                data={realtimeData.value.trafficDistribution || []}
                color="#722ed1"
                height="300px"
                loading={loading.value}
              />
            </NCard>
          </NGridItem>

          <NGridItem span={2}>
            <NCard
              title="最近告警"
              contentStyle={{ padding: '0 16px 16px 16px' }}
              style={{ height: '358px', overflow: 'auto' }}>
              <NList>
                {alertsData.value.length > 0 ? (
                  alertsData.value.map((alert) => (
                    <NListItem key={alert.id}>
                      <NThing title={alert.service}>
                        {{
                          'header-extra': () => (
                            <NTag type={alert.level === 'critical' ? 'error' : 'warning'} size="small">
                              {alert.level}
                            </NTag>
                          ),
                          default: () => (
                            <div>
                              <div class="custom-dashboard-page__alert-time">{alert.time}</div>
                              <div>{alert.message}</div>
                            </div>
                          )
                        }}
                      </NThing>
                    </NListItem>
                  ))
                ) : (
                  <div class="custom-dashboard-page__alert-empty">暂无活跃告警</div>
                )}
              </NList>
            </NCard>
          </NGridItem>
        </NGrid>

        {customWidgets.value.length > 0 && (
          <>
            <div class="custom-dashboard-page__custom-title">自定义组件</div>
            <NGrid cols={2} xGap={16} yGap={16} class="custom-dashboard-page__custom-grid">
              {customWidgets.value.map((widget) => (
                <NGridItem key={widget.id}>
                  <NCard title={widget.title} bordered={false} class="custom-dashboard-page__widget-card">
                    {isEditMode.value && (
                      <div class="custom-dashboard-page__widget-actions">
                        <NTag
                          size="small"
                          bordered={false}
                          type={widget.sourceMode === 'query-statement' ? 'info' : 'success'}>
                          {widget.sourceMode === 'query-statement' ? '查询语句' : '表单组装'}
                        </NTag>
                        <NButton size="small" quaternary onClick={() => openEditWidgetModal(widget)}>
                          编辑组件
                        </NButton>
                        <NButton size="small" quaternary type="error" onClick={() => removeWidget(widget.id)}>
                          删除组件
                        </NButton>
                      </div>
                    )}
                    {renderStoredQueryWidget(widget)}
                  </NCard>
                </NGridItem>
              ))}
            </NGrid>
          </>
        )}

        <NModal
          v-model:show={showAddModal.value}
          preset="dialog"
          title={editingWidgetId.value ? '编辑监控卡片' : '添加监控卡片'}>
          <div class="custom-dashboard-page__builder-shell">
            <div class="custom-dashboard-page__builder-hero">
              <div>
                <div class="custom-dashboard-page__builder-eyebrow">Card Builder</div>
                <h2 class="custom-dashboard-page__builder-title">
                  {cardSourceMode.value === 'form-builder' ? '用表单一步步组装卡片' : '直接粘贴 QuerySpec 生成卡片'}
                </h2>
                <p class="custom-dashboard-page__builder-copy">
                  {cardSourceMode.value === 'form-builder'
                    ? '适合第一次配置监控卡片：先选指标，再选范围、聚合和展示方式，右侧随时预览结果。'
                    : '适合熟悉查询模型的用户：完整控制 scope、subject、metricRef、aggregation 和 visualizationHint。'}
                </p>
              </div>
              <NTag bordered={false} type={cardSourceMode.value === 'query-statement' ? 'info' : 'success'}>
                {cardSourceMode.value === 'query-statement' ? '专业模式' : '推荐新用户'}
              </NTag>
            </div>

            <div class="custom-dashboard-page__mode-choice-grid">
              <button
                type="button"
                class={[
                  'custom-dashboard-page__mode-choice',
                  cardSourceMode.value === 'form-builder' ? 'is-active' : ''
                ]}
                onClick={() => switchCardSourceMode('form-builder')}>
                <span class="custom-dashboard-page__mode-choice-kicker">Guided</span>
                <strong>表单组装</strong>
                <span>从指标目录选择数据，配置目标对象、聚合、时间范围和图表。</span>
                <em>适合：新用户 / 标准监控卡片</em>
              </button>
              <button
                type="button"
                class={[
                  'custom-dashboard-page__mode-choice',
                  'custom-dashboard-page__mode-choice--code',
                  cardSourceMode.value === 'query-statement' ? 'is-active' : ''
                ]}
                onClick={() => switchCardSourceMode('query-statement')}>
                <span class="custom-dashboard-page__mode-choice-kicker">QuerySpec</span>
                <strong>查询语句</strong>
                <span>直接保存完整查询 JSON，不反向改写表单字段。</span>
                <em>适合：专业用户 / 复杂查询 / 复制已有配置</em>
              </button>
            </div>

            <NForm class="custom-dashboard-page__name-form">
              <NFormItem label="卡片名称">
                <NInput v-model:value={widgetForm.value.title} placeholder="例如：Gateway P95 延迟 / CPU 使用率趋势" />
              </NFormItem>
            </NForm>
          </div>
          {cardSourceMode.value === 'form-builder' ? (
            <div class="custom-dashboard-page__builder-layout">
              <section class="custom-dashboard-page__builder-main">
                <NCard bordered={false} class="custom-dashboard-page__config-panel">
                  <div class="custom-dashboard-page__section-heading">
                    <span>1</span>
                    <div>
                      <div class="custom-dashboard-page__catalog-title">选择指标与查询范围</div>
                      <div class="custom-dashboard-page__catalog-subtitle">
                        先决定要查什么，再决定查哪个服务或系统范围。
                      </div>
                    </div>
                  </div>
                  <NForm class="custom-dashboard-page__form-grid">
                    <NFormItem label="指标标识">
                      <NSelect
                        v-model:value={widgetForm.value.metricRef}
                        options={metricRefOptions.value}
                        filterable
                        tag
                        clearable
                        placeholder={catalogItems.value.length ? '搜索并选择当前已接收指标' : '例如 service.cpu.usage'}
                        onUpdateValue={(value: string) => {
                          const item = catalogItems.value.find((metric) => metric.name === value)
                          if (item) applyCatalogMetric(item)
                        }}
                      />
                    </NFormItem>
                    <NFormItem label="数据范围">
                      <NSelect v-model:value={widgetForm.value.scope} options={scopeOptions.value} />
                    </NFormItem>
                    <NFormItem label="数据来源">
                      <NSelect v-model:value={widgetForm.value.sourceKind} options={sourceKindOptions.value} />
                    </NFormItem>
                    <NFormItem label="目标对象">
                      <NSelect v-model:value={widgetForm.value.subjectType} options={subjectTypeOptions} />
                    </NFormItem>
                    <NFormItem label="目标服务">
                      <NSelect
                        v-model:value={widgetForm.value.serviceId}
                        options={serviceOptions.value}
                        placeholder="当目标对象为服务时选择"
                        disabled={widgetForm.value.subjectType !== 'service'}
                      />
                    </NFormItem>
                    <NFormItem label="分组字段">
                      <NInput
                        value={(widgetForm.value.groupBy || []).join(',')}
                        placeholder={
                          selectedMetricSchema.value?.labelNames?.length
                            ? `可选：${selectedMetricSchema.value.labelNames.join(', ')}`
                            : '多个字段用逗号分隔，例如 service,env'
                        }
                        onUpdate:value={(value: string) => {
                          widgetForm.value.groupBy = value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean)
                        }}
                      />
                    </NFormItem>
                  </NForm>
                  {schemaHintText.value ? (
                    <div class="custom-dashboard-page__schema-hint">{schemaHintText.value}</div>
                  ) : null}
                </NCard>

                <NCard bordered={false} class="custom-dashboard-page__config-panel">
                  <div class="custom-dashboard-page__section-heading">
                    <span>2</span>
                    <div>
                      <div class="custom-dashboard-page__catalog-title">设置计算和展示</div>
                      <div class="custom-dashboard-page__catalog-subtitle">选择聚合方式、图表形态和时间窗口。</div>
                    </div>
                  </div>
                  <NForm class="custom-dashboard-page__form-grid custom-dashboard-page__form-grid--three">
                    <NFormItem label="聚合方式">
                      <NSelect v-model:value={widgetForm.value.aggregation} options={aggregationOptions} />
                    </NFormItem>
                    <NFormItem label="展示方式">
                      <NSelect v-model:value={widgetForm.value.visualization} options={visualizationOptions} />
                    </NFormItem>
                    <NFormItem label="时间范围">
                      <NSelect v-model:value={widgetForm.value.timeRange} options={queryTimeRangeOptions} />
                    </NFormItem>
                  </NForm>
                </NCard>
              </section>

              <aside class="custom-dashboard-page__builder-side">
                <NCard
                  bordered={false}
                  class="custom-dashboard-page__catalog-panel custom-dashboard-page__catalog-panel--inline">
                  <div class="custom-dashboard-page__catalog-header">
                    <div>
                      <div class="custom-dashboard-page__catalog-title">当前已接收指标</div>
                      <div class="custom-dashboard-page__catalog-subtitle">
                        来自指标 schema 的实时样本：先看有没有样本、最近何时收到，再决定展示什么。
                      </div>
                    </div>
                    <NTag
                      size="small"
                      bordered={false}
                      type={
                        catalogSourceMode.value === 'schema'
                          ? 'success'
                          : catalogSourceMode.value === 'unavailable'
                            ? 'error'
                            : 'warning'
                      }>
                      {catalogSourceMode.value === 'schema'
                        ? '实时 schema'
                        : catalogSourceMode.value === 'unsupported'
                          ? 'schema 暂不支持'
                          : catalogSourceMode.value === 'unavailable'
                            ? 'schema 暂不可用'
                            : '暂无 schema'}
                    </NTag>
                  </div>
                  <div class="custom-dashboard-page__catalog-health-strip">
                    <div>
                      <strong>{catalogStats.value.total}</strong>
                      <span>指标定义</span>
                    </div>
                    <div>
                      <strong>{catalogStats.value.received}</strong>
                      <span>已收到样本</span>
                    </div>
                    <div>
                      <strong>{catalogStats.value.services}</strong>
                      <span>来源服务</span>
                    </div>
                    <div>
                      <strong>{catalogStats.value.labels}</strong>
                      <span>可用标签</span>
                    </div>
                  </div>
                  <div class="custom-dashboard-page__catalog-latest-seen">
                    最近收到：{formatSeenAt(catalogStats.value.latestSeenAt)}
                  </div>
                  <div class="custom-dashboard-page__catalog-filters">
                    <NInput v-model:value={catalogFilters.value.keyword} placeholder="搜索指标名、描述、标签、服务" />
                  </div>
                  {catalogLoading.value ? (
                    <div class="custom-dashboard-page__catalog-loading">
                      <NSpin size="small" />
                    </div>
                  ) : mappedCatalogItems.value.length ? (
                    <div class="custom-dashboard-page__catalog-list">
                      {mappedCatalogItems.value.map(({ item }) => (
                        <div key={item.name} class="custom-dashboard-page__catalog-item">
                          <div class="custom-dashboard-page__catalog-item-main">
                            <div class="custom-dashboard-page__catalog-item-headline">
                              <div class="custom-dashboard-page__catalog-item-name">{item.name}</div>
                              <NTag size="small" bordered={false} type={getMetricFreshnessType(item) as any}>
                                {getMetricFreshnessLabel(item)}
                              </NTag>
                            </div>
                            <div class="custom-dashboard-page__catalog-item-description">{item.description}</div>
                            <div class="custom-dashboard-page__catalog-item-meta">
                              <NTag size="small" bordered={false}>
                                {item.type}
                              </NTag>
                              <NTag size="small" bordered={false} type="info">
                                {item.unit || '无单位'}
                              </NTag>
                              <NTag size="small" bordered={false} type="success">
                                推荐 {item.recommendation}
                              </NTag>
                              <NTag size="small" bordered={false} type={item.sampleCount > 0 ? 'success' : 'default'}>
                                样本 {item.sampleCount}
                              </NTag>
                            </div>
                            <div class="custom-dashboard-page__metric-discovery-row">
                              <span>服务：</span>
                              <strong>
                                {item.sourceServices.length
                                  ? item.sourceServices.slice(0, 3).join(' / ')
                                  : '全局或未知'}
                              </strong>
                            </div>
                            <div class="custom-dashboard-page__metric-discovery-row">
                              <span>标签：</span>
                              <strong>{item.labelNames.length ? item.labelNames.join(', ') : '无标签'}</strong>
                            </div>
                            <div class="custom-dashboard-page__label-samples">{renderMetricSampleLabels(item)}</div>
                          </div>
                          <NButton size="small" type="primary" ghost onClick={() => applyCatalogMetric(item)}>
                            应用
                          </NButton>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NEmpty description={getCatalogEmptyDescription()} class="custom-dashboard-page__catalog-empty" />
                  )}
                </NCard>
              </aside>
            </div>
          ) : (
            <NCard bordered={false} class="custom-dashboard-page__script-panel custom-dashboard-page__raw-query-panel">
              <div class="custom-dashboard-page__raw-query-header">
                <div>
                  <div class="custom-dashboard-page__catalog-title">QuerySpec JSON</div>
                  <div class="custom-dashboard-page__catalog-subtitle">
                    这里保存的是卡片的直接查询语句，不会反向改写表单字段；保存后该卡片也会继续以查询语句方式编辑。
                  </div>
                </div>
                <NButton
                  size="small"
                  ghost
                  onClick={() => {
                    const query = buildCustomDashboardQuerySpec(widgetForm.value, datasetScope.value)
                    rawQueryScript.value = JSON.stringify({ type: 'queryspec', version: 1, query }, null, 2)
                  }}>
                  从当前表单生成模板
                </NButton>
              </div>
              <NInput
                type="textarea"
                autosize={{ minRows: 10, maxRows: 18 }}
                value={rawQueryScript.value}
                onUpdate:value={(value: string) => (rawQueryScript.value = value)}
                placeholder="粘贴 QuerySpec、{ query } 或 { config: { query } }"
              />
              <div class="custom-dashboard-page__query-examples">
                <span>必须包含：</span>
                <code>scope</code>
                <code>subject</code>
                <code>metricRef</code>
                <code>aggregation</code>
                <code>timeRange</code>
              </div>
            </NCard>
          )}
          <NCard bordered={false} class="custom-dashboard-page__preview-panel">
            <div class="custom-dashboard-page__preview-header">
              <div>
                <div class="custom-dashboard-page__catalog-title">单卡预览</div>
                <div class="custom-dashboard-page__catalog-subtitle">通过查询网关预览当前卡片配置对应的数据形态。</div>
              </div>
              <NButton size="small" type="primary" ghost onClick={runPreview} loading={previewLoading.value}>
                预览查询
              </NButton>
            </div>
            {renderPreviewBody()}
          </NCard>
          {isAdminUser.value && cardSourceMode.value === 'form-builder' ? (
            <NCard bordered={false} class="custom-dashboard-page__script-panel">
              <div class="custom-dashboard-page__preview-header">
                <div>
                  <div class="custom-dashboard-page__catalog-title">高级模式</div>
                  <div class="custom-dashboard-page__catalog-subtitle">
                    管理员可编辑 QuerySpec JSON，应用后会回填表单并继续走校验链路。
                  </div>
                </div>
                <NSpace>
                  <NButton size="small" onClick={() => (advancedMode.value = !advancedMode.value)}>
                    {advancedMode.value ? '收起高级模式' : '展开高级模式'}
                  </NButton>
                  {advancedMode.value ? (
                    <NButton
                      size="small"
                      type="primary"
                      ghost
                      onClick={runAdvancedInspection}
                      loading={scriptLoading.value}>
                      编译并校验
                    </NButton>
                  ) : null}
                  {advancedMode.value ? (
                    <NButton size="small" ghost onClick={applyJsonConfiguration}>
                      应用 JSON 配置
                    </NButton>
                  ) : null}
                </NSpace>
              </div>
              {advancedMode.value ? (
                <div class="custom-dashboard-page__script-body">
                  <div class="custom-dashboard-page__script-status-row">
                    <NTag size="small" bordered={false} type={scriptValidation.value?.valid ? 'success' : 'warning'}>
                      {scriptValidation.value?.valid ? '校验通过' : '待校验 / 存在问题'}
                    </NTag>
                    {scriptValidation?.value ? (
                      <NTag size="small" bordered={false} type={scriptValidation.value.supported ? 'info' : 'default'}>
                        {scriptValidation.value.supported ? '服务端校验' : '本地校验回退'}
                      </NTag>
                    ) : null}
                  </div>
                  {scriptValidation.value?.issues?.length ? (
                    <div class="custom-dashboard-page__script-issues">
                      {scriptValidation.value.issues.map((issue) => (
                        <div key={issue}>{issue}</div>
                      ))}
                    </div>
                  ) : null}
                  <NInput
                    type="textarea"
                    autosize={{ minRows: 8, maxRows: 14 }}
                    value={compiledScript.value}
                    onUpdate:value={(value: string) => (compiledScript.value = value)}
                    placeholder="可粘贴 QuerySpec、{ query } 或 { config: { query } }，再点击“应用 JSON 配置”"
                  />
                  <div class="custom-dashboard-page__script-language">当前语言：{scriptLanguage.value}</div>
                </div>
              ) : null}
            </NCard>
          ) : null}
          <div class="custom-dashboard-page__modal-actions">
            <NButton onClick={closeWidgetModal}>取消</NButton>
            <NButton type="primary" onClick={handleAddDashboard}>
              确认
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
