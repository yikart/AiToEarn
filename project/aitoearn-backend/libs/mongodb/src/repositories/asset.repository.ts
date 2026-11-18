import { InjectModel } from '@nestjs/mongoose'
import { AppException, Pagination, ResponseCode, UserType } from '@yikart/common'
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

export interface UpsertAssetByPathParams {
  path: string
  userId: string
  userType: UserType
  type: AssetType
  status: AssetStatus
  size: number
  mimeType: string
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

  /**
   * 以 path 為唯一鍵寫入；只能重用同一擁有者的資產，避免跨使用者改寫所有權。
   */
  async upsertByPath(params: UpsertAssetByPathParams) {
    const restoreOwnedAsset = async (asset: Asset) => {
      if (asset.userId !== params.userId || asset.userType !== params.userType) {
        throw new AppException(ResponseCode.AssetNotFound)
      }

      if (!asset.deletedAt)
        return asset

      const restored = await this.updateById(asset.id, {
        $set: params,
        $unset: { deletedAt: '' },
      })
      if (!restored)
        throw new AppException(ResponseCode.AssetNotFound)
      return restored as Asset
    }

    const existing = await this.findOne({ path: params.path })
    if (existing)
      return await restoreOwnedAsset(existing as Asset)

    try {
      const asset = await this.updateOne(
        { path: params.path },
        { $setOnInsert: params },
        { upsert: true },
      )
      if (!asset)
        throw new AppException(ResponseCode.AssetNotFound)
      return await restoreOwnedAsset(asset as Asset)
    }
    catch (err) {
      if ((err as { code?: number }).code !== 11000)
        throw err

      const concurrent = await this.findOne({ path: params.path })
      if (!concurrent)
        throw err

      return await restoreOwnedAsset(concurrent as Asset)
    }
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
