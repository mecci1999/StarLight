import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import dayjs from 'dayjs'
import type { LogEntry } from '@/types/logs'

export type LogClipboardDisplayOptions = {
  showTimestamp: boolean
  showLevel: boolean
  showService: boolean
}

export const formatLogForClipboard = (
  log: LogEntry,
  { showTimestamp, showLevel, showService }: LogClipboardDisplayOptions = {
    showTimestamp: true,
    showLevel: true,
    showService: true
  }
) => {
  const segments = [
    showTimestamp && `[${log.timestamp ? dayjs(log.timestamp).format('HH:mm:ss.SSS') : '-'}]`,
    showLevel && `[${log.level?.toUpperCase() || 'UNKNOWN'}]`,
    showService && `[${log.service || 'unknown-service'}]`,
    log.originType && `[${log.originType}]`,
    log.message || ''
  ].filter(Boolean)

  return segments.join(' ')
}

const copyWithLegacyClipboard = (content: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = content
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) throw new Error('Clipboard is unavailable')
}

export const copyLogText = async (content: string) => {
  try {
    await writeText(content)
    return
  } catch {}

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content)
      return
    } catch {}
  }

  copyWithLegacyClipboard(content)
}
