// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RealtimeMonitorPage from '../pages/RealtimeMonitorPage'

const apiMocks = vi.hoisted(() => ({
  fetchCatalogServices: vi.fn(),
  fetchServiceDetailSummary: vi.fn(),
  fetchServiceRuntime: vi.fn(),
  fetchOverviewIncidents: vi.fn(),
  fetchMetricsExplorer: vi.fn()
}))

vi.mock('@/api', () => ({
  default: {
    metrics: apiMocks
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { serviceId: 'svc-1' } })
}))

vi.mock('@/store/useTimeStore', () => ({
  useTimeStore: () => ({
    timeRange: '1h',
    isLive: false,
    startTime: 1,
    endTime: 2,
    timeOptions: [{ label: '1 小时', value: '1h' }],
    setTimeRange: vi.fn(),
    refreshTime: vi.fn()
  })
}))

vi.mock('@/services/authSession', () => ({
  getPreferredMetricsDatasetScope: vi.fn(() => 'tenant')
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      setup(_, { slots }) {
        return () => h(tag, {}, slots.default?.())
      }
    })

  return {
    NCard: passthrough('div'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NStatistic: defineComponent({
      props: ['label', 'value'],
      setup: (props) => () => h('div', {}, `${props.label}:${props.value}`)
    }),
    NProgress: defineComponent({ setup: () => () => h('div', {}, 'progress') }),
    NSpace: passthrough('div'),
    NButton: defineComponent({
      props: ['disabled', 'type', 'secondary'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NSpin: passthrough('div'),
    NEmpty: defineComponent({
      props: ['description'],
      setup(props, { slots }) {
        return () => h('div', {}, [props.description, slots.extra?.(), slots.default?.()])
      }
    }),
    NTag: passthrough('span')
  }
})

vi.mock('@/shared/layout/PageHeader', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', {}, slots.actions?.())
  })
}))
vi.mock('@/shared/components/TimeRangeBar', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/ScopeBar', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/components/charts/LineChart', () => ({
  default: defineComponent({ setup: () => () => h('div', {}, 'line-chart') })
}))

describe('RealtimeMonitorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.fetchCatalogServices.mockResolvedValue({ items: [{ identity: { id: 'svc-1', name: 'Gateway' } }] })
    apiMocks.fetchServiceRuntime.mockResolvedValue({ instances: [], ingestStatus: {} })
    apiMocks.fetchOverviewIncidents.mockResolvedValue([])
    apiMocks.fetchMetricsExplorer.mockResolvedValue({ series: {} })
  })

  it('shows persistent retry state when realtime data loading fails', async () => {
    apiMocks.fetchServiceDetailSummary.mockRejectedValue(new Error('network failed'))

    const wrapper = mount(RealtimeMonitorPage)
    await flushPromises()

    expect(wrapper.text()).toContain('实时监控数据加载失败，请检查服务状态或稍后重试。')
    expect(wrapper.text()).toContain('重试加载')
  })
})
