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
import { MaterialGroup, MaterialType } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class MaterialGroupRepository extends BaseRepository<MaterialGroup> {
  logger = new Logger(MaterialGroupRepository.name)
  constructor(
    @InjectModel(MaterialGroup.name)
    private readonly materialGroupModel: Model<MaterialGroup>,
  ) {
    super(materialGroupModel)
  }

  override async create(newData: Partial<MaterialGroup>) {
    return await this.materialGroupModel.create(newData)
  }

  private async createDefaultGroupIfNotExists(userId: string, type: MaterialType): Promise<boolean> {
    try {
      // 检查是否已存在默认组
      const existingGroup = await this.materialGroupModel.findOne({
        userId,
        type,
        userType: UserType.User,
        isDefault: true,
      })

      // 如果已存在默认组，直接返回 true
      if (existingGroup) {
        return true
      }

      // 创建默认组
      const newGroup = await this.materialGroupModel.create({
        userId,
        name: 'Default',
        userType: UserType.User,
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
      // 为文章和视频类型创建默认组
      const defaultGroups = await Promise.all([
        this.createDefaultGroupIfNotExists(userId, MaterialType.ARTICLE),
        this.createDefaultGroupIfNotExists(userId, MaterialType.VIDEO),
      ])
      // 如果任何一个组创建失败，则返回 false
      return defaultGroups.every(result => result === true)
    }
    catch (error) {
      this.logger.error('Error creating default material groups:', error)
      return false
    }
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    const res = await this.materialGroupModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  // 修改
  async update(id: string, newData: Partial<MaterialGroup>) {
    const res = await this.materialGroupModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

  async getInfo(id: string) {
    const info = await this.materialGroupModel.findOne({ _id: id })
    return info
  }

  // 获取列表
  async getList(inFilter: {
    userId: string
    title?: string
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<MaterialGroup> = {
      userId: inFilter.userId,
    }
    if (inFilter.title)
      filter['title'] = { $regex: inFilter.title, $options: 'i' }

    const [total, list] = await Promise.all([
      this.materialGroupModel.countDocuments(filter),
      this.materialGroupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo! - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ])

    return {
      total,
      list,
    }
  }
}
