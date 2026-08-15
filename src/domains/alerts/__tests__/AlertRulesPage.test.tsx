// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AlertRulesPage from '../pages/AlertRulesPage'

const api = vi.hoisted(() => ({
  fetchAlertRules: vi.fn(),
  fetchRegistryMissingAlertRules: vi.fn(),
  saveRegistryMissingAlertRule: vi.fn(),
  fetchCatalogServices: vi.fn()
}))
const messages = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
vi.mock('@/services/authSession', () => ({ getPreferredMetricsDatasetScope: () => 'system' }))
vi.mock('@/api/alerts', () => ({
  fetchAlertRules: api.fetchAlertRules,
  fetchRegistryMissingAlertRules: api.fetchRegistryMissingAlertRules,
  saveRegistryMissingAlertRule: api.saveRegistryMissingAlertRule,
  updateRegistryMissingAlertRule: vi.fn(),
  deleteRegistryMissingAlertRule: vi.fn(),
  saveAlertRule: vi.fn(),
  updateAlertRule: vi.fn(),
  deleteAlertRule: vi.fn(),
  exportAlertRules: vi.fn(),
  importAlertRules: vi.fn()
}))
vi.mock('@/api/metrics', () => ({ fetchCatalogServices: api.fetchCatalogServices }))
vi.mock('@/shared/layout/PageHeader', () => ({ default: defineComponent({ setup: () => () => h('header') }) }))
vi.mock('@/shared/components/ResultTable', () => ({
  default: defineComponent({
    props: ['data'],
    setup: (props) => () =>
      h(
        'div',
        props.data.map((rule: { name: string }) => rule.name)
      )
  })
}))
vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h(tag, slots.default?.())
    })
  const input = defineComponent({
    props: ['value', 'type', 'placeholder'],
    emits: ['update:value'],
    setup:
      (props, { emit }) =>
      () =>
        h(props.type === 'textarea' ? 'textarea' : 'input', {
          value: props.value,
          placeholder: props.placeholder,
          onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
        })
  })
  const select = defineComponent({
    props: ['value', 'options', 'multiple'],
    emits: ['update:value'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'select',
          {
            value: props.value,
            multiple: props.multiple,
            onChange: (event: Event) =>
              emit(
                'update:value',
                props.multiple
                  ? Array.from((event.target as HTMLSelectElement).selectedOptions).map((option) => option.value)
                  : (event.target as HTMLSelectElement).value
              )
          },
          (props.options || []).map((option: { label: string; value: string }) =>
            h('option', { value: option.value }, option.label)
          )
        )
  })
  return {
    NButton: defineComponent({
      emits: ['click'],
      setup:
        (_, { emit, slots }) =>
        () =>
          h('button', { onClick: () => emit('click') }, slots.default?.())
    }),
    NCard: passthrough('section'),
    NForm: passthrough('form'),
    NFormItem: passthrough('label'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NModal: passthrough('div'),
    NSpace: passthrough('div'),
    NSpin: passthrough('div'),
    NTag: passthrough('span'),
    NTabPane: passthrough('div'),
    NTabs: passthrough('div'),
    NInput: input,
    NInputNumber: input,
    NSelect: select,
    NSwitch: defineComponent({
      props: ['value'],
      emits: ['update:value'],
      setup:
        (props, { emit }) =>
        () =>
          h('input', {
            type: 'checkbox',
            checked: props.value,
            onChange: (event: Event) => emit('update:value', (event.target as HTMLInputElement).checked)
          })
    }),
    useMessage: () => messages
  }
})

describe('AlertRulesPage registry missing rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.fetchAlertRules.mockResolvedValue([])
    api.fetchRegistryMissingAlertRules.mockResolvedValue([])
    api.fetchCatalogServices.mockResolvedValue({
      items: [{ identity: { id: 'auth', name: 'auth' }, displayName: '认证服务' }]
    })
  })

  it('uses server display names and shows the distinct registry editor without metric controls', async () => {
    const wrapper = mount(AlertRulesPage)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '+ 添加规则')!
      .trigger('click')
    await wrapper.find('select').setValue('registry_missing')

    expect(wrapper.text()).toContain('服务注册缺失')
    expect(wrapper.text()).toContain('认证服务')
    expect(wrapper.find('select').text()).not.toContain('CPU使用率')
    expect(wrapper.find('input[placeholder="60 - 86400 秒"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="0 - 86400 秒"]').exists()).toBe(true)
  })

  it('prevents Email registry rules without recipients from saving', async () => {
    const wrapper = mount(AlertRulesPage)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '+ 添加规则')!
      .trigger('click')
    await wrapper.find('select').setValue('registry_missing')
    const selects = wrapper.findAll('select')
    await selects[1].setValue('auth')
    await selects[3].setValue(['Email'])
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '保存')!
      .trigger('click')

    expect(messages.error).toHaveBeenCalledWith('选择 Email 时至少需要一个有效收件人')
    expect(api.saveRegistryMissingAlertRule).not.toHaveBeenCalled()
  })
})
