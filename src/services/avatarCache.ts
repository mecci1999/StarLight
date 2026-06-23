const AVATAR_CACHE_PREFIX = 'starlight:avatar-cache:'
const MAX_CACHED_AVATAR_BYTES = 256 * 1024

const pendingAvatarLoads = new Map<string, Promise<string>>()

export const canCacheAvatarSource = (source: string) =>
  Boolean(
    source &&
      (/^(https?:)?\/\//.test(source) || source.startsWith('/')) &&
      !source.startsWith('data:') &&
      !source.startsWith('blob:')
  )

const getCacheKey = (source: string) => `${AVATAR_CACHE_PREFIX}${source}`

export const getCachedAvatarSource = (source: string) => {
  if (!canCacheAvatarSource(source)) return ''
  try {
    return localStorage.getItem(getCacheKey(source)) || ''
  } catch {
    return ''
  }
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('头像缓存读取失败'))
    reader.readAsDataURL(blob)
  })

export const putCachedAvatarSource = (source: string, dataUrl: string) => {
  if (!canCacheAvatarSource(source) || !dataUrl.startsWith('data:image/')) return
  if (dataUrl.length > MAX_CACHED_AVATAR_BYTES) return
  try {
    localStorage.setItem(getCacheKey(source), dataUrl)
  } catch {
    // 本地缓存是性能优化，写入失败时继续使用远端地址。
  }
}

export const resolveCachedAvatarSource = async (source: string) => {
  if (!canCacheAvatarSource(source)) return source

  const cached = getCachedAvatarSource(source)
  if (cached) return cached

  if (typeof fetch !== 'function') return source

  const pending = pendingAvatarLoads.get(source)
  if (pending) return pending

  const request = fetch(source, { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) return ''
      const blob = await response.blob()
      if (!blob.type.startsWith('image/') || blob.size > MAX_CACHED_AVATAR_BYTES) return source
      const dataUrl = await blobToDataUrl(blob)
      putCachedAvatarSource(source, dataUrl)
      return dataUrl
    })
    .catch(() => '')
    .finally(() => {
      pendingAvatarLoads.delete(source)
    })

  pendingAvatarLoads.set(source, request)
  return request
}
