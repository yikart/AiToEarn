import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { MaterialGroupRepository, MaterialRepository } from '@yikart/mongodb'

@Injectable()
export class MaterialGroupHelperService {
  constructor(
    private readonly materialGroupRepository: MaterialGroupRepository,
    private readonly materialRepository: MaterialRepository,
  ) {}

  /**
   * 校验草稿箱平台限制
   * @param materialGroupId 草稿箱ID
   * @param accountTypes 任务的平台类型列表
   * @throws MaterialGroupNotFound 草稿箱不存在
   * @throws MaterialGroupPlatformMismatch 平台不匹配
   */
  async validatePlatform(materialGroupId: string, accountTypes?: string[]): Promise<void> {
    const materialGroup = await this.materialGroupRepository.getById(materialGroupId)
    if (!materialGroup) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }

    if (materialGroup.platforms?.length && accountTypes?.length) {
      const hasMatch = accountTypes.some(type => materialGroup.platforms.includes(type as AccountType))
      if (!hasMatch) {
        throw new AppException(ResponseCode.MaterialGroupPlatformMismatch)
      }
    }
  }

  async validateNotEmpty(materialGroupId: string): Promise<void> {
    const count = await this.materialRepository.countByGroupId(materialGroupId)
    if (count < 1) {
      throw new AppException(ResponseCode.MaterialGroupEmpty, 'Material group must contain at least one material')
    }
  }

  async validateBindable(materialGroupId: string, accountTypes?: string[]): Promise<void> {
    await this.validatePlatform(materialGroupId, accountTypes)
    await this.validateNotEmpty(materialGroupId)
  }

  /**
   * 校验草稿箱平台限制（如果草稿箱存在）
   * 用于只更新 accountTypes 时，校验现有草稿箱的平台限制
   * @param materialGroupId 草稿箱ID
   * @param accountTypes 任务的平台类型列表
   * @throws MaterialGroupPlatformMismatch 平台不匹配
   */
  async validatePlatformIfExists(materialGroupId: string, accountTypes: string[]): Promise<void> {
    const materialGroup = await this.materialGroupRepository.getById(materialGroupId)
    if (materialGroup?.platforms?.length) {
      const hasMatch = accountTypes.some(type => materialGroup.platforms.includes(type as AccountType))
      if (!hasMatch) {
        throw new AppException(ResponseCode.MaterialGroupPlatformMismatch)
      }
    }
  }
}
