/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: Material material
 */
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { FilterQuery, Model, RootFilterQuery } from 'mongoose'
import { Material, MaterialStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class MaterialRepository extends BaseRepository<Material> {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<Material>,
  ) {
    super(materialModel)
  }

  override async create(newData: Partial<Material>) {
    return await this.materialModel.create(newData)
  }

  // 批量删除
  async deleteManyByIds(ids: string[], filter?: FilterQuery<Material>): Promise<boolean> {
    const res = await this.materialModel.deleteMany({ _id: { $in: ids }, ...filter })
    return res.deletedCount > 0
  }

  // 批量删除
  async deleteByFilter(filter: FilterQuery<Material>): Promise<boolean> {
    const res = await this.materialModel.deleteMany(filter)
    return res.deletedCount > 0
  }

  // 删除
  async deleteByMinUseCount(groupId: string, minUseCount: number): Promise<boolean> {
    const res = await this.materialModel.deleteMany({ groupId, useCount: { $gte: minUseCount } })
    return res.deletedCount > 0
  }

  /**
   * 更新状态
   * @param id
   * @param status
   * @param message
   * @returns
   */
  async updateStatus(
    id: string,
    status: MaterialStatus,
    message: string,
  ): Promise<boolean> {
    const res = await this.materialModel.updateOne(
      { _id: id },
      { $set: { status, message } },
    )
    return res.modifiedCount > 0
  }

  async updateInfo(id: string, newData: Partial<Material>): Promise<boolean> {
    const res = await this.materialModel.updateOne(
      { _id: id },
      { $set: newData },
    )
    return res.modifiedCount > 0
  }

  async getInfo(id: string) {
    return await this.materialModel.findOne({ _id: id }).lean({ virtuals: true })
  }

  async getOptimalByGroup(groupId: string, type?: string, accountType?: string) {
    const filter = {
      groupId,
      status: MaterialStatus.SUCCESS,
      ...(type && { type }),
      ...(accountType && { accountTypes: accountType }),
    }

    const [data = null] = await this.materialModel.aggregate([
      { $match: filter },
      { $sort: { useCount: 1 } },
      {
        $group: {
          _id: null,
          minUseCount: { $first: '$useCount' },
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          docs: {
            $filter: {
              input: '$docs',
              cond: { $eq: ['$$this.useCount', '$minUseCount'] },
            },
          },
        },
      },
      { $unwind: '$docs' },
      { $replaceRoot: { newRoot: '$docs' } },
      { $sample: { size: 1 } },
    ])

    return data
  }

  // 获取列表
  async getList(
    inFilter: {
      userId?: string
      userType?: UserType
      title?: string
      groupId?: string
      status?: MaterialStatus
      ids?: string[]
      useCount?: number
    },
    pageInfo: {
      pageNo: number
      pageSize: number
    },
  ) {
    const { pageNo, pageSize } = pageInfo

    const filter: RootFilterQuery<Material> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      ...(inFilter.userType && { userType: inFilter.userType }),
      ...(inFilter.title && {
        title: { $regex: inFilter.title, $options: 'i' },
      }),
      ...(inFilter.groupId && { groupId: inFilter.groupId }),
      ...(inFilter.status !== undefined && { status: inFilter.status }),
      ...(inFilter.ids && { _id: { $in: [inFilter.ids] } }),
      ...(inFilter.useCount !== undefined && { useCount: { $gte: inFilter.useCount } }),
    }

    const [total, list] = await Promise.all([
      this.materialModel.countDocuments(filter),
      this.materialModel
        .find(filter)
        .sort({ useCount: 1, createdAt: -1 })
        .skip((pageNo! - 1) * pageSize)
        .limit(pageSize)
        .lean({ virtuals: true }),
    ])

    return {
      total,
      list,
    }
  }

  // 获取列表
  async listByIds(materialIds: string[], inFilter?: RootFilterQuery<Material>) {
    const filter: RootFilterQuery<Material> = {
      _id: {
        $in: materialIds,
      },
      status: MaterialStatus.SUCCESS,
      ...inFilter,
    }
    const list = await this.materialModel
      .find(filter)
      .sort({ useCount: 1, createdAt: -1 })
      .lean({ virtuals: true })

    return list
  }

  async tableListByIds(materialIds: string[], page: {
    pageNo: number
    pageSize: number
  }, inFilter?: RootFilterQuery<Material>) {
    const filter: RootFilterQuery<Material> = {
      _id: {
        $in: materialIds,
      },
      ...inFilter,
    }

    const [total, list] = await Promise.all([
      this.materialModel.countDocuments(filter),
      this.materialModel
        .find(filter)
        .sort({ useCount: 1, createdAt: -1 })
        .skip((page.pageNo! - 1) * page.pageSize)
        .limit(page.pageSize)
        .lean({ virtuals: true }),
    ])

    return {
      total,
      list,
    }
  }

  async getOptimalByIds(materialIds: string[]): Promise<Material | null> {
    const data = await this.materialModel
      .findOne({
        _id: {
          $in: materialIds,
        },
        status: MaterialStatus.SUCCESS,
      })
      .sort({ useCount: 1, createdAt: -1 })
      .lean({ virtuals: true })

    return data
  }

  // 增加草稿的使用次数，返回更新后的文档
  async updateUseCountById(id: string): Promise<Material | null> {
    const res = await this.materialModel.findOneAndUpdate(
      { _id: id },
      { $inc: { useCount: 1 } },
      { new: true },
    ).lean({ virtuals: true })
    return res
  }

  // 减少草稿的使用次数（不低于 0）
  async decrementUseCountById(id: string): Promise<boolean> {
    const res = await this.materialModel.updateOne(
      { _id: id, useCount: { $gt: 0 } },
      { $inc: { useCount: -1 } },
    )
    return res.modifiedCount > 0
  }

  /**
   * 通过 photoReference upsert 素材
   */
  async upsertByPhotoReference(newData: Partial<Material>): Promise<Material> {
    const photoReference = newData.brandInfo?.photoReference
    if (!photoReference) {
      throw new Error('photoReference is required for upsert')
    }

    const result = await this.materialModel.findOneAndUpdate(
      { 'brandInfo.photoReference': photoReference },
      { $set: newData },
      { upsert: true, new: true },
    ).lean({ virtuals: true })

    return result!
  }
}
