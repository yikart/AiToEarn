export interface TransactionalMessage {
  subscriber_email?: string
  subscriber_id?: number
  subscriber_emails?: string[]
  subscriber_ids?: number[]
  template_id: number
  from_email?: string
  subject?: string
  data?: Record<string, any>
  headers?: Record<string, string>[]
  messenger?: string
  content_type?: 'html' | 'markdown' | 'plain'
}

export interface TransactionalResponse {
  data: boolean
}
