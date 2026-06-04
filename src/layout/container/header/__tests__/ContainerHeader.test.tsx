// @vitest-environment jsdom
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContainerHeader from '../index'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}))

const apiMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  fetchNotifications: vi.fn(),
  resendNotification: vi.fn()
}))

const sessionMocks = vi.hoisted(() => ({
  clearStoredAuthSession: vi.fn(),
  getStoredUserInfo: vi.fn(),
  getMetricsDatasetScopeLabel: vi.fn()
}))

const messageMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => routerMock
}))

vi.mock('@/api/auth', () => ({
  logout: apiMocks.logout
}))

vi.mock('@/api/alerts', () => ({
  fetchNotifications: apiMocks.fetchNotifications,
  resendNotification: apiMocks.resendNotification
}))

vi.mock('@/services/authSession', () => ({
  clearStoredAuthSession: sessionMocks.clearStoredAuthSession,
  getStoredUserInfo: sessionMocks.getStoredUserInfo,
  getMetricsDatasetScopeLabel: sessionMocks.getMetricsDatasetScopeLabel
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      props: ['class', 'ariaLabel'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class, 'aria-label': props.ariaLabel }, slots.default?.())
      }
    })

  return {
    NAvatar: defineComponent({
      name: 'StubAvatar',
      props: ['src', 'class'],
      setup(props, { slots }) {
        return () => h('span', { class: props.class, 'data-src': props.src || '' }, slots.default?.())
      }
    }),
    NBadge: defineComponent({
      name: 'StubBadge',
      props: ['value', 'dot', 'max'],
      setup(props, { slots }) {
        return () =>
          h(
            'span',
            { 'data-badge-value': props.value || '', 'data-badge-dot': String(Boolean(props.dot)) },
            slots.default?.()
          )
      }
    }),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['ariaLabel', 'loading', 'disabled'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              'aria-label': props.ariaLabel,
              'data-loading': String(Boolean(props.loading)),
              disabled: props.disabled,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    }),
    NDivider: passthrough('hr'),
    NEmpty: defineComponent({
      name: 'StubEmpty',
      props: ['description', 'class'],
      setup(props, { slots }) {
        return () => h('div', { class: props.class }, [props.description, slots.extra?.(), slots.default?.()])
      }
    }),
    NIcon: defineComponent({
      name: 'StubIcon',
      props: ['component', 'class'],
      setup(props, { slots }) {
        return () => h('span', { class: props.class }, slots.default?.() || (props.component ? 'icon' : undefined))
      }
    }),
    NInput: defineComponent({
      name: 'StubInput',
      props: ['value', 'placeholder'],
      emits: ['update:value', 'keydown'],
      setup(props, { emit, slots }) {
        return () =>
          h('div', {}, [
            slots.prefix?.(),
            h('input', {
              value: props.value,
              placeholder: props.placeholder,
              onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value),
              onKeydown: (event: KeyboardEvent) => emit('keydown', event)
            }),
            slots.suffix?.()
          ])
      }
    }),
    NPopover: defineComponent({
      name: 'StubPopover',
      props: ['show'],
      emits: ['update:show'],
      setup(props, { emit, slots }) {
        return () =>
          h('div', { 'data-component': 'popover' }, [
            h('div', { onClick: () => emit('update:show', true) }, slots.trigger?.()),
            h('div', { 'data-popover-open': String(props.show ?? true) }, slots.default?.())
          ])
      }
    }),
    NSpin: passthrough('span'),
    NTag: defineComponent({
      name: 'StubTag',
      props: ['type'],
      setup(props, { slots }) {
        return () => h('span', { 'data-tag-type': props.type || '' }, slots.default?.())
      }
    })
  }
})

