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

  async create(newData: NewMaterial) {
    const res = await this.materialRepository.create(newData)
    return res
  }

  async del(id: string) {
    const material = await this.getInfo(id)
    if (!material)
      return true
    const res = await this.materialRepository.delOne(id)
    if (!res)
      return false
    if (material.autoDeleteMedia) {
      for (const item of material.mediaList) {
        if (!item.mediaId)
          continue
        this.mediaService.del(item.mediaId)
      }
    }
    return res
  }

  async delByIds(userId: string, ids: string[]): Promise<boolean> {
    const res = await this.materialRepository.delByIds(ids, { userId })
    return res
  }

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

  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialRepository.updateInfo(id, data)
    return res
  }

  async getInfo(id: string): Promise<Material | null> {
    const res = await this.materialRepository.getInfo(id)
    return res
  }

  async optimalInGroup(groupId: string): Promise<Material | null> {
    const res = await this.materialRepository.optimalInGroup(groupId)
    return res
  }

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

  async optimalByIds(materialIds: string[]) {
    const res = await this.materialRepository.optimalByIds(materialIds)
    return res
  }

  async getListByIds(ids: string[]) {
    const res = await this.materialRepository.listByIds(ids)
    return res
  }

  async updateStatus(id: string, status: MaterialStatus, message: string) {
    const res = await this.materialRepository.updateStatus(id, status, message)
    return res
  }

  async addUseCount(id: string) {
    const res = await this.materialRepository.addUseCount(id)
    return res
  }
}
