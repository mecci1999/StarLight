// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Step5Verify from '../Step5_Verify'

const apiMocks = vi.hoisted(() => ({
  verifyAppKey: vi.fn()
}))

const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value))
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  })
}

vi.mock('@/api', () => apiMocks)
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
    NIcon: passthrough('span'),
    NSpin: passthrough('div'),
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
      props: ['disabled', 'loading', 'type', 'secondary', 'size', 'iconPlacement'],
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
    })
  }
})

describe('Onboarding Step5 verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    storage.clear()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows missing credential guidance without calling verify endpoint', async () => {
    const wrapper = mount(Step5Verify)
    await flushPromises()

    expect(wrapper.text()).toContain('未检测到凭证')
    expect(apiMocks.verifyAppKey).not.toHaveBeenCalled()
  })

  it('transitions to success after app key verification passes', async () => {
    localStorageMock.setItem('starlight_onboarding_appkey', 'app-key-1')
    localStorageMock.setItem('starlight_onboarding_appsecret', 'app-secret-1')
    apiMocks.verifyAppKey.mockResolvedValue({ valid: true })

    const wrapper = mount(Step5Verify)

    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    expect(apiMocks.verifyAppKey).toHaveBeenCalledWith({
      appKey: 'app-key-1',
      appSecret: 'app-secret-1'
    })
    expect(wrapper.text()).toContain('接入成功！')
  })

  it('allows retry after timing out on invalid credentials', async () => {
    localStorageMock.setItem('starlight_onboarding_appkey', 'app-key-2')
    localStorageMock.setItem('starlight_onboarding_appsecret', 'app-secret-2')
    apiMocks.verifyAppKey.mockResolvedValue({ valid: false })

    const wrapper = mount(Step5Verify)

    await vi.advanceTimersByTimeAsync(18 * 5000)
    await flushPromises()

    expect(wrapper.text()).toContain('凭证暂未通过验证')

    const retryButton = wrapper.findAll('button').find((item) => item.text() === '重试')
    expect(retryButton).toBeTruthy()

    await retryButton!.trigger('click')
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    expect(apiMocks.verifyAppKey).toHaveBeenCalledTimes(19)
  })
})
