import Http, { HttpParams } from './http'
import { ServiceResponse } from '@/types/response'
import { AppException, ErrorType } from '@/common/exception'
import { getCookie } from '@/utils/Cookie'
import urls from '@/api/url'

/**
 * 获取 token 并更新
 */
export const computedToken = computed(() => {
  let tempToken = ''
  return {
    get() {
      if (tempToken) return tempToken

      const token = getCookie('ACCESS_TOKEN')
      if (token) {
        tempToken = token
      }

      return tempToken
    },
    clear() {
      tempToken = ''
    }
  }
})

/**
 * fetch 请求响应拦截器
 * @param url 请求地址
 * @param method 请求方法
 * @param query 查询参数
 * @param body 请求体
 * @param abort 取消请求控制器
 * @param noRetry 是否不重试
 *
 * @returns 响应数据
 */
const responseInterceptor = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  query: any,
  body: any,
  abort?: AbortController,
  noRetry?: boolean,
  requestOptions?: Partial<HttpParams>
): Promise<T> => {
  let httpParams: HttpParams = {
    method,
    noRetry,
    ...(requestOptions || {})
  }

  if (method === 'GET') {
    httpParams = {
      ...httpParams,
      query
    }
  } else {
    const queryString = new URLSearchParams(query).toString()
    if (queryString) {
      url = `${url}?${queryString}`
    }
    httpParams = {
      ...httpParams,
      body
    }
  }

  try {
    const data = await Http(url, httpParams, true, abort)
    const serviceData = (await data.data) as ServiceResponse

    const businessStatus = (serviceData as any)?.status ?? (serviceData as any)?.data?.status
    const businessCode = (serviceData as any)?.code ?? (serviceData as any)?.data?.code
    const businessSuccess = (serviceData as any)?.data?.success ?? (serviceData as any)?.success

    let isSuccess = false
    if (typeof businessSuccess === 'boolean') {
      isSuccess = businessSuccess
    } else if (typeof businessCode === 'number') {
      isSuccess = businessCode === 0 || businessCode === 200
    } else {
      isSuccess = typeof businessStatus === 'number' && businessStatus >= 200 && businessStatus < 300
    }

    if (!isSuccess) {
      const message = (serviceData as any)?.data?.message || (serviceData as any)?.message
      return Promise.reject(
        new AppException(message, {
          type: ErrorType.Server,
          showError: true
        })
      )
    }

    // 除了二维码登录接口，其他接口都需要展示成功信息
    const responseMessage = (serviceData as any)?.data?.message || (serviceData as any)?.message
    if (
      responseMessage &&
      !requestOptions?.suppressSuccessMessage &&
      !url.includes('/qrcode') &&
      url !== urls.metricsStats
    ) {
      window.$message.success(responseMessage)
    }

    const content = (serviceData as any)?.data?.content ?? (serviceData as any)?.content
    return Promise.resolve(content)
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * get 请求
 * @param url
 * @param query
 * @param abort
 * @param noRetry
 * @returns
 */
const get = async <T>(url: string, query: any, abort?: AbortController, noRetry?: boolean): Promise<T> => {
  return responseInterceptor(url, 'GET', query, {}, abort, noRetry)
}

const getWithOptions = async <T>(
  url: string,
  query: any,
  options?: { abort?: AbortController; noRetry?: boolean } & Partial<HttpParams>
): Promise<T> => {
  return responseInterceptor(url, 'GET', query, {}, options?.abort, options?.noRetry, options)
}

/**
 * post 请求
 * @param url
 * @param params
 * @param abort
 * @param noRetry
 * @returns
 */
const post = async <T>(url: string, params: any, abort?: AbortController, noRetry?: boolean): Promise<T> => {
  return responseInterceptor(url, 'POST', {}, params, abort, noRetry)
}

const postWithOptions = async <T>(
  url: string,
  params: any,
  options?: { abort?: AbortController; noRetry?: boolean } & Partial<HttpParams>
): Promise<T> => {
  return responseInterceptor(url, 'POST', {}, params, options?.abort, options?.noRetry, options)
}

/**
 * put 请求
 * @param url
 * @param params
 * @param abort
 * @param noRetry
 * @returns
 */
const put = async <T>(url: string, params: any, abort?: AbortController, noRetry?: boolean): Promise<T> => {
  return responseInterceptor(url, 'PUT', {}, params, abort, noRetry)
}

/**
 * delete 请求
 * @param url
 * @param params
 * @param abort
 * @param noRetry
 * @returns
 */
const del = async <T>(url: string, params: any, abort?: AbortController, noRetry?: boolean): Promise<T> => {
  return responseInterceptor(url, 'DELETE', {}, params, abort, noRetry)
}

export default {
  get,
  getWithOptions,
  post,
  postWithOptions,
  put,
  delete: del
}
