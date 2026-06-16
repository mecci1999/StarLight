import { defineComponent, computed, PropType, ref, watch } from 'vue'
import BaseChart from '@/components/charts/BaseChart'
import type { TopologyData, TopologyNode } from '@/types/monitor'

type TopologyLayerDefinition = {
  key: string
  title: string
  subtitle?: string
}

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
    selectedNodeId: {
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

    watch(
      () => props.refreshKey,
      () => {
        interactionSettled.value = false
      }
    )

    const getNodeColor = (status?: string) => {
      if (status === 'running' || status === 'healthy') return '#00b42a'
      if (status === 'error' || status === 'critical') return '#f53f3f'
      if (status === 'warning') return '#ff7d00'
      if (status === 'stopped' || status === 'idle') return '#86909c'
      return '#86909c'
    }

    const getNodeSymbol = (type?: string) => {
      if (type === 'database') return 'rect'
      if (type === 'middleware') return 'diamond'
      if (type === 'gateway') return 'roundRect'
      if (type === 'infrastructure') return 'diamond'
      return 'circle'
    }

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

    const getLayerColor = (layerKey: string) => {
      if (layerKey === 'gateway') return 'rgba(22, 93, 255, 0.08)'
      if (layerKey === 'service') return 'rgba(0, 180, 42, 0.07)'
      if (layerKey === 'infrastructure') return 'rgba(255, 125, 0, 0.08)'
      return 'rgba(134, 144, 156, 0.08)'
    }

    const getEdgeColor = (edge: any) => {
      if (edge.status === 'critical' || Number(edge.errorRate || 0) > 0) return '#f53f3f'
      if (edge.inferred) return '#94a3b8'
      if (edge.source === 'manual-topology') return '#ff7d00'
      return '#165dff'
    }

    const getEdgeLabel = (edge: any) => {
      const metrics = []
      if (typeof edge.qps === 'number' && edge.qps > 0) metrics.push(`${edge.qps} qps`)
      if (typeof edge.errorRate === 'number' && edge.errorRate > 0) metrics.push(`${edge.errorRate}% err`)
      if (typeof edge.p99 === 'number' && edge.p99 > 0) metrics.push(`p99 ${edge.p99}ms`)
      if (metrics.length > 0) return metrics.slice(0, 2).join(' · ')
      if (edge.inferred) return '推断关系'
      return edge.protocol || ''
    }

    const formatPercent = (value?: number | null) => {
      if (typeof value !== 'number') return '-'
      return `${value >= 0 && value <= 1 ? (value * 100).toFixed(2) : value.toFixed(2)}%`
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const option = computed(() => {
      const layerDefinitions = props.layerDefinitions.length
        ? props.layerDefinitions
        : [
            { key: 'gateway', title: '接入层' },
            { key: 'service', title: '服务应用层' },
            { key: 'infrastructure', title: '基础设施层' }
          ]
      const layerIndexByKey = new Map(layerDefinitions.map((layer, index) => [layer.key, index]))
      const nodesByLayer = new Map<string, TopologyNode[]>()
      props.data.nodes.forEach((node) => {
        const layerKey = resolveLayerKey(node)
        const list = nodesByLayer.get(layerKey) || []
        list.push(node)
        nodesByLayer.set(layerKey, list)
      })

      const maxLayerNodeCount = Math.max(1, ...Array.from(nodesByLayer.values()).map((items) => items.length))
      const columnsPerLayer = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(maxLayerNodeCount * 1.4))))
      const maxLayerRows = Math.max(1, Math.ceil(maxLayerNodeCount / columnsPerLayer))
      const chartWidth = Math.max(1180, columnsPerLayer * 230 + 160)
      const chartHeight = Math.max(620, layerDefinitions.length * Math.max(180, maxLayerRows * 116 + 92))
      const layerHeight = chartHeight / Math.max(layerDefinitions.length, 1)
      const layerGraphics = props.showLayerRegions
        ? layerDefinitions.map((layer, index) => ({
            type: 'group',
            silent: true,
            left: 0,
            top: `${(index / layerDefinitions.length) * 100}%`,
            children: [
              {
                type: 'rect',
                shape: { x: 0, y: 0, width: chartWidth, height: layerHeight - 10 },
                style: {
                  fill: getLayerColor(layer.key),
                  stroke: 'rgba(148, 163, 184, 0.18)',
                  lineWidth: 1
                }
              },
              {
                type: 'text',
                style: {
                  x: 18,
                  y: 18,
                  text: `${layer.title}${layer.subtitle ? ` · ${layer.subtitle}` : ''}`,
                  fill: 'rgba(71, 85, 105, 0.72)',
                  font: '600 13px sans-serif'
                }
              }
            ]
          }))
        : []

      const nodes = props.data.nodes.map((node) => {
        const layerKey = resolveLayerKey(node)
        const layerIndex = layerIndexByKey.get(layerKey) ?? Math.max(layerDefinitions.length - 1, 0)
        const layerNodes = nodesByLayer.get(layerKey) || []
        const positionInLayer = Math.max(
          layerNodes.findIndex((item) => item.id === node.id),
          0
        )
        const row = Math.floor(positionInLayer / columnsPerLayer)
        const column = positionInLayer % columnsPerLayer
        const rowCount = Math.max(1, Math.ceil(layerNodes.length / columnsPerLayer))
        const nodesInRow = Math.min(columnsPerLayer, layerNodes.length - row * columnsPerLayer)
        const rowXStep = chartWidth / (nodesInRow + 1)
        const x = rowXStep * (column + 1)
        const rowGap = Math.min(112, Math.max(76, (layerHeight - 88) / Math.max(rowCount, 1)))
        const y = layerHeight * layerIndex + 72 + row * rowGap

        return {
          id: node.id,
          name: node.name,
          symbol: getNodeSymbol(node.type),
          symbolSize: props.selectedNodeId === node.id ? 68 : 54,
          x,
          y,
          fixed: Boolean(node.editable),
          value: node.status,
          itemStyle: {
            color: getNodeColor(node.status),
            borderColor: props.selectedNodeId === node.id ? '#165dff' : 'rgba(255, 255, 255, 0.9)',
            borderWidth: props.selectedNodeId === node.id ? 4 : 2,
            shadowBlur: props.selectedNodeId === node.id ? 18 : 8,
            shadowColor: props.selectedNodeId === node.id ? 'rgba(22, 93, 255, 0.28)' : 'rgba(15, 23, 42, 0.12)'
          },
          label: {
            show: true,
            position: 'bottom',
            formatter: '{b}',
            color: 'var(--color-text-1)',
            fontSize: 12,
            width: 128,
            overflow: 'truncate',
            fontWeight: props.selectedNodeId === node.id ? 700 : 500
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
        .map((edge: any) => ({
          source: String(edge.from ?? edge.source),
          target: String(edge.to ?? edge.target),
          label: {
            show: true,
            formatter: () => getEdgeLabel(edge),
            color: 'var(--color-text-3)',
            fontSize: 11,
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            borderRadius: 4,
            padding: [2, 5]
          },
          lineStyle: {
            color: getEdgeColor(edge),
            curveness: edge.inferred ? 0.1 : 0.22,
            type: edge.inferred ? 'dashed' : 'solid',
            width: edge.status === 'critical' || Number(edge.errorRate || 0) > 0 ? 3 : edge.inferred ? 1.6 : 2.2,
            opacity: edge.inferred ? 0.58 : 0.86
          }
        }))

      return {
        graphic: layerGraphics,
        tooltip: {
          trigger: 'item',
          confine: true,
          borderWidth: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          textStyle: {
            color: '#fff'
          },
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const node = props.data.nodes.find((n) => n.id === params.data.id)
              return `
                <div style="padding: 6px 8px; min-width: 180px;">
                  <div style="font-weight: 700; margin-bottom: 8px;">${escapeHtml(params.name)}</div>
                <div>Status: <span style="color: ${escapeHtml(params.color)}">${escapeHtml(node?.status || 'unknown')}</span></div>
                <div>Type: ${escapeHtml(node?.type || 'service')}</div>
                <div>Env: ${escapeHtml(node?.env)}</div>
                <div>Cluster: ${escapeHtml(node?.cluster)}</div>
                  <div>Instances: ${typeof node?.instances === 'number' ? node.instances : '-'}</div>
                  <div>QPS: ${typeof node?.qps === 'number' ? node.qps : '-'}</div>
                  <div>Latency: ${typeof node?.latency === 'number' ? `${node.latency}ms` : '-'}</div>
                  <div>Error Rate: ${formatPercent(node?.errorRate)}</div>
                  <div style="margin-top: 8px; opacity: .76;">单击查看详情，双击进入服务页</div>
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
                <div>Protocol: ${escapeHtml(edge?.protocol)}</div>
                <div>Source: telemetry</div>
                <div>QPS: ${typeof edge?.qps === 'number' ? edge.qps : '-'}</div>
                <div>Error Rate: ${typeof edge?.errorRate === 'number' ? `${edge.errorRate}%` : '-'}</div>
                <div>P99: ${typeof edge?.p99 === 'number' ? `${edge.p99}ms` : '-'}</div>
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
            roam: true,
            scaleLimit: {
              min: 0.2,
              max: 4
            },
            nodeScaleRatio: 0.4,
            draggable: true,
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [0, 12],
            label: {
              position: 'bottom',
              formatter: '{b}'
            },
            lineStyle: {
              color: '#165dff',
              curveness: 0.22,
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
      if (params?.dataType !== 'node') return
      interactionSettled.value = true
      const node = props.data.nodes.find((n) => n.id === params.data?.id)
      if (node) props.onNodeClick?.(node)
    }

    const handleChartDblclick = (params: any) => {
      if (params?.dataType !== 'node') return
      interactionSettled.value = true
      const node = props.data.nodes.find((n) => n.id === params.data?.id)
      if (node) props.onNodeDblclick?.(node)
    }

    return () => (
      <BaseChart
        option={option.value}
        height={props.height}
        loading={props.loading}
        onChartClick={handleChartClick}
        onChartDblclick={handleChartDblclick}
      />
    )
  }
})
