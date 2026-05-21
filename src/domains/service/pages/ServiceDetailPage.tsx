import { defineComponent, ref, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NGrid,
  NGridItem,
  NSpin,
  NEmpty,
  NStatistic,
  NButton,
  NTabs,
  NTabPane,
  NSpace,
  NTag,
  NProgress,
  NDrawer,
  NDrawerContent,
  useMessage,
  NInput,
  NIcon,
  NSelect
} from 'naive-ui'
import {
  fetchAlerts,
  fetchAlertRules,
  fetchNotifications,
  fetchServiceDetailSummary,
  fetchServiceRuntime,
  fetchTopology,
  fetchServiceInstances,
  fetchMetricsExplorer,
  type MetricsDatasetScope
} from '@/api'
import { searchTraces, getTraceDetails } from '@/api/trace'
import { listExceptions, searchLogsExplorer } from '@/api/logs'

import type {
  ServiceItem,
  ServiceInstance,
  TopologyData,
  TopologyNode,
  TraceSpan,
  AlertRuleItem,
  NotificationItem
} from '@/types/monitor'
import type { LogEntry } from '@/types/logs'
import dayjs from 'dayjs'
import { SearchOutline } from '@vicons/ionicons5'
import PageHeader from '@/shared/layout/PageHeader'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import ServiceHealthBadge from '@/shared/components/ServiceHealthBadge'
import ServiceIdentityCard from '@/shared/components/ServiceIdentityCard'
import ServiceTopology from '@/components/ServiceTopology'
import DetailDrawer from '@/shared/components/DetailDrawer'
import ResultTable from '@/shared/components/ResultTable'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './ServiceDetailPage.scss'

