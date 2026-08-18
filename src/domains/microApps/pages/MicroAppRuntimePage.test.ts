import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('MicroAppRuntimePage viewport synchronization', () => {
  it('synchronizes native Webview bounds for every ancestor scroll and cleans up the listener', () => {
    const source = readFileSync(resolve(__dirname, 'MicroAppRuntimePage.tsx'), 'utf-8')

    expect(source).toContain("window.addEventListener('scroll', scheduleWebviewBoundsUpdate, true)")
    expect(source).toContain("window.removeEventListener('scroll', scheduleWebviewBoundsUpdate, true)")
  })

  it('closes cached child Webviews when a kept-alive route is deactivated', () => {
    const source = readFileSync(resolve(__dirname, 'MicroAppRuntimePage.tsx'), 'utf-8')

    expect(source).toContain('onDeactivated(() =>')
    expect(source).toContain('void closeWebview()')
    expect(source).toContain('closeMicroAppWebviewsForApp(runtimeAppId)')
  })

  it('does not resize a native Webview when its rounded bounds did not change', () => {
    const source = readFileSync(resolve(__dirname, 'MicroAppRuntimePage.tsx'), 'utf-8')

    expect(source).toContain('previousBounds.width === nextBounds.width')
    expect(source).toContain('previousBounds.height === nextBounds.height')
    expect(source).toContain('mutationTouchesFloatingLayer(mutations)')
  })
})
