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

  async delOne(id: string): Promise<boolean> {
    const res = await this.materialModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  // 批量删除
  async delByIds(ids: string[], filter?: FilterQuery<Material>): Promise<boolean> {
    const res = await this.materialModel.deleteMany({ _id: { $in: ids }, ...filter })
    return res.deletedCount > 0
  }

  // 删除
  async delByMinUseCount(groupId: string, minUseCount: number): Promise<boolean> {
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
    return await this.materialModel.findOne({ _id: id })
  }

  async optimalInGroup(groupId: string) {
    const data = await this.materialModel
      .findOne({
        groupId,
        status: MaterialStatus.SUCCESS,
      })
      .sort({ useCount: 1, createdAt: -1 })
      .lean()

    return data
  }

  // 获取列表
  async getList(inFilter: {
    userId?: string
    userType?: UserType
    title?: string
    groupId?: string
    status?: MaterialStatus
    ids?: string[]
    minUseCount?: number
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo

    const filter: RootFilterQuery<Material> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      userType: inFilter.userType || UserType.User,
      ...(inFilter.title && {
        title: { $regex: inFilter.title, $options: 'i' },
      }),
      ...(inFilter.groupId && { groupId: inFilter.groupId }),
      ...(inFilter.status !== undefined && { status: inFilter.status }),
      ...(inFilter.ids && { _id: { $in: [inFilter.ids] } }),
      ...(inFilter.minUseCount !== undefined && { useCount: { $gte: inFilter.minUseCount } }),
    }

    const [total, list] = await Promise.all([
      this.materialModel.countDocuments(filter),
      this.materialModel
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
      .lean()

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
        .lean(),
    ])

    return {
      total,
      list,
    }
  }

  async optimalByIds(materialIds: string[]): Promise<Material | null> {
    const data = await this.materialModel
      .findOne({
        _id: {
          $in: materialIds,
        },
        status: MaterialStatus.SUCCESS,
      })
      .sort({ useCount: 1, createdAt: -1 })
      .lean()

    return data
  }

  // 增加草稿的使用次数
  async addUseCount(id: string) {
    const res = await this.materialModel.updateOne(
      { _id: id },
      { $inc: { useCount: 1 } },
    )
    return res.modifiedCount > 0
  }
}
