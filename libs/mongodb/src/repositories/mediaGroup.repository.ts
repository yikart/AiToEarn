/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: Material material
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { MediaType } from '../schemas/media.schema'
import { MediaGroup } from '../schemas/mediaGroup.schema'
import { BaseRepository } from './base.repository'

@Injectable()
export class MediaGroupRepository extends BaseRepository<MediaGroup> {
  logger = new Logger(MediaGroupRepository.name)
  constructor(
    @InjectModel(MediaGroup.name)
    private readonly mediaGroupModel: Model<MediaGroup>,
  ) {
    super(mediaGroupModel)
  }

  private async createDefaultGroupIfNotExists(userId: string, type: MediaType): Promise<boolean> {
    try {
      // 检查是否已存在默认组
      const existingGroup = await this.mediaGroupModel.findOne({
        userId,
        type,
        isDefault: true,
      })

      // 如果已存在默认组，直接返回 true
      if (existingGroup) {
        return true
      }

      // 创建默认组
      const newGroup = await this.mediaGroupModel.create({
        userId,
        title: 'Default',
        type,
        isDefault: true,
      })

      return !!newGroup
    }
    catch (error) {
      this.logger.error(`Error creating default ${type} group:`, error)
      return false
    }
  }

  async createDefault(userId: string): Promise<boolean> {
    try {
      const defaultGroups = await Promise.all([
        this.createDefaultGroupIfNotExists(userId, MediaType.IMG),
        this.createDefaultGroupIfNotExists(userId, MediaType.VIDEO),
      ])
      // 如果任何一个组创建失败，则返回 false
      return defaultGroups.every(result => result === true)
    }
    catch (error) {
      this.logger.error('Error creating default media groups:', error)
      return false
    }
  }

  override async create(newData: Partial<MediaGroup>) {
    return await this.mediaGroupModel.create(newData)
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    const res = await this.mediaGroupModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  // 修改
  async update(id: string, newData: Partial<MediaGroup>) {
    const res = await this.mediaGroupModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

  async getInfo(id: string) {
    return await this.mediaGroupModel.findOne({ _id: id })
  }

  // 获取列表
  async getList(inFilter: {
    userId?: string
    userType?: UserType
    title?: string
    type?: MediaType
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<MediaGroup> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      userType: inFilter.userType || UserType.User,
      ...(inFilter.type && { type: inFilter.type }),
      ...(inFilter.title && {
        title: { $regex: inFilter.title, $options: 'i' },
      }),
    }

    const [total, list] = await Promise.all([
      this.mediaGroupModel.countDocuments(filter),
      this.mediaGroupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo! - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ])

    return {
      total,
      list,
    }
  }
}
