import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import { Media, MediaGroupRepository, MediaRepository, MediaType } from '@yikart/mongodb'
import { NewMedia } from '../../transports/content/common'

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly mediaGroupRepository: MediaGroupRepository,
  ) { }

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMedia) {
    const path = newData.url

    const res = await this.mediaRepository.create({
      ...newData,
      userType: UserType.User,
      url: path,
    })
    return res
  }

  /**
   * delete media
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.mediaRepository.delOne(id)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Media | null> {
    const res = await this.mediaRepository.getInfo(id)
    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param userId
   * @returns
   */
  async getList(page: TableDto, userId: string, groupId?: string) {
    const res = await this.mediaRepository.getList({
      userId,
      groupId,
    }, page)
    return res
  }

  // ----- 组 ------
  async createGroup(
    userId: string,
    inData: { title: string, type: MediaType, desc?: string },
  ) {
    const res = await this.mediaGroupRepository.create({
      userId,
      ...inData,
    })
    return res
  }

  async delGroup(id: string): Promise<boolean> {
    const res = await this.mediaGroupRepository.delete(id)
    return !!res
  }

  async updateGroupInfo(
    id: string,
    newData: { title?: string, desc?: string },
  ) {
    const res = await this.mediaGroupRepository.update(id, newData)
    return res
  }

  async getGroupInfo(id: string) {
    const res = await this.mediaGroupRepository.getInfo(id)
    return res
  }

  async getGroupList(
    page: TableDto,
    filter: {
      userId?: string
      title?: string
      type?: MediaType
    },
  ) {
    const res = await this.mediaGroupRepository.getList({
      userType: UserType.Admin,
      ...filter,
    }, page)
    return res
  }

  async addUseCount(id: string): Promise<boolean> {
    const res = await this.mediaRepository.addUseCount(id)
    return res
  }

  async addUseCountOfList(ids: string[]): Promise<boolean> {
    const res = await this.mediaRepository.addUseCountOfList(ids)
    return res
  }
}
