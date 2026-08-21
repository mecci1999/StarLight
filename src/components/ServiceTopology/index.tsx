import { defineComponent, computed, onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import BaseChart from '@/components/charts/BaseChart'
import { useChartTheme } from '@/hooks/useChartTheme'
import type { TopologyData, TopologyEdge, TopologyNode } from '@/types/monitor'

type TopologyLayerDefinition = {
  key: string
  title: string
  subtitle?: string
}

// A 16% corner radius keeps the operational cards calm without turning them
// into pills. ECharts' built-in roundRect radius varies too much by size.
const NODE_CARD_SYMBOL =
  'path://M16,0H84C92.84,0,100,7.16,100,16V84C100,92.84,92.84,100,84,100H16C7.16,100,0,92.84,0,84V16C0,7.16,7.16,0,16,0Z'

export default defineComponent({
  name: 'ServiceTopology',
  props: {
    data: {
      type: Object as PropType<TopologyData>,
      default: () => ({ nodes: [], edges: [] })
    },
    height: {
      type: String,
      default: '600px'
    },
    loading: {
      type: Boolean,
      default: false
    },
    onNodeClick: {
      type: Function as PropType<(node: TopologyNode) => void>,
      default: undefined
    },
    onNodeDblclick: {
      type: Function as PropType<(node: TopologyNode) => void>,
      default: undefined
    },
    onEdgeClick: {
      type: Function as PropType<(edge: TopologyEdge) => void>,
      default: undefined
    },
    selectedNodeId: {
      type: String,
      default: ''
    },
    selectedEdgeKey: {
      type: String,
      default: ''
    },
    showLayerRegions: {
      type: Boolean,
      default: true
    },
    layerDefinitions: {
      type: Array as PropType<TopologyLayerDefinition[]>,
      default: () => []
    },
    refreshKey: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const interactionSettled = ref(false)
    const canvasElement = ref<HTMLElement | null>(null)
    const canvasSize = ref({ width: 0, height: 0 })
    const { themeOptions, isDark } = useChartTheme()
    let resizeObserver: ResizeObserver | undefined

    const measureCanvas = () => {
      const rect = canvasElement.value?.getBoundingClientRect()
      if (!rect) return
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      if (!width || !height) return
      if (canvasSize.value.width !== width || canvasSize.value.height !== height) {
        canvasSize.value = { width, height }
      }
    }

    onMounted(() => {
      measureCanvas()
      if (typeof ResizeObserver === 'undefined' || !canvasElement.value) return
      resizeObserver = new ResizeObserver(measureCanvas)
      resizeObserver.observe(canvasElement.value)
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
    })

    watch(
      () => props.refreshKey,
      () => {
        interactionSettled.value = false
      }
    )

    const getNodeColor = (status?: string) => {
      if (status === 'running' || status === 'healthy') return '#5f8c70'
      if (status === 'error' || status === 'critical') return '#b86560'
      if (status === 'warning') return '#aa874f'
      if (status === 'stopped' || status === 'idle') return '#7b8796'
      return '#9aa5b1'
    }

    const getNodeSymbol = () => NODE_CARD_SYMBOL

    const resolveLayerKey = (node: TopologyNode) => {
      const text =
        `${node.layerName || ''} ${node.type || ''} ${node.protocol || ''} ${node.id || ''} ${node.name || ''}`.toLowerCase()
      if (text.includes('gateway') || text.includes('edge')) return 'gateway'
      if (
        text.includes('infra') ||
        text.includes('database') ||
        text.includes('middleware') ||
        text.includes('storage') ||
        ['redis', 'mysql', 'kafka', 'influxdb', 'elasticsearch'].some((keyword) => text.includes(keyword))
      ) {
        return 'infrastructure'
      }
      return 'service'
    }

    const getLayerColor = (layerKey: string, dark: boolean) => {
      if (layerKey === 'gateway') return dark ? 'rgba(148, 163, 184, 0.052)' : 'rgba(71, 85, 105, 0.026)'
      if (layerKey === 'service') return dark ? 'rgba(148, 163, 184, 0.035)' : 'rgba(71, 85, 105, 0.018)'
      if (layerKey === 'infrastructure') return dark ? 'rgba(148, 163, 184, 0.048)' : 'rgba(71, 85, 105, 0.024)'
      return dark ? 'rgba(148, 163, 184, 0.04)' : 'rgba(71, 85, 105, 0.02)'
    }

    const getEdgeColor = (edge: any) => {
      const errorRate = Number(edge.errorRate || 0)
      const normalizedErrorRate = errorRate >= 0 && errorRate <= 1 ? errorRate * 100 : errorRate
      if (edge.status === 'critical' || normalizedErrorRate >= 1) return '#b86560'
      if (edge.status === 'warning' || Number(edge.p99 || 0) >= 1500) return '#aa874f'
      if (edge.inferred) return '#a2acb9'
      if (edge.source === 'manual-topology') return '#8290a0'
      return '#748295'
    }

    const formatCompactMetric = (value?: number | null, suffix = '', digits = 0) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      return `${value.toFixed(digits)}${suffix}`
    }

    const formatPercent = (value?: number | null) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      const normalized = value >= 0 && value <= 1 ? value * 100 : value
      return `${normalized.toFixed(2)}%`
    }

    const getEdgeLabel = (edge: any) => {
      const metrics = []
      if (typeof edge.qps === 'number' && edge.qps > 0) metrics.push(`${formatCompactMetric(edge.qps, ' QPS', 1)}`)
      if (typeof edge.errorRate === 'number' && edge.errorRate > 0)
        metrics.push(`错误 ${formatPercent(edge.errorRate)}`)
      if (typeof edge.p99 === 'number' && edge.p99 > 0) metrics.push(`P99 ${formatCompactMetric(edge.p99, 'ms')}`)
      if (metrics.length > 0) return metrics.slice(0, 2).join(' · ')
      if (edge.inferred) return '推断'
      return edge.protocol || '已观测'
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const option = computed(() => {
      const dark = isDark.value
      const chartTextStyle = themeOptions.value?.textStyle as { color?: string } | undefined
      const textColor = String(chartTextStyle?.color || (dark ? '#f8fafc' : '#172033'))
      const mutedTextColor = String(themeOptions.value?.legend?.textStyle?.color || (dark ? '#94a3b8' : '#64748b'))
      const surfaceColor = dark ? '#1c222b' : '#ffffff'
      const selectedSurfaceColor = dark ? '#242a34' : '#f8fafc'
      const borderColor = dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.18)'
      const layerBorderColor = dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.12)'
      const selectedBorderColor = dark ? 'rgba(203, 213, 225, 0.42)' : 'rgba(71, 85, 105, 0.36)'
      const layerDefinitions = props.layerDefinitions.length
        ? props.layerDefinitions
        : [
            { key: 'gateway', title: '接入层' },
            { key: 'service', title: '服务应用层' },
            { key: 'infrastructure', title: '基础设施层' }
          ]
      const nodesByLayer = new Map<string, TopologyNode[]>()
      props.data.nodes.forEach((node) => {
        const layerKey = resolveLayerKey(node)
        const list = nodesByLayer.get(layerKey) || []
        list.push(node)
        nodesByLayer.set(layerKey, list)
      })

      // Layer regions are the coordinate system for this view. Keep every node
      // inside the available canvas instead of relying on graph zoom to recover
      // off-screen cards, which makes nodes feel detached from their layer.
      const chartWidth = Math.max(canvasSize.value.width || 980, 680)
      const chartHeight = Math.max(canvasSize.value.height || 690, 600)
      const outerInset = 12
      const laneGap = Math.max(12, Math.min(20, Math.round(chartWidth * 0.016)))
      const gatewayWidth = Math.max(132, Math.min(178, Math.round(chartWidth * 0.16)))
      const infrastructureWidth = Math.max(142, Math.min(188, Math.round(chartWidth * 0.18)))
      const serviceWidth = Math.max(260, chartWidth - outerInset * 2 - gatewayWidth - infrastructureWidth - laneGap * 2)
      const layerBounds: Record<string, { left: number; width: number }> = {
        gateway: { left: outerInset, width: gatewayWidth },
        service: { left: outerInset + gatewayWidth + laneGap, width: serviceWidth },
        infrastructure: { left: chartWidth - outerInset - infrastructureWidth, width: infrastructureWidth }
      }
      const serviceNodeCount = (nodesByLayer.get('service') || []).length
      const verticalSpace = chartHeight - 138
      const serviceColumns =
        [4, 3, 2, 1].find((columnCount) => {
          const cardWidth = (serviceWidth - 32) / columnCount - 12
          const rowCount = Math.max(1, Math.ceil(serviceNodeCount / columnCount))
          const rowGap = rowCount === 1 ? verticalSpace : verticalSpace / (rowCount - 1)
          const cardHeight = cardWidth < 138 ? 56 : 62
          return cardWidth >= 118 && rowGap >= cardHeight + 10
        }) || 1
      const layerGraphics = props.showLayerRegions
        ? layerDefinitions.map((layer) => {
            const bounds = layerBounds[layer.key] || layerBounds.service
            return {
              type: 'group',
              silent: true,
              left: bounds.left,
              top: 12,
              children: [
                {
                  type: 'rect',
                  shape: { x: 0, y: 0, width: bounds.width, height: chartHeight - 24, r: 14 },
                  style: {
                    fill: getLayerColor(layer.key, dark),
                    stroke: layerBorderColor,
                    lineWidth: 1
                  }
                },
                {
                  type: 'text',
                  style: {
                    x: 16,
                    y: 16,
                    text: `${layer.title}${layer.subtitle ? ` · ${layer.subtitle}` : ''}`,
                    fill: mutedTextColor,
                    font: '600 13px sans-serif'
                  }
                }
              ]
            }
          })
        : []

      const nodes = props.data.nodes.map((node) => {
        const layerKey = resolveLayerKey(node)
        const layerNodes = nodesByLayer.get(layerKey) || []
        const positionInLayer = Math.max(
          layerNodes.findIndex((item) => item.id === node.id),
          0
        )
        const bounds = layerBounds[layerKey] || layerBounds.service
        const columnCount = layerKey === 'service' ? serviceColumns : 1
        const row = Math.floor(positionInLayer / columnCount)
        const column = positionInLayer % columnCount
        const rowCount = Math.max(1, Math.ceil(layerNodes.length / columnCount))
        const selected = props.selectedNodeId === node.id
        const columnXStep = (bounds.width - 32) / columnCount
        const baseNodeWidth = Math.max(108, Math.min(166, columnXStep - 12))
        const baseNodeHeight = baseNodeWidth < 138 ? 56 : 62
        const nodeWidth = selected ? baseNodeWidth + 10 : baseNodeWidth
        const nodeHeight = selected ? baseNodeHeight + 8 : baseNodeHeight
        const x = bounds.left + 16 + columnXStep * column + columnXStep / 2
        const topY = 66 + nodeHeight / 2
        const bottomY = chartHeight - 38 - nodeHeight / 2
        const y = rowCount === 1 ? (topY + bottomY) / 2 : topY + ((bottomY - topY) / (rowCount - 1)) * row
        const adjacentToSelection =
          !props.selectedNodeId ||
          selected ||
          props.data.edges.some(
            (edge: any) =>
              (String(edge.from ?? edge.source) === props.selectedNodeId &&
                String(edge.to ?? edge.target) === node.id) ||
              (String(edge.to ?? edge.target) === props.selectedNodeId && String(edge.from ?? edge.source) === node.id)
          )
        const summary =
          [
            typeof node.qps === 'number' ? `${formatCompactMetric(node.qps, ' QPS', 1)}` : null,
            typeof node.latency === 'number' ? `P95 ${formatCompactMetric(node.latency, 'ms')}` : null
          ]
            .filter(Boolean)
            .slice(0, 2)
            .join(' · ') || '等待指标'
        const instanceCount = typeof node.instances === 'number' ? node.instances : null
        const instanceBadgeWidth = instanceCount === null ? 0 : Math.max(25, String(instanceCount).length * 6 + 15)
        const labelWidth = nodeWidth - 16
        const nameWidth = Math.max(64, labelWidth - instanceBadgeWidth - (instanceCount === null ? 0 : 4))
        const hasRiskStatus = node.status === 'critical' || node.status === 'error' || node.status === 'warning'

        return {
          id: node.id,
          name: node.name,
          symbol: getNodeSymbol(),
          symbolSize: [nodeWidth, nodeHeight],
          x,
          y,
          fixed: Boolean(node.editable),
          value: node.status,
          itemStyle: {
            color: selected ? selectedSurfaceColor : surfaceColor,
            borderColor: selected
              ? selectedBorderColor
              : hasRiskStatus
                ? `${getNodeColor(node.status)}a8`
                : borderColor,
            borderWidth: selected ? 1.4 : hasRiskStatus ? 1.2 : 0.8,
            shadowBlur: selected ? 8 : hasRiskStatus ? 3 : 0,
            shadowColor: selected ? (dark ? 'rgba(203, 213, 225, 0.08)' : 'rgba(71, 85, 105, 0.06)') : 'transparent',
            opacity: adjacentToSelection ? 1 : 0.2
          },
          label: {
            show: true,
            position: 'inside',
            formatter: () =>
              instanceCount === null
                ? `{name|${String(node.name).slice(0, 28)}}\n{meta|${summary}}`
                : `{name|${String(node.name).slice(0, 28)}}{instance|×${instanceCount}}\n{meta|${summary}}`,
            width: labelWidth,
            overflow: 'truncate',
            rich: {
              name: {
                color: textColor,
                fontSize: 12,
                fontWeight: selected ? 700 : 600,
                lineHeight: 20,
                width: nameWidth,
                align: instanceCount === null ? 'center' : 'left',
                overflow: 'truncate'
              },
              instance: {
                color: selected ? (dark ? '#d7dee8' : '#4b596a') : dark ? '#aeb9c6' : '#748295',
                fontSize: 9,
                fontWeight: 600,
                lineHeight: 20,
                width: instanceBadgeWidth,
                align: 'right'
              },
              meta: {
                color: mutedTextColor,
                fontSize: 10,
                lineHeight: 16,
                width: labelWidth,
                align: 'center',
                overflow: 'truncate'
              }
            },
            opacity: adjacentToSelection ? 1 : 0.16
          },
          useDirtyRect: true,
          tooltip: {
            show: true
          }
        }
      })

      const nodeIds = new Set(nodes.map((node) => String(node.id)))
      const links = props.data.edges
        .filter(
          (edge: any) => nodeIds.has(String(edge.from ?? edge.source)) && nodeIds.has(String(edge.to ?? edge.target))
        )
        .map((edge: any) => {
          const source = String(edge.from ?? edge.source)
          const target = String(edge.to ?? edge.target)
          const edgeKey = `${source}=>${target}`
          const connectedToSelection =
            !props.selectedNodeId || source === props.selectedNodeId || target === props.selectedNodeId
          const selected = props.selectedEdgeKey === edgeKey
          const errorRate = Number(edge.errorRate || 0)
          const normalizedErrorRate = errorRate >= 0 && errorRate <= 1 ? errorRate * 100 : errorRate
          const atRisk =
            edge.status === 'critical' ||
            edge.status === 'warning' ||
            normalizedErrorRate >= 1 ||
            Number(edge.p99 || 0) >= 1500
          return {
            source,
            target,
            label: {
              show: selected || (connectedToSelection && (typeof edge.qps === 'number' || atRisk)),
              formatter: () => getEdgeLabel(edge),
              color: mutedTextColor,
              fontSize: 10,
              backgroundColor: dark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: [2, 5]
            },
            lineStyle: {
              color: getEdgeColor(edge),
              curveness: edge.inferred ? 0.08 : 0.16,
              type: edge.inferred ? 'dashed' : 'solid',
              width: selected ? 4 : atRisk ? 3 : edge.inferred ? 1.4 : 2,
              opacity: connectedToSelection ? (edge.inferred ? 0.46 : 0.8) : 0.1
            }
          }
        })

      return {
        graphic: layerGraphics,
        tooltip: {
          trigger: 'item',
          confine: true,
          borderWidth: 0,
          backgroundColor: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          textStyle: {
            color: textColor
          },
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const node = props.data.nodes.find((n) => n.id === params.data.id)
              return `
                <div style="padding: 6px 8px; min-width: 180px;">
                  <div style="font-weight: 700; margin-bottom: 8px;">${escapeHtml(params.name)}</div>
                <div>状态：<span style="color: ${getNodeColor(node?.status)}">${escapeHtml(node?.status || 'unknown')}</span></div>
                <div>运行类型：${escapeHtml(node?.type || 'service')}</div>
                <div>环境 / 集群：${escapeHtml(node?.env)} / ${escapeHtml(node?.cluster)}</div>
                  <div>实例：${typeof node?.instances === 'number' ? node.instances : '—'} · QPS：${formatCompactMetric(node?.qps, '', 1)}</div>
                  <div>P95：${formatCompactMetric(node?.latency, 'ms')} · 错误率：${formatPercent(node?.errorRate)}</div>
                  <div style="margin-top: 8px; opacity: .76;">单击聚焦链路，双击进入服务详情</div>
                </div>
              `
            }
            const edge = props.data.edges.find(
              (item) =>
                String(item.from) === String(params.data.source) && String(item.to) === String(params.data.target)
            )
            return `
              <div style="padding: 6px 8px; min-width: 180px;">
                <div style="font-weight: 700; margin-bottom: 8px;">${escapeHtml(params.data.source)} → ${escapeHtml(params.data.target)}</div>
                <div>协议：${escapeHtml(edge?.protocol || '—')} · 来源：${edge?.inferred ? '推断' : '实测'}</div>
                <div>QPS：${formatCompactMetric(edge?.qps, '', 1)} · 错误率：${formatPercent(edge?.errorRate)}</div>
                <div>P50：${formatCompactMetric(edge?.p50, 'ms')} · P99：${formatCompactMetric(edge?.p99, 'ms')}</div>
                <div style="margin-top: 8px; opacity: .76;">单击在右侧查看此调用关系</div>
              </div>
            `
          }
        },
        series: [
          {
            type: 'graph',
            layout: props.showLayerRegions || interactionSettled.value ? 'none' : 'force',
            animation: false,
            coordinateSystem: undefined,
            data: nodes,
            links: links,
            roam: false,
            draggable: false,
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [0, 12],
            label: {
              position: 'bottom',
              formatter: '{b}'
            },
            lineStyle: {
              color: '#2563eb',
              curveness: 0.16,
              opacity: 0.86
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 4
              }
            },
            force:
              props.showLayerRegions || interactionSettled.value
                ? undefined
                : {
                    repulsion: 1200,
                    gravity: 0.08,
                    friction: 0.65,
                    edgeLength: [130, 220],
                    layoutAnimation: false
                  }
          }
        ]
      }
    })

    const handleChartClick = (params: any) => {
      interactionSettled.value = true
      if (params?.dataType === 'node') {
        const node = props.data.nodes.find((n) => n.id === params.data?.id)
        if (node) props.onNodeClick?.(node)
        return
      }
      if (params?.dataType === 'edge') {
        const source = String(params.data?.source || '')
        const target = String(params.data?.target || '')
        const edge = props.data.edges.find(
          (item) => String(item.from ?? item.source) === source && String(item.to) === target
        )
        if (edge) props.onEdgeClick?.(edge)
      }
    }

    const handleChartDblclick = (params: any) => {
      if (params?.dataType !== 'node') return
      interactionSettled.value = true
      const node = props.data.nodes.find((n) => n.id === params.data?.id)
      if (node) props.onNodeDblclick?.(node)
    }

    return () => (
      <div ref={canvasElement} style={{ width: '100%', height: props.height }}>
        <BaseChart
          option={option.value}
          height="100%"
          loading={props.loading}
          onChartClick={handleChartClick}
          onChartDblclick={handleChartDblclick}
        />
      </div>
    )
  }
})
