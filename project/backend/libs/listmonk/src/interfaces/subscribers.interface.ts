export interface SubscriberAttribs {
  [key: string]: any
}

export enum SubscriberStatus {
  ENABLED = 'enabled',
  BLOCKLISTED = 'blocklisted',
}

export interface GetSubscribersDto {
  query?: string
  list_id?: number[]
  subscription_status?: string
  order_by?: 'name' | 'status' | 'created_at' | 'updated_at'
  order?: 'ASC' | 'DESC'
  page?: number
  per_page?: number | 'all'
}

export interface GetSubscribersResponse {
  results: Subscriber[]
  total: number
  per_page: number
  page: number
}

export interface CreateSubscriberDto {
  email: string
  name: string
  status: SubscriberStatus
  lists?: number[]
  attribs?: SubscriberAttribs
  preconfirm_subscriptions?: boolean
}

export interface Subscriber {
  id: number
  created_at: string
  updated_at: string
  uuid: string
  email: string
  name: string
  attribs: SubscriberAttribs
  status: SubscriberStatus
  lists: number[]
}
