import type { RequestData, RequestParams, RequestQuery } from './types'
import { createElement } from 'react'
import { directTrans } from '@/app/i18n/client'
import { useConfigManagerDialogStore } from '@/store/configManagerDialog'
import { useUserStore } from '@/store/user'
import { notification } from '@/utils/ui/notification'
import FetchService from './FetchService'

interface ResponseType<T> {
  code: string | number
  data: T
  message: string
  url: string
}

interface ApiErrorIssue {
  message?: string
  path?: unknown
}

type RequestParamsWithSilent = RequestParams & {
  silent?: boolean // 是否静默处理错误，不显示提示
  authToken?: string // 临时指定本次请求使用的 token
}

export type RequestOptions = Pick<RequestParamsWithSilent, 'authToken' | 'cache'>

const fetchService = new FetchService({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/`,
  requestInterceptor(requestParams) {
    const authToken = 'authToken' in requestParams ? requestParams.authToken : undefined
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getIssuePath(path: unknown) {
  if (!Array.isArray(path))
    return ''

  return path
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .join('.')
}

function getIssueText(issue: ApiErrorIssue) {
  const message = typeof issue.message === 'string' ? issue.message.trim() : ''
  const path = getIssuePath(issue.path)

  if (path && message)
    return `${path}: ${message}`
  return message || path
}

function getApiErrorDetails(errorData: unknown) {
  if (!isRecord(errorData) || !Array.isArray(errorData.issues))
    return []

  const platform = typeof errorData.platform === 'string' ? errorData.platform : ''

  return errorData.issues
    .map((issue) => {
      if (!isRecord(issue))
        return ''

      const issueText = getIssueText({
        message: typeof issue.message === 'string' ? issue.message : undefined,
        path: issue.path,
      })
      if (!issueText)
        return ''

      return platform ? `${platform} / ${issueText}` : issueText
    })
    .filter((detail): detail is string => detail.length > 0)
}

function createConfigManagerTip() {
  const tip = directTrans('common', 'apiErrorConfigTip')
  const action = directTrans('common', 'apiErrorConfigAction')

  return createElement(
    'span',
    { className: 'font-normal text-muted-foreground' },
    tip,
    ' ',
    createElement(
      'button',
      {
        type: 'button',
        className: 'cursor-pointer rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        onClick: () => useConfigManagerDialogStore.getState().openDialog('api-error'),
      },
      action,
    ),
  )
}

function createApiErrorContent(message: string, details: string[] = [], showConfigTip = true) {
  return createElement(
    'div',
    { className: 'flex flex-col gap-1' },
    createElement('span', null, message),
    details.length > 0
      ? createElement(
          'ul',
          { className: 'mt-1 space-y-0.5 font-normal text-muted-foreground' },
          details.slice(0, 4).map(detail => createElement('li', { key: detail }, detail)),
        )
      : null,
    showConfigTip ? createConfigManagerTip() : null,
  )
}

function getApiErrorMessage(data: ResponseType<unknown>, fallback: string) {
  const message = data.message || fallback
  if (data.code !== 16183 || !isRecord(data.data) || typeof data.data.field !== 'string') {
    return message
  }

  return message
    .split(data.data.field)
    .join('')
    .replace(/：\s+/g, '：')
    .replace(/:\s{2,}/g, ': ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function request<T>(params: RequestParamsWithSilent) {
  try {
    const res = await fetchService.request(params)
    const data: ResponseType<T> = await res.json()

    // 使用项目的静态翻译方法（只使用国际化字段，不再使用硬编码回退）
    const networkBusy = directTrans('common', 'networkBusy')

    if (data.code === 401 || data.code === 12000) {
      return data
    }

    if (data.code !== 0) {
      data.message = getApiErrorMessage(data, networkBusy)
      if (!params.silent && typeof window !== 'undefined') {
        const errorDetails = getApiErrorDetails(data.data)
        notification.warning({
          content: createApiErrorContent(data.message, errorDetails),
          key: 'apiErrorMessage',
          duration: errorDetails.length > 0 ? 6 : 3,
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
  get<T>(url: string, data?: RequestQuery, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      params: data,
      method: 'GET',
      silent,
    })
  },
  post<T>(url: string, data?: RequestData, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'POST',
      silent,
    })
  },
  put<T>(url: string, data?: RequestData, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'PUT',
      silent,
    })
  },
  delete<T>(url: string, data?: RequestData, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'DELETE',
      silent,
    })
  },
  patch<T>(url: string, data?: RequestData, silent?: boolean, options?: RequestOptions) {
    return request<T>({
      ...options,
      url,
      data,
      method: 'PATCH',
      silent,
    })
  },
}
