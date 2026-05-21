import { NCard, NSpin, NEmpty, NStatistic, NGrid, NGridItem, useMessage, NButton, NIcon } from 'naive-ui'
import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTopology, fetchServiceDetailSummary, type MetricsDatasetScope } from '@/api'

import type { TopologyData, TopologyNode } from '@/types/monitor'
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
    const timeStore = useTimeStore()
    const message = useMessage()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const topologyLoading = ref(true)
    const topologyData = ref<TopologyData | null>(null)

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
      return { nodes, edges }
    }

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

      topologyData.value = {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      }
    }

    const loadTopology = async () => {
      topologyLoading.value = true
      try {
        topologyData.value = normalizeTopology(
          await fetchTopology({ timeRange: `-${timeStore.timeRange}`, scope: datasetScope.value })
        )
      } catch (e) {
        message.error('获取拓扑数据失败')
      } finally {
        topologyLoading.value = false
      }
    }

    onMounted(async () => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      await loadTopology()
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

    useMitt.on(WsResponseMessageType.TOPOLOGY_SNAPSHOT, (payload) => {
      topologyData.value = normalizeTopology(payload)
    })

    useMitt.on(WsResponseMessageType.TOPOLOGY_DELTA, (payload) => {
      applyDelta(payload)
    })

    onMounted(() => {
      webSocket.send({ type: 'subscribe', data: { channel: 'topology' } })
    })

    onUnmounted(() => {
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
          cpu: summary.cpu ?? null,
          memory: summary.memory ?? null,
          qps: summary.qps ?? null,
          responseTime: summary.responseTime ?? null,
          errorRate: summary.errorRate ?? null,
          activeConnections: summary.activeConnections ?? null,
          version: summary.version ?? identity?.runtime ?? '',
          instances: summary.instances ?? null
        }
      } catch (e) {
        detailMetrics.value = {
          cpu: null,
          memory: null,
          qps: null,
          responseTime: null,
          errorRate: null,
          activeConnections: null,
          version: '',
          instances: null
        }
      } finally {
        detailLoading.value = false
      }
    }

    const displayMetric = (value: number | null | undefined, suffix = '', digits?: number) => {
      if (typeof value !== 'number') return '未知'
      return typeof digits === 'number' ? `${value.toFixed(digits)}${suffix}` : `${value}${suffix}`
    }

    return () => (
      <div class="topology-page">
        <PageHeader title="服务拓扑" subtitle="全局依赖关系与链路概览">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={loadTopology}>
                {{ icon: () => <NIcon component={RefreshOutline} /> }}
                刷新拓扑
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

        <NCard bordered class="topology-page__canvas-card" contentStyle={{ padding: 0 }}>
          {topologyLoading.value ? (
            <div class="topology-page__canvas-loading">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="topology-page__canvas-shell">
              {topologyData.value && topologyData.value.nodes.length ? (
                <ServiceTopology data={topologyData.value} height="100%" onNodeClick={openDetail} />
              ) : (
                <NEmpty description="暂无拓扑数据">
                  <div class="topology-page__empty-tip">请确认服务注册中心是否正常运行</div>
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
                <div>点击节点：打开详情侧栏</div>
                <div>双击节点：进入 service detail</div>
              </div>
            </div>
            <div>
              <div class="topology-page__legend-title">边含义</div>
              <div class="topology-page__legend-list">
                <div>连线：调用关系</div>
                <div>箭头方向：请求流向</div>
                <div>线旁指标：QPS / 错误率 / P99 / 调用次数</div>
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
                <div class="topology-page__detail-meta-grid">
                  <div>实例数：{displayMetric(detailMetrics.value.instances)}</div>
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
