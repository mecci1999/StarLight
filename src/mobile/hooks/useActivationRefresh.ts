type ActivationRefreshOptions = {
  contextKey?: () => string
}

export const useActivationRefresh = (ttlMs: number, options: ActivationRefreshOptions = {}) => {
  let lastActivatedAt = 0
  let lastContextKey = ''

  return () => {
    const contextKey = options.contextKey?.() || ''
    const now = Date.now()
    const shouldRefresh = lastActivatedAt === 0 || contextKey !== lastContextKey || now - lastActivatedAt >= ttlMs

    if (shouldRefresh) {
      lastActivatedAt = now
      lastContextKey = contextKey
    }

    return shouldRefresh
  }
}
