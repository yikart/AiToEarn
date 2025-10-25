/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: 素材草稿
 */
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { ServerBaseApi } from '../serverBase.api'
import {
  Material,
  MaterialFilter,
  MaterialListByIdsFilter,
  MaterialTask,
  NewMaterial,
  NewMaterialTask,
  UpMaterial,
} from './common'

@Injectable()
export class MaterialApi extends ServerBaseApi {
  /**
   * 创建素材
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.sendMessage<Material>(
      'content/material/create',
      newData,
    )
    return res
  }

  /**
   * 创建批量生成草稿任务
   * @param newData
   * @returns
   */
  async createTask(newData: NewMaterialTask) {
    const res = await this.sendMessage<MaterialTask>(
      'content/material/createTask',
      newData,
    )

    return res
  }

  /**
   * 预览批量草稿
   * @param taskId
   * @returns
   */
  async preview(taskId: string) {
    const res = await this.sendMessage<Material>(
      'content/material/preview',
      { id: taskId },
    )

    return res
  }

  /**
   * 开始素材任务
   * @param taskId
   * @returns
   */
  async startTask(taskId: string) {
    const res = await this.sendMessage<string>(
      'content/material/startTask',
      { id: taskId },
    )

    return res
  }

  /**
   * 删除素材
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.sendMessage<boolean>(
      'content/material/delete',
      { id },
    )

    return res
  }

  /**
   * 删除素材
   * @param groupId
   * @param minUseCount
   * @returns
   */
  async delByMinUseCount(groupId: string, minUseCount: number) {
    const res = await this.sendMessage<boolean>(
      'content/material/delete/minUseCount',
      { groupId, minUseCount },
    )

    return res
  }

  /**
   * 修改素材
   * @param id
   * @param newData
   * @returns
   */
  async updateInfo(id: string, newData: UpMaterial) {
    const res = await this.sendMessage<boolean>(
      'content/material/updateInfo',
      { id, ...newData },
    )

    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string) {
    const res = await this.sendMessage<Material>(
      'content/material/info',
      { id },
    )

    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param filter
   * @returns
   */
  async getList(page: TableDto, filter: MaterialFilter) {
    const res = await this.sendMessage<{
      list: Material[]
      total: number
    }>('content/material/list', {
      filter,
      page,
    })

    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param filter
   * @returns
   */
  async listByIds(page: TableDto, filter: MaterialListByIdsFilter) {
    const res = await this.sendMessage<{
      list: Material[]
      total: number
    }>('content/admin/material/listByIds', {
      filter,
      page,
    })

    return res
  }
}
