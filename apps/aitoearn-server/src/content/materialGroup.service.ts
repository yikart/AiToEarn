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
    const res = await this.materialGroupRepository.create(newData)
    return res
  }

  async delGroup(id: string): Promise<boolean> {
    const res = await this.materialGroupRepository.delete(id)
    return res
  }

  async updateGroupInfo(id: string, newData: UpdateMaterialGroup) {
    const res = await this.materialGroupRepository.update(id, newData)
    return res
  }

  async getGroupInfo(id: string) {
    const res = await this.materialGroupRepository.getById(id)
    return res
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
    },
  ) {
    const res = await this.materialGroupRepository.getList(filter, page)
    return res
  }
}
