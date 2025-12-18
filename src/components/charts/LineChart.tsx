import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'
import { graphic } from 'echarts'

export default defineComponent({
  name: 'LineChart',
  props: {
    title: String,
    data: {
      type: Array as () => { timestamp: number; value: number }[],
      default: () => []
    },
    color: {
      type: String,
      default: '#165dff'
    },
    height: {
      type: String,
      default: '200px'
    },
    loading: Boolean,
    area: Boolean
  },
  setup(props) {
    const option = computed(() => ({
      title: {
        text: props.title,
        left: 'left',
        textStyle: {
          fontSize: 14,
          color: 'var(--color-text-2)'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: props.title ? 40 : 20
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.data.map((item) => new Date(item.timestamp).toLocaleTimeString()),
        axisLine: {
          lineStyle: {
            color: 'var(--color-border-3)'
          }
        },
        axisLabel: {
          color: 'var(--color-text-3)'
        }
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: 'var(--color-border-1)',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: 'var(--color-text-3)'
        }
      },
      series: [
        {
          name: props.title || 'Value',
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 2,
            color: props.color
          },
          showSymbol: false,
          areaStyle: props.area
            ? {
                opacity: 0.8,
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: props.color
                  },
                  {
                    offset: 1,
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                ])
              }
            : undefined,
          emphasis: {
            focus: 'series'
          },
          data: props.data.map((item) => item.value)
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
