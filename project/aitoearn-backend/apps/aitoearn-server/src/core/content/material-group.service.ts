import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { MaterialGroupRepository } from '@yikart/mongodb'
import { NewMaterialGroup, UpdateMaterialGroup } from './common'

@Injectable()
export class MaterialGroupService {
  constructor(
    private readonly materialGroupRepository: MaterialGroupRepository,
  ) { }

  async createGroup(newData: NewMaterialGroup) {
    return this.materialGroupRepository.create(newData)
  }

  async delGroup(id: string): Promise<boolean> {
    return this.materialGroupRepository.delete(id)
  }

  async updateGroupInfo(id: string, newData: UpdateMaterialGroup) {
    return this.materialGroupRepository.update(id, newData)
  }

  async getGroupInfo(id: string) {
    return this.materialGroupRepository.getById(id)
  }

  async getInfoByName(userId: string, name: string) {
    return this.materialGroupRepository.getInfoByName(userId, name)
  }

  async getDefaultGroup(userId: string) {
    return this.materialGroupRepository.getDefaultGroup(userId)
  }

  async ensureDefaultGroup(userId: string) {
    return this.materialGroupRepository.createDefault(userId)
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
    },
  ) {
    return this.materialGroupRepository.getList(filter, page)
  }
}
