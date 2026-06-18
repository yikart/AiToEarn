// Source: platforms/threads.api.ts inline types
// Source: plat/threads.ts

/**
 * ThreadsLocationItem 数据结构。
 */
export interface ThreadsLocationItem {
  id: string
  label: string
}

/**
 * ThreadsLocationsResponse 响应数据。
 */
export interface ThreadsLocationsResponse {
  data: ThreadsLocationItem[]
  code: number
}
