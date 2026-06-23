import type { LeanDoc, User } from '@yikart/mongodb'
import type { TokenPayload } from './aitoearn-auth.config'

export type TokenInfo = LeanDoc<User>
export type { TokenPayload }
