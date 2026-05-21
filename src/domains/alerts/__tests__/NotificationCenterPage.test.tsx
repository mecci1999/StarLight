// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationCenterPage from '../pages/NotificationCenterPage'

const apiMocks = vi.hoisted(() => ({
  fetchNotifications: vi.fn(),
  resendNotification: vi.fn()
}))

vi.mock('@/api/alerts', () => ({
  fetchNotifications: apiMocks.fetchNotifications,
  resendNotification: apiMocks.resendNotification
}))

const routeState = vi.hoisted(() => ({ query: {} as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => routeState
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
    NTag: passthrough('span'),
    NSpace: passthrough('div'),
    NButton: defineComponent({
      props: ['disabled', 'type', 'secondary'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
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
    NDatePicker: defineComponent({
      props: ['value'],
      setup: () => () => h('input')
    }),
    NDescriptions: passthrough('div'),
    NDescriptionsItem: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        return () => h('div', {}, [props.label, slots.default?.()])
      }
    }),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NEmpty: defineComponent({
      props: ['description'],
      setup(props, { slots }) {
        return () => h('div', {}, [props.description, slots.extra?.(), slots.default?.()])
      }
    })
  }
})

vi.mock('@/shared/layout/PageHeader', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/TimeRangeBar', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))
vi.mock('@/shared/components/ResultTable', () => ({
  default: defineComponent({
    props: ['data'],
    setup(props) {
      return () =>
        h('div', {}, [
          'table',
          ...(props.data || []).map((row: any) => h('div', {}, [row.ruleName, row.channel, row.status].join(' ')))
        ])
    }
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

describe('NotificationCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {}
  })

  it('shows persistent retry state when notification history loading fails', async () => {
    apiMocks.fetchNotifications.mockRejectedValue(new Error('network failed'))

    const wrapper = mount(NotificationCenterPage)
    await flushPromises()

    expect(wrapper.text()).toContain('通知历史加载失败，请检查告警服务或稍后重试。')
    expect(wrapper.text()).toContain('重试加载')
  })

  it('passes serviceId route context to backend without forcing local keyword filtering', async () => {
    routeState.query = { serviceId: 'svc-id-1' }
    apiMocks.fetchNotifications.mockResolvedValue([
      {
        id: 'n1',
        sentAt: 'now',
        type: 'CPU 告警',
        service: 'gateway',
        channel: 'email',
        target: 'ops@example.com',
        status: 'sent',
        content: 'delivered'
      }
    ])

    const wrapper = mount(NotificationCenterPage)
    await flushPromises()

    expect(apiMocks.fetchNotifications).toHaveBeenCalledWith(expect.objectContaining({ serviceId: 'svc-id-1' }))
    expect(wrapper.text()).toContain('CPU 告警')
  })

  it('renders unexpected backend channel and status values safely', async () => {
    apiMocks.fetchNotifications.mockResolvedValue([
      {
        id: 'n2',
        sentAt: 'now',
        type: '未知渠道通知',
        service: 'gateway',
        channel: 'pagerduty',
        target: 'ops@example.com',
        status: 'queued',
        content: 'queued'
      }
    ])

    const wrapper = mount(NotificationCenterPage)
    await flushPromises()

    expect(wrapper.text()).toContain('pagerduty')
    expect(wrapper.text()).toContain('queued')
  })
})
