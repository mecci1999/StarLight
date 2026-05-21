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

const formatValue = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return value.toLocaleString()
  return Number(value.toFixed(Math.abs(value) >= 10 ? 1 : 2)).toLocaleString()
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
      default: () => [
        'var(--color-primary-6)',
        'var(--color-success-6)',
        'var(--color-warning-6)',
        'var(--color-danger-6)',
        'var(--color-link-5)'
      ]
    },
    variant: {
      type: String,
      default: 'default'
    },
    showLegend: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const { themeOptions } = useChartTheme()
    const isMonitor = computed(() => props.variant === 'monitor')
    const resolvedColors = computed(() => {
      const fallbacks = ['#165dff', '#16a34a', '#d97706', '#dc2626', '#3b82f6']
      return props.colors.map((color, index) => resolveCssColor(color, fallbacks[index % fallbacks.length]))
    })
    const mutedColors = computed(() =>
      resolvedColors.value.map((color) => toRgba(color, isMonitor.value ? 0.84 : 0.78))
    )

    const validData = computed(() =>
      props.data
        .filter((item) => item && Number.isFinite(item.value) && item.value > 0)
        .map((item) => ({
          name: item.name,
          value: Number(item.value)
        }))
    )

    const total = computed(() => validData.value.reduce((sum, item) => sum + item.value, 0))
    const hasData = computed(() => validData.value.length > 0 && total.value > 0)
    const legendData = computed(() => (hasData.value ? validData.value.map((item) => item.name) : []))
    const chartCenter = computed<[string, string]>(() => {
      if (props.showLegend && hasData.value) {
        return isMonitor.value ? ['33%', '56%'] : ['50%', '44%']
      }

      return ['50%', '52%']
    })

    const centerPrimaryText = computed(() => formatValue(total.value))
    const centerSecondaryText = computed(() =>
      hasData.value ? (props.title ? `${props.title} 总量` : '总量') : '暂无数据'
    )
    const titleColor = computed(() => themeOptions.value.title.textStyle.color)
    const secondaryTextColor = computed(() => themeOptions.value.legend.textStyle.color)
    const fillColor = computed(() => resolveCssColor('var(--color-fill-1)', '#f7f8fa'))
    const surfaceColor = computed(() => resolveCssColor('var(--color-bg-2)', '#ffffff'))

    const option = computed(() => ({
      title: {
        text: props.title,
        show: Boolean(props.title),
        left: 0,
        top: 0,
        textStyle: {
          fontSize: 12,
          fontWeight: 500,
          color: titleColor.value
        }
      },
      tooltip: {
        show: hasData.value,
        trigger: 'item',
        formatter: (params: any) => {
          const percent =
            typeof params.percent === 'number' ? `${params.percent.toFixed(params.percent >= 10 ? 0 : 1)}%` : '0%'
          return [
            `<div style="min-width: 132px;">`,
            `<div style="margin-bottom: 6px; color: ${titleColor.value}; font-weight: 500;">${params.name}</div>`,
            `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; color: ${secondaryTextColor.value};">`,
            `<span>数值</span><strong style="color: ${titleColor.value}; font-weight: 500;">${formatValue(Number(params.value || 0))}</strong>`,
            `</div>`,
            `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; color: ${secondaryTextColor.value};">`,
            `<span>占比</span><strong style="color: ${titleColor.value}; font-weight: 500;">${percent}</strong>`,
            `</div>`,
            `</div>`
          ].join('')
        }
      },
      legend:
        props.showLegend && hasData.value
          ? {
              type: 'scroll',
              orient: isMonitor.value ? 'vertical' : 'horizontal',
              left: isMonitor.value ? '64%' : 'center',
              right: isMonitor.value ? 0 : undefined,
              top: isMonitor.value ? 'middle' : undefined,
              bottom: isMonitor.value ? undefined : 0,
              data: legendData.value,
              itemGap: isMonitor.value ? 10 : 12,
              textStyle: {
                color: secondaryTextColor.value,
                fontSize: 11
              },
              formatter: (name: string) => (name.length > 14 ? `${name.slice(0, 14)}…` : name)
            }
          : undefined,
      graphic: [
        {
          type: 'group',
          left: chartCenter.value[0],
          top: chartCenter.value[1],
          silent: true,
          children: [
            {
              type: 'text',
              x: 0,
              y: -18,
              style: {
                text: centerPrimaryText.value,
                textAlign: 'center',
                textVerticalAlign: 'middle',
                fill: titleColor.value,
                fontSize: 20,
                fontWeight: 500
              }
            },
            {
              type: 'text',
              x: 0,
              y: 8,
              style: {
                text: centerSecondaryText.value,
                textAlign: 'center',
                textVerticalAlign: 'middle',
                fill: secondaryTextColor.value,
                fontSize: 11,
                fontWeight: 400
              }
            }
          ]
        }
      ],
      color: mutedColors.value,
      series: [
        {
          name: props.title || 'Access From',
          type: 'pie',
          center: chartCenter.value,
          radius: isMonitor.value ? ['64%', '76%'] : ['68%', '80%'],
          minAngle: hasData.value ? 4 : 360,
          startAngle: 92,
          padAngle: 1,
          selectedOffset: 0,
          stillShowZeroSum: true,
          avoidLabelOverlap: true,
          silent: !hasData.value,
          emptyCircleStyle: {
            color: fillColor.value
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: surfaceColor.value,
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            scale: false
          },
          labelLine: {
            show: false
          },
          data: hasData.value
            ? validData.value
            : [
                {
                  name: '暂无数据',
                  value: 1,
                  itemStyle: {
                    color: fillColor.value
                  },
                  tooltip: {
                    show: false
                  }
                }
              ]
        }
      ]
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
