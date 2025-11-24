import { APIKeyStatus } from '../../libs/mongodb/enums'

export interface ApiKeyInfo {
  readonly userId: string
  readonly apiKey: string
  readonly status: APIKeyStatus
}
