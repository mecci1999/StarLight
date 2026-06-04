// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import TimeRangeBar from '../TimeRangeBar'

vi.mock('naive-ui', () => {
  const passthrough = (name: string, tag = 'div') =>
    defineComponent({
      name,
      props: ['class', 'depth', 'bordered'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class }, slots.default?.())
      }
    })

  return {
    NCard: passthrough('StubCard'),
    NText: passthrough('StubText', 'span'),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['class', 'disabled', 'size', 'secondary', 'type'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              class: props.class,
              disabled: props.disabled,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    }),
    NSelect: defineComponent({
      name: 'StubSelect',
      props: ['class', 'value', 'options', 'disabled'],
      setup(props) {
        return () => h('select', { class: props.class, disabled: props.disabled, value: props.value })
      }
    }),
    NSwitch: defineComponent({
      name: 'StubSwitch',
      props: ['value', 'disabled'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            type: 'checkbox',
            checked: props.value,
            disabled: props.disabled,
            onChange: (event: Event) => emit('update:value', (event.target as HTMLInputElement).checked)
          })
      }
    })
  }
})

const mountTimeRangeBar = (props: Partial<InstanceType<typeof TimeRangeBar>['$props']> = {}) =>
  mount(TimeRangeBar, {
    props: {
      value: '1h',
      live: true,
      options: [
        { label: '15m', value: '15m' },
        { label: '1h', value: '1h' }
      ],
      autoRefreshValue: 'off',
      autoRefreshOptions: [
        { label: '关闭', value: 'off' },
        { label: '30 秒', value: '30s' }
      ],
      autoRefreshHint: '推荐 30 秒刷新一次',
      ...props
    }
  })

describe('TimeRangeBar', () => {
  it('groups controls into primary and secondary toolbar areas', () => {
    const wrapper = mountTimeRangeBar()

    expect(wrapper.get('.time-range-bar__primary').text()).toContain('时间范围')
    expect(wrapper.get('.time-range-bar__secondary').text()).toContain('实时模式')
    expect(wrapper.get('.time-range-bar__secondary').text()).toContain('自动刷新')
    expect(wrapper.get('.time-range-bar__hint').text()).toBe('推荐 30 秒刷新一次')
  })

  it('disables auto refresh selection when realtime mode is off', () => {
    const wrapper = mountTimeRangeBar({ live: false })
    const refreshSelect = wrapper.get('.time-range-bar__select--refresh')

    expect(refreshSelect.attributes('disabled')).toBeDefined()
  })

  it('emits refresh when the refresh button is clicked', async () => {
    const wrapper = mountTimeRangeBar()

    await wrapper.get('.time-range-bar__refresh-button').trigger('click')

    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })
})
