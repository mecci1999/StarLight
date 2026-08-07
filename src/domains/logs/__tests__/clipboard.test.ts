// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LogLevelEnum, LogSourceEnum, type LogEntry } from '@/types/logs'
import { copyLogText, formatLogForClipboard } from '../clipboard'

const tauriWriteText = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: tauriWriteText }))

describe('log clipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tauriWriteText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn() } })
  })

  it('formats log context consistently for all log views', () => {
    expect(
      formatLogForClipboard({
        id: 'log-1',
        timestamp: '2026-06-16T06:01:02.000Z',
        level: LogLevelEnum.INFO,
        service: 'gateway',
        source: LogSourceEnum.APPLICATION,
        originType: 'darwin-app',
        message: 'gateway started'
      } satisfies LogEntry)
    ).toContain('[INFO] [gateway] [darwin-app] gateway started')
  })

  it('formats only the enabled display segments', () => {
    expect(
      formatLogForClipboard(
        {
          id: 'log-1',
          timestamp: '2026-06-16T06:01:02.000Z',
          level: LogLevelEnum.INFO,
          service: 'gateway',
          source: LogSourceEnum.APPLICATION,
          originType: 'darwin-app',
          message: 'gateway started'
        } satisfies LogEntry,
        { showTimestamp: false, showLevel: false, showService: true }
      )
    ).toBe('[gateway] [darwin-app] gateway started')
  })

  it('uses the browser clipboard when the Tauri clipboard is unavailable', async () => {
    const browserWriteText = vi.fn().mockResolvedValue(undefined)
    tauriWriteText.mockRejectedValue(new Error('Tauri unavailable'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: browserWriteText } })

    await copyLogText('log content')

    expect(browserWriteText).toHaveBeenCalledWith('log content')
  })

  it('uses the legacy clipboard fallback when modern clipboard APIs are unavailable', async () => {
    tauriWriteText.mockRejectedValue(new Error('Tauri unavailable'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand })

    await copyLogText('log content')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('rejects when every clipboard mechanism fails', async () => {
    tauriWriteText.mockRejectedValue(new Error('Tauri unavailable'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Browser unavailable')) }
    })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) })

    await expect(copyLogText('log content')).rejects.toThrow('Clipboard is unavailable')
  })
})
