export interface SubscriberAttribs {
  [key: string]: any
}

export enum SubscriberStatus {
  ENABLED = 'enabled',
  BLOCKLISTED = 'blocklisted',
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
