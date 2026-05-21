// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IngestionPage from '../pages/IngestionPage'

const routerPush = vi.hoisted(() => vi.fn())
const apiMocks = vi.hoisted(() => ({
  getAppKeys: vi.fn(),
  generateAppKey: vi.fn(),
  verifyAppKey: vi.fn(),
  deleteAppKey: vi.fn(),
  getIngestionStatus: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/api/metrics', () => apiMocks)
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: vi.fn() }))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      setup(_, { slots }) {
        return () => h(tag, {}, slots.default?.())
      }
    })

  return {
    NCard: passthrough('div'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NStatistic: defineComponent({
      props: ['label', 'value'],
      setup: (props) => () => h('div', {}, `${props.label}:${props.value}`)
    }),
    NButton: defineComponent({
      emits: ['click'],
      setup:
        (_, { emit, slots }) =>
        () =>
          h('button', { onClick: () => emit('click') }, slots.default?.())
    }),
    NTag: passthrough('span'),
    NSpin: passthrough('div'),
    NEmpty: defineComponent({ props: ['description'], setup: (props) => () => h('div', {}, props.description) }),
    NSpace: passthrough('div'),
    NModal: passthrough('div'),
    NForm: passthrough('form'),
    NFormItem: passthrough('div'),
    NInput: defineComponent({
      props: ['value', 'placeholder'],
      emits: ['update:value'],
      setup:
        (props, { emit }) =>
        () =>
          h('input', {
            value: props.value,
            placeholder: props.placeholder,
            onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
          })
    }),
    NTabs: passthrough('div'),
    NTabPane: passthrough('div'),
    NDescriptions: passthrough('div'),
    NDescriptionsItem: defineComponent({
      props: ['label'],
      setup:
        (props, { slots }) =>
        () =>
          h('div', {}, [props.label, slots.default?.()])
    }),
    useMessage: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() })
  }
})

vi.mock('@/shared/layout/PageHeader', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))

describe('IngestionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.getAppKeys.mockResolvedValue([])
    apiMocks.getIngestionStatus.mockResolvedValue(null)
  })

  it('opens the desktop in-app onboarding route from quick entry', async () => {
    const wrapper = mount(IngestionPage)
    await flushPromises()

    const guideButton = wrapper.findAll('button').find((item) => item.text() === '接入向导')
    expect(guideButton).toBeTruthy()
    await guideButton!.trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/home/admin-onboarding-v2')
  })
})
