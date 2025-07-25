import { Injectable } from '@nestjs/common'
import { TableDto } from 'src/common/dto/table.dto'
import {
  Material,
  NewMaterial,
  NewMaterialGroup,
  NewMaterialTask,
  UpdateMaterialGroup,
  UpMaterial,
} from 'src/transports/content/common'
import { MaterialNatsApi } from 'src/transports/content/material.natsApi'

@Injectable()
export class MaterialService {
  constructor(private readonly materialNatsApi: MaterialNatsApi) {}

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.materialNatsApi.create(newData)
    return res
  }

  /**
   * 批量生成任务
   * @param newData
   * @returns
   */
  async createTask(newData: NewMaterialTask) {
    const res = await this.materialNatsApi.createTask(newData)
    return res
  }

  /**
   * 生成任务结果预览
   * @param newData
   * @returns
   */
  async previewTask(taskId: string) {
    const res = await this.materialNatsApi.preview(taskId)
    return res
  }

  /**
   * 开始生成任务
   * @param id
   * @returns
   */
  async startTask(id: string) {
    const res = await this.materialNatsApi.startTask(id)
    return res
  }

  /**
   * delete material
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.materialNatsApi.del(id)
    return res
  }

  /**
   * 更新素材信息
   * @param id
   * @param data
   * @returns
   */
  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialNatsApi.updateInfo(id, data)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Material> {
    const res = await this.materialNatsApi.getInfo(id)
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
    const res = await this.materialNatsApi.getList(page, {
      userId,
      groupId,
    })
    return res
  }

  // ----- 组 ------
  async createGroup(newData: NewMaterialGroup) {
    const res = await this.materialNatsApi.createGroup(newData)
    return res
  }

  async delGroup(id: string): Promise<boolean> {
    const res = await this.materialNatsApi.delGroup(id)
    return res
  }

  async updateGroupInfo(id: string, newData: UpdateMaterialGroup) {
    const res = await this.materialNatsApi.updateGroupInfo(id, newData)
    return res
  }

  async getGroupInfo(id: string) {
    const res = await this.materialNatsApi.getGroupInfo(id)
    return res
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
    },
  ) {
    const res = await this.materialNatsApi.getGroupList(page, filter)
    return res
  }
}
