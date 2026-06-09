// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import LineChart from '../LineChart'

const chartProps = vi.hoisted(() => ({
  props: [] as any[]
}))

vi.mock('vue-echarts', () => ({
  default: defineComponent({
    name: 'StubVChart',
    props: ['option', 'updateOptions'],
    setup(props) {
      chartProps.props.push(props)
      return () => h('div', { 'data-component': 'v-chart' })
    }
  })
}))

vi.mock('@/store/setting', () => ({
  useSettingStore: () => ({ themes: ref({ content: 'light' }) })
}))

describe('LineChart', () => {
  it('passes fixed y-axis max and unit to ECharts with non-merge updates', () => {
    chartProps.props = []

    mount(LineChart, {
      props: {
        data: [{ timestamp: Date.now(), value: 64 }],
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisUnit: '%'
      }
    })

    const props = chartProps.props.at(-1)
    expect(props.option.yAxis.min).toBe(0)
    expect(props.option.yAxis.max).toBe(100)
    expect(props.option.yAxis.interval).toBe(20)
    expect(props.option.yAxis.splitNumber).toBe(5)
    expect(props.option.yAxis.axisLabel.formatter(80)).toBe('80%')
    expect(props.option.yAxis.axisLabel.formatter(100)).toBe('100%')
    expect(props.updateOptions).toEqual({
      notMerge: true,
      replaceMerge: ['xAxis', 'yAxis', 'series']
    })
  })

  it('renders threshold guide line when threshold value is provided', () => {
    chartProps.props = []

    mount(LineChart, {
      props: {
        data: [{ timestamp: Date.now(), value: 64 }],
        yAxisUnit: '%',
        thresholdValue: 80,
        thresholdLabel: '阈值',
        thresholdUnit: '%'
      }
    })

    const props = chartProps.props.at(-1)
    const markLine = props.option.series[0].markLine
    expect(markLine.data[0].yAxis).toBe(80)
    expect(markLine.data[0].lineStyle.type).toBe('dashed')
    expect(markLine.data[0].label.formatter).toBe('阈值 80%')
    expect(props.option.series[0].markLine).toBeTruthy()
  })

  it('renders warning and critical threshold guide lines with distinct styles', () => {
    chartProps.props = []

    mount(LineChart, {
      props: {
        data: [{ timestamp: Date.now(), value: 64 }],
        yAxisUnit: '%',
        thresholdLines: [
          { value: 85, label: '警告', level: 'warning', unit: '%' },
          { value: 95, label: '严重', level: 'critical', unit: '%' }
        ]
      }
    })

    const markLine = chartProps.props.at(-1).option.series[0].markLine
    expect(markLine.data.map((item: any) => item.yAxis)).toEqual([85, 95])
    expect(markLine.data[0].lineStyle.type).toBe('dashed')
    expect(markLine.data[1].lineStyle.type).toBe('dashed')
    expect(markLine.data[1].label.formatter).toBe('严重 95%')
  })

  it('formats byte-scale memory values as storage sizes instead of compact counts plus units', () => {
    chartProps.props = []

    mount(LineChart, {
      props: {
        data: [{ timestamp: Date.now(), value: 17179869184 }],
        yAxisUnit: 'MB'
      }
    })

    const props = chartProps.props.at(-1)
    expect(props.option.yAxis.axisLabel.formatter(17179869184)).toBe('16,384 MB')

    const tooltip = props.option.tooltip.formatter([
      {
        seriesName: 'os.memory.total',
        color: '#165dff',
        data: { timestamp: Date.now(), value: 17179869184 }
      }
    ])
    expect(tooltip).toContain('16,384 MB')
    expect(tooltip).not.toContain('17.2BMB')
  })

  it('formats raw byte units with an automatic storage unit', () => {
    chartProps.props = []

    mount(LineChart, {
      props: {
        data: [{ timestamp: Date.now(), value: 17179869184 }],
        yAxisUnit: 'byte'
      }
    })

    const props = chartProps.props.at(-1)
    expect(props.option.yAxis.axisLabel.formatter(17179869184)).toBe('16 GB')
  })
})
