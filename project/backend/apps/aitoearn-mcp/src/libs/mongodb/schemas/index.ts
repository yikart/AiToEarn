import { Account, AccountSchema } from './account.schema'
import { ApiKeyAccount, ApiKeyAccountSchema } from './api-key-account.schema'
import { ApiKey, ApiKeySchema } from './api-key.schema'

import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.scheam'

import { PublishTask, PublishTaskSchema } from './publishing-task.schema'

export * from './account.schema'

export * from './api-key-account.schema'
export * from './api-key.schema'

export * from './oauth2-credential.scheam'

export * from './publishing-task.schema'

export const schemas = [
  { name: Account.name, schema: AccountSchema },
  { name: ApiKey.name, schema: ApiKeySchema },
  { name: ApiKeyAccount.name, schema: ApiKeyAccountSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: PublishTask.name, schema: PublishTaskSchema },
] as const
