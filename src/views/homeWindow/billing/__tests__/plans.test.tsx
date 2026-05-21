import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Plans from '../plans'

const subscriptionApi = vi.hoisted(() => ({
  getSubscriptionCurrentDetail: vi.fn(),
  getSubscriptionHistory: vi.fn(),
  getPaymentMethods: vi.fn(),
  subscribe: vi.fn(),
  createPaymentOrder: vi.fn(),
  upgradeSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  resumeSubscription: vi.fn()
}))

const messageApi = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn()
}))

vi.mock('@/api/subscription', () => subscriptionApi)

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
    NList: passthrough('div'),
    NListItem: passthrough('div'),
    NIcon: passthrough('span'),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['disabled', 'loading', 'type', 'secondary', 'block'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              disabled: props.disabled,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    }),
    useMessage: () => messageApi
  }
})

describe('Billing plans lifecycle actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subscriptionApi.getPaymentMethods.mockResolvedValue({
      methods: [{ id: 'stripe', enabled: true, name: 'stripe', displayName: 'Stripe', supportedCurrencies: ['USD'] }]
    })
    subscriptionApi.getSubscriptionHistory.mockResolvedValue({ subscriptions: [], total: 0 })
    subscriptionApi.upgradeSubscription.mockResolvedValue({ requiresPayment: false })
    subscriptionApi.cancelSubscription.mockResolvedValue({})
    subscriptionApi.resumeSubscription.mockResolvedValue({})
    subscriptionApi.subscribe.mockResolvedValue({})
    subscriptionApi.createPaymentOrder.mockResolvedValue({ paymentUrl: 'http://example.test/pay' })
    vi.stubGlobal('open', vi.fn())
  })

  it('uses upgrade endpoint for active subscription moving to higher plan', async () => {
    subscriptionApi.getSubscriptionCurrentDetail.mockResolvedValue({
      plan: { name: 'free' },
      subscription: { status: 'active' }
    })

    const wrapper = mount(Plans)
    await flushPromises()

    const upgradeButton = wrapper.findAll('button').find((button) => button.text() === '升级套餐')
    expect(upgradeButton).toBeTruthy()
    await upgradeButton!.trigger('click')
    await flushPromises()

    expect(subscriptionApi.upgradeSubscription).toHaveBeenCalledWith({
      targetPlan: 'pro',
      paymentMethodId: 'stripe',
      upgradeType: 'immediate'
    })
    expect(subscriptionApi.createPaymentOrder).not.toHaveBeenCalled()
  })

  it('uses resume endpoint for cancelled current plan', async () => {
    subscriptionApi.getSubscriptionCurrentDetail.mockRejectedValue(new Error('no active subscription'))
    subscriptionApi.getSubscriptionHistory.mockResolvedValue({
      subscriptions: [
        {
          id: 'sub_cancelled',
          planName: 'pro',
          status: 'cancelled',
          autoRenew: false
        }
      ],
      total: 1
    })

    const wrapper = mount(Plans)
    await flushPromises()

    const resumeButton = wrapper.findAll('button').find((button) => button.text() === '恢复订阅')
    expect(resumeButton).toBeTruthy()
    await resumeButton!.trigger('click')
    await flushPromises()

    expect(subscriptionApi.resumeSubscription).toHaveBeenCalledTimes(1)
  })

  it('exposes cancel action for active paid current plan', async () => {
    subscriptionApi.getSubscriptionCurrentDetail.mockResolvedValue({
      plan: { name: 'pro' },
      subscription: { status: 'active' }
    })

    const wrapper = mount(Plans)
    await flushPromises()

    const cancelButton = wrapper.findAll('button').find((button) => button.text() === '取消订阅')
    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await flushPromises()

    expect(subscriptionApi.cancelSubscription).toHaveBeenCalledWith({ cancelType: 'end_of_period' })
  })
})
