// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TraceExplorerPage from '../pages/TraceExplorerPage'

const apiMocks = vi.hoisted(() => ({
  searchTraces: vi.fn(),
  getTraceDetails: vi.fn(),
  fetchCatalogServices: vi.fn()
}))

vi.mock('@/api/trace', () => ({
  searchTraces: apiMocks.searchTraces,
  getTraceDetails: apiMocks.getTraceDetails
}))

vi.mock('@/api/metrics', () => ({
  fetchCatalogServices: apiMocks.fetchCatalogServices
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { serviceId: 'system:metrics' } }),
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/store/useTimeStore', () => ({
  useTimeStore: () => ({
    timeRange: '1h',
    startTime: 1,
    endTime: 2,
    isLive: false,
    timeOptions: [{ label: '1 小时', value: '1h' }],
    setTimeRange: vi.fn(),
    refreshTime: vi.fn()
  })
}))

vi.mock('@/services/authSession', () => ({
  getStoredUserInfo: () => ({ isAdmin: true })
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
    NTag: passthrough('span'),
    NSpin: passthrough('div'),
    NEmpty: defineComponent({ props: ['description'], setup: (props) => () => h('div', props.description as string) }),
    NDrawer: passthrough('div'),
    NDrawerContent: passthrough('div'),
    NButton: defineComponent({
      props: ['loading', 'disabled'],
      setup:
        (props, { slots }) =>
        () =>
          h('button', { disabled: props.disabled }, slots.default?.())
    }),
    NSpace: passthrough('div'),
    NInput: defineComponent({
      props: ['value', 'placeholder'],
      setup: (props) => () => h('input', { value: props.value, placeholder: props.placeholder })
    }),
    NSelect: defineComponent({ props: ['value', 'options'], setup: () => () => h('select') }),
    NIcon: passthrough('i'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    useMessage: () => ({ error: vi.fn() })
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
vi.mock('@/components/charts/BarChart', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/ResultTable', () => ({
  default: defineComponent({
    props: ['data', 'maxHeight', 'flexHeight'],
    setup: (props) => () =>
      h('div', { 'data-max-height': props.maxHeight, 'data-flex-height': String(props.flexHeight) }, 'table')
  })
}))

describe('TraceExplorerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.searchTraces.mockResolvedValue([])
    apiMocks.fetchCatalogServices.mockResolvedValue({ items: [] })
  })

  it('loads traces with clean base params and configures table vertical scroll', async () => {
    const wrapper = mount(TraceExplorerPage)
    await flushPromises()

    expect(apiMocks.searchTraces).toHaveBeenCalledWith({
      startTime: 1,
      endTime: 2,
      service: 'metrics',
      traceId: undefined,
      operation: undefined,
      limit: 100,
      originType: 'darwin-app'
    })
    const table = wrapper.find('[data-max-height="max(360px, calc(100vh - 520px))"]')
    expect(table.exists()).toBe(true)
    expect(table.attributes('data-flex-height')).toBe('false')
    expect(wrapper.text()).toContain('服务：metrics')
  })
})
