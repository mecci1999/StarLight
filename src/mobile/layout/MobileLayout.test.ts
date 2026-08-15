import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('mobile bottom tab bar', () => {
  it('keeps a centered 60px tab-content region above the reserved safe area', async () => {
    const styles = await readFile(new URL('./MobileLayout.scss', import.meta.url), 'utf8')

    expect(styles).toContain('padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));')
    expect(styles).toMatch(
      /&__tabs\s*{[\s\S]*?height: calc\(60px \+ env\(safe-area-inset-bottom, 0px\)\);[\s\S]*?padding-bottom: env\(safe-area-inset-bottom, 0px\);[\s\S]*?box-sizing: border-box;/
    )
  })

  it('mounts the shared notification ingestion host exactly once at the mobile application root', async () => {
    const layout = await readFile(new URL('./MobileLayout.tsx', import.meta.url), 'utf8')

    expect(layout).toContain(
      "import ClientNotificationHost from '@/shared/components/ClientNotificationHost/ClientNotificationHost'"
    )
    expect(layout.match(/<ClientNotificationHost\s*\/>/g)).toHaveLength(1)
  })
})
