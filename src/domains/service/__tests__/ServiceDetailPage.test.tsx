// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ServiceDetailPage from '../pages/ServiceDetailPage'

const routerPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { serviceId: 'svc-a' }, query: { timeRange: '4h' } }),
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/store/useTimeStore', () => ({
  useTimeStore: () => ({
    timeRange: '4h',
    isLive: false,
    timeOptions: [{ label: '最近 4 小时', value: '4h' }],
    setTimeRange: vi.fn(),
    refreshTime: vi.fn()
  })
}))

vi.mock('@/services/authSession', () => ({
  getPreferredMetricsDatasetScope: vi.fn(() => 'tenant')
}))

vi.mock('@/api', () => ({
  fetchAlerts: vi.fn().mockResolvedValue([]),
  fetchAlertRules: vi.fn().mockResolvedValue([]),
  fetchNotifications: vi.fn().mockResolvedValue([]),
  fetchServiceDetailSummary: vi.fn().mockResolvedValue({
    service: { id: 'svc-a', name: 'checkout', status: 'running', health: 'healthy' },
    summary: {}
  }),
  fetchServiceRuntime: vi.fn().mockResolvedValue({ instances: [], ingestStatus: {} }),
  fetchTopology: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  fetchServiceInstances: vi.fn().mockResolvedValue([]),
  fetchMetricsExplorer: vi.fn().mockResolvedValue({ series: {}, requestStats: [] })
}))

vi.mock('@/api/trace', () => ({
  searchTraces: vi.fn().mockResolvedValue([]),
  getTraceDetails: vi.fn().mockResolvedValue([])
}))

vi.mock('@/api/logs', () => ({
  listExceptions: vi.fn().mockResolvedValue([]),
  searchLogsExplorer: vi.fn().mockResolvedValue({ items: [] })
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      props: ['class'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class }, slots.default?.())
      }
    })

  return {
    NCard: passthrough('section'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NSpin: passthrough('div'),
    NEmpty: defineComponent({ props: ['description'], setup: (props) => () => h('div', props.description as string) }),
    NStatistic: defineComponent({
      props: ['label', 'value'],
      setup: (props) => () => h('div', `${props.label}:${props.value}`)
    }),
    NButton: defineComponent({
      props: ['type', 'secondary', 'size'],
      emits: ['click'],
      setup(_, { emit, slots }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NTabs: passthrough('div'),
    NTabPane: passthrough('div'),
    NSpace: passthrough('div'),
    NTag: passthrough('span'),
    NProgress: passthrough('div'),
    NDrawer: passthrough('div'),
    NDrawerContent: passthrough('div'),
    NInput: defineComponent({ props: ['value'], setup: () => () => h('input') }),
    NIcon: passthrough('i'),
    NSelect: defineComponent({ props: ['value', 'options'], setup: () => () => h('select') }),
    useMessage: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() })
  }
})

vi.mock('@/shared/layout/PageHeader', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('header', slots.actions?.())
  })
}))
vi.mock('@/shared/components/TimeRangeBar', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/ServiceHealthBadge', () => ({
  default: defineComponent({ setup: () => () => h('span', 'health') })
}))
vi.mock('@/shared/components/ServiceIdentityCard', () => ({
  default: defineComponent({ setup: () => () => h('div') })
}))
vi.mock('@/components/ServiceTopology', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/DetailDrawer', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.())
  })
}))
vi.mock('@/shared/components/ResultTable', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/components/charts/LineChart', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/components/charts/BarChart', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))

describe('ServiceDetailPage', () => {
  beforeEach(() => {
    routerPush.mockClear()
  })

  it('provides a header action to return to the service catalog with current context', async () => {
    const wrapper = mount(ServiceDetailPage)
    await flushPromises()

    const backButton = wrapper.findAll('button').find((button) => button.text() === '返回服务目录')
    expect(backButton).toBeTruthy()

    await backButton!.trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      path: '/home/services',
      query: {
        timeRange: '4h',
        scope: 'tenant'
      }
    })
  })
})
