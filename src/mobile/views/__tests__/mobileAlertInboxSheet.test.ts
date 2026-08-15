import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('mobile alert inbox sheets', () => {
  it('uses a safe-area-aware overlay layer above the fixed bottom tab bar', async () => {
    const [inbox, sheet, layout] = await Promise.all([
      readFile(new URL('../MobileAlertsInbox.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../../ui/MobileSheet.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../../layout/MobileLayout.scss', import.meta.url), 'utf8')
    ])

    expect(inbox).toContain('<MobileSheet')
    expect(sheet).toContain('safeAreaInsetBottom={props.safeAreaInsetBottom}')
    expect(sheet).toContain('zIndex={MOBILE_SHEET_Z_INDEX}')
    expect(sheet).toContain('teleport="body"')
    expect(sheet).toContain('export const MOBILE_SHEET_Z_INDEX = 200')
    expect(layout).toContain('z-index: 100')
  })
})
