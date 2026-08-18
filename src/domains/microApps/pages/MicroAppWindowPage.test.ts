import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('MicroAppWindowPage native shell', () => {
  const source = readFileSync(resolve(__dirname, 'MicroAppWindowPage.tsx'), 'utf-8')

  it('uses the shared StarLight action bar and an isolated child Webview', () => {
    expect(source).toContain('<WindowActionBar maxW shrink={false} showSlot>')
    expect(source).toContain('new Webview(getCurrentWindow(), microAppWebviewLabel')
    expect(source).toContain('dragDropEnabled: false')
  })

  it('keeps a macOS-specific title-bar layout for native traffic-light controls', () => {
    expect(source).toContain("type() === 'macos'")
    expect(source).toContain("'micro-app-window--macos': isMacOS.value")
  })
})
