import { defineComponent, computed } from 'vue'
import BaseChart from './BaseChart'
import { graphic } from 'echarts'

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

type ThresholdGuideLine = {
  value: number
  label?: string
  unit?: string
  color?: string
  level?: 'critical' | 'warning' | 'info'
}

export default defineComponent({
  name: 'LineChart',
  props: {
    title: String,
    series: {
      type: Array as () => { name: string; color?: string; data: { timestamp: number; value: number }[] }[],
      default: undefined
    },
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
    area: Boolean,
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
    },
    thresholdValue: {
      type: Number,
      default: undefined
    },
    thresholdLabel: {
      type: String,
      default: '阈值'
    },
    thresholdUnit: {
      type: String,
      default: ''
    },
    thresholdLines: {
      type: Array as () => ThresholdGuideLine[],
      default: () => []
    }
  },
  setup(props) {
    const isMonitor = computed(() => props.variant === 'monitor')
    const chartTitleColor = computed(() => resolveCssColor('var(--color-text-2)', '#4e5969'))
    const chartTextColor = computed(() => resolveCssColor('var(--color-text-3)', '#86909c'))
    const chartMutedColor = computed(() => resolveCssColor('var(--color-text-4)', '#c9cdd4'))
    const softBorderColor = computed(() => resolveCssColor('var(--color-border-1)', '#f2f3f5'))
    const surfaceColor = computed(() => resolveCssColor('var(--color-bg-2)', '#ffffff'))

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

    const timestamps = computed(() => resolvedSeries.value[0]?.data.map((item) => item.timestamp) || [])
    const spansMultipleDays = computed(() => {
      if (timestamps.value.length < 2) return false
      return timestamps.value[timestamps.value.length - 1] - timestamps.value[0] >= 24 * 60 * 60 * 1000
    })

    const axisTimeFormatter = computed(
      () =>
        new Intl.DateTimeFormat(undefined, {
          ...(spansMultipleDays.value ? { month: '2-digit', day: '2-digit' } : { hour: '2-digit', minute: '2-digit' })
        })
    )

    const tooltipTimeFormatter = computed(
      () =>
        new Intl.DateTimeFormat(undefined, {
          month: spansMultipleDays.value ? '2-digit' : undefined,
          day: spansMultipleDays.value ? '2-digit' : undefined,
          hour: '2-digit',
          minute: '2-digit'
        })
    )

    const hasMultipleSeries = computed(() => resolvedSeries.value.length > 1)
    const baseFillOpacity = computed(() => {
      if (props.area) {
        return isMonitor.value ? 0.2 : 0.145
      }

      return hasMultipleSeries.value ? (isMonitor.value ? 0.11 : 0.085) : isMonitor.value ? 0.13 : 0.095
    })
    const fadeFillOpacity = computed(() => (props.area ? 0.02 : isMonitor.value ? 0.018 : 0.015))
    const shouldForcePercentScale = computed(() => props.yAxisUnit === '%' && props.yAxisMax === 100)
    const getThresholdLineColor = (line: ThresholdGuideLine) => {
      if (line.color) return resolveCssColor(line.color, '#ff7d00')
      if (line.level === 'critical') return resolveCssColor('var(--color-danger-6)', '#f53f3f')
      if (line.level === 'info') return resolveCssColor('var(--color-primary-6)', '#165dff')
      return resolveCssColor('var(--color-warning-6)', '#ff7d00')
    }
    const normalizedThresholdLines = computed<ThresholdGuideLine[]>(() => {
      const lines = props.thresholdLines.filter((line) => typeof line.value === 'number' && Number.isFinite(line.value))
      if (lines.length) return lines
      if (typeof props.thresholdValue !== 'number' || !Number.isFinite(props.thresholdValue)) return []
      return [{ value: props.thresholdValue, label: props.thresholdLabel, unit: props.thresholdUnit, level: 'warning' }]
    })
    const thresholdLine = computed(() => {
      if (!normalizedThresholdLines.value.length) return undefined
      return {
        silent: true,
        symbol: ['none', 'none'],
        data: normalizedThresholdLines.value.map((line) => {
          const color = getThresholdLineColor(line)
          const unit = line.unit || props.yAxisUnit
          const label = line.label || (line.level === 'critical' ? '严重' : line.level === 'info' ? '提示' : '警告')

          return {
            yAxis: line.value,
            lineStyle: {
              color,
              width: 1.5,
              type: 'dashed'
              // width: line.level === 'critical' ? 1.85 : 1.5,
              // type: line.level === 'critical' ? 'solid' : 'dashed'
            },
            label: {
              show: true,
              position: 'insideEndTop',
              color,
              fontSize: 11,
              formatter: `${label} ${formatNumber(line.value)}${unit}`
            }
          }
        })
      }
    })

    const option = computed(() => ({
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
          snap: true,
          lineStyle: {
            color: toRgba(chartTextColor.value, isMonitor.value ? 0.28 : 0.16),
            width: 1
          },
          label: { show: false }
        },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params]
          const firstPoint = items[0]
          const timestamp = firstPoint?.data?.timestamp ?? timestamps.value[firstPoint?.dataIndex ?? 0]
          const heading = timestamp ? tooltipTimeFormatter.value.format(new Date(timestamp)) : ''

          return [
            `<div style="min-width: 136px;">`,
            heading
              ? `<div style="margin-bottom: 6px; color: ${chartTitleColor.value}; font-weight: 500;">${heading}</div>`
              : '',
            ...items.map((item: any) => {
              const seriesColor = resolveCssColor(item.color, '#165dff')
              const numericValue = Number(item.data?.value ?? item.value?.value ?? item.value ?? 0)
              return [
                `<div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 3px;">`,
                `<div style="display: flex; align-items: center; gap: 8px; min-width: 0; color: ${chartTextColor.value};">`,
                `<span style="width: 6px; height: 6px; border-radius: 999px; background: ${seriesColor}; flex-shrink: 0;"></span>`,
                `<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.seriesName}</span>`,
                `</div>`,
                `<strong style="color: ${chartTitleColor.value}; font-weight: 500;">${formatNumber(numericValue)}${props.yAxisUnit}</strong>`,
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
        left: isMonitor.value ? 12 : 8,
        right: isMonitor.value ? 12 : 8,
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
                  color: toRgba(resolveCssColor(props.color, '#165dff'), isMonitor.value ? 0.12 : 0.08)
                }
              }
            }
          ]
        : [],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps.value.map((timestamp) => axisTimeFormatter.value.format(new Date(timestamp))),
        axisLine: {
          show: false,
          lineStyle: {
            color: softBorderColor.value
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: isMonitor.value ? chartMutedColor.value : chartTextColor.value,
          fontSize: 10,
          margin: 8,
          hideOverlap: true
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
          formatter: (value: number) => `${formatNumber(value)}${props.yAxisUnit}`
        }
      },
      series: resolvedSeries.value.map((seriesItem, index) => ({
        name: seriesItem.name,
        type: 'line',
        smooth: 0.22,
        connectNulls: true,
        lineStyle: {
          width: 1.75,
          cap: 'round',
          join: 'round',
          color: seriesItem.color,
          opacity: 0.92
        },
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: {
          opacity: 1,
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: toRgba(seriesItem.color, baseFillOpacity.value)
            },
            {
              offset: 0.72,
              color: toRgba(seriesItem.color, props.area ? baseFillOpacity.value * 0.46 : baseFillOpacity.value * 0.32)
            },
            {
              offset: 1,
              color: toRgba(seriesItem.color, fadeFillOpacity.value)
            }
          ])
        },
        emphasis: {
          focus: 'series',
          scale: false,
          lineStyle: {
            width: 2.25,
            opacity: 1
          }
        },
        itemStyle: {
          color: seriesItem.color,
          borderWidth: 1.5,
          borderColor: surfaceColor.value
        },
        data: seriesItem.data.map((item) => ({
          value: item.value,
          timestamp: item.timestamp
        })),
        markLine: index === 0 ? thresholdLine.value : undefined
      }))
    }))

    return () => <BaseChart option={option.value} height={props.height} loading={props.loading} />
  }
})
