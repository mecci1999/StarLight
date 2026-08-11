// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import type { ClientNotificationEntry } from '@/services/clientNotifications'

type RawMessageHandler = (message: unknown) => void | Promise<void>

const fetchNotificationsMock = vi.fn()
const pushClientNotificationMock = vi.fn()
const syncClientNotificationBadgeMock = vi.fn()
const rawMessageHandlers = new Set<RawMessageHandler>()
const clientNotifications: Ref<ClientNotificationEntry[]> = ref([])

vi.mock('@/api/alerts', () => ({
  fetchNotifications: fetchNotificationsMock
}))

vi.mock('@/hooks/useMitt', () => ({
  useMitt: {
    on: (_event: string, handler: RawMessageHandler) => rawMessageHandlers.add(handler),
    off: (_event: string, handler: RawMessageHandler) => rawMessageHandlers.delete(handler)
  }
}))

vi.mock('@/services/clientNotifications', () => ({
  clientNotifications,
  dismissClientNotification: vi.fn(),
  hideClientNotification: vi.fn(),
  pushClientNotification: pushClientNotificationMock,
  syncClientNotificationBadge: syncClientNotificationBadgeMock
}))

const createNotification = (id: string, sentAt: string) => ({
  key: `key-${id}`,
  id: `record-${id}`,
  alertId: id,
  sendTime: sentAt,
  sentAt,
  ruleName: 'CPU threshold',
  service: 'api',
  channel: 'InApp',
  recipient: 'operator',
  status: 'success' as const,
  retryCount: 0,
  content: 'CPU is high'
})

describe('ClientNotificationHost', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    fetchNotificationsMock.mockReset()
    pushClientNotificationMock.mockReset()
    syncClientNotificationBadgeMock.mockReset()
    rawMessageHandlers.clear()
    clientNotifications.value = []
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    })
    pushClientNotificationMock.mockImplementation(async (payload: { id?: string }) => ({ id: payload.id }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('suppresses historical records but delivers records created after the session baseline', async () => {
    const historical = createNotification('historical', '2020-01-01T00:00:00.000Z')
    const fresh = createNotification('fresh', new Date(Date.now() + 60_000).toISOString())
    fetchNotificationsMock.mockResolvedValue([historical, fresh])

    const { default: ClientNotificationHost } = await import('../ClientNotificationHost')
    const wrapper = mount(ClientNotificationHost, { props: { pollIntervalMs: 60_000 } })
    await flushPromises()

    expect(pushClientNotificationMock).toHaveBeenCalledTimes(1)
    expect(pushClientNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fresh', dedupeKey: 'fresh' })
    )
    expect(JSON.parse(storage.get('starlight_client_notification_seen_ids_v1') || '[]')).toEqual(
      expect.arrayContaining(['historical', 'fresh'])
    )
    wrapper.unmount()
  })

  it('deduplicates a websocket alert and its polling record by alert ID', async () => {
    fetchNotificationsMock.mockResolvedValue([])
    const { default: ClientNotificationHost } = await import('../ClientNotificationHost')
    const wrapper = mount(ClientNotificationHost, { props: { pollIntervalMs: 60_000 } })
    await flushPromises()

    const message = {
      type: 'alert',
      data: {
        alertId: 'shared-alert',
        ruleId: 'cpu-rule',
        tenantId: 'tenant-1',
        level: 'critical',
        service: 'api',
        metric: 'cpu',
        value: 95,
        threshold: 90,
        operator: '>',
        status: 'active',
        message: 'CPU is high',
        time: new Date().toISOString()
      }
    }
    for (const handler of rawMessageHandlers) await handler(message)
    fetchNotificationsMock.mockResolvedValue([createNotification('shared-alert', new Date().toISOString())])
    await vi.advanceTimersByTimeAsync(60_000)

    expect(pushClientNotificationMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('does not persist an ID when the in-app push is rejected', async () => {
    fetchNotificationsMock.mockResolvedValue([
      createNotification('retryable-alert', new Date(Date.now() + 60_000).toISOString())
    ])
    pushClientNotificationMock.mockResolvedValue(null)

    const { default: ClientNotificationHost } = await import('../ClientNotificationHost')
    const wrapper = mount(ClientNotificationHost, { props: { pollIntervalMs: 60_000 } })
    await flushPromises()

    expect(storage.get('starlight_client_notification_seen_ids_v1')).toBeUndefined()
    wrapper.unmount()
  })
})
