// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCachedAvatarSource, putCachedAvatarSource, resolveCachedAvatarSource } from '../avatarCache'

describe('avatarCache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('returns cached data urls without fetching the remote avatar again', async () => {
    const avatarUrl = '/uploads/avatar.webp'
    const dataUrl = 'data:image/webp;base64,cached-avatar'
    putCachedAvatarSource(avatarUrl, dataUrl)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(getCachedAvatarSource(avatarUrl)).toBe(dataUrl)
    await expect(resolveCachedAvatarSource(avatarUrl)).resolves.toBe(dataUrl)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches an uncached avatar once and stores it as a data url', async () => {
    const avatarUrl = '/uploads/avatar.webp'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['avatar'], { type: 'image/webp' }))
      })
    )

    const cached = await resolveCachedAvatarSource(avatarUrl)

    expect(cached).toMatch(/^data:image\/webp;base64,/)
    await expect(resolveCachedAvatarSource(avatarUrl)).resolves.toBe(cached)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('returns an empty source when the avatar request fails', async () => {
    const avatarUrl = '/uploads/missing.webp'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(resolveCachedAvatarSource(avatarUrl)).resolves.toBe('')
  })
})
