import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  AddUsedStorageDto,
  DeductUsedStorageDto,
  SetTotalStorageDto,
  StorageInfoDto,
} from './storage.dto'
import { StorageService } from './storage.service'
import { StorageInfoVo } from './storage.vo'

@Controller()
export class StorageController {
  private readonly logger = new Logger(StorageController.name)

  constructor(private readonly storageService: StorageService) {}

  /**
   * 获取用户存储信息
   */
  @NatsMessagePattern('user.storage.info')
  async getStorageInfo(@Payload() data: StorageInfoDto): Promise<StorageInfoVo> {
    const storageInfo = await this.storageService.getStorageInfo(data.userId)
    return StorageInfoVo.create(storageInfo)
  }

  /**
   * 增加已用存储
   */
  @NatsMessagePattern('user.storage.addUsed')
  async addUsedStorage(@Payload() data: AddUsedStorageDto) {
    await this.storageService.addUsedStorage(data)
  }

  /**
   * 减少已用存储
   */
  @NatsMessagePattern('user.storage.deductUsed')
  async deductUsedStorage(@Payload() data: DeductUsedStorageDto) {
    await this.storageService.deductUsedStorage(data)
  }

  /**
   * 设置总存储容量
   */
  @NatsMessagePattern('user.storage.setTotal')
  async setTotalStorage(@Payload() data: SetTotalStorageDto) {
    await this.storageService.setTotalStorage(data.userId, data.totalStorage, data.expiredAt)
  }
}
