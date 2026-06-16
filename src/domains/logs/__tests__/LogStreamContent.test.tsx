// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LogStreamContent from '../components/LogStreamContent'

const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const webSocketSend = vi.hoisted(() => vi.fn())
const webSocketState = vi.hoisted(() => ({ connected: true }))
const mittHandlers = vi.hoisted(() => new Map<string, Set<(payload: any) => void>>())
const recentLogs = vi.hoisted(() => [
  {
    id: 'log-1',
    timestamp: '2026-06-16T06:01:02.000Z',
    level: 'info',
    service: 'gateway',
    message: 'gateway started',
    source: 'application',
    originType: 'darwin-app'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-16T06:02:03.000Z',
    level: 'warn',
    service: 'logs-api',
    message: 'slow flush',
    source: 'application',
    originType: 'darwin-app'
  }
])

vi.mock('@/services/authSession', () => ({
  getStoredUserInfo: () => ({ isAdmin: true })
}))

vi.mock('@/services/webSocket', () => ({
  default: {
    get isConnected() {
      return webSocketState.connected
    },
    send: webSocketSend
  }
}))

vi.mock('@/hooks/useMitt', () => ({
  useMitt: {
    on: vi.fn((event: string, handler: (payload: any) => void) => {
      if (!mittHandlers.has(event)) mittHandlers.set(event, new Set())
      mittHandlers.get(event)!.add(handler)
    }),
    off: vi.fn((event: string, handler: (payload: any) => void) => {
      mittHandlers.get(event)?.delete(handler)
    }),
    emit: vi.fn((event: string, payload: any) => {
      mittHandlers.get(event)?.forEach((handler) => handler(payload))
    })
  }
}))

vi.mock('@/api', () => ({
  default: {
    logs: {
      searchLogsExplorer: vi
        .fn()
        .mockResolvedValue({ items: recentLogs, pagination: { total: 2, page: 1, pageSize: 200 } }),
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
    webSocketState.connected = true
    mittHandlers.clear()
  })

  it('subscribes to the logs WebSocket channel when starting the stream', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    expect(webSocketSend).toHaveBeenCalledWith({ type: 'subscribe', data: { channel: 'logs' } })
  })

  it('does not report stream success when the WebSocket channel is disconnected after recent logs load', async () => {
    webSocketState.connected = false
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 2100))
    await flushPromises()

    expect(webSocketSend).not.toHaveBeenCalledWith({ type: 'subscribe', data: { channel: 'logs' } })
    expect(messages.success).not.toHaveBeenCalled()
    expect(messages.error).toHaveBeenCalledWith('启动日志流失败: WebSocket 实时通道尚未连接')
    expect(wrapper.findAll('button').some((item) => item.text().includes('开始流'))).toBe(true)
  })

  it('shows stop controls immediately after starting the stream', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    const buttonTexts = wrapper.findAll('button').map((item) => item.text())
    expect(buttonTexts.some((text) => text.includes('停止'))).toBe(true)
    expect(buttonTexts.some((text) => text.includes('暂停'))).toBe(true)
    expect(buttonTexts.some((text) => text.includes('开始流'))).toBe(false)
  })

  it('updates stream stats from preloaded recent logs', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('接收总数:2')
    expect(wrapper.text()).toContain('连接时间:')
    expect(wrapper.text()).toContain('最后接收:14:02:03')
  })

  it('increments stream stats when a live log event arrives', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()
    mittHandlers.get('wsRawMessage')?.forEach((handler) =>
      handler({
        type: 'logs',
        data: {
          id: 'log-3',
          timestamp: '2026-06-16T06:03:04.000Z',
          level: 'error',
          service: 'gateway',
          message: 'live error',
          source: 'application',
          originType: 'darwin-app'
        }
      })
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('接收总数:3')
    expect(wrapper.text()).toContain('live error')
  })

  it('unsubscribes from the logs channel when stopping the stream', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    const stopButton = wrapper.findAll('button').find((item) => item.text().includes('停止'))
    expect(stopButton).toBeTruthy()
    await stopButton!.trigger('click')

    expect(webSocketSend).toHaveBeenCalledWith({ type: 'unsubscribe', data: { channel: 'logs' } })
  })
})
