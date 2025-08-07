/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: 素材草稿
 */
import { Injectable, Logger } from '@nestjs/common'
import { TableDto } from 'src/common/dto/table.dto'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import {
  Material,
  MaterialFilter,
  MaterialGroup,
  MaterialTask,
  NewMaterial,
  NewMaterialGroup,
  NewMaterialTask,
  UpdateMaterialGroup,
  UpMaterial,
} from './common'

@Injectable()
export class MaterialNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 初始化组
   * @param userId
   * @returns
   */
  async createDefault(userId: string) {
    Logger.log('createDefault====================', userId)
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.materialGroup.createDefault,
      {
        userId,
      },
    )

    return res
  }

  /**
   * 创建素材
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.natsService.sendMessage<Material>(
      NatsApi.content.material.create,
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
    const res = await this.natsService.sendMessage<MaterialTask>(
      NatsApi.content.material.createTask,
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
    const res = await this.natsService.sendMessage<Material>(
      NatsApi.content.material.preview,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.content.material.startTask,
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
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.material.del,
      { id },
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
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.material.updateInfo,
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
    const res = await this.natsService.sendMessage<Material>(
      NatsApi.content.material.info,
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
    const res = await this.natsService.sendMessage<{
      list: Material[]
      total: number
    }>(NatsApi.content.material.list, {
      filter,
      page,
    })

    return res
  }

  // ----- 组 ------
  /**
   * 创建素材组
   * @param newData
   * @returns
   */
  async createGroup(newData: NewMaterialGroup) {
    const res = await this.natsService.sendMessage<MaterialGroup>(
      NatsApi.content.materialGroup.create,
      newData,
    )

    return res
  }

  /**
   * 删除素材组
   * @param id
   * @returns
   */
  async delGroup(id: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.materialGroup.del,
      { id },
    )

    return res
  }

  /**
   * 修改素材组
   * @param id
   * @param newData
   * @returns
   */
  async updateGroupInfo(id: string, newData: UpdateMaterialGroup) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.materialGroup.updateInfo,
      { id, ...newData },
    )

    return res
  }

  /**
   * 获取组信息
   * @param id
   * @returns
   */
  async getGroupInfo(id: string) {
    const res = await this.natsService.sendMessage<MaterialGroup>(
      NatsApi.content.materialGroup.info,
      { id },
    )

    return res
  }

  /**
   * 获取素材组列表
   * @param page
   * @param filter
   * @returns
   */
  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
    },
  ) {
    const res = await this.natsService.sendMessage<{
      list: MaterialGroup[]
      total: number
    }>(NatsApi.content.materialGroup.list, {
      filter,
      page,
    })

    return res
  }
}
