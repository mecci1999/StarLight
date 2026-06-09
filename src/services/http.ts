import { AppException, ErrorType } from '@/common/exception'
import { RequestQueue } from '@/utils/RequestQueue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { getCookie, setCookie, removeCookie } from '@/utils/Cookie'
import url from '@/api/url'

// 错误信息常量
const ERROR_MESSAGES = {
  NETWORK: '网络异常',
  TIMEOUT: '请求超时，请稍后重试',
  OFFLINE: '当前网络已断开，请检查网络连接',
  ABORTED: '请求已取消',
  UNKNOWN: '请求失败，请稍后重试'
} as const

const ACCESS_TOKEN_EXPIRE_DAYS = 7
const REFRESH_TOKEN_EXPIRE_DAYS = 30

/**
 * @description 重试选项
 */
export type RetryOptions = {
  retries?: number // 重试次数
  retryDelay?: (attempt: number) => number // 重试延迟函数
  retryOn?: number[] // 重试状态码
}

/**
 * @description 请求参数
 * @property {"GET"|"POST"|"PUT"|"DELETE"} method 请求方法
 * @property {Record<string, string>} [headers] 请求头
 * @property {Record<string, any>} [query] 请求参数
 * @property {any} [body] 请求体
 * @property {boolean} [isBlob] 是否为Blob
 * @property {RetryOptions} [retry] 重试选项
 * @property {boolean} [noRetry] 是否禁用重试
 * @property {boolean} [suppressErrorLog] 是否抑制预期失败的控制台错误日志
 * @return HttpParams
 */
export type HttpParams = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  query?: Record<string, any>
  body?: any
  isBlob?: boolean // 是否二进制流
  retry?: RetryOptions // 重试选项
  noRetry?: boolean // 是否禁用重试
  suppressErrorLog?: boolean // 是否抑制预期失败的错误日志
}

/**
 * @description 等待指定的毫秒数
 * @param {number} ms 毫秒数
 * @return {Promise<void>}
 */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const runtimeFetch = (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init)

const parseResponseData = async (response: Response, isBlob?: boolean) => {
  if (isBlob) return response.arrayBuffer()

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null)
  }

  if (!contentType && typeof response.json === 'function') {
    const json = await response.json().catch(() => undefined)
    if (json !== undefined) return json
  }

  if (typeof response.text !== 'function') return null
  const text = await response.text().catch(() => '')
  if (!text) return null

  return {
    message: text,
    content: text
  }
}

const resolveHttpErrorMessage = (status: number, responseData: any, requestUrl: string) => {
  const responseMessage = responseData?.data?.message || responseData?.message
  if (responseMessage) return responseMessage

  if (status === 500 && import.meta.env.DEV && requestUrl.startsWith('/api/')) {
    return '服务端暂不可用，请确认后端网关已启动'
  }

  return `HTTP error! status: ${status}`
}

const getStoredToken = (name: 'ACCESS_TOKEN' | 'REFRESH_TOKEN') => {
  const cookie = getCookie(name)
  if (cookie) return cookie
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(name)
  if (stored) {
    const expires = name === 'ACCESS_TOKEN' ? ACCESS_TOKEN_EXPIRE_DAYS : REFRESH_TOKEN_EXPIRE_DAYS
    setCookie(name, stored, expires)
  }
  return stored
}

const setStoredToken = (name: 'ACCESS_TOKEN' | 'REFRESH_TOKEN', value: string) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(name, value)
}

const clearStoredTokens = () => {
  removeCookie('ACCESS_TOKEN')
  removeCookie('REFRESH_TOKEN')
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem('ACCESS_TOKEN')
  localStorage.removeItem('REFRESH_TOKEN')
}

const extractTokenFromSetCookie = (header: string | null, key: 'ACCESS_TOKEN' | 'REFRESH_TOKEN') => {
  if (!header) return null
  const match = header.match(new RegExp(`${key}=([^;]+)`))
  return match ? match[1] : null
}

const persistTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  if (accessToken) {
    const safeAccessToken = accessToken.replace(/[\r\n]/g, '')
    setCookie('ACCESS_TOKEN', safeAccessToken, ACCESS_TOKEN_EXPIRE_DAYS)
    setStoredToken('ACCESS_TOKEN', safeAccessToken)
  }
  if (refreshToken) {
    const safeRefreshToken = refreshToken.replace(/[\r\n]/g, '')
    setCookie('REFRESH_TOKEN', safeRefreshToken, REFRESH_TOKEN_EXPIRE_DAYS)
    setStoredToken('REFRESH_TOKEN', safeRefreshToken)
  }
}

