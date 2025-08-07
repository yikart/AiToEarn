/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: media Media
 */
import { Injectable } from '@nestjs/common'
import { TableDto } from 'src/common/dto/table.dto'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { Media, MediaGroup, MediaType, NewMedia } from './common'

@Injectable()
export class MediaNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 初始化组
   * @param userId
   * @returns
   */
  async createDefault(userId: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.mediaGroup.createDefault,
      {
        userId,
      },
    )

    return res
  }

  /**
   * 创建媒体
   * @param newData
   * @returns
   */
  async create(newData: NewMedia) {
    const res = await this.natsService.sendMessage<Media>(
      NatsApi.content.media.create,
      newData,
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
      NatsApi.content.media.del,
      { id },
    )

    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string) {
    const res = await this.natsService.sendMessage<Media>(
      NatsApi.content.media.info,
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
  async getList(page: TableDto, filter: { userId: string, groupId?: string, type?: MediaType }) {
    const res = await this.natsService.sendMessage<{
      list: Media[]
      total: number
    }>(NatsApi.content.media.list, {
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
  async createGroup(newData: {
    title: string
    userId: string
    type: MediaType
    desc?: string
  }) {
    const res = await this.natsService.sendMessage<MediaGroup>(
      NatsApi.content.mediaGroup.create,
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
      NatsApi.content.mediaGroup.del,
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
  async updateGroupInfo(
    id: string,
    newData: { title?: string, desc?: string },
  ) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.content.mediaGroup.update,
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
    const res = await this.natsService.sendMessage<MediaGroup>(
      NatsApi.content.mediaGroup.info,
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
      type?: MediaType
    },
  ) {
    const res = await this.natsService.sendMessage<{
      list: MediaGroup[]
      total: number
    }>(NatsApi.content.mediaGroup.list, {
      filter,
      page,
    })

    return res
  }
}
