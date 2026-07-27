import { defineComponent, ref, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  MobileCard,
  MobileButton,
  MobileEmpty,
  MobileLoading,
  MobileInput,
  MobileTag,
  MobileSelect,
  MobileStatistic
} from '@/mobile/ui'
import { fetchTopology } from '@/api'
import ServiceHealthBadge from '@/shared/components/ServiceHealthBadge'
import { PhArrowsClockwise } from '@phosphor-icons/vue'
import type { TopologyData, TopologyNode, TopologyEdge } from '@/types/monitor'
import './MobileTopology.scss'

export default defineComponent({
  name: 'MobileTopology',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref(false)
    const topologyData = ref<TopologyData>({ nodes: [], edges: [] })
    const selectedServiceId = ref('')
    const searchKeyword = ref('')

    const loadTopology = async () => {
      loading.value = true
      error.value = false
      try {
        const data = await fetchTopology()
        topologyData.value = {
          nodes: (data?.nodes || []).map((node: TopologyNode) => ({
            ...node,
            id: String(node?.id || node?.name || ''),
            name: String(node?.name || node?.id || '')
          })),
          edges: data?.edges || []
        }
      } catch {
        error.value = true
      } finally {
        loading.value = false
      }
    }

    onActivated(loadTopology)

    const serviceOptions = computed(() =>
      topologyData.value.nodes
        .filter((node) => node.id && node.name)
        .map((node) => ({
          label: node.name,
          value: node.id
        }))
    )

    const selectedNode = computed(
      () => topologyData.value.nodes.find((node) => node.id === selectedServiceId.value) ?? null
    )

    const upstreamDependencies = computed(() => {
      if (!selectedServiceId.value) return []
      const edges = topologyData.value.edges.filter(
        (edge) => String(edge.to) === selectedServiceId.value && String(edge.from) !== selectedServiceId.value
      )
      const nodeMap = new Map(topologyData.value.nodes.map((node) => [node.id, node]))
      return edges.map((edge) => {
        const fromNode = nodeMap.get(String(edge.from))
        return {
          edge,
          node:
            fromNode ??
            ({
              id: String(edge.from),
              name: String(edge.from),
              status: 'unknown' as const
            } as TopologyNode)
        }
      })
    })

    const downstreamDependencies = computed(() => {
      if (!selectedServiceId.value) return []
      const edges = topologyData.value.edges.filter(
        (edge) => String(edge.from) === selectedServiceId.value && String(edge.to) !== selectedServiceId.value
      )
      const nodeMap = new Map(topologyData.value.nodes.map((node) => [node.id, node]))
      return edges.map((edge) => {
        const toNode = nodeMap.get(String(edge.to))
        return {
          edge,
          node:
            toNode ??
            ({
              id: String(edge.to),
              name: String(edge.to),
              status: 'unknown' as const
            } as TopologyNode)
        }
      })
    })

    const filteredUpstream = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return upstreamDependencies.value
      return upstreamDependencies.value.filter((dep) => {
        const text = `${dep.node.name} ${dep.node.id} ${dep.edge.protocol || ''}`.toLowerCase()
        return text.includes(keyword)
      })
    })

    const filteredDownstream = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return downstreamDependencies.value
      return downstreamDependencies.value.filter((dep) => {
        const text = `${dep.node.name} ${dep.node.id} ${dep.edge.protocol || ''}`.toLowerCase()
        return text.includes(keyword)
      })
    })

    const summaryStats = computed(() => {
      const upstream = upstreamDependencies.value
      const downstream = downstreamDependencies.value
      return {
        totalUpstream: upstream.length,
        totalDownstream: downstream.length,
        healthyUpstream: upstream.filter((d) => d.node.status === 'healthy' || d.node.status === 'running').length,
        healthyDownstream: downstream.filter((d) => d.node.status === 'healthy' || d.node.status === 'running').length
      }
    })

    const navigateToServiceDetail = (serviceId: string) => {
      if (!serviceId || serviceId === selectedServiceId.value) return
      router.push(`/mobile/service-detail-v2/${serviceId}`)
    }

    const displayMetric = (value: number | null | undefined, suffix = '') => {
      if (typeof value !== 'number') return '--'
      return `${value}${suffix}`
    }

    const getHealthStatus = (node: TopologyNode) => {
      const status = String(node.status ?? '')
      if (status === 'healthy' || status === 'running') return 'healthy'
      if (status === 'warning' || status === 'idle' || status === 'degraded') return 'degraded'
      if (status === 'critical' || status === 'error' || status === 'stopped') return 'critical'
      return 'unknown'
    }

    const getHealthTagType = (node: TopologyNode): 'success' | 'warning' | 'danger' | 'default' => {
      const health = getHealthStatus(node)
      switch (health) {
        case 'healthy':
          return 'success'
        case 'degraded':
          return 'warning'
        case 'critical':
          return 'danger'
        default:
          return 'default'
      }
    }

    const getHealthLabel = (node: TopologyNode) => {
      const health = getHealthStatus(node)
      switch (health) {
        case 'healthy':
          return '健康'
        case 'degraded':
          return '降级'
        case 'critical':
          return '异常'
        default:
          return '未知'
      }
    }

    const renderDependencyCard = (
      dep: { edge: TopologyEdge; node: TopologyNode },
      direction: 'upstream' | 'downstream'
    ) => {
      const { edge, node } = dep
      const isInfra = node.type === 'middleware' || node.type === 'database' || node.layerName === 'infrastructure'
      const protocol = edge.protocol || node.protocol
      const errorRate =
        typeof edge.errorRate === 'number'
          ? edge.errorRate > 1
            ? edge.errorRate
            : edge.errorRate * 100
          : typeof node.errorRate === 'number'
            ? node.errorRate > 1
              ? node.errorRate
              : node.errorRate * 100
            : null

      return (
        <div
          key={`${direction}-${node.id}-${edge.from}-${edge.to}`}
          class="mobile-topology__card-wrapper"
          onClick={() => navigateToServiceDetail(node.id)}>
          <MobileCard size="small" bordered={false} class="mobile-topology__card">
            <div class="mobile-topology__card-content">
              <div class="mobile-topology__card-main">
                <div class="mobile-topology__card-title-row">
                  <span class="mobile-topology__card-name">{node.name}</span>
                  <MobileTag size="small" plain type={getHealthTagType(node)}>
                    {getHealthLabel(node)}
                  </MobileTag>
                </div>
                <div class="mobile-topology__card-id">{node.id}</div>
                <div class="mobile-topology__card-meta">
                  {protocol && (
                    <span class="mobile-topology__card-tag mobile-topology__card-tag--protocol">{protocol}</span>
                  )}
                  {isInfra && <span class="mobile-topology__card-tag mobile-topology__card-tag--infra">基础设施</span>}
                  {edge.inferred && (
                    <span class="mobile-topology__card-tag mobile-topology__card-tag--inferred">推断</span>
                  )}
                </div>
                <div class="mobile-topology__card-metrics">
                  <div class="mobile-topology__card-metric">
                    <span class="mobile-topology__card-metric-label">QPS</span>
                    <span class="mobile-topology__card-metric-value">{displayMetric(edge.qps ?? node.qps)}</span>
                  </div>
                  <div class="mobile-topology__card-metric">
                    <span class="mobile-topology__card-metric-label">错误率</span>
                    <span
                      class={[
                        'mobile-topology__card-metric-value',
                        typeof errorRate === 'number' && errorRate > 0
                          ? 'mobile-topology__card-metric-value--danger'
                          : ''
                      ]}>
                      {displayMetric(errorRate, '%')}
                    </span>
                  </div>
                  <div class="mobile-topology__card-metric">
                    <span class="mobile-topology__card-metric-label">P99</span>
                    <span class="mobile-topology__card-metric-value">
                      {displayMetric(edge.p99 ?? node.latency, 'ms')}
                    </span>
                  </div>
                </div>
              </div>
              <div class="mobile-topology__card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </MobileCard>
        </div>
      )
    }

    return () => (
      <div class="mobile-topology">
        <div class="mobile-topology__header">
          <div>
            <h2 class="mobile-topology__title">服务拓扑</h2>
            <div class="mobile-topology__subtitle">依赖关系与链路概览</div>
          </div>
          <MobileButton
            size="small"
            type="ghost"
            class="mobile-topology__refresh-action"
            onClick={loadTopology}
            icon={() => <PhArrowsClockwise size={16} />}>
            刷新
          </MobileButton>
        </div>

        {loading.value ? (
          <div class="mobile-topology__loading">
            <MobileLoading loading={loading.value} size="48px" />
          </div>
        ) : error.value ? (
          <div class="mobile-topology__error">
            <div class="mobile-topology__error-text">数据加载失败，请检查网络连接后重试</div>
            <MobileButton size="small" type="primary" onClick={loadTopology}>
              重试
            </MobileButton>
          </div>
        ) : topologyData.value.nodes.length === 0 ? (
          <MobileEmpty description="暂无拓扑数据" class="mobile-topology__empty-state">
            <div class="mobile-topology__empty-tip">请确认服务注册中心是否正常运行</div>
          </MobileEmpty>
        ) : (
          <>
            <div class="mobile-topology__selector">
              <MobileSelect
                modelValue={selectedServiceId.value}
                onUpdate:modelValue={(v) => {
                  selectedServiceId.value = v
                }}
                options={serviceOptions.value}
                placeholder="选择服务查看拓扑依赖"
                clearable
              />
            </div>

            {selectedServiceId.value && (
              <>
                <div class="mobile-topology__summary">
                  <div class="mobile-topology__summary-item mobile-topology__summary-item--total">
                    <MobileStatistic label="上游" value={summaryStats.value.totalUpstream} />
                  </div>
                  <div class="mobile-topology__summary-item mobile-topology__summary-item--total">
                    <MobileStatistic label="下游" value={summaryStats.value.totalDownstream} />
                  </div>
                  <div class="mobile-topology__summary-item mobile-topology__summary-item--healthy">
                    <MobileStatistic
                      label="健康"
                      value={summaryStats.value.healthyUpstream + summaryStats.value.healthyDownstream}
                    />
                  </div>
                </div>

                <div class="mobile-topology__search">
                  <MobileInput
                    modelValue={searchKeyword.value}
                    onUpdate:modelValue={(v) => {
                      searchKeyword.value = v
                    }}
                    placeholder="搜索依赖服务名称或协议..."
                    clearable
                  />
                </div>

                {selectedNode.value && (
                  <div class="mobile-topology__current-service">
                    <MobileCard size="small" bordered={false} class="mobile-topology__current-card">
                      <div class="mobile-topology__current-content">
                        <div class="mobile-topology__current-info">
                          <div class="mobile-topology__current-name">{selectedNode.value.name}</div>
                          <div class="mobile-topology__current-id">{selectedNode.value.id}</div>
                        </div>
                        <div class="mobile-topology__current-badge">
                          <ServiceHealthBadge
                            status={
                              getHealthStatus(selectedNode.value) as 'healthy' | 'degraded' | 'critical' | 'unknown'
                            }
                            size="sm"
                          />
                        </div>
                      </div>
                    </MobileCard>
                  </div>
                )}

                <div class="mobile-topology__section">
                  <div class="mobile-topology__section-header">
                    <div class="mobile-topology__section-title">
                      <span class="mobile-topology__section-indicator mobile-topology__section-indicator--upstream" />
                      上游服务 (Upstream)
                    </div>
                    <span class="mobile-topology__section-count">{filteredUpstream.value.length} 项</span>
                  </div>
                  {filteredUpstream.value.length > 0 ? (
                    <div class="mobile-topology__list">
                      {filteredUpstream.value.map((dep) => renderDependencyCard(dep, 'upstream'))}
                    </div>
                  ) : (
                    <div class="mobile-topology__section-empty">
                      {searchKeyword.value.trim() ? '未找到匹配的上游依赖' : '暂无上游依赖 — 没有服务调用当前服务'}
                    </div>
                  )}
                </div>

                <div class="mobile-topology__section">
                  <div class="mobile-topology__section-header">
                    <div class="mobile-topology__section-title">
                      <span class="mobile-topology__section-indicator mobile-topology__section-indicator--downstream" />
                      下游服务 (Downstream)
                    </div>
                    <span class="mobile-topology__section-count">{filteredDownstream.value.length} 项</span>
                  </div>
                  {filteredDownstream.value.length > 0 ? (
                    <div class="mobile-topology__list">
                      {filteredDownstream.value.map((dep) => renderDependencyCard(dep, 'downstream'))}
                    </div>
                  ) : (
                    <div class="mobile-topology__section-empty">
                      {searchKeyword.value.trim() ? '未找到匹配的下游依赖' : '暂无下游依赖 — 当前服务不调用其他服务'}
                    </div>
                  )}
                </div>
              </>
            )}

            {!selectedServiceId.value && (
              <div class="mobile-topology__prompt">请在上方选择一个服务，查看其上游和下游依赖关系</div>
            )}
          </>
        )}
      </div>
    )
  }
})
