import type { RequestParams } from '@/utils/FetchService/types'
import { directTrans } from '@/app/i18n/client'
import { CONTACT } from '@/constant'
import { notification } from '@/lib/notification'
import { useUserStore } from '@/store/user'
import FetchService from '@/utils/FetchService/FetchService'

interface ResponseType<T> {
  code: string | number
  data: T
  message: string
  url: string
}

type RequestParamsWithSilent = RequestParams & {
  silent?: boolean // 是否静默处理错误，不显示提示
  authToken?: string // 临时指定本次请求使用的 token
  skipAuthLogout?: boolean // 401/用户不存在时不触发全局登出
}

export type RequestOptions = Pick<RequestParamsWithSilent, 'authToken' | 'skipAuthLogout'>

const fetchService = new FetchService({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/`,
  requestInterceptor(requestParams) {
    const { authToken } = requestParams as RequestParamsWithSilent
    const token = authToken ?? useUserStore.getState().token
    requestParams.headers = {
      ...(requestParams.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    }

    // 添加语言头
    if (typeof window !== 'undefined') {
      const lng = useUserStore.getState().lang
      requestParams.headers = {
        ...requestParams.headers,
        'Accept-Language': lng,
      }
    }

    return requestParams
  },
  responseInterceptor(response) {
    return response
  },
})

function createApiErrorContent(message: string) {
  const contactLabel = directTrans('common', 'contact')
  const contactTip = directTrans('common', 'apiErrorContactTip')
  return `${message} ${contactTip} ${contactLabel} ${CONTACT}`
}

export async function request<T>(params: RequestParamsWithSilent) {
  try {
    const res = await fetchService.request(params)
    const data: ResponseType<T> = await res.json()

    // 使用项目的静态翻译方法（只使用国际化字段，不再使用硬编码回退）
    const networkBusy = directTrans('common', 'networkBusy')

    // 未登录拦截
    if (data.code === 401 && (!useUserStore.getState().token || params.skipAuthLogout)) {
      return data
    }

    // 已登录、但是登录过期
    if (data.code === 401) {
      useUserStore.getState().logout()
      return data
    }

    // 用户未找到，登出
    if (data.code === 12000) {
      if (!params.skipAuthLogout) {
        useUserStore.getState().logout()
      }
      return data
    }

    if (data.code !== 0) {
      if (!params.silent && typeof window !== 'undefined') {
        notification.warning({
          content: createApiErrorContent(data.message || networkBusy),
          key: 'apiErrorMessage',
          duration: 3,
        })
      }
      return data
    }

    return data
  }
  catch (e) {
    if (
      (useUserStore.getState().token || params.url.includes('login/'))
      && !params.silent
      && typeof window !== 'undefined'
    ) {
      const errText = directTrans('common', 'networkError')
      notification.error({
        content: createApiErrorContent(errText),
        key: 'apiErrorMessage',
        duration: 3,
      })
    }
    return null
  }
}

export default {
  get<T>(url: string, data?: any, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      params: data,
      method: 'GET',
      silent,
    })
  },
  post<T>(url: string, data?: any, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'POST',
      silent,
    })
  },
  put<T>(url: string, data?: any, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'PUT',
      silent,
    })
  },
  delete<T>(url: string, data?: any, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'DELETE',
      silent,
    })
  },
  patch<T>(url: string, data?: any, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'PATCH',
      silent,
    })
  },
}
