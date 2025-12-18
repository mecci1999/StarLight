import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'

export default defineComponent({
  name: 'GaugeChart',
  props: {
    title: String,
    value: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    unit: {
      type: String,
      default: '%'
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
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: props.min,
          max: props.max,
          splitNumber: 5,
          itemStyle: {
            color: props.color
          },
          progress: {
            show: true,
            width: 10
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 10,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: 'auto'
            }
          },
          axisLine: {
            lineStyle: {
              width: 10
            }
          },
          axisTick: {
            distance: -15,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          splitLine: {
            distance: -20,
            length: 10,
            lineStyle: {
              width: 3,
              color: '#999'
            }
          },
          axisLabel: {
            color: 'var(--color-text-3)',
            distance: -30,
            fontSize: 10
          },
          detail: {
            valueAnimation: true,
            formatter: `{value}${props.unit}`,
            color: 'auto',
            fontSize: 20,
            offsetCenter: [0, '0%']
          },
          title: {
            offsetCenter: [0, '30%'],
            fontSize: 14,
            color: 'var(--color-text-2)'
          },
          data: [
            {
              value: props.value,
              name: props.title
            }
          ]
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
