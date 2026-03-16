import { SetMetadata } from '@nestjs/common'
import { TransactionOptions } from 'mongodb'

export const TRANSACTIONAL_METADATA = Symbol('TRANSACTIONAL_METADATA')

export function Transactional(options?: TransactionOptions): MethodDecorator {
  return SetMetadata(TRANSACTIONAL_METADATA, options)
}
