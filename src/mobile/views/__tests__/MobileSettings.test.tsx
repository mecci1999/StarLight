// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobileSettings from '../MobileSettings'

const getVersion = vi.hoisted(() => vi.fn())
const isTauri = vi.hoisted(() => vi.fn())
const getClientNotificationPermission = vi.hoisted(() => vi.fn())
const canOpenClientNotificationSettings = vi.hoisted(() => vi.fn())
const openClientNotificationSettings = vi.hoisted(() => vi.fn())
const requestClientNotificationPermission = vi.hoisted(() => vi.fn())
const mobileFeedback = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn() }))

vi.mock('@tauri-apps/api/app', () => ({ getVersion }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri }))
vi.mock('@/services/clientNotifications', () => ({
  getClientNotificationPermission,
  canOpenClientNotificationSettings,
  openClientNotificationSettings,
  requestClientNotificationPermission
}))
vi.mock('@/mobile/services/mobileFeedback', () => ({ mobileFeedback }))
vi.mock('@/store/setting', () => ({
  useSettingStore: () => ({
    themes: { pattern: 'os', content: 'light', versatile: 'default' },
    page: { shadow: true, blur: true, fonts: 'PingFang' },
    login: { autoLogin: true },
    showMode: 'icon',
    setTheme: vi.fn()
  })
}))
vi.mock('@/mobile/ui', () => {
  const passthrough = (name: string) =>
    defineComponent({
      name,
      setup(_, { slots }) {
        return () => h('div', {}, slots.default?.())
      }
    })

  const button = defineComponent({
    name: 'MobileButton',
    setup(_, { attrs, slots }) {
      return () => h('button', { ...attrs, class: 'mobile-button' }, slots.default?.())
    }
  })

  return {
    MobileButton: button,
    MobileCard: passthrough('MobileCard'),
    MobileList: passthrough('MobileList'),
    MobileListItem: passthrough('MobileListItem'),
    MobileSheet: passthrough('MobileSheet'),
    MobileRadio: passthrough('MobileRadio'),
    MobileSwitch: passthrough('MobileSwitch')
  }
})

describe('MobileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isTauri.mockReturnValue(false)
    canOpenClientNotificationSettings.mockReturnValue(false)
    getClientNotificationPermission.mockResolvedValue({ status: 'not-requested' })
  })

  it('displays the installed Tauri application version in the About section', async () => {
    isTauri.mockReturnValue(true)
    getVersion.mockResolvedValue('0.1.16')

    const wrapper = mount(MobileSettings)
    await flushPromises()

    const version = wrapper.get('output[aria-label="当前应用版本 0.1.16"]')
    expect(version.text()).toBe('v0.1.16')
    expect(getVersion).toHaveBeenCalledTimes(1)
  })

  it('requests system notification permission only after the user taps the action', async () => {
    requestClientNotificationPermission.mockResolvedValue({ status: 'granted' })

    const wrapper = mount(MobileSettings)
    await flushPromises()

    expect(requestClientNotificationPermission).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('状态：未请求，应用内通知始终可用')

    await wrapper.get('.mobile-settings__notification-row .mobile-button').trigger('click')
    await flushPromises()

    expect(requestClientNotificationPermission).toHaveBeenCalledTimes(1)
    expect(mobileFeedback.success).toHaveBeenCalledWith('系统通知已开启')
    expect(wrapper.text()).toContain('状态：已允许，应用内通知始终可用')
  })

  it('keeps the in-app notification fallback clear when permission is denied or unavailable', async () => {
    requestClientNotificationPermission.mockResolvedValue({ status: 'denied' })
    const wrapper = mount(MobileSettings)
    await flushPromises()

    await wrapper.get('.mobile-settings__notification-row .mobile-button').trigger('click')
    await flushPromises()

    expect(mobileFeedback.warning).toHaveBeenCalledWith('系统通知未开启，应用内通知仍会正常显示')
    expect(wrapper.text()).toContain('状态：未允许，应用内通知始终可用')
  })

  it('recovers a denied iOS notification state on remount and opens Settings only after its action is tapped', async () => {
    isTauri.mockReturnValue(true)
    canOpenClientNotificationSettings.mockReturnValue(true)
    getClientNotificationPermission.mockResolvedValue({ status: 'denied' })
    openClientNotificationSettings.mockResolvedValue(true)

    const firstMount = mount(MobileSettings)
    await flushPromises()
    firstMount.unmount()

    const wrapper = mount(MobileSettings)
    await flushPromises()

    const action = wrapper.get('.mobile-settings__notification-row .mobile-button')
    expect(action.text()).toBe('前往系统设置')
    expect(openClientNotificationSettings).not.toHaveBeenCalled()
    expect(requestClientNotificationPermission).not.toHaveBeenCalled()

    await action.trigger('click')
    await flushPromises()

    expect(openClientNotificationSettings).toHaveBeenCalledTimes(1)
    expect(requestClientNotificationPermission).not.toHaveBeenCalled()
  })

  it('retries permission instead of exposing iOS Settings when that bridge is unavailable', async () => {
    isTauri.mockReturnValue(true)
    getClientNotificationPermission.mockResolvedValue({ status: 'denied' })
    requestClientNotificationPermission.mockResolvedValue({ status: 'request-failed' })
    const wrapper = mount(MobileSettings)
    await flushPromises()

    const action = wrapper.get('.mobile-settings__notification-row .mobile-button')
    expect(action.text()).toBe('开启通知')
    await action.trigger('click')
    await flushPromises()

    expect(requestClientNotificationPermission).toHaveBeenCalledTimes(1)
    expect(openClientNotificationSettings).not.toHaveBeenCalled()
  })
})
