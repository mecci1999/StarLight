// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OnboardingNotice from '../OnboardingNotice'

const apiMocks = vi.hoisted(() => ({
  getUserInfo: vi.fn()
}))

const authSessionMocks = vi.hoisted(() => ({
  getStoredUserInfo: vi.fn(),
  persistStoredUserInfo: vi.fn()
}))

const routerPush = vi.hoisted(() => vi.fn())

vi.mock('@/api', () => apiMocks)
vi.mock('@/services/authSession', () => authSessionMocks)
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush
  })
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
    NResult: defineComponent({
      name: 'StubResult',
      props: ['title', 'description', 'status'],
      setup(props, { slots }) {
        return () =>
          h('div', {}, [
            h('div', {}, props.title),
            h('div', {}, props.description),
            slots.default?.(),
            slots.footer?.()
          ])
      }
    }),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['disabled', 'loading', 'type'],
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
    NFlex: passthrough('div')
  }
})

describe('Mobile onboarding notice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      isAdmin: false,
      email: 'demo@example.com'
    })
  })

  it('routes to mobile home after refreshed completed onboarding state', async () => {
    apiMocks.getUserInfo.mockResolvedValue({
      isOnboardingCompleted: true,
      isAdmin: false,
      nickName: 'Demo'
    })

    const wrapper = mount(OnboardingNotice)

    const button = wrapper.findAll('button').find((item) => item.text() === '我已完成接入，进入首页')
    expect(button).toBeTruthy()

    await button!.trigger('click')
    await flushPromises()

    expect(apiMocks.getUserInfo).toHaveBeenCalledWith('user-1')
    expect(authSessionMocks.persistStoredUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        isOnboardingCompleted: true,
        nickName: 'Demo'
      })
    )
    expect(routerPush).toHaveBeenCalledWith('/mobile/home')
  })

  it('falls back to login when onboarding remains incomplete', async () => {
    apiMocks.getUserInfo.mockResolvedValue({
      isOnboardingCompleted: false,
      isAdmin: false
    })

    const wrapper = mount(OnboardingNotice)

    const button = wrapper.findAll('button').find((item) => item.text() === '我已完成接入，进入首页')
    expect(button).toBeTruthy()

    await button!.trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith('/login')
  })

  it('falls back to login when refreshing onboarding state fails', async () => {
    apiMocks.getUserInfo.mockRejectedValue(new Error('network error'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(OnboardingNotice)

    const button = wrapper.findAll('button').find((item) => item.text() === '我已完成接入，进入首页')
    expect(button).toBeTruthy()

    await button!.trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith('/login')
    warnSpy.mockRestore()
  })
})
