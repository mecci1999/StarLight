import { describe, expect, it } from 'vitest'
import { didResendNotificationSucceed, getNextRetryCount, rollbackRetryCount } from '../notificationCenterModel'

describe('didResendNotificationSucceed', () => {
  it('treats explicit false responses as resend failures', () => {
    expect(didResendNotificationSucceed(false)).toBe(false)
    expect(didResendNotificationSucceed({ success: false })).toBe(false)
    expect(didResendNotificationSucceed({})).toBe(false)
    expect(didResendNotificationSucceed(undefined)).toBe(false)
    expect(didResendNotificationSucceed(null)).toBe(false)
  })

  it('treats only explicit success responses as resend success', () => {
    expect(didResendNotificationSucceed(true)).toBe(true)
    expect(didResendNotificationSucceed({ success: true })).toBe(true)
  })

  it('increments retry count optimistically from known or missing values', () => {
    expect(getNextRetryCount(0)).toBe(1)
    expect(getNextRetryCount(2)).toBe(3)
    expect(getNextRetryCount(null)).toBe(1)
  })

  it('rolls retry count back to the previous value after resend failure', () => {
    expect(rollbackRetryCount(3, 2)).toBe(2)
    expect(rollbackRetryCount(1, null)).toBe(0)
    expect(rollbackRetryCount(undefined, undefined)).toBe(0)
  })
})
