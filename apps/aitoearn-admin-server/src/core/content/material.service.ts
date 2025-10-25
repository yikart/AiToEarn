import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import { MaterialRepository } from '@yikart/mongodb'
import {
  Material,
  MaterialListByIdsFilter,
  NewMaterial,
  NewMaterialTask,
  UpMaterial,
} from '../../transports/content/common'
import { MaterialApi } from '../../transports/content/material.api'
import { MaterialFilterDto } from './dto/material.dto'

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialApi: MaterialApi,
    private readonly materialRepository: MaterialRepository,
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
    const res = await this.materialRepository.delOne(id)
    return res
  }

  /**
   * delete material
   * @param groupId
   * @param minUseCount
   * @returns
   */
  async delByMinUseCount(groupId: string, minUseCount: number) {
    const res = await this.materialRepository.delByMinUseCount(groupId, minUseCount)
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
   * 获取素材列表
   * @param page
   * @param filter
   * @returns
   */
  async getList(page: TableDto, filter?: MaterialFilterDto) {
    const res = await this.materialRepository.getList({
      ...filter,
      userType: UserType.Admin,
    }, page)
    return res
  }

  /**
   * listByIds
   * @param page
   * @param filter
   * @returns
   */
  async listByIds(page: TableDto, filter: MaterialListByIdsFilter) {
    const res = await this.materialRepository.tableListByIds(filter.ids, page)
    return res
  }
}
