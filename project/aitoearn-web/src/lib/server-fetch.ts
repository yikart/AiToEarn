/**
 * server-fetch - 服务端 fetch 封装
 * 用于 Server Component / generateMetadata / sitemap 等 SSR 场景
 * 无客户端依赖（不使用 useUserStore、directTrans）
 */

import { headers } from 'next/headers'

interface ServerFetchOptions {
  revalidate?: number | false
  tags?: string[]
}

interface ApiResponse<T> {
  code: number | string
  data: T
  message: string
}

async function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  if (apiUrl.startsWith('http')) {
    return apiUrl
  }
  // 相对路径时，从请求 headers 中获取 host 拼接完整 URL
  const h = await headers()
  const host = h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}${apiUrl}`
}

/**
 * 服务端 GET 请求
 * 利用 Next.js fetch + next.revalidate 实现 ISR 缓存
 */
export async function serverFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options: ServerFetchOptions = {},
): Promise<ApiResponse<T> | null> {
  try {
    const baseUrl = await getApiBaseUrl()
    const url = new URL(`${baseUrl}/${path}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    const fetchOptions: RequestInit & { next?: { revalidate?: number | false, tags?: string[] } } = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: {},
    }

    if (options.revalidate !== undefined) {
      fetchOptions.next!.revalidate = options.revalidate
    }
    if (options.tags) {
      fetchOptions.next!.tags = options.tags
    }

    const res = await fetch(url.toString(), fetchOptions)
    if (!res.ok)
      return null

    const data: ApiResponse<T> = await res.json()
    return data
  }
  catch {
    return null
  }
}
