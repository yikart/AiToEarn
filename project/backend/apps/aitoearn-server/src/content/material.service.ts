import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import { Material, MaterialRepository, MaterialStatus, MaterialType } from '@yikart/mongodb'
import { NewMaterial, UpMaterial } from './common'
import { MediaService } from './media.service'

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly mediaService: MediaService,
  ) { }

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.materialRepository.create(newData)
    return res
  }

  /**
   * delete material
   * @param id
   * @returns
   */
  async del(id: string) {
    const material = await this.getInfo(id)
    if (!material)
      return true
    const res = await this.materialRepository.delOne(id)
    if (!res)
      return false
    // 删除媒体资源
    if (material.autoDeleteMedia) {
      for (const item of material.mediaList) {
        if (!item.mediaId)
          continue
        this.mediaService.del(item.mediaId)
      }
    }
    return res
  }

  /**
   * 批量删除素材
   * @param ids
   * @returns
   */
  async delByIds(userId: string, ids: string[]): Promise<boolean> {
    const res = await this.materialRepository.delByIds(ids, { userId })
    return res
  }

  /**
   * delete material (TODO: 待优化)
   * @param userId
   * @param filter
   * @returns
   */
  async delByFilter(
    userId: string,
    inFilter: {
      title?: string
      groupId?: string
      status?: MaterialStatus
      useCount?: number
      type?: MaterialType
    },
  ) {
    const { groupId, type, useCount, title, status } = inFilter
    const filter = {
      userId,
      userType: UserType.User,
      ...(groupId && { groupId }),
      ...(type && { type }),
      ...(useCount !== undefined && { useCount: { $gte: useCount } }),
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(status !== undefined && { status }),
    }
    const res = await this.materialRepository.delByFilter(filter)
    return res
  }

  /**
   * 更新素材信息
   * @param id
   * @param data
   * @returns
   */
  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialRepository.updateInfo(id, data)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Material | null> {
    const res = await this.materialRepository.getInfo(id)
    return res
  }

  /**
   * 获取组内最优素材
   * @param groupId
   * @returns
   */
  async optimalInGroup(groupId: string): Promise<Material | null> {
    const res = await this.materialRepository.optimalInGroup(groupId)
    return res
  }

  /**
   * 获取草稿列表
   * @param page
   * @param userId
   * @param filter
   * @returns
   */
  async getList(
    page: TableDto,
    filter: {
      userId?: string
      userType?: UserType
      title?: string
      groupId?: string
      status?: MaterialStatus
      ids?: string[]
      useCount?: number
    },
  ) {
    const res = await this.materialRepository.getList(filter, page)
    return res
  }

  /**
   * 获取素材列表
   * @param materialIds
   * @returns
   */
  async optimalByIds(materialIds: string[]) {
    const res = await this.materialRepository.optimalByIds(materialIds)
    return res
  }

  /**
   * 草稿素材列表
   * @param ids
   * @returns
   */
  async getListByIds(ids: string[]) {
    const res = await this.materialRepository.listByIds(ids)
    return res
  }

  /**
   * 开始生成任务
   * @param id
   * @returns
   */
  async updateStatus(id: string, status: MaterialStatus, message: string) {
    const res = await this.materialRepository.updateStatus(id, status, message)
    return res
  }

  /**
   * 使用计数增加
   * @param id
   * @returns
   */
  async addUseCount(id: string) {
    const res = await this.materialRepository.addUseCount(id)
    return res
  }
}
