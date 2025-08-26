import { Injectable } from '@nestjs/common'
import { TableDto } from 'src/common/dto/table.dto'
import { Media, MediaType, NewMedia } from 'src/transports/content/common'
import { MediaNatsApi } from 'src/transports/content/media.natsApi'

@Injectable()
export class MediaService {
  constructor(private readonly mediaNatsApi: MediaNatsApi) {}

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMedia) {
    const res = await this.mediaNatsApi.create(newData)
    return res
  }

  /**
   * delete media
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.mediaNatsApi.del(id)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Media> {
    const res = await this.mediaNatsApi.getInfo(id)
    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param filter
   * @param filter.userId
   * @param filter.groupId
   * @param filter.type
   * @returns
   */
  async getList(
    page: TableDto,
    filter: { userId: string, groupId?: string, type?: MediaType },
  ) {
    const res = await this.mediaNatsApi.getList(page, filter)
    return res
  }

  // ----- 组 ------
  async createGroup(
    userId: string,
    inData: { title: string, type: MediaType, desc?: string },
  ) {
    const res = await this.mediaNatsApi.createGroup({
      userId,
      ...inData,
    })
    return res
  }

  async delGroup(id: string): Promise<boolean> {
    const res = await this.mediaNatsApi.delGroup(id)
    return res
  }

  async updateGroupInfo(
    id: string,
    newData: { title?: string, desc?: string },
  ) {
    const res = await this.mediaNatsApi.updateGroupInfo(id, newData)
    return res
  }

  async getGroupInfo(id: string) {
    const res = await this.mediaNatsApi.getGroupInfo(id)
    return res
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
      type?: MediaType
    },
  ) {
    const res = await this.mediaNatsApi.getGroupList(page, filter)
    return res
  }
}
