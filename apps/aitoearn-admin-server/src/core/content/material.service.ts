import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import {
  Material,
  MaterialListByIdsFilter,
  NewMaterial,
  NewMaterialGroup,
  NewMaterialTask,
  UpdateMaterialGroup,
  UpMaterial,
} from '../../transports/content/common'
import { MaterialApi } from '../../transports/content/material.api'
import { MaterialFilterDto } from './dto/material.dto'

@Injectable()
export class MaterialService {
  constructor(private readonly materialApi: MaterialApi) {}

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.materialApi.create(newData)
    return res
  }

  /**
   * 批量生成任务
   * @param newData
   * @returns
   */
  async createTask(newData: NewMaterialTask) {
    const res = await this.materialApi.createTask(newData)
    return res
  }

  /**
   * 生成任务结果预览
   * @param newData
   * @returns
   */
  async previewTask(taskId: string) {
    const res = await this.materialApi.preview(taskId)
    return res
  }

  /**
   * 开始生成任务
   * @param id
   * @returns
   */
  async startTask(id: string) {
    const res = await this.materialApi.startTask(id)
    return res
  }

  /**
   * delete material
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.materialApi.del(id)
    return res
  }

  /**
   * delete material
   * @param groupId
   * @param minUseCount
   * @returns
   */
  async delByMinUseCount(groupId: string, minUseCount: number) {
    const res = await this.materialApi.delByMinUseCount(groupId, minUseCount)
    return res
  }

  /**
   * 更新素材信息
   * @param id
   * @param data
   * @returns
   */
  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialApi.updateInfo(id, data)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Material> {
    const res = await this.materialApi.getInfo(id)
    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param filter
   * @returns
   */
  async getList(page: TableDto, filter?: MaterialFilterDto) {
    const res = await this.materialApi.getList(page, {
      ...filter,
      userType: UserType.Admin,
    })
    return res
  }

  /**
   * listByIds
   * @param page
   * @param filter
   * @returns
   */
  async listByIds(page: TableDto, filter: MaterialListByIdsFilter) {
    const res = await this.materialApi.listByIds(page, filter)
    return res
  }

  // ----- 组 ------
  async createGroup(newData: NewMaterialGroup) {
    const res = await this.materialApi.createGroup({
      ...newData,
      userType: UserType.Admin,
    })
    return res
  }

  async delGroup(id: string): Promise<boolean> {
    const res = await this.materialApi.delGroup(id)
    return res
  }

  async updateGroupInfo(id: string, newData: UpdateMaterialGroup) {
    const res = await this.materialApi.updateGroupInfo(id, newData)
    return res
  }

  async getGroupInfo(id: string) {
    const res = await this.materialApi.getGroupInfo(id)
    return res
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      userType: string
      title?: string
    },
  ) {
    const res = await this.materialApi.getGroupList(page, {
      ...filter,
      userType: UserType.Admin,
    })
    return res
  }
}
