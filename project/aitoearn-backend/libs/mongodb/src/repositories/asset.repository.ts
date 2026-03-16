import { InjectModel } from '@nestjs/mongoose'
import { Pagination, UserType } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AssetStatus, AssetType } from '../enums'
import { Asset } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAssetsParams extends Pagination {
  userId: string
  userType?: UserType
  type?: AssetType
  types?: AssetType[]
  status?: AssetStatus
  statuses?: AssetStatus[]
}

export class AssetRepository extends BaseRepository<Asset> {
  constructor(
    @InjectModel(Asset.name) assetModel: Model<Asset>,
  ) {
    super(assetModel)
  }

  async getByPath(path: string) {
    return await this.findOne({
      path,
      deletedAt: { $exists: false },
    })
  }

  async getByIdAndUserId(id: string, userId: string, userType?: UserType) {
    return await this.findOne({
      _id: id,
      userId,
      ...(userType ? { userType } : {}),
      deletedAt: { $exists: false },
    })
  }

  async listWithPagination(params: ListAssetsParams) {
    const { page, pageSize, userId, userType, type, types, status, statuses } = params

    const filter: FilterQuery<Asset> = {
      userId,
      ...(userType ? { userType } : {}),
      deletedAt: { $exists: false },
      ...(types ? { type: { $in: types } } : type && { type }),
      ...(statuses ? { status: { $in: statuses } } : status && { status }),
    }

    const [list, total] = await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })

    return { list, total }
  }

  async updateStatus(id: string, status: AssetStatus, additionalData?: Partial<Asset>) {
    return await this.updateById(id, {
      status,
      ...additionalData,
    })
  }

  async softDelete(id: string) {
    return await this.updateById(id, {
      deletedAt: new Date(),
    })
  }

  async softDeleteByUserId(userId: string, assetIds: string[]) {
    const result = await this.model.updateMany(
      {
        _id: { $in: assetIds },
        userId,
        deletedAt: { $exists: false },
      },
      {
        $set: { deletedAt: new Date() },
      },
    )
    return { affectedCount: result.modifiedCount }
  }

  /**
   * 查找待确认的 assets（PENDING 状态且创建时间超过指定阈值）
   * @param olderThanSeconds 创建时间超过多少秒的 asset
   * @param limit 最大返回数量
   */
  async findPendingAssets(olderThanSeconds: number, limit = 100) {
    const threshold = new Date(Date.now() - olderThanSeconds * 1000)
    return await this.model.find({
      status: AssetStatus.Pending,
      createdAt: { $lt: threshold },
      deletedAt: { $exists: false },
    }).limit(limit).lean({ virtuals: true }).exec()
  }

  /**
   * 将过期的 PENDING assets 标记为失败
   * @param olderThanSeconds 创建时间超过多少秒视为过期
   */
  async markExpiredPendingAsFailed(olderThanSeconds: number) {
    const threshold = new Date(Date.now() - olderThanSeconds * 1000)
    const result = await this.model.updateMany(
      {
        status: AssetStatus.Pending,
        createdAt: { $lt: threshold },
        deletedAt: { $exists: false },
      },
      {
        $set: { status: AssetStatus.Failed },
      },
    )
    return { affectedCount: result.modifiedCount }
  }

  /**
   * 根据状态和创建时间获取资源列表
   * 只查找创建时间超过 minAgeSeconds 的记录
   */
  async listByStatusAndAge(status: AssetStatus, minAgeSeconds: number, limit = 50) {
    const threshold = new Date(Date.now() - minAgeSeconds * 1000)
    return await this.model.find({
      status,
      createdAt: { $lt: threshold },
      deletedAt: { $exists: false },
    }).limit(limit).lean({ virtuals: true }).exec()
  }
}
