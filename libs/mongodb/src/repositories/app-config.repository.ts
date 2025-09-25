import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AppConfig } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAppConfigParams extends Pagination {
  appId?: string
  key?: string
  enabled?: boolean
  keyword?: string
}

export class AppConfigRepository extends BaseRepository<AppConfig> {
  constructor(
    @InjectModel(AppConfig.name) appConfigModel: Model<AppConfig>,
  ) {
    super(appConfigModel)
  }

  async listWithPagination(params: ListAppConfigParams) {
    const { page, pageSize, appId, key, enabled, keyword } = params

    const filter: FilterQuery<AppConfig> = {}
    if (appId)
      filter.appId = appId
    if (key)
      filter.key = key
    if (enabled !== undefined)
      filter.enabled = enabled
    if (keyword) {
      filter.$or = [
        { key: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ]
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }

  async listByAppIdWithEnabled(appId: string) {
    return await this.find({
      appId,
      enabled: true,
    })
  }

  async listByAppIdAndKey(appId: string, key: string, limit = 10) {
    return await this.find(
      { appId, key },
      { sort: { updatedAt: -1 }, limit },
    )
  }

  async upsertByAppIdAndKey(
    appId: string,
    key: string,
    updateData: Partial<AppConfig>,
  ) {
    return await this.model.findOneAndUpdate(
      { appId, key },
      { $set: updateData },
      { upsert: true, new: true },
    ).exec()
  }

  async bulkUpsert(configEntries: Array<{
    appId: string
    key: string
    value: string
    enabled: boolean
  }>) {
    const bulkOps = configEntries.map(entry => ({
      updateOne: {
        filter: { appId: entry.appId, key: entry.key },
        update: {
          $set: {
            value: entry.value,
            enabled: entry.enabled,
          },
        },
        upsert: true,
      },
    }))

    const result = await this.model.bulkWrite(bulkOps)
    return result.modifiedCount + result.upsertedCount
  }

  async deleteByAppIdAndKey(appId: string, key: string) {
    const result = await this.deleteOne({ appId, key })
    return result.deletedCount
  }
}
