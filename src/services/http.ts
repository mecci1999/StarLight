import { fetch } from '@tauri-apps/plugin-http'
import { AppException, ErrorType } from '@/common/exception'
import { RequestQueue } from '@/utils/requestQueue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { getCookie } from '@/utils/cookie'

// 错误信息常量
const ERROR_MESSAGES = {
  NETWORK: '网络异常',
  TIMEOUT: '请求超时，请稍后重试',
  OFFLINE: '当前网络已断开，请检查网络连接',
  ABORTED: '请求已取消',
  UNKNOWN: '请求失败，请稍后重试'
} as const

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
}

/**
 * @description 等待指定的毫秒数
 * @param {number} ms 毫秒数
 * @return {Promise<void>}
 */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    if (url.includes('/login') || url.includes('/refreshToken')) return false

    // 检查是否已登录成功(有双token)
    const hasToken = getCookie('ACCESS_TOKEN')
    const hasRefreshToken = getCookie('REFRESH_TOKEN')
    const isLoggedIn = hasToken && hasRefreshToken

    // 在登录窗口但已登录成功的情况下不阻止请求
    return !isLoggedIn
  } catch (error) {
    console.error('检查请求状态失败:', error)
    return false
  }
}

/**
 * @description HTTP 请求
 * @description 基于 Tauri 的 HTTP 请求封装，支持重试、请求队列等功能
 * @template T
 * @param {string} url 请求地址
 * @param {HttpParams} options 请求参数
 * @param {boolean} fullResponse 是否返回完整响应
 * @param {Promise<T | { data: T; resp: Response }>} abort 中断器
 */
async function Http<T = any>(
  url: string,
  options: HttpParams,
  fullResponse: boolean = false,
  abort?: AbortController
): Promise<{ data: T; resp: Response } | T> {
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
    retries: 3,
    retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
    retryOn: [] // 状态码意味着已经连接到服务器
  }

  // 合并默认重试配置与用户传入的重试配置
  const retryOptions: RetryOptions = {
    ...defaultRetryOptions,
    ...options.retry
  }

  const { retries = 3, retryDelay } = retryOptions

  // 获取token和指纹
  const token = getCookie('ACCESS_TOKEN')
  //const fingerprint = await getEnhancedFingerprint()

  // 构建请求头
  const httpHeaders = new Headers(options.headers || {})

  // 设置Content-Type
  if (!httpHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
    httpHeaders.set('Content-Type', 'application/json')
  }

  // 设置Cookie
  if (token) {
    httpHeaders.set('Cookie', `ACCESS_TOKEN=${token}`)
  }

  // 设置浏览器指纹
  //if (fingerprint) {
  //httpHeaders.set('X-Device-Fingerprint', fingerprint)
  //}

  // 构建fetch请求选项
  const fetchOptions: RequestInit = {
    method: options.method,
    headers: httpHeaders,
    signal: abort?.signal
  }

  // 获取代理设置
  // const proxySettings = JSON.parse(localStorage.getItem('proxySettings') || '{}')
  // 如果设置了代理，添加代理配置 (BETA)
  // if (proxySettings.type && proxySettings.ip && proxySettings.port) {
  //   // 使用 Rust 后端的代理客户端
  //   fetchOptions.proxy = {
  //     url: `${proxySettings.type}://${proxySettings.ip}:${proxySettings.port}`
  //   }
  // }

  // 判断是否需要添加请求体
  if (options.body) {
    if (!(options.body instanceof FormData || options.body instanceof URLSearchParams)) {
      fetchOptions.body = JSON.stringify(options.body)
    } else {
      fetchOptions.body = options.body // 如果是 FormData 或 URLSearchParams 直接使用
    }
  }

  // 添加查询参数
  if (options.query) {
    const queryString = new URLSearchParams(options.query).toString()
    url += `?${queryString}`
  }

  // 定义重试函数
  let tokenRefreshCount = 0 // 在闭包中存储计数器
}
