/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: MaterialGroup materialGroup
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

  private async createDefaultGroupIfNotExists(userId: string): Promise<boolean> {
    try {
      // 检查是否已存在默认组
      const existingGroup = await this.materialGroupModel.findOne({
        userId,
        userType: UserType.User,
        isDefault: true,
      }).lean({ virtuals: true })

      // 如果已存在默认组，直接返回 true
      if (existingGroup) {
        return true
      }

      // 创建默认组
      const newGroup = await this.materialGroupModel.create({
        userId,
        name: 'Default',
        userType: UserType.User,
        isDefault: true,
      })

      return !!newGroup
    }
    catch (error) {
      this.logger.error(`Error creating default group:`, error)
      return false
    }
  }

  async createDefault(userId: string): Promise<boolean> {
    try {
      const res = await this.createDefaultGroupIfNotExists(userId)
      return res
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
    const info = await this.materialGroupModel.findOne({ _id: id }).lean({ virtuals: true })
    return info
  }

  async getInfoByName(userId: string, name: string) {
    return await this.materialGroupModel.findOne({ userId, name: { $regex: name, $options: 'i' } }).lean({ virtuals: true })
  }

  async getDefaultGroup(userId: string) {
    return await this.materialGroupModel.findOne({ userId, isDefault: true }).sort({ createdAt: -1 }).lean({ virtuals: true })
  }

  async listByIds(ids: string[]): Promise<MaterialGroup[]> {
    return this.materialGroupModel.find({ _id: { $in: ids } }).lean({ virtuals: true })
  }

  // 获取列表
  async getList(inFilter: {
    userId?: string
    userType?: UserType
    title?: string
    type?: MaterialType
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<MaterialGroup> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      ...(inFilter.userType && { userType: inFilter.userType }),
      ...(inFilter.type && { type: inFilter.type }),
      ...(inFilter.title && { title: { $regex: inFilter.title, $options: 'i' } }),
    }

    const [total, list] = await Promise.all([
      this.materialGroupModel.countDocuments(filter),
      this.materialGroupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo! - 1) * pageSize)
        .limit(pageSize)
        .lean({ virtuals: true }),
    ])

    return {
      total,
      list,
    }
  }

  // 更新 openAffiliate 状态
  async updateOpenAffiliateById(id: string, openAffiliate: boolean) {
    const res = await this.materialGroupModel.updateOne(
      { _id: id },
      { $set: { openAffiliate } },
    )
    return res.modifiedCount > 0
  }

  // 关闭同用户其他素材组的 openAffiliate
  async updateOpenAffiliateByUserId(userId: string, excludeId: string) {
    const res = await this.materialGroupModel.updateMany(
      { userId, _id: { $ne: excludeId } },
      { $set: { openAffiliate: false } },
    )
    return res.modifiedCount
  }

  async listByLibraryId(libraryId: string): Promise<MaterialGroup[]> {
    return this.materialGroupModel.find({ libraryId }).lean({ virtuals: true })
  }

  async countByLibraryIdAndUserId(libraryId: string, userId: string): Promise<number> {
    return this.materialGroupModel.countDocuments({ libraryId, userId })
  }

  async updateLibraryIdById(id: string, libraryId: string | null): Promise<boolean> {
    const res = await this.materialGroupModel.updateOne(
      { _id: id },
      { $set: { libraryId } },
    )
    return res.modifiedCount > 0
  }

  async updateLibraryIdToNullByLibraryId(libraryId: string): Promise<void> {
    await this.materialGroupModel.updateMany(
      { libraryId },
      { $set: { libraryId: null } },
    ).exec()
  }

  // 获取开启 openAffiliate 的素材组（最新的一个）
  async getOpenAffiliate(userId: string) {
    return await this.materialGroupModel
      .findOne({ userId, openAffiliate: true })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
  }
}