describe('ContainerHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.push.mockResolvedValue(undefined)
    routerMock.replace.mockResolvedValue(undefined)
    apiMocks.logout.mockResolvedValue(undefined)
    apiMocks.fetchNotifications.mockResolvedValue([])
    apiMocks.resendNotification.mockResolvedValue(true)
    sessionMocks.getStoredUserInfo.mockReturnValue({
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true
    })
    sessionMocks.getMetricsDatasetScopeLabel.mockReturnValue('Darwin 系统')
    sessionMocks.clearStoredAuthSession.mockImplementation(() => {})
    window.$message = messageMock as unknown as typeof window.$message
  })

  it('routes global search keywords to the matching investigation pages', async () => {
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const input = wrapper.get('input[placeholder="搜索服务、日志、链路、指标或告警…"]')
    await input.setValue('trace abc')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/traces',
      query: { keyword: 'trace abc' }
    })

    await input.setValue('CPU usage')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/metrics',
      query: { keyword: 'CPU usage' }
    })

    await input.setValue('链路 abc')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/traces',
      query: { keyword: '链路 abc' }
    })

    await input.setValue('日志 error')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/logs',
      query: { keyword: '日志 error' }
    })

    await input.setValue('指标 cpu')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/metrics',
      query: { keyword: '指标 cpu' }
    })

    await input.setValue('gateway service')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({ path: '/home/services', query: { keyword: 'gateway service' } })
  })

  it('supports command-k focus without breaking the desktop drag-safe header shell', async () => {
    const wrapper = mount(ContainerHeader, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.get('.container-header').attributes('data-tauri-drag-region')).toBe('true')
    expect(wrapper.get('.header-search').classes()).toContain('no-drag')
    expect(wrapper.get('.header-actions').classes()).toContain('no-drag')

    const input = wrapper.get('input[placeholder="搜索服务、日志、链路、指标或告警…"]').element as HTMLInputElement
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    await nextTick()

    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('loads notification state, exposes failed retries, and refreshes after resend', async () => {
    apiMocks.fetchNotifications.mockResolvedValueOnce([
      {
        id: 'n1',
        sentAt: '2026-06-02 10:00',
        type: 'CPU 告警',
        service: 'gateway',
        channel: 'email',
        target: 'ops@example.com',
        status: 'failed',
        content: 'CPU too high',
        errorMessage: 'SMTP rejected',
        retryCount: 1
      }
    ])
    apiMocks.fetchNotifications.mockResolvedValueOnce([
      {
        id: 'n1',
        sentAt: '2026-06-02 10:01',
        type: 'CPU 告警',
        service: 'gateway',
        channel: 'email',
        target: 'ops@example.com',
        status: 'sent',
        content: 'delivered',
        retryCount: 2
      }
    ])

    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(apiMocks.fetchNotifications).toHaveBeenCalledWith()
    expect(wrapper.text()).toContain('1 条失败，0 条发送中')
    expect(wrapper.text()).toContain('CPU 告警')
    expect(wrapper.text()).toContain('SMTP rejected')

    const resendButton = wrapper.findAll('button').find((button) => button.text() === '重发')
    expect(resendButton).toBeTruthy()
    await resendButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.resendNotification).toHaveBeenCalledWith('n1')
    expect(messageMock.success).toHaveBeenCalledWith('通知已重新发送')
    expect(wrapper.text()).toContain('最近通知状态正常')
  })

  it('keeps the notification popover actionable when loading fails', async () => {
    apiMocks.fetchNotifications.mockRejectedValue(new Error('network failed'))

    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.text()).toContain('通知状态暂不可用')
    expect(wrapper.text()).toContain('通知加载失败，请稍后重试。')
    expect(wrapper.text()).toContain('重新加载')
  })

  it('shows account context and routes avatar menu actions including logout', async () => {
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.text()).toContain('Ops Admin')
    expect(wrapper.text()).toContain('ops@example.com')
    expect(wrapper.text()).toContain('管理员')
    expect(wrapper.text()).toContain('Darwin 系统')

    const settingsButton = wrapper.findAll('button').find((button) => button.text().includes('应用设置'))
    expect(settingsButton).toBeTruthy()
    await settingsButton!.trigger('click')
    expect(routerMock.push).toHaveBeenLastCalledWith('/home/settings')

    const logoutButton = wrapper.findAll('button').find((button) => button.text().includes('退出登录'))
    expect(logoutButton).toBeTruthy()
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.logout).toHaveBeenCalled()
    expect(sessionMocks.clearStoredAuthSession).toHaveBeenCalled()
    expect(routerMock.replace).toHaveBeenCalledWith('/login')
  })
})