export default defineComponent({
  name: 'ServiceDetailPageV2',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const serviceId = String(route.params.serviceId || '')
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const loading = ref(false)
    const activeTab = ref('overview')
    const service = ref<ServiceItem | null>(null)
    const summary = ref<{
      cpu: number | null
      memory: number | null
      qps: number | null
      responseTime: number | null
      errorRate: number | null
      activeConnections: number | null
      instances: number | null
      version: string
    }>({
      cpu: null,
      memory: null,
      qps: null,
      responseTime: null,
      errorRate: null,
      activeConnections: null,
      instances: null,
      version: ''
    })
    const runtime = ref({
      instances: [] as any[],
      appKey: '',
      env: '',
      region: '',
      ingestStatus: { metrics: null as boolean | null, logs: null as boolean | null, traces: null as boolean | null }
    })
    const alerts = ref<any[]>([])
    const alertRules = ref<AlertRuleItem[]>([])
    const notifications = ref<NotificationItem[]>([])
    const logs = ref<LogEntry[]>([])
    const selectedLogPattern = ref<string | null>(null)
    const logKeyword = ref('')
    const showLogDetail = ref(false)
    const selectedLog = ref<LogEntry | null>(null)
    const recentIncidents = ref<any[]>([])
    const recentTraces = ref<TraceSpan[]>([])
    const traceQuery = ref('')
    const traceDrawerOpen = ref(false)
    const selectedTraceId = ref<string | null>(null)
    const drawerTraces = ref<TraceSpan[]>([])
    const drawerLoading = ref(false)
    const selectedSpan = ref<TraceSpan | null>(null)
    const recentExceptions = ref<any[]>([])
    const healthTimeline = ref({
      cpu: [] as Array<{ timestamp: number; value: number }>,
      memory: [] as Array<{ timestamp: number; value: number }>,
      responseTime: [] as Array<{ timestamp: number; value: number }>
    })
    const metricsSeries = ref({
      cpu: [] as any[],
      memory: [] as any[],
      qps: [] as any[],
      responseTime: [] as any[]
    })
    const selectedMetric = ref<'cpu' | 'memory' | 'qps' | 'responseTime'>('cpu')
    const requestStats = ref<Array<{ name: string; value: number }>>([])
    const baselineComparison = computed(() => {
      const compareSeries = [
        { label: 'QPS', data: metricsSeries.value.qps?.[0]?.data || [] },
        { label: '响应时间', data: metricsSeries.value.responseTime?.[0]?.data || [] },
        { label: 'CPU', data: metricsSeries.value.cpu?.[0]?.data || [] },
        { label: '内存', data: metricsSeries.value.memory?.[0]?.data || [] }
      ]
      return compareSeries.map((item) => {
        const half = Math.floor(item.data.length / 2)
        const baseline = half > 0 ? item.data.slice(0, half) : item.data
        const current = half > 0 ? item.data.slice(half) : item.data
        const avg = (rows: Array<{ value: number }>) =>
          rows.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : 0
        const baselineAvg = avg(baseline)
        const currentAvg = avg(current)
        const delta = baselineAvg === 0 ? 0 : Number((((currentAvg - baselineAvg) / baselineAvg) * 100).toFixed(1))
        return {
          label: item.label,
          baseline: Number(baselineAvg.toFixed(2)),
          current: Number(currentAvg.toFixed(2)),
          delta
        }
      })
    })
    const topologyLoading = ref(false)
    const topologyData = ref<TopologyData>({ nodes: [], edges: [] })
    const instanceLoading = ref(false)
    const serviceInstances = ref<ServiceInstance[]>([])
    const showTopologyDetail = ref(false)
    const selectedTopologyNode = ref<TopologyNode | null>(null)

    const normalizeStatus = (status?: string) => {
      if (!status) return 'unknown'
      if (
        status === 'healthy' ||
        status === 'critical' ||
        status === 'idle' ||
        status === 'running' ||
        status === 'error' ||
        status === 'stopped' ||
        status === 'warning' ||
        status === 'unknown'
      )
        return status
      return 'unknown'
    }

    const normalizeTopology = (payload: any): TopologyData => {
      const source = payload?.snapshot || payload
      return {
        nodes: Array.isArray(source?.nodes)
          ? source.nodes.map((node: any) => ({
              ...node,
              id: String(node?.id || node?.name || ''),
              name: String(node?.name || node?.id || ''),
              status: normalizeStatus(node?.status)
            }))
          : [],
        edges: Array.isArray(source?.edges)
          ? source.edges.map((edge: any) => ({
              ...edge,
              from: edge?.from ?? edge?.source,
              to: edge?.to ?? edge?.target
            }))
          : []
      }
    }

    const loadLogs = async () => {
      const logsRes = await searchLogsExplorer({
        service: serviceId,
        keyword: logKeyword.value || undefined,
        startTime: dayjs(timeStore.startTime).format('YYYY-MM-DD HH:mm:ss'),
        endTime: dayjs(timeStore.endTime).format('YYYY-MM-DD HH:mm:ss'),
        page: 1,
        pageSize: 20
      }).catch((error) => {
        console.error('Failed to load service logs:', error)
        return { items: [] }
      })
      logs.value = Array.isArray(logsRes?.items) ? logsRes.items : []
    }

    const loadTraces = async () => {
      const tracesRes = await searchTraces({
        service: serviceId,
        traceId: traceQuery.value || undefined,
        startTime: timeStore.startTime,
        endTime: timeStore.endTime,
        limit: 20
      }).catch((error) => {
        console.error('Failed to load recent traces:', error)
        return []
      })
      const traceMap = new Map<string, TraceSpan>()
      ;(Array.isArray(tracesRes) ? tracesRes : []).forEach((span: TraceSpan) => {
        if (!traceMap.has(span.traceId) || (!span.parentId && traceMap.get(span.traceId)?.parentId)) {
          traceMap.set(span.traceId, span)
        }
      })
      recentTraces.value = Array.from(traceMap.values())
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 20)
    }

    const loadServiceDetail = async () => {
      loading.value = true
      try {
        const [detailRes, runtimeRes, alertsRes, exceptionsRes, metricsRes, alertRulesRes, notificationsRes] =
          await Promise.all([
            fetchServiceDetailSummary(serviceId, { timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value }),
            fetchServiceRuntime(serviceId, { scope: datasetScope.value }),
            fetchAlerts({
              serviceId,
              scope: datasetScope.value,
              startTime: timeStore.startTime,
              endTime: timeStore.endTime
            }),
            loadTraces(),
            listExceptions({
              service: serviceId,
              startTime: timeStore.startTime,
              endTime: timeStore.endTime,
              limit: 5
            }).catch((error: unknown) => {
              console.error('Failed to load recent exceptions:', error)
              return []
            }),
            fetchMetricsExplorer({ serviceId, timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value }).catch(
              (error) => {
                console.error('Failed to load health timeline:', error)
                return null
              }
            ),
            fetchAlertRules({
              serviceId,
              scope: datasetScope.value,
              startTime: timeStore.startTime,
              endTime: timeStore.endTime
            }).catch((error) => {
              console.error('Failed to load alert rules:', error)
              return []
            }),
            fetchNotifications({
              serviceId,
              scope: datasetScope.value,
              startTime: timeStore.startTime,
              endTime: timeStore.endTime
            }).catch((error) => {
              console.error('Failed to load notifications:', error)
              return []
            })
          ])
        const identity = detailRes?.identity
        const detailSummary = detailRes?.summary

        service.value = identity
          ? {
              id: identity.id,
              name: identity.name,
              owner: identity.owner,
              region: identity.region,
              version: detailSummary?.version || identity.runtime,
              tags: identity.tags || [],
              health: identity.healthStatus,
              status:
                identity.healthStatus === 'healthy'
                  ? 'running'
                  : identity.healthStatus === 'unknown'
                    ? 'unknown'
                    : 'error',
              instances: detailSummary?.instances ?? null,
              qps: detailSummary?.qps ?? null,
              latency: detailSummary?.responseTime ?? null,
              errorRate: detailSummary?.errorRate ?? null,
              lastUpdate: new Date().toISOString(),
              lastDeploy: detailRes?.lastDeployAt || undefined
            }
          : null
        summary.value = {
          cpu: detailSummary?.cpu ?? null,
          memory: detailSummary?.memory ?? null,
          qps: detailSummary?.qps ?? null,
          responseTime: detailSummary?.responseTime ?? null,
          errorRate: detailSummary?.errorRate ?? null,
          activeConnections: detailSummary?.activeConnections ?? null,
          instances: detailSummary?.instances ?? null,
          version: detailSummary?.version ?? identity?.runtime ?? ''
        }
        runtime.value = runtimeRes || {
          instances: [],
          appKey: serviceId,
          env: '',
          region: '',
          ingestStatus: { metrics: null, logs: null, traces: null }
        }
        alerts.value = Array.isArray(alertsRes) ? alertsRes : []
        alertRules.value = Array.isArray(alertRulesRes) ? alertRulesRes.slice(0, 5) : []
        notifications.value = Array.isArray(notificationsRes)
          ? notificationsRes.slice(0, 5).map((item: any, index: number) => ({
              key: item.id || `notification-${index}`,
              sendTime: item.sentAt || item.sendTime || '未知时间',
              ruleName: item.type || item.ruleName || '未知通知',
              service: item.service || service.value?.name || serviceId || '未知服务',
              channel: item.channel,
              recipient: item.target || item.recipient || '未知接收方',
              status:
                item.status === 'sent' || item.status === 'delivered'
                  ? 'success'
                  : item.status === 'failed'
                    ? 'failed'
                    : item.status === 'pending'
                      ? 'pending'
                      : 'unknown',
              retryCount: typeof item.retryCount === 'number' ? item.retryCount : null,
              content: item.content,
              errorMessage: item.errorMessage || ''
            }))
          : []
        await loadLogs()
        recentIncidents.value = alerts.value.slice(0, 5)
        recentExceptions.value = Array.isArray(exceptionsRes) ? exceptionsRes.slice(0, 5) : []
        healthTimeline.value = {
          cpu: metricsRes?.series?.cpu?.[0]?.data || [],
          memory: metricsRes?.series?.memory?.[0]?.data || [],
          responseTime: metricsRes?.series?.responseTime?.[0]?.data || []
        }
        metricsSeries.value = {
          cpu: metricsRes?.series?.cpu || [],
          memory: metricsRes?.series?.memory || [],
          qps: metricsRes?.series?.qps || [],
          responseTime: metricsRes?.series?.responseTime || []
        }
        requestStats.value = Array.isArray(metricsRes?.requestStats) ? metricsRes.requestStats : []
      } catch (error) {
        console.error('Failed to load service detail v2:', error)
      } finally {
        loading.value = false
      }
    }

    const loadTopologyPreview = async () => {
      topologyLoading.value = true
      try {
        topologyData.value = normalizeTopology(
          await fetchTopology({ timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value })
        )
      } catch (error) {
        console.error('Failed to load service topology preview:', error)
        topologyData.value = { nodes: [], edges: [] }
      } finally {
        topologyLoading.value = false
      }
    }

    const loadInstances = async () => {
      instanceLoading.value = true
      try {
        serviceInstances.value = (await fetchServiceInstances(serviceId, { scope: datasetScope.value })) || []
      } catch (error) {
        console.error('Failed to load service instances preview:', error)
        serviceInstances.value = []
      } finally {
        instanceLoading.value = false
      }
    }

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      loadServiceDetail()
      loadTopologyPreview()
      loadInstances()
    })

    watch(
      () => timeStore.timeRange,
      () => {
        loadServiceDetail()
        loadTopologyPreview()
      }
    )

    const healthStatus = computed(() => {
      if (!service.value) return 'unknown'
      if (service.value.health === 'healthy') return 'healthy'
      if (service.value.health === 'warning') return 'degraded'
      if (service.value.health === 'unhealthy') return 'critical'
      if (service.value.health === 'unknown') return 'unknown'
      return 'unknown'
    })

    const displayValue = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    const openRoute = (path: string) => {
      router.push({
        path,
        query: {
          serviceId,
          timeRange: timeStore.timeRange,
          scope: datasetScope.value
        }
      })
    }

    const openIncidentInbox = (incidentId?: string) => {
      router.push({
        path: incidentId ? `/home/alerts/inbox/${incidentId}` : '/home/alerts/inbox',
        query: {
          serviceId,
          timeRange: timeStore.timeRange,
          scope: datasetScope.value,
          incidentId: undefined
        }
      })
    }

    const topologyPreview = computed<TopologyData>(() => {
      const allNodes = topologyData.value.nodes || []
      const allEdges = topologyData.value.edges || []
      if (!serviceId || !allNodes.length) return { nodes: [], edges: [] }

      const relatedIds = new Set<string>([serviceId])
      allEdges.forEach((edge) => {
        if (edge.from === serviceId || edge.to === serviceId) {
          relatedIds.add(String(edge.from))
          relatedIds.add(String(edge.to))
        }
      })

      return {
        nodes: allNodes.filter((node) => relatedIds.has(String(node.id))),
        edges: allEdges.filter((edge) => relatedIds.has(String(edge.from)) && relatedIds.has(String(edge.to)))
      }
    })

    const relatedTopologyNodes = computed(() =>
      topologyPreview.value.nodes.filter((node) => String(node.id) !== serviceId)
    )

    const dependencySummary = computed(() => {
      const upstreamEdges = topologyPreview.value.edges.filter((edge) => String(edge.to) === serviceId)
      const downstreamEdges = topologyPreview.value.edges.filter((edge) => String(edge.from) === serviceId)
      const isServiceNode = (node: TopologyNode) => !node.type || node.type === 'service'
      return {
        upstreamCount: upstreamEdges.length,
        downstreamCount: downstreamEdges.length,
        relatedCount: relatedTopologyNodes.value.length,
        upstreamNodes: relatedTopologyNodes.value.filter(
          (node) => isServiceNode(node) && upstreamEdges.some((edge) => String(edge.from) === String(node.id))
        ),
        downstreamNodes: relatedTopologyNodes.value.filter(
          (node) => isServiceNode(node) && downstreamEdges.some((edge) => String(edge.to) === String(node.id))
        )
      }
    })

    const openTrace = async (traceId: string) => {
      selectedTraceId.value = traceId
      traceDrawerOpen.value = true
      selectedSpan.value = null
      drawerTraces.value = []
      drawerLoading.value = true

      try {
        const spans = await getTraceDetails(traceId)
        drawerTraces.value = spans.sort((a: TraceSpan, b: TraceSpan) => a.startTime - b.startTime)
      } catch (error) {
        console.error('Failed to load trace details:', error)
        drawerTraces.value = []
        message.error('加载链路详情失败')
      } finally {
        drawerLoading.value = false
      }
    }

    const rootSpan = computed(() => drawerTraces.value.find((s) => !s.parentId) || drawerTraces.value[0])

    const totalDuration = computed(() => {
      if (drawerTraces.value.length === 0) return 0
      const endTimes = drawerTraces.value.map((s) => s.startTime + s.duration)
      const minStartTime = Math.min(...drawerTraces.value.map((s) => s.startTime))
      return Math.max(...endTimes) - minStartTime
    })

    const WaterfallItem = (props: { span: TraceSpan; depth: number; rootStart: number }) => {
      const relativeStart = props.span.startTime - props.rootStart
      const duration = totalDuration.value || 1
      const left = Math.max(0, (relativeStart / duration) * 100)
      const width = Math.max((props.span.duration / duration) * 100, 0.5)

      return (
        <div class="service-detail-page__waterfall-row" onClick={() => (selectedSpan.value = props.span)}>
          <div class="service-detail-page__waterfall-service">
            <div style={{ marginLeft: `${props.depth * 16}px` }} class="service-detail-page__waterfall-service-inner">
              <div
                class={[
                  'service-detail-page__waterfall-dot',
                  props.span.status === 'ok'
                    ? 'service-detail-page__waterfall-dot--ok'
                    : 'service-detail-page__waterfall-dot--error'
                ]}></div>
              <span class="service-detail-page__waterfall-service-name" title={props.span.service}>
                {props.span.service}
              </span>
            </div>
          </div>
          <div class="service-detail-page__waterfall-main">
            <div class="service-detail-page__waterfall-axis">
              <div class="service-detail-page__waterfall-axis-line"></div>
            </div>
            <div
              class={[
                'service-detail-page__waterfall-bar',
                props.span.status === 'ok'
                  ? 'service-detail-page__waterfall-bar--ok'
                  : 'service-detail-page__waterfall-bar--error'
              ]}
              style={{ '--waterfall-left': `${left}%`, '--waterfall-width': `${width}%` }}>
              <span
                class={[
                  'service-detail-page__waterfall-label',
                  props.span.status === 'ok' ? '' : 'service-detail-page__waterfall-label--error'
                ]}>
                {props.span.name} <span class="service-detail-page__waterfall-duration">({props.span.duration}ms)</span>
              </span>
            </div>
          </div>
        </div>
      )
    }

    const renderTree = (parentId?: string, depth = 0, rootStart = 0): any[] => {
      const children = drawerTraces.value
        .filter((s) => s.parentId === parentId)
        .sort((a, b) => a.startTime - b.startTime)
      if (depth === 0 && children.length === 0 && drawerTraces.value.length > 0) {
        const allIds = new Set(drawerTraces.value.map((s) => s.id))
        const roots = drawerTraces.value.filter((s) => !s.parentId || !allIds.has(s.parentId))
        return roots.flatMap((root) => [
          <WaterfallItem span={root} depth={0} rootStart={root.startTime} />,
          ...renderTree(root.id, 1, root.startTime)
        ])
      }
      return children.flatMap((child) => [
        <WaterfallItem span={child} depth={depth} rootStart={rootStart} />,
        ...renderTree(child.id, depth + 1, rootStart)
      ])
    }

    const traceColumns = [
      {
        title: '开始时间',
        key: 'startTime',
        render: (row: TraceSpan) => new Date(row.startTime).toLocaleTimeString()
      },
      {
        title: '服务',
        key: 'service',
        render: (row: TraceSpan) => (
          <NTag size="small" type="info" bordered={false}>
            {row.service}
          </NTag>
        )
      },
      {
        title: '操作',
        key: 'name'
      },
      {
        title: '耗时',
        key: 'duration',
        render: (row: TraceSpan) => `${row.duration}ms`
      },
      {
        title: '状态',
        key: 'status',
        render: (row: TraceSpan) => (
          <NTag type={row.status === 'ok' ? 'success' : 'error'} size="small" bordered={false}>
            {row.status === 'ok' ? '正常' : '异常'}
          </NTag>
        )
      },
      {
        title: 'Trace ID',
        key: 'traceId',
        render: (row: TraceSpan) => (
          <span
            class="service-detail-page__link-button service-detail-page__mono-id"
            onClick={(e) => {
              e.stopPropagation()
              openTrace(row.traceId)
            }}>
            {row.traceId}
          </span>
        )
      }
    ]

    const openDependencyService = (node: TopologyNode) => {
      router.push({
        path: `/home/services/${node.id}`,
        query: { timeRange: timeStore.timeRange }
      })
    }

    const buildDependencyRows = (nodes: TopologyNode[], direction: 'upstream' | 'downstream') =>
      nodes.map((node) => {
        const edge = topologyPreview.value.edges.find((item) =>
          direction === 'upstream'
            ? String(item.from) === String(node.id) && String(item.to) === serviceId
            : String(item.from) === serviceId && String(item.to) === String(node.id)
        )
        return {
          id: node.id,
          name: node.name,
          status: node.status,
          protocol: edge?.protocol || '-',
          qps: typeof edge?.qps === 'number' ? edge.qps : null,
          errorRate: typeof edge?.errorRate === 'number' ? edge.errorRate : null,
          p99: typeof edge?.p99 === 'number' ? edge.p99 : null,
          count: typeof edge?.count === 'number' ? edge.count : null,
          rawNode: node
        }
      })

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'
    const resolveAlertHealth = (level?: string) => {
      if (level === 'critical') return 'critical'
      if (level === 'warning') return 'degraded'
      return 'unknown'
    }
    const activeAlerts = computed(() => alerts.value.filter((incident) => incident.status === 'active'))
    const hasUnknownAlertStatus = computed(() => alerts.value.some((incident) => !incident.status))

    const upstreamDependencyRows = computed(() =>
      buildDependencyRows(dependencySummary.value.upstreamNodes, 'upstream')
    )
    const downstreamDependencyRows = computed(() =>
      buildDependencyRows(dependencySummary.value.downstreamNodes, 'downstream')
    )

    const openTopologyNode = (node: TopologyNode) => {
      selectedTopologyNode.value = node
      showTopologyDetail.value = true
    }

    const selectedDependencyMetrics = computed(() => {
      if (!selectedTopologyNode.value) return null
      const relatedEdges = topologyPreview.value.edges.filter(
        (edge) =>
          String(edge.from) === String(selectedTopologyNode.value?.id) ||
          String(edge.to) === String(selectedTopologyNode.value?.id)
      )
      if (!relatedEdges.length) return null

      const avg = (values: number[]) =>
        values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null
      const qpsValues = relatedEdges
        .map((edge) => edge.qps)
        .filter((value): value is number => typeof value === 'number')
      const errorRateValues = relatedEdges
        .map((edge) => edge.errorRate)
        .filter((value): value is number => typeof value === 'number')
      const p99Values = relatedEdges
        .map((edge) => edge.p99)
        .filter((value): value is number => typeof value === 'number')
      const callCountValues = relatedEdges
        .map((edge) => edge.count)
        .filter((value): value is number => typeof value === 'number')
      const callCount = callCountValues.length ? callCountValues.reduce((sum, value) => sum + value, 0) : null

      return {
        edgeCount: relatedEdges.length,
        qps: avg(qpsValues),
        errorRate: avg(errorRateValues),
        p99: avg(p99Values),
        callCount
      }
    })

    const showLogDetails = (log: LogEntry) => {
      selectedLog.value = log
      showLogDetail.value = true
    }

    const logPatterns = computed(() => {
      const buckets = new Map<string, { pattern: string; count: number; level: string }>()
      logs.value.forEach((log) => {
        const key = log.message
        const prev = buckets.get(key)
        if (prev) {
          prev.count += 1
        } else {
          buckets.set(key, { pattern: key, count: 1, level: String(log.level) })
        }
      })
      return Array.from(buckets.values())
        .filter((item) => item.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    })

    const filteredLogs = computed(() => {
      if (!selectedLogPattern.value) return logs.value
      return logs.value.filter((log) => log.message === selectedLogPattern.value)
    })

    const traceDurationBuckets = computed(() => {
      const buckets = [
        { name: '0-50ms', min: 0, max: 50 },
        { name: '50-100ms', min: 50, max: 100 },
        { name: '100-250ms', min: 100, max: 250 },
        { name: '250-500ms', min: 250, max: 500 },
        { name: '500ms+', min: 500, max: Number.POSITIVE_INFINITY }
      ]
      return buckets.map((bucket) => ({
        name: bucket.name,
        value: recentTraces.value.filter((trace) => trace.duration >= bucket.min && trace.duration < bucket.max).length
      }))
    })

    const logColumns = [
      {
        title: '时间',
        key: 'timestamp'
      },
      {
        title: '级别',
        key: 'level',
        render: (row: LogEntry) => (
          <NTag size="small" bordered={false}>
            {String(row.level).toUpperCase()}
          </NTag>
        )
      },
      {
        title: '服务',
        key: 'service'
      },
      {
        title: '消息',
        key: 'message',
        render: (row: LogEntry) => (
          <span
            class="service-detail-page__link-button"
            onClick={(e) => {
              e.stopPropagation()
              showLogDetails(row)
            }}>
            {row.message}
          </span>
        )
      },
      {
        title: '主机',
        key: 'hostname'
      }
    ]

    const dependencyColumns = [
      {
        title: '服务名',
        key: 'name'
      },
      {
        title: '状态',
        key: 'status',
        render: (row: any) => (
          <ServiceHealthBadge
            status={
              row.status === 'running' || row.status === 'healthy'
                ? 'healthy'
                : row.status === 'unknown'
                  ? 'unknown'
                  : row.status === 'warning'
                    ? 'degraded'
                    : 'critical'
            }
            size="sm"
          />
        )
      },
      {
        title: '协议',
        key: 'protocol'
      },
      {
        title: 'QPS',
        key: 'qps'
      },
      {
        title: '错误率',
        key: 'errorRate',
        render: (row: any) => displayMetric(row.errorRate, '%')
      },
      {
        title: 'P99',
        key: 'p99',
        render: (row: any) => displayMetric(row.p99, 'ms')
      },
      {
        title: '调用次数',
        key: 'count'
      },
      {
        title: '操作',
        key: 'actions',
        render: (row: any) => (
          <NButton size="small" secondary onClick={() => openDependencyService(row.rawNode)}>
            查看详情
          </NButton>
        )
      }
    ]

    const alertRuleColumns = [
      {
        title: '规则名',
        key: 'name'
      },
      {
        title: '指标',
        key: 'metric'
      },
      {
        title: '阈值',
        key: 'threshold',
        render: (row: AlertRuleItem) => `${row.operator} ${row.threshold}${row.unit || ''}`
      },
      {
        title: '级别',
        key: 'level',
        render: (row: AlertRuleItem) => (
          <NTag
            size="small"
            bordered={false}
            type={row.level === 'critical' ? 'error' : row.level === 'warning' ? 'warning' : 'info'}>
            {row.level}
          </NTag>
        )
      },
      {
        title: '状态',
        key: 'enabled',
        render: (row: AlertRuleItem) => (
          <NTag size="small" bordered={false} type={row.enabled ? 'success' : 'default'}>
            {row.enabled ? '启用' : '停用'}
          </NTag>
        )
      }
    ]

    const instanceColumns = [
      {
        title: '实例ID',
        key: 'id',
        render: (row: ServiceInstance) => <span class="service-detail-page__mono-id">{row.id}</span>
      },
      {
        title: '状态',
        key: 'status',
        render: (row: ServiceInstance) => (
          <NTag
            type={row.status === 'running' ? 'success' : row.status === 'unknown' ? 'default' : 'error'}
            size="small"
            bordered={false}>
            {row.status === 'running' ? '运行中' : row.status === 'unknown' ? '未知' : '异常'}
          </NTag>
        )
      },
      {
        title: '节点',
        key: 'node'
      },
      {
        title: 'CPU',
        key: 'cpu',
        render: (row: ServiceInstance) =>
          typeof row.cpu === 'number'
            ? h(NProgress, { type: 'line', percentage: row.cpu, showIndicator: false })
            : h('span', { class: 'service-detail-page__unknown-text' }, '未知')
      },
      {
        title: '内存',
        key: 'memory',
        render: (row: ServiceInstance) =>
          typeof row.memory === 'number'
            ? h(NProgress, { type: 'line', percentage: row.memory, showIndicator: false })
            : h('span', { class: 'service-detail-page__unknown-text' }, '未知')
      }
    ]

    return () => (
      <div class="service-detail-page">
        <PageHeader title="服务详情" subtitle="围绕服务状态、性能与关联入口组织当前上下文">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={loadServiceDetail}>
                刷新详情
              </NButton>
            )
          }}
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
            loadServiceDetail()
          }}
        />

        {loading.value ? (
          <div class="service-detail-page__loading">
            <NSpin size="large" />
          </div>
        ) : !service.value ? (
          <NEmpty description="未找到对应服务" class="service-detail-page__empty-state" />
        ) : (
          <>
            <ServiceIdentityCard
              service={{
                id: service.value.id,
                name: service.value.name,
                displayName: service.value.name,
                owner: service.value.owner,
                env: runtime.value.env,
                region: service.value.region,
                appKey: runtime.value.appKey || service.value.id,
                healthStatus: healthStatus.value as any,
                runtime: service.value.version,
                tags: service.value.tags || []
              }}
            />

            <NGrid cols={6} xGap={16} yGap={16} class="service-detail-page__summary-grid">
              {(
                [
                  { label: '实例数', value: displayValue(summary.value.instances) },
                  { label: 'QPS', value: displayValue(summary.value.qps) },
                  { label: '响应时间', value: displayValue(summary.value.responseTime, 'ms') },
                  { label: '错误率', value: displayValue(summary.value.errorRate, '%') },
                  {
                    label: '活跃事件',
                    value: hasUnknownAlertStatus.value ? '未知' : activeAlerts.value.length
                  },
                  { label: '最近部署', value: service.value?.lastDeploy || '-' }
                ] as Array<{ label: string; value: string | number }>
              ).map((item) => (
                <NGridItem key={item.label}>
                  <NCard bordered={false} class="service-detail-page__summary-card">
                    <NStatistic label={item.label} value={item.value} />
                  </NCard>
                </NGridItem>
              ))}
            </NGrid>

            <NTabs
              type="line"
              animated
              value={activeTab.value}
              onUpdateValue={(value: string) => (activeTab.value = value)}>
              <NTabPane name="overview" tab="概览">
                <NGrid cols={2} xGap={16} yGap={16}>
                  <NGridItem>
                    <NCard
                      title="运行摘要"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      <div class="service-detail-page__summary-content-grid">
                        <div class="service-detail-page__sub-card">
                          <div class="service-detail-page__sub-card-label">CPU</div>
                          <div class="service-detail-page__sub-card-value">{displayValue(summary.value.cpu, '%')}</div>
                        </div>
                        <div class="service-detail-page__sub-card">
                          <div class="service-detail-page__sub-card-label">内存</div>
                          <div class="service-detail-page__sub-card-value">
                            {displayValue(summary.value.memory, '%')}
                          </div>
                        </div>
                        <div class="service-detail-page__sub-card">
                          <div class="service-detail-page__sub-card-label">活跃连接</div>
                          <div class="service-detail-page__sub-card-value">
                            {displayValue(summary.value.activeConnections)}
                          </div>
                        </div>
                        <div class="service-detail-page__sub-card">
                          <div class="service-detail-page__sub-card-label">版本</div>
                          <div class="service-detail-page__sub-card-value">{summary.value.version || '-'}</div>
                        </div>
                      </div>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="快捷入口"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      <NSpace vertical size="large">
                        <NSpace>
                          <NButton secondary type="primary" onClick={() => openRoute('/home/services/topology')}>
                            查看拓扑
                          </NButton>
                          <NButton secondary type="primary" onClick={() => openRoute('/home/instance-monitor')}>
                            查看实例
                          </NButton>
                        </NSpace>
                        <NSpace>
                          <NButton secondary onClick={() => openRoute('/home/investigate/logs')}>
                            查看日志
                          </NButton>
                          <NButton secondary onClick={() => openRoute('/home/investigate/traces')}>
                            查看链路
                          </NButton>
                          <NButton secondary onClick={() => openRoute('/home/alerts/inbox')}>
                            查看告警
                          </NButton>
                        </NSpace>
                        <div class="service-detail-page__section-note">
                          当前已打通服务详情与拓扑、实例、日志、链路、告警页之间的主导航入口，后续逐步补齐更深的联动与过滤透传。
                        </div>
                      </NSpace>
                    </NCard>
                  </NGridItem>
                  <NGridItem span={2}>
                    <NCard title="健康时间线" bordered={false} class="service-detail-page__section-card">
                      {healthTimeline.value.cpu.length ||
                      healthTimeline.value.memory.length ||
                      healthTimeline.value.responseTime.length ? (
                        <div class="service-detail-page__overview-panels">
                          <LineChart title="CPU 趋势" height="220px" data={healthTimeline.value.cpu as any} />
                          <LineChart
                            title="内存趋势"
                            height="220px"
                            color="#14b8a6"
                            data={healthTimeline.value.memory as any}
                          />
                          <LineChart
                            title="响应时间趋势"
                            height="220px"
                            color="#8b5cf6"
                            data={healthTimeline.value.responseTime as any}
                          />
                        </div>
                      ) : (
                        <NEmpty description="暂无健康时间线数据" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="依赖摘要"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      {dependencySummary.value.relatedCount ? (
                        <div class="service-detail-page__section-shell">
                          <div class="service-detail-page__dependency-kpis">
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">上游</div>
                              <div class="service-detail-page__sub-card-value">
                                {dependencySummary.value.upstreamCount}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">下游</div>
                              <div class="service-detail-page__sub-card-value">
                                {dependencySummary.value.downstreamCount}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">相关依赖</div>
                              <div class="service-detail-page__sub-card-value">
                                {dependencySummary.value.relatedCount}
                              </div>
                            </div>
                          </div>
                          <div class="service-detail-page__stack-list">
                            <div>
                              <div class="service-detail-page__sub-card-label">上游服务</div>
                              <div class="service-detail-page__route-actions">
                                {dependencySummary.value.upstreamNodes.length ? (
                                  dependencySummary.value.upstreamNodes.map((node) => (
                                    <NButton size="small" secondary onClick={() => openDependencyService(node)}>
                                      {node.name}
                                    </NButton>
                                  ))
                                ) : (
                                  <span class="service-detail-page__muted-text">暂无上游</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div class="service-detail-page__sub-card-label">下游服务</div>
                              <div class="service-detail-page__route-actions">
                                {dependencySummary.value.downstreamNodes.length ? (
                                  dependencySummary.value.downstreamNodes.map((node) => (
                                    <NButton size="small" secondary onClick={() => openDependencyService(node)}>
                                      {node.name}
                                    </NButton>
                                  ))
                                ) : (
                                  <span class="service-detail-page__muted-text">暂无下游</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <NEmpty description="暂无依赖关系" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="最近事件"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      {recentIncidents.value.length ? (
                        <div class="service-detail-page__event-list">
                          {recentIncidents.value.map((incident) => (
                            <div
                              class="service-detail-page__event-card"
                              key={incident.id}
                              onClick={() => openIncidentInbox(incident.id)}>
                              <div class="service-detail-page__event-header">
                                <div>
                                  <div class="service-detail-page__event-title">{incident.message}</div>
                                  <div class="service-detail-page__event-meta">
                                    {incident.service || service.value?.name || serviceId} · {incident.time || '-'}
                                  </div>
                                </div>
                                <ServiceHealthBadge status={resolveAlertHealth(incident.level)} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <NEmpty description="暂无事件" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard
                      title="最近链路"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      {recentTraces.value.length ? (
                        <div class="service-detail-page__event-list">
                          {recentTraces.value.map((trace) => (
                            <div
                              class="service-detail-page__event-card"
                              key={trace.traceId}
                              onClick={() => openRoute('/home/investigate/traces')}>
                              <div class="service-detail-page__event-header">
                                <div>
                                  <div class="service-detail-page__event-title">{trace.name}</div>
                                  <div class="service-detail-page__event-meta">
                                    {trace.service} · {new Date(trace.startTime).toLocaleString()} · {trace.duration}ms
                                  </div>
                                </div>
                                <ServiceHealthBadge status={trace.status === 'ok' ? 'healthy' : 'critical'} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <NEmpty description="暂无链路" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </NGridItem>
                  <NGridItem span={2}>
                    <NCard
                      title="最近异常"
                      bordered={false}
                      class="service-detail-page__section-card service-detail-page__section-card--tall">
                      {recentExceptions.value.length ? (
                        <div class="service-detail-page__event-list">
                          {recentExceptions.value.map((exception) => (
                            <div
                              class="service-detail-page__event-card"
                              key={exception.id || exception.message}
                              onClick={() => openRoute('/home/exception-analysis')}>
                              <div class="service-detail-page__event-header">
                                <div>
                                  <div class="service-detail-page__event-title">{exception.message}</div>
                                  <div class="service-detail-page__event-meta">
                                    {exception.type || '未知类型'} · 次数{' '}
                                    {typeof exception.count === 'number' ? exception.count : '未知'} · 最近{' '}
                                    {exception.lastOccurrence || '未知时间'}
                                  </div>
                                </div>
                                <ServiceHealthBadge status="critical" size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <NEmpty description="暂无异常" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </NGridItem>
                </NGrid>
              </NTabPane>

              <NTabPane name="metrics" tab="指标">
                <div class="service-detail-page__metrics-stack">
                  <NCard title="KPI 图组" bordered={false} class="service-detail-page__metrics-section">
                    <NGrid cols={2} xGap={16} yGap={16}>
                      <NGridItem>
                        <NCard title="QPS 趋势" bordered={false} class="service-detail-page__section-card">
                          {metricsSeries.value.qps.length ? (
                            <LineChart
                              series={metricsSeries.value.qps as any}
                              title=""
                              height="260px"
                              variant="monitor"
                              showLegend
                            />
                          ) : (
                            <NEmpty description="暂无 QPS 指标" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                      </NGridItem>
                      <NGridItem>
                        <NCard title="响应时间趋势" bordered={false} class="service-detail-page__section-card">
                          {metricsSeries.value.responseTime.length ? (
                            <LineChart
                              series={metricsSeries.value.responseTime as any}
                              title=""
                              height="260px"
                              variant="monitor"
                              showLegend
                            />
                          ) : (
                            <NEmpty description="暂无响应时间指标" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                      </NGridItem>
                    </NGrid>
                  </NCard>

                  <NCard title="基础设施图组" bordered={false} class="service-detail-page__metrics-section">
                    <NGrid cols={2} xGap={16} yGap={16}>
                      <NGridItem>
                        <NCard title="CPU 使用率趋势" bordered={false} class="service-detail-page__section-card">
                          {metricsSeries.value.cpu.length ? (
                            <LineChart
                              series={metricsSeries.value.cpu as any}
                              title=""
                              height="260px"
                              area
                              variant="monitor"
                              showLegend
                            />
                          ) : (
                            <NEmpty description="暂无 CPU 指标" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                      </NGridItem>
                      <NGridItem>
                        <NCard title="内存使用率趋势" bordered={false} class="service-detail-page__section-card">
                          {metricsSeries.value.memory.length ? (
                            <LineChart
                              series={metricsSeries.value.memory as any}
                              title=""
                              height="260px"
                              area
                              variant="monitor"
                              showLegend
                            />
                          ) : (
                            <NEmpty description="暂无内存指标" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                      </NGridItem>
                    </NGrid>
                  </NCard>

                  <NCard title="请求统计" bordered={false} class="service-detail-page__metrics-section">
                    {requestStats.value.length ? (
                      <BarChart data={requestStats.value as any} height="260px" variant="monitor" />
                    ) : (
                      <NEmpty description="暂无请求统计" class="service-detail-page__empty-state" />
                    )}
                  </NCard>

                  <NCard title="自定义指标" bordered={false} class="service-detail-page__metrics-section">
                    <div class="service-detail-page__custom-metric-toolbar">
                      <NSelect
                        v-model:value={selectedMetric.value}
                        options={[
                          { label: 'CPU', value: 'cpu' },
                          { label: '内存', value: 'memory' },
                          { label: 'QPS', value: 'qps' },
                          { label: '响应时间', value: 'responseTime' }
                        ]}
                        class="service-detail-page__select"
                      />
                    </div>
                    {metricsSeries.value[selectedMetric.value].length ? (
                      <LineChart
                        series={metricsSeries.value[selectedMetric.value] as any}
                        title=""
                        height="280px"
                        variant="monitor"
                        showLegend
                      />
                    ) : (
                      <NEmpty description="暂无指标数据" class="service-detail-page__empty-state" />
                    )}
                  </NCard>

                  <NCard title="基线对比" bordered={false} class="service-detail-page__metrics-section">
                    <div class="service-detail-page__baseline-grid">
                      {baselineComparison.value.map((item) => (
                        <div class="service-detail-page__sub-card">
                          <div class="service-detail-page__baseline-label">{item.label}</div>
                          <div class="service-detail-page__muted-text">Baseline: {item.baseline}</div>
                          <div class="service-detail-page__muted-text">Current: {item.current}</div>
                          <div
                            class={[
                              'service-detail-page__baseline-delta',
                              item.delta >= 0
                                ? 'service-detail-page__baseline-delta--up'
                                : 'service-detail-page__baseline-delta--down'
                            ]}>
                            {item.delta > 0 ? '+' : ''}
                            {item.delta}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </NCard>

                  <div class="service-detail-page__trace-footer">
                    <NButton type="primary" secondary onClick={() => openRoute('/home/investigate/metrics')}>
                      进入指标分析
                    </NButton>
                  </div>
                </div>
              </NTabPane>

              <NTabPane name="topology" tab="拓扑">
                <NCard bordered={false} class="service-detail-page__section-card">
                  <div class="service-detail-page__section-note">
                    查看当前服务在调用链中的上下游关系，并可直接查看节点详情。
                  </div>
                  {topologyPreview.value.nodes.length > 0 ? (
                    <>
                      <div class="service-detail-page__topology-shell">
                        <ServiceTopology
                          data={topologyPreview.value}
                          height="100%"
                          loading={topologyLoading.value}
                          onNodeClick={openTopologyNode}
                        />
                      </div>
                      {selectedDependencyMetrics.value ? (
                        <div class="service-detail-page__topology-metrics">
                          <div class="service-detail-page__topology-metrics-title">
                            {selectedTopologyNode.value?.name} 关联指标
                          </div>
                          <div class="service-detail-page__topology-node-stats">
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">关联边数</div>
                              <div class="service-detail-page__sub-card-value">
                                {selectedDependencyMetrics.value.edgeCount}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">QPS</div>
                              <div class="service-detail-page__sub-card-value">
                                {displayMetric(selectedDependencyMetrics.value.qps)}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">错误率</div>
                              <div class="service-detail-page__sub-card-value">
                                {displayMetric(selectedDependencyMetrics.value.errorRate, '%')}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">P99</div>
                              <div class="service-detail-page__sub-card-value">
                                {displayMetric(selectedDependencyMetrics.value.p99, 'ms')}
                              </div>
                            </div>
                            <div class="service-detail-page__sub-card">
                              <div class="service-detail-page__sub-card-label">调用次数</div>
                              <div class="service-detail-page__sub-card-value">
                                {selectedDependencyMetrics.value.callCount}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div class="service-detail-page__topology-footer">
                        <div class="service-detail-page__topology-hint">
                          已显示当前服务及其直接上下游节点，点击节点可查看详情。
                        </div>
                        <NButton type="primary" secondary onClick={() => openRoute('/home/services/topology')}>
                          打开完整拓扑
                        </NButton>
                      </div>
                      {relatedTopologyNodes.value.length > 0 && (
                        <div class="service-detail-page__related-nodes">
                          {relatedTopologyNodes.value.map((node) => (
                            <NButton size="small" secondary onClick={() => openTopologyNode(node)}>
                              {node.name}
                            </NButton>
                          ))}
                        </div>
                      )}
                      <div class="service-detail-page__topology-tables">
                        <NCard title="上游依赖表" bordered={false} class="service-detail-page__table-card">
                          {upstreamDependencyRows.value.length ? (
                            <ResultTable
                              columns={dependencyColumns as any}
                              data={upstreamDependencyRows.value as any}
                              rowKey="id"
                              pagination={false as any}
                            />
                          ) : (
                            <NEmpty description="暂无上游依赖" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                        <NCard title="下游依赖表" bordered={false} class="service-detail-page__table-card">
                          {downstreamDependencyRows.value.length ? (
                            <ResultTable
                              columns={dependencyColumns as any}
                              data={downstreamDependencyRows.value as any}
                              rowKey="id"
                              pagination={false as any}
                            />
                          ) : (
                            <NEmpty description="暂无下游依赖" class="service-detail-page__empty-state" />
                          )}
                        </NCard>
                      </div>
                    </>
                  ) : (
                    <NEmpty description="暂无拓扑数据">
                      <div class="service-detail-page__topology-empty-action">
                        <NButton type="primary" secondary onClick={() => openRoute('/home/services/topology')}>
                          打开完整拓扑
                        </NButton>
                      </div>
                    </NEmpty>
                  )}
                </NCard>
              </NTabPane>

              <NTabPane name="logs" tab="日志">
                <NCard bordered={false} class="service-detail-page__logs-shell">
                  <div class="service-detail-page__section-note service-detail-page__logs-toolbar">
                    查看与当前服务相关的日志、异常与导出能力。
                  </div>
                  <div class="service-detail-page__custom-metric-toolbar">
                    <NInput v-model:value={logKeyword.value} placeholder="搜索日志关键词" clearable>
                      {{ prefix: () => <NIcon component={SearchOutline} /> }}
                    </NInput>
                    <NButton type="primary" onClick={loadLogs}>
                      搜索
                    </NButton>
                  </div>
                  <div class="service-detail-page__logs-layout">
                    <div>
                      {filteredLogs.value.length ? (
                        <ResultTable
                          columns={logColumns as any}
                          data={filteredLogs.value as any}
                          rowKey={(row: LogEntry) => row.id || row.key || row.timestamp}
                          pagination={false as any}
                          rowProps={(row: LogEntry) => ({
                            onClick: () => showLogDetails(row)
                          })}
                        />
                      ) : (
                        <NEmpty description="暂无日志数据" class="service-detail-page__empty-state" />
                      )}
                    </div>
                    <NCard title="日志模式" bordered={false} class="service-detail-page__side-card">
                      {logPatterns.value.length ? (
                        <div class="service-detail-page__logs-patterns">
                          {logPatterns.value.map((item) => (
                            <button
                              class="service-detail-page__log-pattern-card"
                              key={item.pattern}
                              onClick={() => {
                                selectedLogPattern.value =
                                  selectedLogPattern.value === item.pattern ? null : item.pattern
                              }}>
                              <div class="service-detail-page__log-pattern-header">
                                <div class="service-detail-page__log-pattern-title">{item.pattern}</div>
                                <NTag size="small" bordered={false}>
                                  {item.count}
                                </NTag>
                              </div>
                              <div class="service-detail-page__event-meta">{item.level.toUpperCase()}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <NEmpty description="暂无日志模式" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                  </div>
                  <div class="service-detail-page__logs-footer">
                    <NSpace>
                      <NButton type="primary" secondary onClick={() => openRoute('/home/investigate/logs')}>
                        日志中心
                      </NButton>
                      <NButton secondary onClick={() => openRoute('/home/exception-analysis')}>
                        异常分析
                      </NButton>
                    </NSpace>
                  </div>
                </NCard>
              </NTabPane>

              <NTabPane name="traces" tab="链路">
                <NCard bordered={false} class="service-detail-page__traces-shell">
                  <div class="service-detail-page__section-note service-detail-page__traces-toolbar">
                    查看当前服务相关链路，并可直接在页内打开链路详情。
                  </div>
                  <div class="service-detail-page__trace-toolbar">
                    <NInput v-model:value={traceQuery.value} placeholder="搜索 Trace ID" clearable>
                      {{ prefix: () => <NIcon component={SearchOutline} /> }}
                    </NInput>
                    <NButton type="primary" onClick={loadTraces}>
                      搜索
                    </NButton>
                  </div>
                  <NCard title="耗时分布" bordered={false} class="service-detail-page__distribution-card">
                    {traceDurationBuckets.value.some((item) => item.value > 0) ? (
                      <BarChart data={traceDurationBuckets.value as any} height="220px" variant="monitor" />
                    ) : (
                      <NEmpty description="暂无耗时分布数据" class="service-detail-page__empty-state" />
                    )}
                  </NCard>
                  {recentTraces.value.length ? (
                    <ResultTable
                      columns={traceColumns as any}
                      data={recentTraces.value as any}
                      rowKey={(row: TraceSpan) => row.traceId}
                      pagination={false as any}
                      rowProps={(row: TraceSpan) => ({
                        onClick: () => openTrace(row.traceId)
                      })}
                    />
                  ) : (
                    <NEmpty description="暂无链路数据" class="service-detail-page__empty-state" />
                  )}
                  <div class="service-detail-page__trace-footer">
                    <NButton type="primary" secondary onClick={() => openRoute('/home/investigate/traces')}>
                      打开链路追踪
                    </NButton>
                  </div>
                </NCard>
              </NTabPane>

              <NTabPane name="alerts" tab="告警">
                <NCard bordered={false} class="service-detail-page__alerts-shell">
                  <div class="service-detail-page__section-note service-detail-page__alerts-section">
                    查看当前服务相关的告警历史、规则与通知记录。
                  </div>
                  {activeAlerts.value.length ? (
                    <div class="service-detail-page__alerts-active-list">
                      {activeAlerts.value.slice(0, 5).map((incident) => (
                        <div
                          class="service-detail-page__event-card"
                          key={incident.id}
                          onClick={() => openIncidentInbox(incident.id)}>
                          <div class="service-detail-page__event-header">
                            <div>
                              <div class="service-detail-page__event-title">{incident.message}</div>
                              <div class="service-detail-page__event-meta">
                                {incident.service || service.value?.name || serviceId} · {incident.time || '-'}
                              </div>
                            </div>
                            <ServiceHealthBadge status={resolveAlertHealth(incident.level)} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : hasUnknownAlertStatus.value ? (
                    <NEmpty
                      description="活跃状态未知，暂时无法确认当前事件数"
                      class="service-detail-page__empty-state"
                    />
                  ) : (
                    <NEmpty description="暂无活跃事件" class="service-detail-page__empty-state" />
                  )}
                  <NSpace>
                    <NButton type="primary" secondary onClick={() => openRoute('/home/alerts/inbox')}>
                      告警历史
                    </NButton>
                    <NButton secondary onClick={() => openRoute('/home/alert-rules')}>
                      告警规则
                    </NButton>
                    <NButton secondary onClick={() => openRoute('/home/alert-notifications')}>
                      通知历史
                    </NButton>
                  </NSpace>
                  <div class="service-detail-page__alert-rules">
                    {alertRules.value.length ? (
                      <ResultTable
                        columns={alertRuleColumns as any}
                        data={alertRules.value as any}
                        rowKey="id"
                        pagination={false as any}
                      />
                    ) : (
                      <NEmpty description="暂无告警规则" class="service-detail-page__empty-state" />
                    )}
                  </div>
                  <div class="service-detail-page__silent-section">
                    <div class="service-detail-page__section-note">静默策略（当前以已静默告警作为最小视图）</div>
                    {alerts.value.filter((incident) => incident.status === 'suppressed').length ? (
                      <div class="service-detail-page__alerts-muted-list">
                        {alerts.value
                          .filter((incident) => incident.status === 'suppressed')
                          .slice(0, 5)
                          .map((incident) => (
                            <div class="service-detail-page__silent-card" key={incident.id}>
                              <div class="service-detail-page__silent-header">
                                <div>
                                  <div class="service-detail-page__event-title">{incident.message}</div>
                                  <div class="service-detail-page__event-meta">
                                    {incident.service || service.value?.name || serviceId} · {incident.time || '-'}
                                  </div>
                                </div>
                                <NTag size="small" bordered={false}>
                                  已静默
                                </NTag>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <NEmpty description="暂无静默策略" class="service-detail-page__empty-state" />
                    )}
                  </div>
                  <div class="service-detail-page__notifications-section">
                    {notifications.value.length ? (
                      <div class="service-detail-page__alerts-notifications">
                        {notifications.value.map((item) => (
                          <div
                            class="service-detail-page__notification-card"
                            key={item.key}
                            onClick={() => openRoute('/home/alert-notifications')}>
                            <div class="service-detail-page__notification-header">
                              <div>
                                <div class="service-detail-page__event-title">{item.ruleName}</div>
                                <div class="service-detail-page__event-meta">
                                  {item.channel} · {item.recipient} · {item.sendTime}
                                </div>
                              </div>
                              <NTag
                                size="small"
                                bordered={false}
                                type={
                                  item.status === 'success'
                                    ? 'success'
                                    : item.status === 'failed'
                                      ? 'error'
                                      : item.status === 'pending'
                                        ? 'warning'
                                        : 'default'
                                }>
                                {item.status}
                              </NTag>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <NEmpty description="暂无通知历史" class="service-detail-page__empty-state" />
                    )}
                  </div>
                </NCard>
              </NTabPane>

              <NTabPane name="runtime" tab="运行时">
                <NCard bordered={false} class="service-detail-page__runtime-shell">
                  <NSpace vertical>
                    <div class="service-detail-page__section-note">运行时视图聚焦实例、区域、AppKey 与采集状态。</div>
                    <NSpace class="service-detail-page__runtime-tags">
                      <NTag size="small" bordered={false}>
                        实例数：{displayMetric(summary.value.instances)}
                      </NTag>
                      <NTag size="small" bordered={false}>
                        版本：{summary.value.version || '-'}
                      </NTag>
                      <NTag size="small" bordered={false}>
                        区域：{runtime.value.region || service.value.region || '-'}
                      </NTag>
                      <NTag size="small" bordered={false}>
                        AppKey：{runtime.value.appKey || service.value.id}
                      </NTag>
                    </NSpace>
                    <NSpace>
                      <NTag
                        size="small"
                        type={runtime.value.ingestStatus.metrics ? 'success' : 'default'}
                        bordered={false}>
                        Metrics
                      </NTag>
                      <NTag
                        size="small"
                        type={runtime.value.ingestStatus.logs ? 'success' : 'default'}
                        bordered={false}>
                        Logs
                      </NTag>
                      <NTag
                        size="small"
                        type={runtime.value.ingestStatus.traces ? 'success' : 'default'}
                        bordered={false}>
                        Traces
                      </NTag>
                    </NSpace>
                    <NCard title="运行环境" bordered={false} class="service-detail-page__runtime-card">
                      {runtime.value.env ? (
                        <div class="service-detail-page__runtime-meta-card">
                          <div class="service-detail-page__runtime-meta-label">当前环境</div>
                          <div class="service-detail-page__runtime-meta-value">{runtime.value.env}</div>
                        </div>
                      ) : (
                        <NEmpty description="暂无运行环境信息" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                    <NCard title="元信息" bordered={false} class="service-detail-page__runtime-card">
                      {service.value ? (
                        <div class="service-detail-page__runtime-meta-grid">
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">Owner</div>
                            <div class="service-detail-page__runtime-meta-value">{service.value.owner || '-'}</div>
                          </div>
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">Region</div>
                            <div class="service-detail-page__runtime-meta-value">
                              {runtime.value.region || service.value.region || '-'}
                            </div>
                          </div>
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">AppKey</div>
                            <div class="service-detail-page__runtime-meta-value service-detail-page__runtime-meta-value--break">
                              {runtime.value.appKey || service.value.id}
                            </div>
                          </div>
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">Version</div>
                            <div class="service-detail-page__runtime-meta-value">
                              {summary.value.version || service.value.version || '-'}
                            </div>
                          </div>
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">Tags</div>
                            <div class="service-detail-page__runtime-tags">
                              {service.value.tags?.length ? (
                                service.value.tags.map((tag) => (
                                  <NTag size="small" bordered={false}>
                                    {tag}
                                  </NTag>
                                ))
                              ) : (
                                <span class="service-detail-page__muted-text">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <NEmpty description="暂无元信息" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                    <NCard title="部署历史" bordered={false} class="service-detail-page__runtime-card">
                      {service.value?.lastDeploy || summary.value.version ? (
                        <div class="service-detail-page__runtime-stack">
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">最近部署时间</div>
                            <div class="service-detail-page__runtime-meta-value">
                              {service.value?.lastDeploy || '-'}
                            </div>
                          </div>
                          <div class="service-detail-page__runtime-meta-card">
                            <div class="service-detail-page__runtime-meta-label">当前版本</div>
                            <div class="service-detail-page__runtime-meta-value">{summary.value.version || '-'}</div>
                          </div>
                        </div>
                      ) : (
                        <NEmpty description="暂无部署历史" class="service-detail-page__empty-state" />
                      )}
                    </NCard>
                    <ResultTable
                      loading={instanceLoading.value}
                      columns={instanceColumns}
                      data={serviceInstances.value.slice(0, 5)}
                      rowKey={(row: ServiceInstance) => row.id}
                      pagination={false as any}
                    />
                    <div class="service-detail-page__trace-footer">
                      <NButton type="primary" secondary onClick={() => openRoute('/home/instance-monitor')}>
                        打开实例监控
                      </NButton>
                    </div>
                  </NSpace>
                </NCard>
              </NTabPane>
            </NTabs>

            <DetailDrawer
              show={showTopologyDetail.value}
              title={selectedTopologyNode.value?.name || '节点详情'}
              width="md"
              onUpdate:show={(value: boolean) => {
                showTopologyDetail.value = value
              }}>
              {selectedTopologyNode.value ? (
                <div class="service-detail-page__detail-drawer-shell">
                  <ServiceIdentityCard
                    compact
                    service={{
                      id: selectedTopologyNode.value.id,
                      name: selectedTopologyNode.value.name,
                      displayName: selectedTopologyNode.value.name,
                      healthStatus:
                        selectedTopologyNode.value.status === 'running'
                          ? 'healthy'
                          : selectedTopologyNode.value.status === 'error'
                            ? 'critical'
                            : 'degraded',
                      runtime: selectedTopologyNode.value.type || 'service',
                      env: selectedTopologyNode.value.env,
                      region: selectedTopologyNode.value.cluster,
                      tags: selectedTopologyNode.value.protocol ? [selectedTopologyNode.value.protocol] : []
                    }}
                  />
                  <div class="service-detail-page__detail-meta-grid">
                    <div>节点ID：{selectedTopologyNode.value.id}</div>
                    <div>状态：{selectedTopologyNode.value.status}</div>
                    <div>环境：{selectedTopologyNode.value.env || '-'}</div>
                    <div>集群：{selectedTopologyNode.value.cluster || '-'}</div>
                    <div>协议：{selectedTopologyNode.value.protocol || '-'}</div>
                    <div>层级：{selectedTopologyNode.value.layerName || '-'}</div>
                  </div>
                </div>
              ) : null}
            </DetailDrawer>

            <NDrawer v-model:show={traceDrawerOpen.value} width={800} placement="right">
              <NDrawerContent title={`链路：${selectedTraceId.value}`} closable>
                {drawerLoading.value ? (
                  <div class="service-detail-page__trace-loading">
                    <NSpin size="large" />
                  </div>
                ) : drawerTraces.value.length > 0 && rootSpan.value ? (
                  <div class="service-detail-page__trace-tree-shell">
                    <div class="service-detail-page__trace-scale">
                      <div class="service-detail-page__trace-scale-service">服务 / 操作</div>
                      <div class="service-detail-page__trace-scale-main">
                        <div class="service-detail-page__trace-scale-edge service-detail-page__trace-scale-edge--left">
                          0ms
                        </div>
                        <div class="service-detail-page__trace-scale-edge service-detail-page__trace-scale-edge--right">
                          {totalDuration.value}ms
                        </div>
                      </div>
                    </div>

                    <div class="service-detail-page__trace-tree">
                      {renderTree(undefined, 0, rootSpan.value.startTime)}
                    </div>

                    {selectedSpan.value && (
                      <div class="service-detail-page__trace-detail-panel">
                        <h4 class="service-detail-page__trace-detail-title">{selectedSpan.value.name} 详情</h4>
                        <div class="service-detail-page__trace-detail-grid">
                          <div>
                            服务：<span class="service-detail-page__mono-value">{selectedSpan.value.service}</span>
                          </div>
                          <div>
                            耗时：<span class="service-detail-page__mono-value">{selectedSpan.value.duration}ms</span>
                          </div>
                          <div>
                            开始时间：
                            <span class="service-detail-page__mono-value">
                              {new Date(selectedSpan.value.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            状态：
                            <span
                              class={
                                selectedSpan.value.status === 'ok'
                                  ? 'service-detail-page__trace-status-ok'
                                  : 'service-detail-page__trace-status-error'
                              }>
                              {selectedSpan.value.status}
                            </span>
                          </div>
                        </div>

                        {selectedSpan.value.tags && Object.keys(selectedSpan.value.tags).length > 0 && (
                          <div class="service-detail-page__alert-rules">
                            <h5 class="service-detail-page__log-detail-title">Tags</h5>
                            <div class="service-detail-page__trace-tags">
                              {Object.entries(selectedSpan.value.tags).map(([key, value]) => (
                                <NTag key={key} size="small" bordered={false}>
                                  {key}: {String(value)}
                                </NTag>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <NEmpty description="No trace details found" class="service-detail-page__trace-empty" />
                )}
              </NDrawerContent>
            </NDrawer>

            <DetailDrawer
              show={showLogDetail.value}
              title="日志详情"
              width="lg"
              onUpdate:show={(value: boolean) => {
                showLogDetail.value = value
              }}>
              {selectedLog.value ? (
                <div class="service-detail-page__log-detail-shell">
                  <div class="service-detail-page__log-detail-header">
                    <NTag
                      type={
                        selectedLog.value.level === 'error' || selectedLog.value.level === 'fatal'
                          ? 'error'
                          : selectedLog.value.level === 'warn'
                            ? 'warning'
                            : 'info'
                      }>
                      {String(selectedLog.value.level).toUpperCase()}
                    </NTag>
                    <span class="service-detail-page__log-detail-time">
                      {dayjs(selectedLog.value.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <pre class="service-detail-page__log-detail-block">{selectedLog.value.message}</pre>
                  <pre class="service-detail-page__log-detail-json">
                    {JSON.stringify(
                      {
                        tags: selectedLog.value.tags,
                        fields: selectedLog.value.fields,
                        stackTrace: selectedLog.value.stackTrace
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : null}
            </DetailDrawer>
          </>
        )}
      </div>
    )
  }
})
