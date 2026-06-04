// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from '../pages/SettingsPage'
import { CloseBxEnum, ShowModeEnum, ThemeEnum } from '@/types/enums'

const messageApi = vi.hoisted(() => ({
  success: vi.fn()
}))

const settingStore = vi.hoisted(() => ({
  themes: {
    content: 'light',
    pattern: 'light',
    versatile: 'custom'
  },
  escClose: true,
  showMode: 0,
  tips: {
    type: 'hide',
    notTips: false
  },
  login: {
    autoLogin: false,
    autoStartup: false
  },
  page: {
    shadow: false,
    fonts: 'System',
    blur: false
  },
  setTheme: vi.fn((theme: ThemeEnum) => {
    settingStore.themes.pattern = theme
    settingStore.themes.content = theme === ThemeEnum.OS ? ThemeEnum.LIGHT : theme
  })
}))

vi.mock('@/store/setting', () => ({
  useSettingStore: () => settingStore
}))

vi.mock('@/shared/layout/PageHeader', () => ({
  default: defineComponent({
    name: 'StubPageHeader',
    props: ['title', 'subtitle'],
    setup(props, { slots }) {
      return () => h('header', {}, [h('h1', {}, props.title), h('p', {}, props.subtitle), slots.actions?.()])
    }
  })
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      props: ['class'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class }, slots.default?.())
      }
    })

  return {
    NButton: defineComponent({
      name: 'StubButton',
      emits: ['click'],
      setup(_, { emit, slots }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NCard: passthrough('section'),
    NIcon: passthrough('span'),
    NRadioButton: defineComponent({
      name: 'StubRadioButton',
      props: ['value'],
      setup(props, { slots }) {
        return () => h('button', { type: 'button', 'data-radio-value': String(props.value) }, slots.default?.())
      }
    }),
    NRadioGroup: defineComponent({
      name: 'StubRadioGroup',
      props: ['value', 'onUpdateValue'],
      emits: ['update:value'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'div',
            {
              'data-radio-group': String(props.value),
              onClick: (event: MouseEvent) => {
                const target = event.target as HTMLElement
                const rawValue = target.closest('[data-radio-value]')?.getAttribute('data-radio-value')
                if (rawValue === undefined || rawValue === null) return
                const value = /^-?\d+$/.test(rawValue) ? Number(rawValue) : rawValue
                emit('update:value', value)
                props.onUpdateValue?.(value)
              }
            },
            slots.default?.()
          )
      }
    }),
    NSwitch: defineComponent({
      name: 'StubSwitch',
      props: ['value', 'onUpdateValue'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            type: 'checkbox',
            checked: Boolean(props.value),
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked
              emit('update:value', checked)
              props.onUpdateValue?.(checked)
            }
          })
      }
    }),
    NTag: passthrough('span')
  }
})

describe('SettingsPage from top-bar avatar menu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    settingStore.themes.content = ThemeEnum.LIGHT
    settingStore.themes.pattern = ThemeEnum.LIGHT
    settingStore.themes.versatile = 'custom'
    settingStore.escClose = true
    settingStore.showMode = ShowModeEnum.ICON
    settingStore.tips.type = CloseBxEnum.HIDE
    settingStore.tips.notTips = false
    settingStore.login.autoLogin = false
    settingStore.login.autoStartup = false
    settingStore.page.shadow = false
    settingStore.page.fonts = 'System'
    settingStore.page.blur = false
    window.$message = messageApi as unknown as typeof window.$message
  })

  it('renders and updates the settings exposed by the top-bar settings entry', async () => {
    const wrapper = mount(SettingsPage)

    expect(wrapper.text()).toContain('应用设置')
    expect(wrapper.text()).toContain('管理 StarLight 客户端的显示、窗口、登录与启动偏好。')

    await wrapper.find('button[data-radio-value="dark"]').trigger('click')
    expect(settingStore.setTheme).toHaveBeenCalledWith(ThemeEnum.DARK)

    await wrapper.find('button[data-radio-value="1"]').trigger('click')
    expect(settingStore.showMode).toBe(ShowModeEnum.TEXT)

    await wrapper.find('button[data-radio-value="close"]').trigger('click')
    expect(settingStore.tips.type).toBe(CloseBxEnum.CLOSE)

    const switches = wrapper.findAll('input[type="checkbox"]')
    await switches[0].setValue(true)
    await switches[1].setValue(true)
    await switches[2].setValue(true)
    await switches[3].setValue(true)
    await switches[4].setValue(true)
    await switches[5].setValue(true)

    expect(settingStore.page.shadow).toBe(true)
    expect(settingStore.page.blur).toBe(true)
    expect(settingStore.tips.notTips).toBe(true)
    expect(settingStore.escClose).toBe(true)
    expect(settingStore.login.autoLogin).toBe(true)
    expect(settingStore.login.autoStartup).toBe(true)
  })

  it('resets interface settings to the documented defaults', async () => {
    const wrapper = mount(SettingsPage)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '恢复界面默认')!
      .trigger('click')

    expect(settingStore.setTheme).toHaveBeenCalledWith(ThemeEnum.OS)
    expect(settingStore.themes.versatile).toBe('default')
    expect(settingStore.showMode).toBe(ShowModeEnum.ICON)
    expect(settingStore.page.shadow).toBe(true)
    expect(settingStore.page.blur).toBe(true)
    expect(settingStore.page.fonts).toBe('PingFang')
    expect(messageApi.success).toHaveBeenCalledWith('界面设置已恢复默认')
  })
})
