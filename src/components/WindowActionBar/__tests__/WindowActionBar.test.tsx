// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WindowActionBar from '../index'

const windowMock = vi.hoisted(() => ({
  label: 'home',
  listen: vi.fn(() => Promise.resolve(() => {})),
  setAlwaysOnTop: vi.fn(() => Promise.resolve()),
  minimize: vi.fn(() => Promise.resolve()),
  maximize: vi.fn(() => Promise.resolve()),
  unmaximize: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  hide: vi.fn(() => Promise.resolve()),
  isMaximizable: vi.fn(() => Promise.resolve(false))
}))

const topState = vi.hoisted(() => ({ value: false }))
const settingState = vi.hoisted(() => ({
  tips: {
    type: 0,
    notTips: false
  },
  escClose: false
}))

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  WebviewWindow: {
    getCurrent: () => windowMock
  }
}))

vi.mock('@tauri-apps/api/event', () => ({
  emit: vi.fn(() => Promise.resolve())
}))

vi.mock('@tauri-apps/plugin-os', () => ({
  type: () => 'windows'
}))

vi.mock('@tauri-apps/plugin-process', () => ({
  exit: vi.fn(() => Promise.resolve())
}))

vi.mock('@/hooks/useMitt', () => ({
  useMitt: {
    emit: vi.fn()
  }
}))

vi.mock('@/hooks/useTauriListener', () => ({
  useTauriListener: () => ({
    pushListeners: vi.fn()
  })
}))

vi.mock('@/hooks/useWindow', () => ({
  useWindow: () => ({
    resizeWindow: vi.fn(() => Promise.resolve())
  })
}))

vi.mock('@/store/alwaysOnTop', () => ({
  useAlwaysOnTopStore: () => ({
    getWindowTop: vi.fn(() => topState.value),
    setWindowTop: vi.fn((_, value: boolean) => {
      topState.value = value
    })
  })
}))

vi.mock('@/store/setting', () => ({
  useSettingStore: () => settingState
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia')
  return {
    ...actual,
    storeToRefs: () => ({
      tips: { value: settingState.tips },
      escClose: { value: settingState.escClose }
    })
  }
})

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
      props: ['class'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () => h('button', { class: props.class, onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NCheckbox: defineComponent({
      name: 'StubCheckbox',
      props: ['checked', 'size', 'onUpdateChecked'],
      emits: ['update:checked'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            type: 'checkbox',
            checked: props.checked,
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked
              emit('update:checked', checked)
              props.onUpdateChecked?.(checked)
            }
          })
      }
    }),
    NFlex: passthrough('div'),
    NModal: defineComponent({
      name: 'StubModal',
      props: ['show', 'class'],
      setup(props, { slots }) {
        return () => (props.show ? h('div', { class: props.class }, slots.default?.()) : null)
      }
    }),
    NPopover: defineComponent({
      name: 'StubPopover',
      setup(_, { slots }) {
        return () => h('div', {}, [slots.trigger?.(), slots.default?.()])
      }
    }),
    NRadio: defineComponent({
      name: 'StubRadio',
      props: ['checked'],
      emits: ['update:checked'],
      setup(props, { emit }) {
        return () => h('input', { type: 'radio', checked: props.checked, onChange: () => emit('update:checked', true) })
      }
    })
  }
})

describe('WindowActionBar top-bar shell behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    topState.value = false
    settingState.tips.type = 0
    settingState.tips.notTips = false
    settingState.escClose = false
  })

  it('marks all top-bar window controls as no-drag click targets', async () => {
    const wrapper = mount(WindowActionBar, {
      props: {
        showSlot: true,
        topWinLable: 'home',
        plain: true
      },
      slots: {
        default: () => h('div', 'header')
      }
    })
    await flushPromises()

    expect(wrapper.get('.hover-box').classes()).toContain('no-drag')
    expect(wrapper.get('.minimize-btn').classes()).toContain('no-drag')
    expect(wrapper.get('.maximize-btn').classes()).toContain('no-drag')
    expect(wrapper.get('.close-btn').classes()).toContain('no-drag')
  })

  it('persists the close dialog do-not-show preference before confirming', async () => {
    const wrapper = mount(WindowActionBar, {
      props: {
        showSlot: true,
        plain: true
      }
    })
    await flushPromises()

    await wrapper.get('.close-btn').trigger('click')
    await flushPromises()

    const checkbox = wrapper.get('input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(settingState.tips.notTips).toBe(false)

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === '确定')
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(settingState.tips.notTips).toBe(true)
    expect(windowMock.hide).toHaveBeenCalled()
  })
})
