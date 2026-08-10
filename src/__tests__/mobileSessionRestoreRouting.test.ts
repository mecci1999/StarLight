import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

describe('mobile cold-start session restoration', () => {
  it('restores the session before replacing the mobile login route with the authenticated destination', async () => {
    const source = await readFile(new URL('../App.tsx', import.meta.url), 'utf8')

    expect(source).toContain('const restored = await restoreAuthSession()')
    expect(source).toContain("router.currentRoute.value.name === 'mobile-login'")
    expect(source).toContain('await router.replace({ name: resolveAuthLandingRoute(false, storedUser) })')
    expect(source.indexOf('const restored = await restoreAuthSession()')).toBeLessThan(
      source.indexOf('sessionRestored.value = true')
    )
  })
})
