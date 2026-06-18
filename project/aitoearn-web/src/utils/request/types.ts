export interface RequestParams extends RequestInit {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: RequestData
  params?: RequestQuery
}

export type RequestData = object | FormData
export type RequestQuery = object

export interface Dictionary<T = unknown> {
  [key: string]: T
}

export interface IFetchServiceConfig<T = Response> {
  baseURL: string
  requestInterceptor?: (requestParams: RequestParams) => RequestParams | void | null
  responseInterceptor?: (response: Response) => T
}