const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000

type JwtPayload = {
  exp?: number
}

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    )
    return JSON.parse(atob(paddedPayload)) as JwtPayload
  } catch {
    return null
  }
}

const shouldRefreshAccessToken = (token: string | null) => {
  if (!token) return false

  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false

  return payload.exp * 1000 - Date.now() <= TOKEN_REFRESH_SKEW_MS
}

/**
 * @description 判断是否应进行下一次重试
 * @param attempt 重试次数
 * @param maxRetries 最大重试次数
 * @param abort 中止控制器
 */
function shouldRetry(attempt: number, maxRetries: number, abort?: AbortController): boolean {
  return attempt + 1 < maxRetries && !abort?.signal.aborted
}

/**
 * @description TODO: 防止当有请求的时候突然退出登录，导致在登录窗口发生请求错误
 * @description 检查是否需要阻止请求
 * @param url 请求地址
 * @returns 是否需要阻止请求
 */
const shouldBlockRequest = async (url: string) => {
  try {
    const currentWindow = WebviewWindow.getCurrent()
    const isLoginWindow = currentWindow.label === 'login'

    // 如果不是登录窗口,不阻止请求
    if (!isLoginWindow) return false

    // 登录相关的接口永远不阻止
    if (
      url.includes('/login') ||
      url.includes('/verifyCode') ||
      url.includes('/register') ||
      url.includes('/refreshToken') ||
      url.includes('qrcode')
    )
      return false

    // 检查是否已登录成功(有双token)，仅依赖 Cookie
    const hasToken = getStoredToken('ACCESS_TOKEN')
    const hasRefreshToken = getStoredToken('REFRESH_TOKEN')
    const isLoggedIn = hasToken && hasRefreshToken

    // 在登录窗口但已登录成功的情况下不阻止请求
    return !isLoggedIn
  } catch (error) {
    console.error('检查请求状态失败:', error)
    return false
  }
}

// 添加一个标记,避免多个请求同时刷新token
let isRefreshing = false

// 使用队列实现
const requestQueue = new RequestQueue()
async function refreshTokenAndRetry(): Promise<string> {
  if (isRefreshing) {
    console.log('🔄 已有刷新请求在进行中，加入等待队列')

    return new Promise((resolve, reject) => {
      requestQueue.enqueue(resolve, reject, 1)
    })
  }

  isRefreshing = true

  try {
    const refreshToken = getStoredToken('REFRESH_TOKEN')
    const refreshUrl = url.refreshToken
    const serviceUrl = import.meta.env.VITE_SERVICE_URL
    const accessToken = getStoredToken('ACCESS_TOKEN')
    const hasVisibleRefreshCookie = typeof document !== 'undefined' && document.cookie.includes('REFRESH_TOKEN=')

    const refreshHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    const refreshBody = refreshToken ? JSON.stringify({ refreshToken }) : undefined

    console.log('📤 正在使用refreshToken获取新的token', {
      refreshUrl,
      serviceUrl,
      hasRefreshToken: Boolean(refreshToken),
      hasVisibleRefreshCookie,
      hasAccessToken: Boolean(accessToken)
    })
    if (!refreshUrl || refreshUrl.includes('undefined')) {
      throw new AppException('服务端地址未配置', {
        type: ErrorType.Network,
        showError: true
      })
    }
    const response = await runtimeFetch(refreshUrl, {
      method: 'POST',
      headers: refreshHeaders,
      body: refreshBody,
      credentials: 'include'
    })

    const data = await response.json().catch(() => null)
    const businessStatus = data?.status ?? data?.data?.status
    const businessCode = data?.code ?? data?.data?.code
    const businessSuccess = data?.data?.success ?? data?.success
    const hasExplicitBusinessFailure =
      (typeof businessStatus === 'number' && businessStatus >= 400) ||
      businessSuccess === false ||
      businessCode === 10003 ||
      businessCode === 40000 ||
      businessCode === 40001

    const isSuccess =
      (typeof businessStatus === 'number' && businessStatus >= 200 && businessStatus < 300) ||
      businessSuccess === true ||
      businessCode === 0 ||
      businessCode === 200

    console.log('🔄 Token刷新响应', {
      status: response.status,
      ok: response.ok,
      businessStatus,
      businessCode,
      businessSuccess,
      fullData: data
    })

    if (!response.ok || !isSuccess || hasExplicitBusinessFailure) {
      clearStoredTokens()
      window.dispatchEvent(new Event('needReLogin'))
      throw new AppException(data?.data?.message || data?.message || '登录已过期，请重新登录', {
        type: ErrorType.TokenExpired,
        code: businessCode ?? businessStatus ?? response.status,
        details: data,
        showError: true
      })
    }

    const content = data?.data?.content || data?.content || data?.data || data || {}
    console.log('🔍 提取token的content对象:', content)

    const nextAccessToken = content.accessToken || content.token || content.access_token || getCookie('ACCESS_TOKEN')
    const nextRefreshToken = content.refreshToken || content.refresh_token || getCookie('REFRESH_TOKEN')

    console.log('🔑 提取到的token:', {
      hasAccessToken: !!nextAccessToken,
      accessTokenLength: nextAccessToken?.length || 0,
      hasRefreshToken: !!nextRefreshToken,
      refreshTokenLength: nextRefreshToken?.length || 0
    })

    if (nextAccessToken) {
      const safeAccessToken = nextAccessToken.replace(/[\r\n]/g, '')
      setCookie('ACCESS_TOKEN', safeAccessToken, ACCESS_TOKEN_EXPIRE_DAYS)
      setStoredToken('ACCESS_TOKEN', safeAccessToken)
    }
    if (nextRefreshToken) {
      const safeRefreshToken = nextRefreshToken.replace(/[\r\n]/g, '')
      setCookie('REFRESH_TOKEN', safeRefreshToken, REFRESH_TOKEN_EXPIRE_DAYS)
      setStoredToken('REFRESH_TOKEN', safeRefreshToken)
    }

    if (nextAccessToken) {
      console.log('🔑 Token刷新成功')
      const safeAccessToken = nextAccessToken.replace(/[\r\n]/g, '')
      await requestQueue.processQueue(safeAccessToken)

      return safeAccessToken
    }

    window.dispatchEvent(new Event('needReLogin'))
    throw new Error('刷新令牌失败')
  } catch (error: any) {
    console.error('❌ 刷新Token过程出错:', error)
    requestQueue.clear(error) // 发生错误时清空队列并拒绝等待请求

    // 如果是网络错误，不触发强制登出
    const isNetworkError =
      error instanceof TypeError ||
      error.name === 'AbortError' ||
      !navigator.onLine ||
      error.message?.toLowerCase().includes('network')

    if (!isNetworkError && !(error instanceof AppException && error.message === '无刷新令牌')) {
      window.dispatchEvent(new Event('needReLogin'))
    }
    throw error
  } finally {
    isRefreshing = false
  }
}

