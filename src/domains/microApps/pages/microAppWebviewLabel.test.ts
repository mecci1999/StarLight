import { describe, expect, it } from 'vitest'
import {
  isMicroAppHostWindowLabelForApp,
  isMicroAppWebviewLabelForApp,
  microAppHostWindowLabel,
  microAppWebviewLabel,
  microAppWebviewLabelPrefix
} from './microAppWebviewLabel'

describe('microAppWebviewLabel', () => {
  it('encodes canonical identities into a Tauri-safe label', () => {
    expect(microAppWebviewLabel('starlight-trails-workspace', '1.0.2')).toBe(
      'micro_app_v1_737461726c696768742d747261696c732d776f726b7370616365:312e302e32'
    )
  })

  it('matches every version belonging to the same micro app', () => {
    expect(microAppWebviewLabelPrefix('trails')).toBe('micro_app_v1_747261696c73:')
    expect(isMicroAppWebviewLabelForApp(microAppWebviewLabel('trails', '1.0.7'), 'trails')).toBe(true)
    expect(isMicroAppWebviewLabelForApp(microAppWebviewLabel('other', '1.0.7'), 'trails')).toBe(false)
  })

  it('uses a separate trusted label namespace for the independent host window', () => {
    const label = microAppHostWindowLabel('trails', '1.0.7')
    expect(label).toBe('micro_host_v1_747261696c73:312e302e37')
    expect(isMicroAppHostWindowLabelForApp(label, 'trails')).toBe(true)
    expect(isMicroAppWebviewLabelForApp(label, 'trails')).toBe(false)
  })
})
