import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'
import { graphic } from 'echarts'

export default defineComponent({
  name: 'BarChart',
  props: {
    title: String,
    data: {
      type: Array as () => { name: string; value: number }[],
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
    loading: Boolean
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
          type: 'shadow'
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
        data: props.data.map((item) => item.name),
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
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: props.color },
              { offset: 1, color: '#83bff6' }
            ])
          },
          data: props.data.map((item) => item.value)
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
