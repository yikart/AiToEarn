import { APIKeyStatus } from '@yikart/mongodb'

export interface ApiKeyInfo {
  readonly userId: string
  readonly apiKey: string
  readonly status: APIKeyStatus
}
