import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { FilterQuery, Model, RootFilterQuery, Types } from 'mongoose'
import { Media, MediaType } from '../schemas/media.schema'
import { BaseRepository } from './base.repository'

@Injectable()
export class MediaRepository extends BaseRepository<Media> {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
  ) {
    super(mediaModel)
  }

  override async create(newData: Omit<Media, 'id' | 'updatedAt' | 'useCount' | 'createdAt'>) {
    return await this.mediaModel.create(newData)
  }

  async getListByIds(ids: string[]) {
    const mediaList = await this.mediaModel.find({ _id: { $in: ids } }).lean({ virtuals: true })
    return mediaList
  }

  // 批量删除素材
  async deleteManyByIds(ids: string[], filter?: FilterQuery<Media>): Promise<boolean> {
    const res = await this.mediaModel.deleteMany({ _id: { $in: ids }, ...filter })
    return res.deletedCount > 0
  }

  // 批量删除素材
  async getListByFilter(filter: FilterQuery<Media>) {
    const mediaList = await this.mediaModel.find(filter).lean({ virtuals: true })
    return mediaList
  }

  // 批量删除素材
  async deleteByFilter(filter: FilterQuery<Media>): Promise<boolean> {
    const res = await this.mediaModel.deleteMany(filter)
    return res.deletedCount > 0
  }

  // 更新
  async updateInfo(id: string, newData: Partial<Media>): Promise<boolean> {
    const res = await this.mediaModel.updateOne({ _id: id }, { $set: newData })
    return res.modifiedCount > 0
  }

  async getInfo(id: string) {
    return await this.mediaModel.findOne({ _id: id }).lean({ virtuals: true })
  }

  /**
   * 获取指定分组下的媒体
   * @param groupId
   * @returns
   */
  async getListByGroup(groupId: string) {
    return await this.mediaModel.find({ groupId }).lean({ virtuals: true })
  }

  // 获取列表
  async getList(inFilter: {
    userId?: string
    groupId?: string
    materialGroupId?: string
    type?: MediaType
    userType?: UserType
    useCount?: number
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo

    const filter: RootFilterQuery<Media> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      ...(inFilter.groupId && { groupId: inFilter.groupId }),
      ...(inFilter.materialGroupId && { materialGroupId: inFilter.materialGroupId }),
      ...(inFilter.userType && { userType: inFilter.userType }),
      ...(inFilter.type && { type: inFilter.type }),
      ...(inFilter.useCount !== undefined && { useCount: { $gte: inFilter.useCount } }),
    }

    const total = await this.mediaModel.countDocuments(filter)
    const list = await this.mediaModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNo! - 1) * pageSize)
      .limit(pageSize)
      .lean({ virtuals: true })
      .exec()

    return {
      total,
      list,
    }
  }

  /**
   * 检查指定组是否为空（不包含任何媒体文件）
   * @param groupId 组ID
   * @returns 如果组为空返回true，否则返回false
   */
  async getIsEmptyByGroup(groupId: string): Promise<boolean> {
    const exists = await this.mediaModel.exists({ groupId })
    return !exists
  }

  // 使用次数增加
  async updateUseCountById(id: string): Promise<boolean> {
    const res = await this.mediaModel.updateOne({ _id: id }, { $inc: { useCount: 1 } })
    return res.modifiedCount > 0
  }

  async updateManyUseCountByIds(ids: string[], filter?: FilterQuery<Media>): Promise<boolean> {
    const idList = ids.map(id => new Types.ObjectId(id))
    const res = await this.mediaModel.updateMany({ _id: { $in: idList }, ...filter }, { $inc: { useCount: 1 } })
    return res.modifiedCount > 0
  }
}
