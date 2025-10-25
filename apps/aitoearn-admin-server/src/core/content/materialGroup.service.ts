import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import { MaterialGroupRepository } from '@yikart/mongodb'
import {
  NewMaterialGroup,
  UpdateMaterialGroup,
} from '../../transports/content/common'

@Injectable()
export class MaterialGroupService {
  constructor(private readonly materialGroupRepository: MaterialGroupRepository) { }
  // ----- 组 ------
  async createGroup(newData: NewMaterialGroup) {
    const res = await this.materialGroupRepository.create({
      ...newData,
      userType: UserType.Admin,
    })
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
      userType: UserType
      title?: string
    },
  ) {
    const res = await this.materialGroupRepository.getList({
      ...filter,
      userType: UserType.Admin,
    }, page)
    return res
  }
}
