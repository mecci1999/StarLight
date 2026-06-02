// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LogStreamContent from '../components/LogStreamContent'

let lastEventSourceUrl = ''
let lastEventSourceWithCredentials = false
let lastFetchUrl = ''
let lastFetchHeaders: Record<string, string> = {}
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

class MockEventSource {
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  withCredentials = false

  constructor(url: string, options?: EventSourceInit) {
    lastEventSourceUrl = url
    this.withCredentials = Boolean(options?.withCredentials)
    lastEventSourceWithCredentials = this.withCredentials
    setTimeout(() => this.onopen?.(), 0)
  }

  close() {}
}

vi.mock('@/services/authSession', () => ({
  getStoredUserInfo: () => ({ isAdmin: true }),
  getStoredAuthTokens: () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' })
}))

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn((input: string, init?: { headers?: Record<string, string> }) => {
    lastFetchUrl = input
    lastFetchHeaders = init?.headers || {}
    const encoder = new TextEncoder()
    let sent = false
    return Promise.resolve({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => {
            if (sent) return Promise.resolve({ done: true, value: undefined })
            sent = true
            return Promise.resolve({ done: false, value: encoder.encode('data: {"type":"connected","data":"ok"}\n\n') })
          }
        })
      }
    })
  })
}))

vi.mock('@/api', () => ({
  default: {
    logs: {
      exportLogs: vi.fn()
    }
  }
}))

vi.mock('@/api/metrics', () => ({
  fetchCatalogServices: vi.fn().mockResolvedValue({ items: [] })
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      setup(_, { slots }) {
        return () => h(tag, {}, slots.default?.())
      }
    })

  return {
    NCard: passthrough('div'),
    NSpace: passthrough('div'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NSpin: passthrough('div'),
    NTooltip: passthrough('div'),
    NIcon: passthrough('span'),
    NAlert: passthrough('div'),
    NStatistic: defineComponent({
      props: ['label', 'value'],
      setup: (props) => () => h('div', {}, `${props.label}:${props.value}`)
    }),
    NSwitch: defineComponent({ props: ['value'], emits: ['update:value'], setup: () => () => h('input') }),
    NEmpty: defineComponent({ props: ['description'], setup: (props) => () => h('div', {}, props.description) }),
    NButton: defineComponent({
      props: ['loading', 'type'],
      emits: ['click'],
      setup(_, { emit, slots }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NInput: defineComponent({
      props: ['value', 'placeholder'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            value: props.value,
            placeholder: props.placeholder,
            onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
          })
      }
    }),
    NSelect: defineComponent({
      props: ['value', 'options'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h(
            'select',
            {
              value: props.value,
              onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value)
            },
            (props.options || []).map((option: any) => h('option', { value: option.value }, option.label))
          )
      }
    }),
    useMessage: () => messages
  }
})

vi.mock('@/shared/layout/PageHeader', () => ({ default: defineComponent({ setup: () => () => h('div') }) }))

describe('LogStreamContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastEventSourceUrl = ''
    lastEventSourceWithCredentials = false
    lastFetchUrl = ''
    lastFetchHeaders = {}
    vi.stubGlobal('EventSource', MockEventSource)
  })

  it('opens admin Darwin log stream through authenticated Tauri fetch without URL token', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    expect(lastFetchUrl).toContain('/api/logs/v1/stream?')
    expect(lastFetchUrl).toContain('originType=darwin-app')
    expect(lastFetchUrl).not.toContain('token=')
    expect(lastFetchHeaders.Cookie).toBe('ACCESS_TOKEN=access-1')
  })
})
