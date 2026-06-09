import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'

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

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0'

  const absoluteValue = Math.abs(value)
  if (absoluteValue >= 1000000) {
    return `${Number((value / 1000000).toFixed(absoluteValue >= 10000000 ? 0 : 1))}M`
  }

  if (absoluteValue >= 1000) {
    return `${Number((value / 1000).toFixed(absoluteValue >= 10000 ? 0 : 1))}k`
  }

  if (Number.isInteger(value)) return value.toLocaleString()
  return Number(value.toFixed(absoluteValue >= 10 ? 1 : 2)).toLocaleString()
}

const BYTE_UNITS = ['byte', 'bytes', 'b']
const BYTES_PER_KIB = 1024
const BYTES_PER_MIB = BYTES_PER_KIB * 1024
const BYTES_PER_GIB = BYTES_PER_MIB * 1024

const formatStorageSize = (value: number) => {
  if (!Number.isFinite(value)) return '0 B'
  const absoluteValue = Math.abs(value)
  const units = [
    { label: 'GB', size: BYTES_PER_GIB },
    { label: 'MB', size: BYTES_PER_MIB },
    { label: 'KB', size: BYTES_PER_KIB }
  ]
  const matchedUnit = units.find((unit) => absoluteValue >= unit.size)

  if (!matchedUnit) return `${Number(value.toFixed(0)).toLocaleString()} B`
  const normalizedValue = value / matchedUnit.size
  const digits = Math.abs(normalizedValue) >= 10 ? 1 : 2
  return `${Number(normalizedValue.toFixed(digits)).toLocaleString()} ${matchedUnit.label}`
}

const formatValueWithUnit = (value: number, unit = '') => {
  const normalizedUnit = unit.trim().toLowerCase()
  if (BYTE_UNITS.includes(normalizedUnit)) return formatStorageSize(value)

  if (normalizedUnit === 'mb' && Math.abs(value) >= BYTES_PER_MIB) {
    return `${Number((value / BYTES_PER_MIB).toFixed(1)).toLocaleString()} MB`
  }

  if (normalizedUnit === 'gb' && Math.abs(value) >= BYTES_PER_GIB) {
    return `${Number((value / BYTES_PER_GIB).toFixed(2)).toLocaleString()} GB`
  }

  return `${formatNumber(value)}${unit}`
}

