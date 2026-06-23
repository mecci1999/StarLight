import { describe, expect, it } from 'vitest'
import { extractUpdatedUser } from '../user'

describe('user api', () => {
  it('extracts the final user payload from current backend envelopes', () => {
    expect(
      extractUpdatedUser({
        data: {
          content: {
            user: {
              userId: 'user-1',
              avatar: 'http://127.0.0.1:6670/uploads/avatar.webp'
            }
          }
        }
      })
    ).toEqual({
      userId: 'user-1',
      avatar: 'http://127.0.0.1:6670/uploads/avatar.webp'
    })
  })

  it('keeps compatibility with flattened user update responses', () => {
    expect(extractUpdatedUser({ user: { nickname: 'Ops Lead', timezone: 'UTC+9' } })).toEqual({
      nickname: 'Ops Lead',
      timezone: 'UTC+9'
    })

    expect(extractUpdatedUser({ nickname: 'Ops Lead', locale: 'zh-CN' })).toEqual({
      nickname: 'Ops Lead',
      locale: 'zh-CN'
    })
  })
})
