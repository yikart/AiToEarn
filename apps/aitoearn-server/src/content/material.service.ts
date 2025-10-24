import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { Material, MaterialRepository, MaterialStatus } from '@yikart/mongodb'
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
  async delByIds(ids: string[]): Promise<boolean> {
    const res = await this.materialRepository.delByIds(ids)
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
   * 获取素材列表
   * @param page
   * @param userId
   * @param groupId
   * @returns
   */
  async getList(page: TableDto, userId: string, groupId?: string) {
    const res = await this.materialRepository.getList({
      userId,
      groupId,
    }, page)
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
