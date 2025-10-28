import { SetMetadata } from '@nestjs/common'
import { TransactionOptions } from 'mongodb'

export const TRANSACTIONAL_METADATA = Symbol('TRANSACTIONAL_METADATA')

/**
 * MongoDB 事务装饰器
 * 用于自动管理 MongoDB 事务的开始、提交和回滚
 *
 * @param options 事务配置选项
 * @returns MethodDecorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Transactional()
 *   async createUserWithProfile(userData: CreateUserDto, profileData: CreateProfileDto) {
 *     // 这里的所有数据库操作都会在同一个事务中执行
 *     const user = await this.userRepository.create(userData)
 *     const profile = await this.profileRepository.create({ ...profileData, userId: user._id })
 *     return { user, profile }
 *   }
 * }
 * ```
 */
export function Transactional(options?: TransactionOptions): MethodDecorator {
  return SetMetadata(TRANSACTIONAL_METADATA, options)
}
