// @vitest-environment jsdom
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Forget from '../forget'

const apiMocks = vi.hoisted(() => ({
  forgetPassword: vi.fn(),
  verifyCode: vi.fn()
}))

const messageApi = vi.hoisted(() => ({
  create: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  destroyAll: vi.fn()
}))

vi.mock('@/api', () => apiMocks)
vi.mock('@/utils/Crypto', () => ({
  encryptPassword: vi.fn(() => 'hashed-password')
}))
vi.mock('@vueuse/core', () => ({
  useNetwork: () => ({
    isOnline: ref(true)
  })
}))
vi.mock('lodash-es', () => ({
  throttle: (fn: (...args: any[]) => any) => fn
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
    NFlex: passthrough('div'),
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
    NInput: defineComponent({
      name: 'StubInput',
      props: ['value', 'placeholder', 'type', 'clearable', 'maxlength', 'minlength', 'showPasswordOn'],
      emits: ['update:value', 'updateValue', 'blur'],
      setup(props, { emit, slots }) {
        return () =>
          h('div', {}, [
            h('input', {
              value: props.value,
              placeholder: props.placeholder,
              type: props.type || 'text',
              onInput: (event: Event) => {
                const value = (event.target as HTMLInputElement).value
                emit('update:value', value)
                emit('updateValue', value)
              },
              onBlur: () => emit('blur')
            }),
            slots.suffix?.()
          ])
      }
    })
  }
})

describe('Forget password mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    window.$message = messageApi
    apiMocks.verifyCode.mockResolvedValue({})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('submits valid reset data to forgetPassword and emits login on success', async () => {
    apiMocks.forgetPassword.mockResolvedValue({})

    const wrapper = mount(Forget, {
      props: {
        protocol: true
      }
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('demo@example.com')
    await inputs[1].setValue('abc123')
    await inputs[2].setValue('abc123')
    await inputs[3].setValue('123456')
    await flushPromises()

    const resetButton = wrapper.findAll('button').find((item) => item.text() === '重置密码')
    expect(resetButton).toBeTruthy()

    await resetButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.forgetPassword).toHaveBeenCalledWith({
      email: 'demo@example.com',
      hash: 'hashed-password',
      code: '123456'
    })
    expect(messageApi.success).toHaveBeenCalledWith('密码重置成功，跳转到登录页面')

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.emitted('switchMode')).toEqual([['login']])
  })

  it('does not emit login when forgetPassword fails', async () => {
    apiMocks.forgetPassword.mockRejectedValue(new Error('reset failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(Forget, {
      props: {
        protocol: true
      }
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('demo@example.com')
    await inputs[1].setValue('abc123')
    await inputs[2].setValue('abc123')
    await inputs[3].setValue('123456')
    await flushPromises()

    const resetButton = wrapper.findAll('button').find((item) => item.text() === '重置密码')
    expect(resetButton).toBeTruthy()

    await resetButton!.trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1000)

    expect(apiMocks.forgetPassword).toHaveBeenCalledTimes(1)
    expect(messageApi.success).not.toHaveBeenCalled()
    expect(wrapper.emitted('switchMode')).toBeUndefined()

    errorSpy.mockRestore()
  })
})
