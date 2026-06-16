import {
  NCard,
  NSpin,
  NEmpty,
  NStatistic,
  useMessage,
  NButton,
  NIcon,
  NInput,
  NSelect,
  NTag,
  NSwitch,
  NModal,
  NForm,
  NFormItem
} from 'naive-ui'
import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { SelectOption } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { fetchTopology, fetchServiceDetailSummary, saveTopologyCanvas, type MetricsDatasetScope } from '@/api'

import type { TopologyData, TopologyEdge, TopologyNode } from '@/types/monitor'
import ServiceTopology from '@/components/ServiceTopology'
import PageHeader from '@/shared/layout/PageHeader'
import DetailDrawer from '@/shared/components/DetailDrawer'
import ServiceIdentityCard from '@/shared/components/ServiceIdentityCard'
import { RefreshOutline } from '@vicons/ionicons5'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import { useTimeStore } from '@/store/useTimeStore'
import webSocket from '@/services/webSocket'
import { useMitt } from '@/hooks/useMitt'
import { WsResponseMessageType } from '@/types/enums'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './TopologyPage.scss'

export default defineComponent({
  name: 'TopologyPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const topologyLoading = ref(true)
    const topologyData = ref<TopologyData | null>(null)
    const query = ref('')
    const statusFilter = ref('all')
    const autoRefresh = ref(true)
    const refreshIntervalMs = ref(15000)
    const lastUpdatedAt = ref<number | null>(null)
    const topologyRefreshKey = ref(0)
    const refreshTimer = ref<ReturnType<typeof globalThis.setInterval> | null>(null)
    const showAddInfra = ref(false)
    const infraForm = ref({
      id: 'infra:redis',
      name: 'Redis',
      type: 'middleware',
      protocol: 'redis',
      layerName: 'infrastructure',
      status: 'unknown',
      connectTo: ''
    })
    const manualNodes = ref<any[]>([])
    const manualEdges = ref<any[]>([])

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
      ) {
        return status
      }
      return 'unknown'
    }

    const normalizeTopology = (payload: any): TopologyData => {
      const source = payload?.snapshot || payload
      const nodes = Array.isArray(source?.nodes)
        ? source.nodes.map((node: any) => ({
            ...node,
            id: String(node?.id || node?.name || ''),
            name: String(node?.name || node?.id || ''),
            status: normalizeStatus(node?.status)
          }))
        : []
      const edges = Array.isArray(source?.edges)
        ? source.edges.map((edge: any) => ({
            ...edge,
            from: edge?.from ?? edge?.source,
            to: edge?.to ?? edge?.target
          }))
        : []
      return { nodes, edges, meta: source?.meta }
    }

    const syncManualCanvasState = (data: TopologyData) => {
      manualNodes.value = data.nodes.filter((node) => node.source === 'manual-topology')
      manualEdges.value = data.edges.filter((edge) => edge.source === 'manual-topology')
    }

    const getLayerKey = (node: TopologyNode) => {
      const text = `${node.layerName || ''} ${node.type || ''}`.toLowerCase()
      if (text.includes('gateway') || text.includes('edge')) return 'gateway'
      if (
        text.includes('infra') ||
        text.includes('database') ||
        text.includes('middleware') ||
        text.includes('storage') ||
        ['redis', 'mysql', 'kafka', 'influxdb', 'elasticsearch'].some((keyword) =>
          String(node.id || node.name)
            .toLowerCase()
            .includes(keyword)
        )
      ) {
        return 'infrastructure'
      }
      return 'service'
    }

    const getNodeIdentity = (node: TopologyNode) => String(node.id || node.name || '').trim()

    const buildInferredTopologyEdges = (nodes: TopologyNode[], explicitEdges: TopologyEdge[]) => {
      const existingPairs = new Set(
        explicitEdges.map((edge) => `${String(edge.from)}=>${String(edge.to)}`).filter((key) => key !== '=>')
      )
      const gatewayNodes = nodes.filter((node) => getLayerKey(node) === 'gateway')
      const serviceNodes = nodes.filter((node) => getLayerKey(node) === 'service')
      const infraNodes = nodes.filter((node) => getLayerKey(node) === 'infrastructure')
      const inferredEdges: TopologyEdge[] = []

      const addEdge = (fromNode: TopologyNode | undefined, toNode: TopologyNode | undefined, protocol = 'observed') => {
        const from = fromNode ? getNodeIdentity(fromNode) : ''
        const to = toNode ? getNodeIdentity(toNode) : ''
        if (!from || !to || from === to) return
        const key = `${from}=>${to}`
        if (existingPairs.has(key)) return
        existingPairs.add(key)
        inferredEdges.push({
          from,
          to,
          protocol,
          callType: 'inferred',
          status: 'unknown',
          source: 'client-inferred-topology',
          inferred: true
        })
      }

      if (explicitEdges.length === 0 && gatewayNodes.length > 0) {
        serviceNodes.forEach((service) => addEdge(gatewayNodes[0], service, 'http'))
      }

      if (explicitEdges.length === 0 && gatewayNodes.length === 0 && serviceNodes.length > 1) {
        serviceNodes.slice(1).forEach((service) => addEdge(serviceNodes[0], service, 'service'))
      }

      if (infraNodes.length > 0 && serviceNodes.length > 0) {
        const connectedTargets = new Set(explicitEdges.map((edge) => String(edge.to)))
        infraNodes.forEach((infra) => {
          if (!connectedTargets.has(getNodeIdentity(infra))) addEdge(serviceNodes[0], infra, infra.protocol || 'infra')
        })
      }

      return inferredEdges
    }

    const ensurePresentableTopology = (data: TopologyData): TopologyData => {
      const nodes = data.nodes.filter((node) => getNodeIdentity(node))
      const nodeIds = new Set(nodes.map(getNodeIdentity))
      const explicitEdges = data.edges.filter(
        (edge) =>
          nodeIds.has(String(edge.from)) && nodeIds.has(String(edge.to)) && String(edge.from) !== String(edge.to)
      )
      const inferredEdges = buildInferredTopologyEdges(nodes, explicitEdges)
      return {
        ...data,
        nodes,
        edges: [...explicitEdges, ...inferredEdges],
        meta: {
          ...(data.meta || {}),
          inferredEdgeCount: inferredEdges.length,
          originalEdgeCount: data.edges.length
        }
      }
    }

    const isFallbackTopology = computed(
      () =>
        topologyData.value?.meta?.source === 'service-catalog-fallback' ||
        ((topologyData.value?.nodes?.length || 0) > 1 && Number(topologyData.value?.meta?.originalEdgeCount || 0) === 0)
    )

    const applyDelta = (payload: any) => {
      const delta = payload?.delta || payload
      if (!delta) return
      const current = topologyData.value || { nodes: [], edges: [] }

      const nodeMap = new Map<string, any>(current.nodes.map((node) => [String(node.id), node]))
      const edgeMap = new Map<string, any>(current.edges.map((edge) => [`${edge.from}=>${edge.to}`, edge]))

      const getNodeId = (node: any) => String(node?.id || node?.name || '')
      const getEdgeKey = (edge: any) => `${edge?.from ?? edge?.source}=>${edge?.to ?? edge?.target}`

      ;(delta.removedNodes || []).forEach((node: any) => {
        const id = getNodeId(node)
        if (id) nodeMap.delete(id)
      })
      ;(delta.removedEdges || []).forEach((edge: any) => {
        const key = getEdgeKey(edge)
        if (key) edgeMap.delete(key)
      })
      ;(delta.addedNodes || []).forEach((node: any) => {
        const normalized = {
          ...node,
          id: String(node?.id || node?.name || ''),
          name: String(node?.name || node?.id || ''),
          status: normalizeStatus(node?.status)
        }
        if (normalized.id) nodeMap.set(normalized.id, normalized)
      })
      ;(delta.updatedNodes || []).forEach((node: any) => {
        const normalized = {
          ...node,
          id: String(node?.id || node?.name || ''),
          name: String(node?.name || node?.id || ''),
          status: normalizeStatus(node?.status)
        }
        if (normalized.id) nodeMap.set(normalized.id, normalized)
      })
      ;(delta.addedEdges || []).forEach((edge: any) => {
        const normalized = {
          ...edge,
          from: edge?.from ?? edge?.source,
          to: edge?.to ?? edge?.target
        }
        const key = `${normalized.from}=>${normalized.to}`
        if (key) edgeMap.set(key, normalized)
      })
      ;(delta.updatedEdges || []).forEach((edge: any) => {
        const normalized = {
          ...edge,
          from: edge?.from ?? edge?.source,
          to: edge?.to ?? edge?.target
        }
        const key = `${normalized.from}=>${normalized.to}`
        if (key) edgeMap.set(key, normalized)
      })

      topologyData.value = ensurePresentableTopology({
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      })
    }

    const loadTopology = async () => {
      topologyLoading.value = true
      try {
        const nextTopology = normalizeTopology(
          await fetchTopology({ timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value })
        )
        topologyData.value = ensurePresentableTopology(nextTopology)
        syncManualCanvasState(topologyData.value)
        lastUpdatedAt.value = Date.now()
        topologyRefreshKey.value += 1
      } catch (e) {
        message.error('获取拓扑数据失败')
      } finally {
        topologyLoading.value = false
      }
    }

    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        globalThis.clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    const startAutoRefresh = () => {
      stopAutoRefresh()
      if (!autoRefresh.value) return
      refreshTimer.value = globalThis.setInterval(() => {
        if (!topologyLoading.value) loadTopology()
      }, refreshIntervalMs.value)
    }

    onMounted(async () => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      await loadTopology()
      startAutoRefresh()
      const focusNodeId = typeof route.query.focus === 'string' ? route.query.focus : route.query.serviceId
      if (typeof focusNodeId === 'string') {
        const targetNode = topologyData.value?.nodes?.find((node) => String(node.id) === focusNodeId)
        if (targetNode) {
          await openDetail(targetNode as any)
        }
      }
    })

    watch(
      () => timeStore.timeRange,
      () => {
        loadTopology()
      }
    )

    watch(
      () => datasetScope.value,
      () => {
        loadTopology()
      }
    )

    watch(
      () => autoRefresh.value,
      () => {
        startAutoRefresh()
      }
    )

    watch(
      () => refreshIntervalMs.value,
      () => {
        startAutoRefresh()
      }
    )

    useMitt.on(WsResponseMessageType.TOPOLOGY_SNAPSHOT, (payload) => {
      const nextTopology = normalizeTopology(payload)
      topologyData.value = ensurePresentableTopology(nextTopology)
      syncManualCanvasState(topologyData.value)
      lastUpdatedAt.value = Date.now()
      topologyRefreshKey.value += 1
    })

    useMitt.on(WsResponseMessageType.TOPOLOGY_DELTA, (payload) => {
      applyDelta(payload)
      lastUpdatedAt.value = Date.now()
    })

    onMounted(() => {
      webSocket.send({ type: 'subscribe', data: { channel: 'topology' } })
    })

    onUnmounted(() => {
      stopAutoRefresh()
      webSocket.send({ type: 'unsubscribe', data: { channel: 'topology' } })
    })

    const showDetail = ref(false)
    const currentNode = ref<TopologyNode | null>(null)
    const detailLoading = ref(false)
    const detailMetrics = ref<{
      cpu: number | null
      memory: number | null
      qps: number | null
      responseTime: number | null
      errorRate: number | null
      activeConnections: number | null
      version: string
      instances: number | null
    }>({
      cpu: null,
      memory: null,
      qps: null,
      responseTime: null,
      errorRate: null,
      activeConnections: null,
      version: '',
      instances: null
    })

    const openDetail = async (node: TopologyNode) => {
      currentNode.value = node
      showDetail.value = true
      detailLoading.value = true
      const nodeFallbackMetrics = {
        cpu: null,
        memory: null,
        qps: node.qps ?? null,
        responseTime: node.latency ?? null,
        errorRate:
          typeof node.errorRate === 'number' && node.errorRate <= 1 ? node.errorRate * 100 : (node.errorRate ?? null),
        activeConnections: null,
        version: node.version || '',
        instances: node.instances ?? null
      }
      try {
        const detail = await fetchServiceDetailSummary(node.id, { scope: datasetScope.value })
        const identity = detail?.identity
        const summary = detail?.summary || {}

        if (identity) {
          currentNode.value = {
            ...node,
            name: identity.displayName || identity.name,
            status:
              identity.healthStatus === 'healthy'
                ? 'healthy'
                : identity.healthStatus === 'warning' || identity.healthStatus === 'degraded'
                  ? 'warning'
                  : identity.healthStatus === 'critical'
                    ? 'critical'
                    : identity.healthStatus === 'unknown'
                      ? 'unknown'
                      : 'unknown',
            env: identity.env || node.env,
            cluster: identity.region || node.cluster
          } as any
        }

        detailMetrics.value = {
          cpu: summary.cpu ?? nodeFallbackMetrics.cpu,
          memory: summary.memory ?? nodeFallbackMetrics.memory,
          qps: summary.qps ?? nodeFallbackMetrics.qps,
          responseTime: summary.responseTime ?? nodeFallbackMetrics.responseTime,
          errorRate: summary.errorRate ?? nodeFallbackMetrics.errorRate,
          activeConnections: summary.activeConnections ?? nodeFallbackMetrics.activeConnections,
          version: summary.version ?? identity?.runtime ?? nodeFallbackMetrics.version,
          instances: summary.instances ?? nodeFallbackMetrics.instances
        }
      } catch (e) {
        detailMetrics.value = nodeFallbackMetrics
      } finally {
        detailLoading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '', digits?: number) => {
      if (typeof value !== 'number') return '未知'
      return typeof digits === 'number' ? `${value.toFixed(digits)}${suffix}` : `${value}${suffix}`
    }

    const isHealthyStatus = (status?: string) => status === 'healthy' || status === 'running'
    const isWarningStatus = (status?: string) => status === 'warning' || status === 'idle'
    const isCriticalStatus = (status?: string) => status === 'critical' || status === 'error' || status === 'stopped'

    const topologyStats = computed(() => {
      const nodes = topologyData.value?.nodes || []
      const edges = topologyData.value?.edges || []
      return {
        nodes: nodes.length,
        edges: edges.length,
        healthy: nodes.filter((node) => isHealthyStatus(node.status)).length,
        warning: nodes.filter((node) => isWarningStatus(node.status)).length,
        critical: nodes.filter((node) => isCriticalStatus(node.status)).length
      }
    })

    const filteredTopologyData = computed<TopologyData>(() => {
      const source = topologyData.value || { nodes: [], edges: [] }
      const keyword = query.value.trim().toLowerCase()
      const nodes = source.nodes.filter((node) => {
        const matchesKeyword =
          !keyword ||
          [node.name, node.id, node.app, node.env, node.cluster, node.protocol, node.layerName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        const matchesStatus = statusFilter.value === 'all' || node.status === statusFilter.value
        return matchesKeyword && matchesStatus
      })
      const nodeIds = new Set(nodes.map((node) => String(node.id)))
      const explicitEdges = source.edges.filter(
        (edge) => nodeIds.has(String(edge.from)) && nodeIds.has(String(edge.to))
      )
      const inferredEdges = buildInferredTopologyEdges(nodes, explicitEdges)
      return { nodes, edges: [...explicitEdges, ...inferredEdges], meta: source.meta }
    })

    const refreshOptions = [
      { label: '5 秒', value: 5000 },
      { label: '15 秒', value: 15000 },
      { label: '30 秒', value: 30000 },
      { label: '60 秒', value: 60000 }
    ]

    const infraTypeOptions = [
      { label: 'Redis 缓存', value: 'redis' },
      { label: 'MySQL 数据库', value: 'mysql' },
      { label: 'Kafka 消息队列', value: 'kafka' },
      { label: 'InfluxDB 时序库', value: 'influxdb' },
      { label: 'Elasticsearch 搜索', value: 'elasticsearch' }
    ]

    const layerDefinitions = [
      { key: 'gateway', title: '接入层', subtitle: 'Gateway / Edge / API Entry' },
      { key: 'service', title: '服务应用层', subtitle: '业务服务、平台服务、系统服务' },
      { key: 'infrastructure', title: '基础设施层', subtitle: '数据库、缓存、消息队列、时序存储' }
    ]

    const lastUpdatedLabel = computed(() => {
      if (!lastUpdatedAt.value) return '尚未刷新'
      return new Date(lastUpdatedAt.value).toLocaleTimeString()
    })

    const nodeOptions = computed<SelectOption[]>(() =>
      (topologyData.value?.nodes || []).map((node) => ({
        label: `${node.name} (${node.id})`,
        value: node.id
      }))
    )

    const applyInfraPreset = (preset: string) => {
      const presets: Record<string, any> = {
        redis: { id: 'infra:redis', name: 'Redis', type: 'middleware', protocol: 'redis' },
        mysql: { id: 'infra:mysql', name: 'MySQL', type: 'database', protocol: 'mysql' },
        kafka: { id: 'infra:kafka', name: 'Kafka', type: 'middleware', protocol: 'kafka' },
        influxdb: { id: 'infra:influxdb', name: 'InfluxDB', type: 'database', protocol: 'influxdb' },
        elasticsearch: {
          id: 'infra:elasticsearch',
          name: 'Elasticsearch',
          type: 'middleware',
          protocol: 'elasticsearch'
        }
      }
      infraForm.value = {
        ...infraForm.value,
        ...(presets[preset] || {}),
        layerName: 'infrastructure',
        status: infraForm.value.status || 'unknown'
      }
    }

    const addInfrastructureNode = async () => {
      const id = infraForm.value.id.trim()
      if (!id) {
        message.warning('请输入资源 ID')
        return
      }
      const node = {
        id,
        name: infraForm.value.name || id,
        type: infraForm.value.type,
        protocol: infraForm.value.protocol,
        layerName: 'infrastructure',
        layer: 3,
        status: infraForm.value.status,
        source: 'manual-topology',
        editable: true
      }
      const nextNodes = [...manualNodes.value.filter((item) => item.id !== id), node]
      const nextEdges = [...manualEdges.value.filter((edge) => edge.to !== id)]
      if (infraForm.value.connectTo) {
        nextEdges.push({
          from: infraForm.value.connectTo,
          to: id,
          protocol: infraForm.value.protocol || 'manual',
          callType: 'sync',
          source: 'manual-topology',
          editable: true,
          status: 'unknown'
        })
      }
      await saveTopologyCanvas({ nodes: nextNodes, edges: nextEdges, scope: datasetScope.value })
      manualNodes.value = nextNodes
      manualEdges.value = nextEdges
      showAddInfra.value = false
      message.success('已添加基础设施节点')
      await loadTopology()
    }

    const openAddInfrastructureModal = (preset = 'redis') => {
      applyInfraPreset(preset)
      showAddInfra.value = true
    }

    const statusOptions = [
      { label: '全部状态', value: 'all' },
      { label: '健康', value: 'healthy' },
      { label: '运行中', value: 'running' },
      { label: '告警', value: 'warning' },
      { label: '异常', value: 'critical' },
      { label: '错误', value: 'error' },
      { label: '已停止', value: 'stopped' },
      { label: '未知', value: 'unknown' }
    ]

    const openServiceDetail = (node: TopologyNode) => {
      router.push({ path: `/home/services/${node.id}`, query: { timeRange: timeStore.timeRange } })
    }

    return () => (
      <div class="topology-page">
        <PageHeader title="服务拓扑" subtitle="全局依赖关系与链路概览">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={loadTopology}>
                {{
                  icon: () => <NIcon component={RefreshOutline} />,
                  default: () => '刷新拓扑'
                }}
              </NButton>
            )
          }}
        </PageHeader>

        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => {
            timeStore.setTimeRange(range)
            loadTopology()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadTopology()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadTopology()
          }}
        />

        <div class="topology-page__summary-strip">
          <NCard bordered={false} class="topology-page__summary-card topology-page__summary-card--total">
            <div class="topology-page__summary-label">服务节点</div>
            <div class="topology-page__summary-value">{topologyStats.value.nodes}</div>
          </NCard>
          <NCard bordered={false} class="topology-page__summary-card">
            <div class="topology-page__summary-label">调用关系</div>
            <div class="topology-page__summary-value">{topologyStats.value.edges}</div>
          </NCard>
          <NCard bordered={false} class="topology-page__summary-card topology-page__summary-card--healthy">
            <div class="topology-page__summary-label">健康</div>
            <div class="topology-page__summary-value">{topologyStats.value.healthy}</div>
          </NCard>
          <NCard bordered={false} class="topology-page__summary-card topology-page__summary-card--warning">
            <div class="topology-page__summary-label">告警/退化</div>
            <div class="topology-page__summary-value">{topologyStats.value.warning}</div>
          </NCard>
          <NCard bordered={false} class="topology-page__summary-card topology-page__summary-card--critical">
            <div class="topology-page__summary-label">异常</div>
            <div class="topology-page__summary-value">{topologyStats.value.critical}</div>
          </NCard>
        </div>

        <NCard bordered class="topology-page__canvas-card" contentStyle={{ padding: 0 }}>
          <div class="topology-page__canvas-toolbar">
            <div>
              <div class="topology-page__canvas-title">依赖地图</div>
              <div class="topology-page__canvas-subtitle">
                自动刷新 {autoRefresh.value ? `${refreshIntervalMs.value / 1000}s` : '已关闭'} · 最近更新{' '}
                {lastUpdatedLabel.value}
              </div>
            </div>
            <div class="topology-page__canvas-actions">
              <div class="topology-page__live-control">
                <span>实时刷新</span>
                <NSwitch
                  size="small"
                  value={autoRefresh.value}
                  onUpdateValue={(value: boolean) => {
                    autoRefresh.value = value
                  }}
                />
              </div>
              <NSelect
                value={refreshIntervalMs.value}
                options={refreshOptions}
                class="topology-page__interval-select"
                disabled={!autoRefresh.value}
                onUpdateValue={(value: number) => {
                  refreshIntervalMs.value = value
                }}
              />
              <NInput
                clearable
                value={query.value}
                placeholder="搜索服务 / 环境 / 集群"
                class="topology-page__search"
                onUpdateValue={(value: string) => {
                  query.value = value
                }}
              />
              <NSelect
                value={statusFilter.value}
                options={statusOptions}
                class="topology-page__status-select"
                onUpdateValue={(value: string) => {
                  statusFilter.value = value
                }}
              />
              <NButton
                secondary
                onClick={() => {
                  query.value = ''
                  statusFilter.value = 'all'
                }}>
                重置视图
              </NButton>
              <NButton type="primary" secondary onClick={() => openAddInfrastructureModal('redis')}>
                添加底层服务
              </NButton>
            </div>
          </div>
          {isFallbackTopology.value && (
            <div class="topology-page__telemetry-warning">
              当前真实调用关系不足，页面已用虚线补齐可视化依赖，避免节点孤岛。网关会从实际 API 请求中记录
              <span> gateway → 目标服务 </span>
              依赖，请产生一次接口访问并等待指标刷新后重试；外部服务间调用仍需要上报 target_service / peer_service。
            </div>
          )}
          {topologyLoading.value ? (
            <div class="topology-page__canvas-loading">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="topology-page__canvas-shell">
              {filteredTopologyData.value.nodes.length ? (
                <ServiceTopology
                  data={filteredTopologyData.value}
                  height="100%"
                  selectedNodeId={currentNode.value?.id || ''}
                  showLayerRegions={false}
                  layerDefinitions={layerDefinitions}
                  refreshKey={topologyRefreshKey.value}
                  onNodeClick={openDetail}
                  onNodeDblclick={openServiceDetail}
                />
              ) : (
                <NEmpty description="暂无拓扑数据">
                  <div class="topology-page__empty-tip">请确认服务注册中心是否正常运行，或清空当前筛选条件</div>
                </NEmpty>
              )}
            </div>
          )}
        </NCard>

        <NCard bordered={false} class="topology-page__legend-card">
          <div class="topology-page__legend-grid">
            <div>
              <div class="topology-page__legend-title">节点含义</div>
              <div class="topology-page__legend-list">
                <div>圆点节点：服务 / 实例</div>
                <div>点击节点：打开 Inspector 侧栏</div>
                <div>双击节点：进入服务详情</div>
              </div>
            </div>
            <div>
              <div class="topology-page__legend-title">边含义</div>
              <div class="topology-page__legend-list">
                <div>连线：调用关系</div>
                <div>箭头方向：请求流向</div>
                <div>线旁指标：QPS / 错误率 / P99 / 调用次数</div>
                <div>灰色虚线：暂无真实 telemetry 时的可视化推断关系</div>
              </div>
            </div>
            <div>
              <div class="topology-page__legend-title">颜色含义</div>
              <div class="topology-page__legend-list">
                <div>
                  <span class="topology-page__status-dot topology-page__status-dot--healthy"></span>健康
                </div>
                <div>
                  <span class="topology-page__status-dot topology-page__status-dot--warning"></span>告警/退化
                </div>
                <div>
                  <span class="topology-page__status-dot topology-page__status-dot--critical"></span>异常
                </div>
              </div>
            </div>
          </div>
        </NCard>

        <NModal
          show={showAddInfra.value}
          preset="dialog"
          title="添加底层服务"
          positiveText="保存到画布"
          negativeText="取消"
          onUpdateShow={(value: boolean) => {
            showAddInfra.value = value
          }}
          onPositiveClick={() => {
            addInfrastructureNode()
            return false
          }}>
          <div class="topology-page__infra-modal-intro">
            用于补齐自动链路暂时无法发现的基础设施依赖，例如 InfluxDB、Kafka、MySQL、Redis。
          </div>
          <NForm labelPlacement="top" class="topology-page__infra-form">
            <NFormItem label="服务类型">
              <NSelect
                value={infraForm.value.protocol}
                options={infraTypeOptions}
                onUpdateValue={(value: string) => applyInfraPreset(value)}
              />
            </NFormItem>
            <NFormItem label="节点 ID">
              <NInput
                value={infraForm.value.id}
                placeholder="infra:redis"
                onUpdateValue={(value: string) => {
                  infraForm.value.id = value
                }}
              />
            </NFormItem>
            <NFormItem label="展示名称">
              <NInput
                value={infraForm.value.name}
                placeholder="Redis"
                onUpdateValue={(value: string) => {
                  infraForm.value.name = value
                }}
              />
            </NFormItem>
            <NFormItem label="连接来源">
              <NSelect
                clearable
                filterable
                value={infraForm.value.connectTo}
                options={nodeOptions.value}
                placeholder="选择调用它的上游服务，可留空"
                onUpdateValue={(value: string | null) => {
                  infraForm.value.connectTo = value || ''
                }}
              />
            </NFormItem>
            <NFormItem label="健康状态">
              <NSelect
                value={infraForm.value.status}
                options={statusOptions.filter((option) => option.value !== 'all')}
                onUpdateValue={(value: string) => {
                  infraForm.value.status = value
                }}
              />
            </NFormItem>
          </NForm>
        </NModal>

        <DetailDrawer
          show={showDetail.value}
          title={currentNode.value?.name || '节点详情'}
          width="md"
          onUpdate:show={(value: boolean) => {
            showDetail.value = value
          }}>
          {detailLoading.value ? (
            <div class="topology-page__detail-loading">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="topology-page__detail-panel">
              {currentNode.value && (
                <ServiceIdentityCard
                  compact
                  service={{
                    name: currentNode.value.name,
                    displayName: currentNode.value.name,
                    healthStatus:
                      currentNode.value.status === 'running'
                        ? 'healthy'
                        : currentNode.value.status === 'healthy'
                          ? 'healthy'
                          : currentNode.value.status === 'error'
                            ? 'critical'
                            : currentNode.value.status === 'critical'
                              ? 'critical'
                              : currentNode.value.status === 'warning'
                                ? 'degraded'
                                : currentNode.value.status === 'idle' || currentNode.value.status === 'stopped'
                                  ? 'muted'
                                  : currentNode.value.status === 'unknown'
                                    ? 'unknown'
                                    : 'unknown',
                    runtime: currentNode.value.type || 'service',
                    env: currentNode.value.env,
                    region: currentNode.value.cluster,
                    tags: currentNode.value.protocol ? [currentNode.value.protocol] : []
                  }}
                />
              )}
              <div class="topology-page__detail-stats">
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="CPU" value={displayMetric(detailMetrics.value.cpu, '%', 0)}>
                    {{
                      default: () => (
                        <div class="topology-page__detail-stat-value">
                          {displayMetric(detailMetrics.value.cpu, '%', 0)}
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="内存" value={displayMetric(detailMetrics.value.memory, '%', 0)}>
                    {{
                      default: () => (
                        <div class="topology-page__detail-stat-value">
                          {displayMetric(detailMetrics.value.memory, '%', 0)}
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="QPS" value={displayMetric(detailMetrics.value.qps)}>
                    {{
                      default: () => (
                        <div class="topology-page__detail-stat-value">{displayMetric(detailMetrics.value.qps)}</div>
                      )
                    }}
                  </NStatistic>
                </NCard>
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="响应时间" value={displayMetric(detailMetrics.value.responseTime, 'ms', 0)}>
                    {{
                      default: () => (
                        <div class="topology-page__detail-stat-value">
                          {displayMetric(detailMetrics.value.responseTime, 'ms', 0)}
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="错误率" value={displayMetric(detailMetrics.value.errorRate, '%', 2)}>
                    {{
                      default: () => (
                        <div
                          class={`topology-page__detail-stat-value ${
                            typeof detailMetrics.value.errorRate === 'number'
                              ? detailMetrics.value.errorRate > 0
                                ? 'topology-page__detail-stat-value--danger'
                                : 'topology-page__detail-stat-value--success'
                              : 'topology-page__detail-stat-value--muted'
                          }`}>
                          {displayMetric(detailMetrics.value.errorRate, '%', 2)}
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
                <NCard embedded bordered class="topology-page__detail-stat-card">
                  <NStatistic label="活跃连接" value={displayMetric(detailMetrics.value.activeConnections)}>
                    {{
                      default: () => (
                        <div class="topology-page__detail-stat-value">
                          {displayMetric(detailMetrics.value.activeConnections)}
                        </div>
                      )
                    }}
                  </NStatistic>
                </NCard>
              </div>
              <NCard embedded bordered class="topology-page__detail-meta-card">
                <div class="topology-page__detail-actions">
                  <NTag
                    size="small"
                    type={
                      isCriticalStatus(currentNode.value?.status)
                        ? 'error'
                        : isWarningStatus(currentNode.value?.status)
                          ? 'warning'
                          : 'success'
                    }>
                    {currentNode.value?.status || 'unknown'}
                  </NTag>
                  {currentNode.value && (
                    <NButton
                      size="small"
                      type="primary"
                      secondary
                      onClick={() => openServiceDetail(currentNode.value as TopologyNode)}>
                      打开服务详情
                    </NButton>
                  )}
                </div>
                <div class="topology-page__detail-meta-grid">
                  <div>实例数：{displayMetric(detailMetrics.value.instances)}</div>
                  <div>目录 QPS：{displayMetric(currentNode.value?.qps)}</div>
                  <div>目录延迟：{displayMetric(currentNode.value?.latency, 'ms', 0)}</div>
                  <div>目录错误率：{displayMetric(currentNode.value?.errorRate, '%', 2)}</div>
                  <div>版本：{detailMetrics.value.version || '-'}</div>
                  <div>节点名称：{currentNode.value?.name || '-'}</div>
                  <div>节点状态：{currentNode.value?.status || '-'}</div>
                  <div>所属集群：{currentNode.value?.cluster || '-'}</div>
                  <div>环境：{currentNode.value?.env || '-'}</div>
                  <div>协议：{currentNode.value?.protocol || '-'}</div>
                  <div>层级：{currentNode.value?.layerName || '-'}</div>
                </div>
              </NCard>
            </div>
          )}
        </DetailDrawer>
      </div>
    )
  }
})
