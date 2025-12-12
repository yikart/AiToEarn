import type { RequestParams } from '@/utils/FetchService/types'
import { message } from 'antd'
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
    const i18nText = {
      networkBusy: isZh
        ? '网络繁忙，请稍后重试！'
        : 'Network busy, please try again later!',
      networkError: isZh
        ? '网络异常，请稍后重试！'
        : 'Network error, please try again later!',
      contact: isZh ? '如需帮助请联系客服：' : 'Need help? Contact support:',
    }

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
        message.warning({
          content: `${data.message || i18nText.networkBusy} ${i18nText.contact} https://t.me/harryyyy2025`,
          key: 'apiErrorMessage',
          duration: 6,
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
    console.warn(e)
    if (!params.silent && typeof window !== 'undefined') {
      message.error({
        content: `${(useUserStore.getState().lang || 'zh-CN').toLowerCase().startsWith('zh') ? '网络异常，请稍后重试！' : 'Network error, please try again later!'} ${(useUserStore.getState().lang || 'zh-CN').toLowerCase().startsWith('zh') ? '如需帮助请联系客服：' : 'Need help? Contact support:'} https://t.me/harryyyy2025`,
        key: 'apiErrorMessage',
        duration: 6,
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
}
