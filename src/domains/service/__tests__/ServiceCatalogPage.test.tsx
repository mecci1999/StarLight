// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ServiceCatalogPage from '../pages/ServiceCatalogPage'

const apiMocks = vi.hoisted(() => ({
  fetchCatalogServices: vi.fn(),
  fetchCatalogServicesSummary: vi.fn(),
  fetchCatalogServiceQuickView: vi.fn()
}))

vi.mock('@/api', () => ({
  fetchCatalogServices: apiMocks.fetchCatalogServices,
  fetchCatalogServicesSummary: apiMocks.fetchCatalogServicesSummary,
  fetchCatalogServiceQuickView: apiMocks.fetchCatalogServiceQuickView
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} })
}))

vi.mock('@/store/useTimeStore', () => ({
  useTimeStore: () => ({
    timeRange: '1h',
    isLive: false,
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
    NButton: defineComponent({
      props: ['type', 'secondary'],
      emits: ['click'],
      setup(_, { emit, slots }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NCard: passthrough('div'),
    NEmpty: defineComponent({
      props: ['description'],
      setup(props, { slots }) {
        return () => h('div', {}, [props.description, slots.extra?.(), slots.default?.()])
      }
    }),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NSpin: passthrough('div'),
    NStatistic: defineComponent({
      props: ['label', 'value'],
      setup(props) {
        return () => h('div', {}, `${props.label}:${props.value}`)
      }
    }),
    NInput: defineComponent({
      props: ['value', 'placeholder'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            value: props.value,
            placeholder: props.placeholder,
            onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
          })
      }
    }),
    NSelect: defineComponent({
      props: ['value', 'options'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h(
            'select',
            {
              value: props.value,
              onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value)
            },
            (props.options || []).map((option: any) => h('option', { value: option.value }, option.label))
          )
      }
    }),
    NSpace: passthrough('div'),
    NTag: passthrough('span'),
    useMessage: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() })
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
vi.mock('@/shared/components/ResultTable', () => ({
  default: defineComponent({
    props: ['columns', 'scrollX', 'maxHeight', 'flexHeight'],
    setup: (props) => () =>
      h(
        'div',
        {
          'data-scroll-x': props.scrollX,
          'data-max-height': props.maxHeight,
          'data-flex-height': String(props.flexHeight)
        },
        [
          'table',
          JSON.stringify(
            (props.columns || []).map((column: any) => ({ key: column.key, fixed: column.fixed, width: column.width }))
          )
        ]
      )
  })
}))
vi.mock('@/shared/components/DetailDrawer', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', {}, slots.default?.())
  })
}))
vi.mock('@/shared/components/ServiceHealthBadge', () => ({
  default: defineComponent({ setup: () => () => h('span', {}, 'health') })
}))

describe('ServiceCatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.fetchCatalogServicesSummary.mockResolvedValue({})
  })

  it('shows persistent retry state when service catalog loading fails', async () => {
    apiMocks.fetchCatalogServices.mockRejectedValue(new Error('network failed'))

    const wrapper = mount(ServiceCatalogPage)
    await flushPromises()

    expect(wrapper.text()).toContain('服务目录加载失败，请检查后端服务或稍后重试。')
    expect(wrapper.text()).toContain('重试加载')
    expect(wrapper.text()).toContain('总服务数:未知')
  })

  it('configures service catalog table with fixed service and action columns', async () => {
    apiMocks.fetchCatalogServices.mockResolvedValue({
      items: [
        {
          identity: { id: 'svc-a', name: 'checkout', owner: 'ops', team: 'core', env: 'prod', region: 'cn' },
          qps: 12,
          p95Latency: 80,
          errorRate: 0.1,
          activeIncidentCount: 0,
          instanceCount: 3
        }
      ]
    })

    const wrapper = mount(ServiceCatalogPage)
    await flushPromises()

    const table = wrapper.find('[data-scroll-x="1940"]')
    expect(table.exists()).toBe(true)
    expect(wrapper.find('.service-catalog-page__table-scroll').exists()).toBe(true)
    expect(table.attributes('data-max-height')).toBe('max(360px, calc(100vh - 420px))')
    expect(table.attributes('data-flex-height')).toBe('false')
    expect(table.text()).toContain('"key":"name","fixed":"left","width":220')
    expect(table.text()).toContain('"key":"actions","fixed":"right","width":420')
  })

  it('keeps the page vertically scrollable while confining wide tables', () => {
    const styles = readFileSync(resolve(__dirname, '../pages/ServiceCatalogPage.scss'), 'utf-8')

    expect(styles).toContain('height: 100%;')
    expect(styles).toContain('min-height: 0;')
    expect(styles).toContain('overflow-y: auto;')
    expect(styles).toContain('overflow-x: auto;')
    expect(styles).not.toContain('linear-gradient')
  })
})
