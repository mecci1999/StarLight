import { computed } from 'vue'
import { useSettingStore } from '@/store/setting'
import { storeToRefs } from 'pinia'

const resolveCssVar = (name: string) => {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
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

/**
 * Chart Theme Hook
 * Provides unified ECharts styling based on global CSS variables.
 */
export function useChartTheme() {
  const settingStore = useSettingStore()
  const { themes } = storeToRefs(settingStore)

  const isDark = computed(() => themes.value.content === 'dark')

  // Reactive theme options for ECharts
  const themeOptions = computed(() => {
    const dark = isDark.value

    const textColor = resolveCssVar('--color-text-1') || (dark ? '#f5f5f5' : '#1d2129')
    const secondaryTextColor = resolveCssVar('--color-text-3') || (dark ? '#a3a3a3' : '#86909c')
    const tertiaryTextColor = resolveCssVar('--color-text-4') || (dark ? '#737373' : '#c9cdd4')
    const borderColor = resolveCssVar('--color-border-2') || (dark ? '#404040' : '#e5e6eb')
    const softBorderColor = resolveCssVar('--color-border-1') || (dark ? '#2a2a2a' : '#f2f3f5')
    const tooltipBg = resolveCssVar('--color-bg-5') || (dark ? '#2a2a2a' : '#ffffff')
    const primaryColor =
      resolveCssVar('--color-primary-5') || resolveCssVar('--color-primary-6') || (dark ? '#60a5fa' : '#4080ff')
    const successColor = resolveCssVar('--color-success-6') || (dark ? '#4ade80' : '#16a34a')
    const warningColor = resolveCssVar('--color-warning-6') || (dark ? '#fbbf24' : '#d97706')
    const dangerColor =
      resolveCssVar('--color-danger-5') || resolveCssVar('--color-danger-6') || (dark ? '#f87171' : '#ef4444')
    const linkColor =
      resolveCssVar('--color-link-4') || resolveCssVar('--color-link-5') || (dark ? '#2563eb' : '#60a5fa')

    const colorPalette = [primaryColor, successColor, warningColor, dangerColor, linkColor, tertiaryTextColor]

    return {
      color: colorPalette,
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'PingFang, sans-serif'
      },
      title: {
        textStyle: {
          color: textColor,
          fontWeight: 500,
          fontSize: 12,
          lineHeight: 20
        },
        subtextStyle: {
          color: secondaryTextColor
        }
      },
      legend: {
        icon: 'circle',
        itemWidth: 6,
        itemHeight: 6,
        itemGap: 12,
        textStyle: {
          color: secondaryTextColor,
          fontSize: 11,
          padding: [0, 0, 0, 4]
        },
        pageIconColor: secondaryTextColor,
        pageIconInactiveColor: tertiaryTextColor,
        pageIconSize: 8,
        pageTextStyle: {
          color: secondaryTextColor,
          fontSize: 11
        }
      },
      grid: {
        containLabel: true,
        top: 20,
        bottom: 8,
        left: 8,
        right: 8
      },
      tooltip: {
        backgroundColor: toRgba(tooltipBg, dark ? 0.92 : 0.94),
        borderColor: toRgba(borderColor, dark ? 0.44 : 0.58),
        borderWidth: 1,
        textStyle: {
          color: textColor,
          fontSize: 11,
          lineHeight: 18
        },
        padding: [8, 10],
        extraCssText: `box-shadow: ${dark ? '0 12px 24px rgba(0, 0, 0, 0.22)' : '0 8px 20px rgba(15, 23, 42, 0.06)'}; border-radius: 10px; backdrop-filter: blur(16px);`
      },
      categoryAxis: {
        axisLine: {
          show: true,
          lineStyle: {
            color: softBorderColor
          }
        },
        axisTick: {
          show: false,
          alignWithLabel: true
        },
        axisLabel: {
          show: true,
          color: secondaryTextColor,
          fontSize: 11,
          margin: 8,
          hideOverlap: true
        },
        axisPointer: {
          lineStyle: {
            color: toRgba(secondaryTextColor, dark ? 0.32 : 0.18),
            width: 1
          }
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: softBorderColor
          }
        }
      },
      valueAxis: {
        axisLine: {
          show: false,
          lineStyle: {
            color: secondaryTextColor
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: true,
          color: secondaryTextColor,
          fontSize: 11,
          margin: 8
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: toRgba(softBorderColor, dark ? 0.72 : 0.92),
            width: 1,
            type: 'solid'
          }
        }
      }
    }
  })

  const loadingOptions = computed(() => {
    const dark = isDark.value
    const primaryColor = resolveCssVar('--color-primary-6') || (dark ? '#60a5fa' : '#165dff')
    const maskColor = toRgba(resolveCssVar('--color-bg-2') || (dark ? '#1e1e1e' : '#ffffff'), dark ? 0.28 : 0.42)
    const textColor = resolveCssVar('--color-text-3') || (dark ? '#a3a3a3' : '#86909c')

    return {
      color: primaryColor,
      maskColor,
      textColor,
      fontSize: 12,
      lineWidth: 2
    }
  })

  return {
    themeOptions,
    loadingOptions,
    isDark
  }
}
