import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('MicroAppRuntimePage viewport synchronization', () => {
  it('synchronizes native Webview bounds for every ancestor scroll and cleans up the listener', () => {
    const source = readFileSync(resolve(__dirname, 'MicroAppRuntimePage.tsx'), 'utf-8')

    expect(source).toContain("window.addEventListener('scroll', scheduleWebviewBoundsUpdate, true)")
    expect(source).toContain("window.removeEventListener('scroll', scheduleWebviewBoundsUpdate, true)")
  })
})
