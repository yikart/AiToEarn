import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { Transactional, UserRepository } from '@yikart/mongodb'
import { AddUsedStorageDto, DeductUsedStorageDto } from './storage.dto'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)

  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 获取用户存储使用情况
   * @param userId 用户ID
   * @returns 用户存储信息
   */
  async getStorageInfo(userId: string) {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const used = user.usedStorage || 0
    const total = user.storage?.total || 0
    const available = Math.max(0, total - used)

    return {
      used,
      total,
      available,
    }
  }

  /**
   * 增加已用存储
   * @param data 增加存储数据
   */
  @Transactional()
  async addUsedStorage(data: AddUsedStorageDto): Promise<void> {
    const user = await this.userRepository.getById(data.userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const currentUsed = user.usedStorage || 0
    const totalStorage = user.storage?.total || 0
    const newUsedStorage = currentUsed + data.amount

    if (newUsedStorage > totalStorage) {
      throw new AppException(ResponseCode.UserStorageExceeded)
    }

    await this.userRepository.updateById(data.userId, {
      usedStorage: newUsedStorage,
    })
  }

  /**
   * 减少已用存储
   * @param data 减少存储数据
   */
  @Transactional()
  async deductUsedStorage(data: DeductUsedStorageDto): Promise<void> {
    const user = await this.userRepository.getById(data.userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const currentUsed = user.usedStorage || 0
    const newUsedStorage = Math.max(0, currentUsed - data.amount)

    await this.userRepository.updateById(data.userId, {
      usedStorage: newUsedStorage,
    })
  }

  /**
   * 设置总存储容量
   * @param userId 用户ID
   * @param totalStorage 总存储容量（Bytes）
   * @param expiredAt 过期时间（可选）
   */
  async setTotalStorage(userId: string, totalStorage: number, expiredAt?: Date): Promise<void> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    await this.userRepository.updateById(userId, {
      storage: {
        total: totalStorage,
        expiredAt,
      },
    })
  }
}
