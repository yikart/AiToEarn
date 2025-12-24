import type { RequestParams } from '@/utils/FetchService/types'
import { useUserStore } from '@/store/user'
import FetchService from '@/utils/FetchService/FetchService'
import { directTrans } from '@/app/i18n/client'
import { CONTACT } from '@/constant'
import { notification } from '@/lib/notification'

interface ResponseType<T> {
  code: string | number
  data: T
  message: string
  url: string
}

type RequestParamsWithSilent = RequestParams & {
  silent?: boolean // 是否静默处理错误，不显示提示
}

const fetchService = new FetchService({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/`,
  requestInterceptor(requestParams) {
    const token = useUserStore.getState().token
    // const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYWlsIjoiemlqdWUyMDI1QG91dGxvb2suY29tIiwiaWQiOiI2OGI1MDM0ZDIxYjE1YTQwZTUxMWRmOWIiLCJuYW1lIjoi55So5oi3X1dYeVMzb0N3IiwiaWF0IjoxNzY0MDM1NTQzLCJleHAiOjE3NjQ2NDAzNDN9.ylPhoyWW5zPV2Y92lxR8OP0z55pWrY7aZ_kZlMRd0_s'
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

export async function request<T>(params: RequestParamsWithSilent) {
  try {
    const res = await fetchService.request(params)
    const data: ResponseType<T> = await res.json()

    const lang = useUserStore.getState().lang || 'zh-CN'
    const isZh = (lang || '').toLowerCase().startsWith('zh')
    // 使用项目的静态翻译方法（只使用国际化字段，不再使用硬编码回退）
    const networkBusy = directTrans('common', 'networkBusy')
    const networkError = directTrans('common', 'networkError')
    const contactLabel = directTrans('common', 'contact')
    const contactText = `${contactLabel} ${CONTACT}`

    // 未登录拦截
    if (data.code === 401 && !useUserStore.getState().token) {
      // 如果是 silent 模式，返回完整响应以便调用方处理
      if (params.silent) {
        return data
      }
      return null
    }

    // 已登录、但是登录过期
    if (data.code === 401) {
      useUserStore.getState().logout()
      // 如果是 silent 模式，返回完整响应以便调用方处理
      if (params.silent) {
        return data
      }
    }

    if (data.code !== 0) {
      if (!params.silent && typeof window !== 'undefined') {
        notification.warning({
          content: `${data.message || networkBusy} ${contactText}`,
          key: 'apiErrorMessage',
          duration: 3,
        })
      }
      // 如果是 silent 模式，返回完整响应以便调用方处理
      if (params.silent) {
        return data
      }
      return null
    }

    return data
  }
  catch (e) {
    if (!params.silent && typeof window !== 'undefined') {
      const errText = directTrans('common', 'networkError')
      const contactLabelNow = directTrans('common', 'contact')
      notification.error({
        content: `${errText} ${contactLabelNow} ${CONTACT}`,
        key: 'apiErrorMessage',
        duration: 3,
      })
    }
    return null
  }
}

export default {
  get<T>(url: string, data?: any, silent?: boolean) {
    return request<T>({
      url,
      params: data,
      method: 'GET',
      silent,
    })
  },
  post<T>(url: string, data?: any, silent?: boolean) {
    return request<T>({
      url,
      data,
      method: 'POST',
      silent,
    })
  },
  put<T>(url: string, data?: any, silent?: boolean) {
    return request<T>({
      url,
      data,
      method: 'PUT',
      silent,
    })
  },
  delete<T>(url: string, data?: any, silent?: boolean) {
    return request<T>({
      url,
      data,
      method: 'DELETE',
      silent,
    })
  },
  patch<T>(url: string, data?: any, silent?: boolean) {
    return request<T>({
      url,
      data,
      method: 'PATCH',
      silent,
    })
  },
}
