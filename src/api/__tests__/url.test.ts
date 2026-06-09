import { describe, expect, it } from 'vitest'
import url from '../url'

describe('api url', () => {
  it('uses same-origin /api paths in Vite development mode', () => {
    expect(import.meta.env.DEV).toBe(true)
    expect(url.emailVerifyCode).toBe('/api/auth/v1/verifyCode')
    expect(url.refreshToken).toBe('/api/auth/v1/refreshToken')
  })
})
