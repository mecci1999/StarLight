export function didResendNotificationSucceed(result: boolean | { success?: boolean } | null | undefined) {
  if (result === true) return true
  if (result && typeof result === 'object') {
    return result.success === true
  }
  return false
}

export function getNextRetryCount(currentRetryCount: number | null | undefined) {
  return typeof currentRetryCount === 'number' ? currentRetryCount + 1 : 1
}

export function rollbackRetryCount(
  currentRetryCount: number | null | undefined,
  previousRetryCount: number | null | undefined
) {
  if (typeof previousRetryCount === 'number') return previousRetryCount
  if (typeof currentRetryCount === 'number' && currentRetryCount > 0) return currentRetryCount - 1
  return previousRetryCount ?? 0
}