/**
 * @description HTTP 请求
 * @description 基于 Tauri 的 HTTP 请求封装，支持重试、请求队列等功能
 * @template T
 * @param {string} url 请求地址
 * @param {HttpParams} options 请求参数
 * @param {boolean} fullResponse 是否返回完整响应
 * @param {Promise<T | { data: T; response: Response }>} abort 中断器
 */
async function Http<T = any>(
  url: string,
  options: HttpParams,
  fullResponse: boolean = false,
  abort?: AbortController
): Promise<{ data: T; response: Response } | T> {
  // 检查是否需要阻止请求
  const shouldBlock = await shouldBlockRequest(url)
  if (shouldBlock) {
    throw new AppException('在登录窗口中，取消非登录相关请求', {
      type: ErrorType.Network,
      showError: false
    })
  }

  // 打印请求信息
  console.log(`🚀 发起请求 → ${options.method} ${url}`, {
    body: options.body,
    query: options.query
  })

  // 默认重试配置，在登录窗口时禁用重试
  const defaultRetryOptions: RetryOptions = {
    retries: 3, // 默认重试次数为3次
    retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
    retryOn: [] // 状态码意味着已经连接到服务器
  }

  // 合并默认重试配置与用户传入的重试配置
  const retryOptions: RetryOptions = {
    ...defaultRetryOptions,
    ...options.retry
  }

  const { retries = 3, retryDelay } = retryOptions
  const maxRetries = options.noRetry ? 1 : retries

  // 获取token和指纹
  const storedToken = getStoredToken('ACCESS_TOKEN')
  const isAuthRequest = /\/(login|register|verifyCode|refresh|publicKey)/i.test(url)
  const token = !isAuthRequest && shouldRefreshAccessToken(storedToken) ? await refreshTokenAndRetry() : storedToken
  //const fingerprint = await getEnhancedFingerprint()

  // 构建请求头
  const httpHeaders = new Headers(options.headers || {})

  // 设置Content-Type
  if (!httpHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
    httpHeaders.set('Content-Type', 'application/json')
  }

  // 设置认证头
  // 浏览器原生 fetch 不可靠地允许手动设置 Cookie 头，所以统一改用 Authorization。
  // refreshToken 仍然通过请求体传递，服务端已有兼容逻辑。

  if (token && !isAuthRequest) {
    try {
      const safeToken = token.replace(/[^\x20-\x7E]/g, '')
      httpHeaders.set('Authorization', `Bearer ${safeToken}`)
    } catch (e) {
      console.error('❌ 设置 Authorization 失败，Token 可能已损坏', e)
      clearStoredTokens()
    }
  }

  // 处理请求体
  let body = options.body
  if (body && !(body instanceof FormData || body instanceof URLSearchParams)) {
    body = JSON.stringify(body)
  }

  // 确保 httpHeaders 可以在闭包中被引用和修改
  const fetchOptions: RequestInit = {
    method: options.method,
    headers: httpHeaders,
    signal: abort?.signal,
    body,
    credentials: 'include'
  }

  // 添加查询参数
  if (options.query) {
    const queryString = new URLSearchParams(options.query).toString()
    url += `?${queryString}`
  }

  console.log('🌐 实际请求路径', {
    method: options.method,
    url
  })

  // 添加获取网络错误信息的辅助函数
  function getNetworkErrorMessage(error: any): string {
    if (!navigator.onLine) {
      return ERROR_MESSAGES.OFFLINE
    }

    if (error.name === 'AbortError') {
      return ERROR_MESSAGES.ABORTED
    }

    // 检查是否包含超时关键词
    if (error.message?.toLowerCase().includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT
    }

    return ERROR_MESSAGES.NETWORK
  }

  // 定义重试函数
  let tokenRefreshCount = 0 // 在闭包中存储计数器
  async function attemptFetch(currentAttempt: number): Promise<{ data: T; response: Response } | T> {
    try {
      const response = await runtimeFetch(url, fetchOptions)
      const setCookieHeader = response.headers.get('set-cookie')
      if (setCookieHeader) {
        const headerAccessToken = extractTokenFromSetCookie(setCookieHeader, 'ACCESS_TOKEN')
        const headerRefreshToken = extractTokenFromSetCookie(setCookieHeader, 'REFRESH_TOKEN')
        if (headerAccessToken || headerRefreshToken) {
          persistTokens(headerAccessToken, headerRefreshToken)
        }
      }

      // 解析响应数据。Vite proxy 或网关错误可能返回 text/plain，不能一律按 JSON 解析。
      const responseData = await parseResponseData(response, options.isBlob)

      const businessStatus = responseData?.status ?? responseData?.data?.status
      const businessCode = responseData?.code ?? responseData?.data?.code
      const businessSuccess = responseData?.data?.success ?? responseData?.success

      console.log('🔎 响应诊断', {
        url,
        method: options.method,
        status: response.status,
        ok: response.ok,
        businessStatus,
        businessCode,
        businessSuccess,
        tokenRefreshCount,
        responseData
      })

      if (response.status === 401 || businessCode === 40001) {
        console.log('🔄 Token无效，尝试刷新Token...', {
          status: response.status,
          businessCode,
          businessStatus,
          url,
          method: options.method,
          tokenRefreshCount
        })

        // 限制token刷新重试次数，最多重试一次，避免无限循环
        if (tokenRefreshCount >= 1) {
          console.log('🚫 Token刷新重试次数超过限制，清除token并重新登录')
          clearStoredTokens()
          window.dispatchEvent(new Event('needReLogin'))
          throw new AppException('登录已过期，请重新登录', {
            type: ErrorType.TokenExpired,
            showError: true
          })
        }

        try {
          console.log('🔄 开始尝试刷新Token并重试请求', { url, method: options.method })
          // 刷新token
          const token = await refreshTokenAndRetry()
          console.log('🔄 使用新Token重试原请求', `token length: ${token?.length}`)

          if (token && typeof token === 'string') {
            // 移除可能导致 header 错误的字符（如换行符）
            const safeToken = token.replace(/[\r\n]/g, '')
            // 更新 fetchOptions.headers，确保下一次 fetch 使用新 token
            if (fetchOptions.headers instanceof Headers) {
              fetchOptions.headers.set('Authorization', `Bearer ${safeToken}`)
            } else if (Array.isArray(fetchOptions.headers)) {
              const existing = fetchOptions.headers.find((h) => h[0].toLowerCase() === 'authorization')
              if (existing) {
                existing[1] = `Bearer ${safeToken}`
              } else {
                fetchOptions.headers.push(['Authorization', `Bearer ${safeToken}`])
              }
            } else {
              fetchOptions.headers = { ...fetchOptions.headers, Authorization: `Bearer ${safeToken}` }
            }
          }

          // 增加计数器
          tokenRefreshCount++
          return attemptFetch(currentAttempt)
        } catch (refreshError: any) {
          // 续签出错
          console.error('❌ Token续签失败:', refreshError)

          // 修改逻辑：无论何种错误，都不强制登出，而是抛出异常
          // 让调用方（组件/页面）决定如何处理错误（例如显示错误提示）
          // 只有当明确收到 "无刷新令牌" 错误时（意味着 refreshToken 也过期了），才考虑是否需要登出，
          // 但即便是这种情况，对于非关键请求，强制登出也可能体验不好。
          // 这里我们选择最保守的策略：只抛出错误，绝不主动触发 needReLogin。

          /*
          const isNetworkError = 
            refreshError instanceof TypeError || 
            refreshError.name === 'AbortError' || 
            !navigator.onLine ||
            refreshError.message?.toLowerCase().includes('network')

          if (!isNetworkError && !(refreshError instanceof AppException && refreshError.message === '无刷新令牌')) {
            window.dispatchEvent(new Event('needReLogin'))
          }
          */

          throw refreshError
        }
      }

      if (response.status === 403) {
        console.log('🤯 权限不足')
      }

      if (!response.ok && response.status !== 401 && response.status !== 403 && businessCode !== 40001) {
        throw new AppException(resolveHttpErrorMessage(response.status, responseData, url), {
          type: ErrorType.Server,
          code: response.status,
          details: { url, method: options.method, response: responseData }
        })
      }

      const isSuccess =
        (typeof businessStatus === 'number' && businessStatus >= 200 && businessStatus < 300) ||
        businessSuccess === true ||
        businessCode === 0 ||
        businessCode === 200 ||
        response.ok

      if (responseData && !isSuccess) {
        throw new AppException(responseData?.data?.message || responseData?.message || '服务端返回错误', {
          type: ErrorType.Server,
          code: businessStatus ?? response.status,
          details: responseData,
          showError: true
        })
      }

      // 打印响应结果
      console.log(`✅ 请求成功 → ${options.method} ${url}`, {
        status: response.status,
        data: responseData
      })

      // 若请求成功且没有业务报错
      if (fullResponse) {
        return { data: responseData, response: response }
      }

      return responseData
    } catch (error: any) {
      // 处理网络相关错误
      const isRetryableNetworkError =
        error instanceof TypeError || // fetch 的网络错误会抛出 TypeError
        error.name === 'AbortError' || // 请求中断
        error.name === 'SyntaxError' || // Header 格式错误
        !navigator.onLine // 浏览器离线

      // 可重试的网络瞬断只打印 warning，不提前 console.error，避免刷新页面时出现“失败”误报。
      if (isRetryableNetworkError) {
        // 移除 SyntaxError 的特殊处理，避免误删 Token 导致无法续期
        // 让错误自然抛出或进入重试逻辑

        // 获取友好的错误信息
        const errorMessage = getNetworkErrorMessage(error)

        // 重试请求
        if (shouldRetry(currentAttempt, maxRetries, abort)) {
          console.warn(`${errorMessage}，准备重试 → 第 ${currentAttempt + 2} 次尝试`)
          // 计算重试延迟
          const delayMs = retryDelay ? retryDelay(currentAttempt) : 1000
          // 等待一段时间后重试
          await wait(delayMs)
          // 重试请求
          return attemptFetch(currentAttempt + 1)
        }

        if (import.meta.env.DEV && !options.suppressErrorLog) {
          console.error(`尝试 ${currentAttempt + 1} 失败 →`, error)
        }

        // 重试次数用完，抛出友好的错误信息
        throw new AppException(errorMessage, {
          type: ErrorType.Network,
          details: { attempts: currentAttempt + 1 },
          showError: true
        })
      }

      // 非网络类错误不会重试，需要保留详细错误，方便定位真实业务/解析问题。
      if (import.meta.env.DEV && !options.suppressErrorLog) {
        console.error(`尝试 ${currentAttempt + 1} 失败 →`, error)
      }

      if (error instanceof AppException) {
        throw error
      }

      // 未知错误，使用友好的错误提示
      throw new AppException(ERROR_MESSAGES.UNKNOWN, {
        type: error instanceof TypeError ? ErrorType.Network : ErrorType.Unknown,
        details: { attempts: currentAttempt + 1 },
        showError: true
      })
    }
  }

  // 第一次执行，attempt=0
  return attemptFetch(0)
}

export default Http
