import { AccountRepository } from './account.repository'
import { ApiKeyAccountRepository } from './api-key-account.repository'
import { ApiKeyRepository } from './api-key.repository'

import { OAuth2CredentialRepository } from './oauth2-credential.repository'
import { PublishTaskRepository } from './publish-task.repository'

export * from './account.repository'
export * from './api-key-account.repository'
export * from './api-key.repository'
export * from './base.repository'
export * from './publish-task.repository'

export const repositories = [
  AccountRepository,
  ApiKeyRepository,
  ApiKeyAccountRepository,
  OAuth2CredentialRepository,
  PublishTaskRepository,
] as const