export default defineComponent({
  name: 'BarChart',
  props: {
    title: String,
    series: {
      type: Array as () => { name: string; color?: string; data: { name: string; value: number }[] }[],
      default: undefined
    },
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
    loading: Boolean,
    variant: {
      type: String,
      default: 'default'
    },
    showLegend: {
      type: Boolean,
      default: undefined
    },
    showDataZoom: {
      type: Boolean,
      default: false
    },
    yAxisMin: {
      type: Number,
      default: undefined
    },
    yAxisMax: {
      type: Number,
      default: undefined
    },
    yAxisUnit: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const isMonitor = computed(() => props.variant === 'monitor')
    const chartTitleColor = computed(() => resolveCssColor('var(--color-text-2)', '#4e5969'))
    const chartTextColor = computed(() => resolveCssColor('var(--color-text-3)', '#86909c'))
    const chartMutedColor = computed(() => resolveCssColor('var(--color-text-4)', '#c9cdd4'))
    const softBorderColor = computed(() => resolveCssColor('var(--color-border-1)', '#f2f3f5'))
    const resolvedSeries = computed(() =>
      props.series && props.series.length > 0
        ? props.series.map((seriesItem) => ({
            ...seriesItem,
            color: resolveCssColor(seriesItem.color || props.color, '#165dff')
          }))
        : [
            {
              name: props.title || 'Value',
              color: resolveCssColor(props.color, '#165dff'),
              data: props.data
            }
          ]
    )

    const categories = computed(() => resolvedSeries.value[0]?.data.map((item) => item.name) || [])
    const hasMultipleSeries = computed(() => resolvedSeries.value.length > 1)
    const shouldForcePercentScale = computed(() => props.yAxisUnit === '%' && props.yAxisMax === 100)
    const hasManyCategories = computed(() => categories.value.length > 8)
    const barFillOpacity = computed(() =>
      hasMultipleSeries.value ? (isMonitor.value ? 0.34 : 0.24) : isMonitor.value ? 0.42 : 0.3
    )
    const activeBarFillOpacity = computed(() => (isMonitor.value ? 0.68 : 0.52))

    const option = computed(() => ({
      animationDuration: isMonitor.value ? 420 : 360,
      animationEasing: 'cubicOut',
      backgroundColor: 'transparent',
      title: {
        text: props.title,
        left: 0,
        top: 0,
        show: Boolean(props.title),
        textStyle: {
          fontSize: 12,
          fontWeight: 500,
          color: chartTitleColor.value
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          label: { show: false },
          lineStyle: {
            color: toRgba(chartTextColor.value, isMonitor.value ? 0.24 : 0.16),
            width: 1
          }
        },
        borderWidth: 0,
        extraCssText: 'box-shadow: none; border-radius: 10px;',
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params]
          const heading = items[0]?.axisValue || ''

          return [
            `<div style="min-width: 136px;">`,
            heading
              ? `<div style="margin-bottom: 6px; color: ${chartTitleColor.value}; font-weight: 500;">${heading}</div>`
              : '',
            ...items.map((item: any) => {
              const seriesColor = resolveCssColor(item.color, '#165dff')
              const numericValue = Number(item.data?.value ?? item.value ?? 0)
              return [
                `<div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 3px;">`,
                `<div style="display: flex; align-items: center; gap: 8px; min-width: 0; color: ${chartTextColor.value};">`,
                `<span style="width: 6px; height: 6px; border-radius: 999px; background: ${seriesColor}; flex-shrink: 0;"></span>`,
                `<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.seriesName}</span>`,
                `</div>`,
                `<strong style="color: ${chartTitleColor.value}; font-weight: 500;">${formatValueWithUnit(numericValue, props.yAxisUnit)}</strong>`,
                `</div>`
              ].join('')
            }),
            `</div>`
          ].join('')
        }
      },
      legend: hasMultipleSeries.value
        ? {
            show: props.showLegend !== false,
            top: props.title ? 4 : 0,
            left: 'left',
            textStyle: {
              color: chartTextColor.value,
              fontSize: 11
            },
            itemGap: 12
          }
        : undefined,
      grid: {
        left: isMonitor.value ? 10 : 8,
        right: isMonitor.value ? 10 : 8,
        bottom: props.showDataZoom ? 24 : isMonitor.value ? 8 : 4,
        containLabel: true,
        top: props.title ? (hasMultipleSeries.value ? 44 : 28) : hasMultipleSeries.value ? 20 : 8
      },
      dataZoom: props.showDataZoom
        ? [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              type: 'slider',
              height: 10,
              bottom: 0,
              start: 0,
              end: 100,
              borderColor: 'transparent',
              backgroundColor: softBorderColor.value,
              fillerColor: toRgba(resolveCssColor(props.color, '#165dff'), isMonitor.value ? 0.16 : 0.1),
              handleSize: 0,
              moveHandleSize: 0,
              showDetail: false,
              brushSelect: false,
              dataBackground: {
                lineStyle: {
                  color: toRgba(chartTextColor.value, 0.22)
                },
                areaStyle: {
                  color: toRgba(softBorderColor.value, isMonitor.value ? 0.88 : 1)
                }
              },
              selectedDataBackground: {
                lineStyle: {
                  color: resolveCssColor(props.color, '#165dff')
                },
                areaStyle: {
                  color: toRgba(resolveCssColor(props.color, '#165dff'), 0.08)
                }
              }
            }
          ]
        : [],
      xAxis: {
        type: 'category',
        data: categories.value,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: isMonitor.value ? chartMutedColor.value : chartTextColor.value,
          fontSize: 10,
          margin: 9,
          hideOverlap: true,
          interval: hasManyCategories.value ? 'auto' : 0,
          formatter: (value: string) => (String(value).length > 18 ? `${String(value).slice(0, 17)}…` : value)
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        min: shouldForcePercentScale.value ? 0 : props.yAxisMin,
        max: props.yAxisMax,
        interval: shouldForcePercentScale.value ? 20 : undefined,
        splitNumber: shouldForcePercentScale.value ? 5 : 4,
        scale: false,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: toRgba(softBorderColor.value, isMonitor.value ? 0.4 : 0.58),
            width: 1,
            type: 'dashed',
            dashOffset: 1.5
          }
        },
        axisLabel: {
          color: isMonitor.value ? chartMutedColor.value : chartTextColor.value,
          fontSize: 10,
          margin: 8,
          formatter: (value: number) => formatValueWithUnit(value, props.yAxisUnit)
        }
      },
      series: resolvedSeries.value
        .map((seriesItem) => ({
          name: seriesItem.name,
          type: 'bar',
          barGap: hasMultipleSeries.value ? '28%' : '30%',
          barCategoryGap: hasManyCategories.value ? '42%' : '52%',
          barMaxWidth: hasMultipleSeries.value ? 16 : 24,
          itemStyle: {
            color: toRgba(seriesItem.color, barFillOpacity.value),
            borderColor: toRgba(seriesItem.color, isMonitor.value ? 0.38 : 0.26),
            borderWidth: 1,
            borderRadius: 0
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: toRgba(seriesItem.color, activeBarFillOpacity.value),
              borderColor: toRgba(seriesItem.color, 0.42),
              borderWidth: 1
            }
          },
          data: seriesItem.data.map((item) => ({
            value: item.value,
            itemStyle: {
              color: toRgba(seriesItem.color, barFillOpacity.value)
            }
          }))
        }))
        .map((seriesItem) => ({
          ...seriesItem,
          animationDelay: (index: number) => Math.min(index * 18, 260)
        }))
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
