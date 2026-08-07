// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LogStreamContent from '../components/LogStreamContent'

const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const webSocketSend = vi.hoisted(() => vi.fn())
const webSocketEnsureConnected = vi.hoisted(() => vi.fn())
const webSocketState = vi.hoisted(() => ({ connected: true }))
const mittHandlers = vi.hoisted(() => new Map<string, Set<(payload: any) => void>>())
const clipboardWriteText = vi.hoisted(() => vi.fn())
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
    ensureConnected: webSocketEnsureConnected,
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

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: clipboardWriteText }))

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
    webSocketEnsureConnected.mockResolvedValue(undefined)
    mittHandlers.clear()
    clipboardWriteText.mockResolvedValue(undefined)
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
    webSocketEnsureConnected.mockImplementation(async () => {
      setTimeout(() => {
        mittHandlers.get('wsConnectionStateChange')?.forEach((handler) => handler('disconnected'))
      }, 0)
    })
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()

    expect(webSocketSend).not.toHaveBeenCalledWith({ type: 'subscribe', data: { channel: 'logs' } })
    expect(messages.success).not.toHaveBeenCalled()
    expect(messages.error).toHaveBeenCalledWith('启动日志流失败: WebSocket 实时通道尚未连接')
    expect(wrapper.findAll('button').some((item) => item.text().includes('开始流'))).toBe(true)
  })

  it('actively reconnects the shared WebSocket before subscribing to logs', async () => {
    webSocketState.connected = false
    webSocketEnsureConnected.mockImplementation(async () => {
      webSocketState.connected = true
    })
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    expect(webSocketEnsureConnected).toHaveBeenCalledOnce()
    expect(webSocketSend).toHaveBeenCalledWith({ type: 'subscribe', data: { channel: 'logs' } })
    expect(messages.success).toHaveBeenCalled()
  })

  it('resubscribes to logs after the shared WebSocket reconnects', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    mittHandlers.get('wsConnectionStateChange')?.forEach((handler) => handler('disconnected'))
    mittHandlers.get('wsConnectionStateChange')?.forEach((handler) => handler('connected'))
    await flushPromises()

    const logSubscriptions = webSocketSend.mock.calls.filter(
      ([message]) => message.type === 'subscribe' && message.data?.channel === 'logs'
    )
    expect(logSubscriptions).toHaveLength(2)
    expect(wrapper.findAll('button').some((item) => item.text().includes('停止'))).toBe(true)
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

  it('copies the currently displayed logs with their context', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    const copyButton = wrapper.findAll('button').find((item) => item.text().includes('复制日志'))
    expect(copyButton).toBeTruthy()
    await copyButton!.trigger('click')

    expect(clipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] [gateway] [darwin-app] gateway started')
    )
    expect(clipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] [logs-api] [darwin-app] slow flush')
    )
    expect(messages.success).toHaveBeenCalledWith('已复制 2 条日志')
  })

  it('warns instead of copying when no logs are displayed', async () => {
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const copyButton = wrapper.findAll('button').find((item) => item.text().includes('复制日志'))
    expect(copyButton).toBeTruthy()
    await copyButton!.trigger('click')

    expect(clipboardWriteText).not.toHaveBeenCalled()
    expect(messages.warning).toHaveBeenCalledWith('没有日志可复制')
  })

  it('reports copy failure instead of success when the clipboard rejects', async () => {
    clipboardWriteText.mockRejectedValue(new Error('Clipboard unavailable'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable')) }
    })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) })
    const wrapper = mount(LogStreamContent)
    await flushPromises()

    const startButton = wrapper.findAll('button').find((item) => item.text().includes('开始流'))
    expect(startButton).toBeTruthy()
    await startButton!.trigger('click')
    await flushPromises()

    const copyButton = wrapper.findAll('button').find((item) => item.text().includes('复制日志'))
    expect(copyButton).toBeTruthy()
    await copyButton!.trigger('click')
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('已复制 2 条日志')
    expect(messages.error).toHaveBeenCalledWith('复制日志失败')
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
