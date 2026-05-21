import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'
import type { TopologyData } from '@/types/monitor'

// TODO(refactor-phase0): consolidate this legacy topology renderer with `@/components/ServiceTopology`.
// Both currently encode similar graph styling and should converge to one implementation.

export default defineComponent({
  name: 'TopologyChart',
  props: {
    data: {
      type: Object as () => TopologyData,
      default: () => ({ nodes: [], edges: [] })
    },
    height: {
      type: String,
      default: '600px'
    },
    loading: Boolean
  },
  setup(props) {
    const getNodeColor = (status: string) => {
      if (status === 'running' || status === 'healthy') return '#00b42a'
      if (status === 'error' || status === 'critical') return '#f53f3f'
      if (status === 'warning') return '#ff7d00'
      if (status === 'stopped' || status === 'idle') return '#86909c'
      return '#86909c'
    }

    const option = computed(() => {
      const nodes = props.data.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        symbolSize: 50,
        itemStyle: {
          color: getNodeColor(node.status)
        },
        label: {
          show: true,
          position: 'bottom',
          formatter: '{b}',
          color: 'var(--color-text-1)'
        }
      }))

      const links = props.data.edges.map((edge: any) => ({
        source: edge.from ?? edge.source,
        target: edge.to ?? edge.target,
        lineStyle: {
          curveness: 0.2
        }
      }))

      return {
        title: {
          text: 'Service Topology',
          top: 'bottom',
          left: 'right',
          textStyle: {
            color: 'var(--color-text-3)'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const node = props.data.nodes.find((n) => n.id === params.data.id)
              return `
                        <div style="padding: 4px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                            <div>Status: <span style="color: ${params.color}">${node?.status}</span></div>
                        </div>
                    `
            }
            return `${params.data.source} -> ${params.data.target}`
          }
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            animation: false,
            data: nodes,
            links: links,
            roam: true,
            label: {
              position: 'right',
              formatter: '{b}'
            },
            lineStyle: {
              color: 'source',
              curveness: 0.3
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 10
              }
            },
            force: {
              repulsion: 1000,
              edgeLength: 150
            }
          }
        ]
      }
    })

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
