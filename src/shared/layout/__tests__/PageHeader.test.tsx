// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import PageHeader from '../PageHeader'

vi.mock('naive-ui', () => ({
  NSpace: defineComponent({
    name: 'StubSpace',
    props: ['class', 'align'],
    setup(props, { slots }) {
      return () => h('div', { class: props.class, 'data-align': props.align }, slots.default?.())
    }
  })
}))

describe('PageHeader', () => {
  it('renders title and subtitle in one main heading row', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '指标分析',
        subtitle: '历史趋势、热力与对比分析'
      }
    })

    const main = wrapper.get('.page-header__main')
    expect(main.get('.page-header__title').text()).toBe('指标分析')
    expect(main.get('.page-header__subtitle').text()).toBe('历史趋势、热力与对比分析')
  })

  it('keeps meta, action and extra slots in the action area', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '面板',
        subtitle: '集中查看系统健康'
      },
      slots: {
        meta: () => h('span', { class: 'meta-slot' }, 'Meta'),
        actions: () => h('button', { class: 'action-slot' }, '刷新'),
        extra: () => h('span', { class: 'extra-slot' }, 'Extra')
      }
    })

    const actions = wrapper.get('.page-header__actions')
    expect(actions.get('.meta-slot').text()).toBe('Meta')
    expect(actions.get('.action-slot').text()).toBe('刷新')
    expect(actions.get('.extra-slot').text()).toBe('Extra')
  })
})
