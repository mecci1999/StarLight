import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'
import { useChartTheme } from '@/hooks/useChartTheme'

const resolveCssColor = (value: string | undefined, fallback: string) => {
  if (!value) return fallback

  const match = value.match(/var\((--[^)]+)\)/u)
  if (match && typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || fallback
  }

  return value
}

const toRgba = (color: string, alpha: number) => {
  if (!color) return `rgba(0, 0, 0, ${alpha})`

  if (color.startsWith('rgba(')) {
    return color.replace(/rgba\(([^)]+),\s*[^,]+\)$/u, `rgba($1, ${alpha})`)
  }

  if (color.startsWith('rgb(')) {
    const values = color
      .replace('rgb(', '')
      .replace(')', '')
      .split(',')
      .map((item) => item.trim())
    return `rgba(${values.join(', ')}, ${alpha})`
  }

  const normalized = color.replace('#', '')
  const isShortHex = normalized.length === 3
  const isLongHex = normalized.length === 6

  if (!isShortHex && !isLongHex) return color

  const hex = isShortHex
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized

  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const formatValue = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return value.toLocaleString()
  return Number(value.toFixed(Math.abs(value) >= 10 ? 1 : 2)).toLocaleString()
}

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
      default: 'var(--color-primary-6)'
    },
    height: {
      type: String,
      default: '200px'
    },
    loading: Boolean
  },
  setup(props) {
    const { themeOptions } = useChartTheme()
    const primaryColor = computed(() =>
      resolveCssColor(props.color, resolveCssColor('var(--color-primary-6)', '#165dff'))
    )
    const detailColor = computed(() => themeOptions.value.title.textStyle.color)
    const titleColor = computed(() => themeOptions.value.legend.textStyle.color)
    const trackColor = computed(() => resolveCssColor('var(--color-fill-2)', '#f2f3f5'))
    const ringShadowColor = computed(() => toRgba(primaryColor.value, 0.16))
    const normalizedValue = computed(() => {
      const { min, max, value } = props
      const range = max - min

      if (!Number.isFinite(value) || !Number.isFinite(range) || range <= 0) return 0

      return Math.min(Math.max((value - min) / range, 0), 1)
    })

    const option = computed(() => ({
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          min: props.min,
          max: props.max,
          splitNumber: 1,
          center: ['50%', '50%'],
          radius: '92%',
          itemStyle: {
            color: primaryColor.value,
            shadowColor: ringShadowColor.value,
            shadowBlur: 6
          },
          progress: {
            show: true,
            roundCap: true,
            clip: false,
            width: 10,
            overlap: false,
            itemStyle: {
              color: primaryColor.value
            }
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: [[1, trackColor.value]],
              width: 10,
              cap: 'round'
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          detail: {
            valueAnimation: true,
            formatter: () => `${formatValue(props.value)}${props.unit}`,
            color: detailColor.value,
            fontSize: 20,
            fontWeight: 500,
            offsetCenter: [0, '0%']
          },
          title: {
            show: Boolean(props.title),
            offsetCenter: [0, '28%'],
            fontSize: 11,
            color: titleColor.value
          },
          data: [
            {
              value: props.min + normalizedValue.value * (props.max - props.min),
              name: props.title
            }
          ]
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
