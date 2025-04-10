import Http, { HttpParams } from './http'
import { ServiceResponse } from '@/types/response'
import { AppException, ErrorType } from '@/common/exception'
import { getCookie } from '@/utils/Cookie'

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
  noRetry?: boolean
): Promise<T> => {
  let httpParams: HttpParams = {
    method,
    noRetry
  }

  if (method === 'GET') {
    httpParams = {
      ...httpParams,
      query
    }
  } else {
    url = `${url}?${new URLSearchParams(query).toString()}`
    httpParams = {
      ...httpParams,
      body
    }
  }

  try {
    const data = await Http(url, httpParams, true, abort)
    const serviceData = (await data.data) as ServiceResponse

    // 检查服务端返回是否成功，并且中断请求
    if (serviceData.status !== 200) {
      return Promise.reject(
        new AppException(serviceData.data.message, {
          type: ErrorType.Server,
          showError: true
        })
      )
    }

    return Promise.resolve(serviceData.data.content)
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
const get = async <T>(url: string, query: T, abort?: AbortController, noRetry?: boolean): Promise<T> => {
  return responseInterceptor(url, 'GET', query, {}, abort, noRetry)
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
  post,
  put,
  delete: del
}
