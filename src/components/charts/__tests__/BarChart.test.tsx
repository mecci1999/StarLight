// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import BarChart from '../BarChart'

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

describe('BarChart', () => {
  it('passes fixed y-axis max and unit to ECharts with non-merge updates', () => {
    chartProps.props = []

    mount(BarChart, {
      props: {
        data: [{ name: 'CPU', value: 64 }],
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

  it('uses monitor-style transparent straight bars without gradients or shadows', () => {
    chartProps.props = []

    mount(BarChart, {
      props: {
        variant: 'monitor',
        data: [
          { name: 'metrics-query · v2.query.cards', value: 64 },
          { name: 'logs · v1.search', value: 18 }
        ]
      }
    })

    const props = chartProps.props.at(-1)
    expect(props.option.series).toHaveLength(1)
    expect(props.option.series[0].name).toBe('Value')
    expect(props.option.series[0].silent).toBeUndefined()
    expect(props.option.series[0].itemStyle.borderRadius).toBe(0)
    expect(props.option.series[0].itemStyle.color).toContain('rgba(')
    expect(props.option.series[0].itemStyle.shadowBlur).toBeUndefined()
    expect(props.option.series[0].data[0].itemStyle.color).toContain('0.18')
    expect(props.option.series[0].emphasis.itemStyle.color).toContain('0.34')
    expect(props.option.tooltip.axisPointer.type).toBe('line')
    expect(props.option.tooltip.extraCssText).toContain('box-shadow: none')
    expect(props.option.yAxis.splitLine.lineStyle.type).toBe('dashed')
    expect(props.option.xAxis.axisLabel.formatter('metrics-query · v2.query.cards')).toBe('metrics-query · v…')
  })
})
