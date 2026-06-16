const expectedBillingErrorMessages = [
  '用户没有有效订阅',
  '用户当前没有订阅',
  '用户未认证',
  '管理员未认证',
  "Service 'subscription' is not registered yet",
  "Service 'subscription-billing' is not registered yet"
]

export const isExpectedBillingUnavailableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '')
  return expectedBillingErrorMessages.some((item) => message.includes(item))
}

export const reportUnexpectedBillingError = (label: string, error: unknown) => {
  if (isExpectedBillingUnavailableError(error)) return
  console.warn(label, error)
}
