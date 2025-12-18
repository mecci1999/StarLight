import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'

export default defineComponent({
  name: 'PieChart',
  props: {
    title: String,
    data: {
      type: Array as () => { name: string; value: number }[],
      default: () => []
    },
    height: {
      type: String,
      default: '200px'
    },
    loading: Boolean,
    colors: {
      type: Array as () => string[],
      default: () => ['#165dff', '#00b42a', '#ff7d00', '#f53f3f', '#722ed1']
    }
  },
  setup(props) {
    const option = computed(() => ({
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          color: 'var(--color-text-2)'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: 'var(--color-text-3)'
        }
      },
      color: props.colors,
      series: [
        {
          name: props.title || 'Access From',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: 'var(--color-bg-2)',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: props.data
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
