import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model, RootFilterQuery } from 'mongoose'
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

  async getConfig(appId: string): Promise<Record<string, any>> {
    const configs = await this.model.find({
      appId,
      enabled: true,
    }).exec()

    return configs
  }

  async getConfigHistory(appId: string, key: string, limit = 10): Promise<AppConfig[]> {
    return await this.model.find({ appId, key })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec()
  }

  async updateConfig(
    appId: string,
    key: string,
    value: any,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<AppConfig> {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    const updatedConfig = await this.model.findOneAndUpdate(
      { appId, key },
      {
        $set: {
          value: valueStr,
          description,
          metadata,
          enabled: true,
        },
      },
      { upsert: true, new: true },
    ).exec()

    return updatedConfig
  }

  async batchUpdateConfigs(
    appId: string,
    configs: Record<string, any>,
  ): Promise<{ success: boolean, updatedCount: number }> {
    const bulkOps = Object.entries(configs).map(([key, value]) => {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      return {
        updateOne: {
          filter: { appId, key },
          update: {
            $set: {
              value: valueStr,
              enabled: true,
            },
          },
          upsert: true,
        },
      }
    })

    const result = await this.model.bulkWrite(bulkOps)
    return {
      success: true,
      updatedCount: result.modifiedCount + result.upsertedCount,
    }
  }

  async deleteConfig(appId: string, key: string): Promise<boolean> {
    const result = await this.model.deleteOne({ appId, key }).exec()
    return result.deletedCount > 0
  }

  async getConfigList(
    page: {
      pageNo: number
      pageSize: number
    },
    query: {
      appId?: string
      key?: string
    },
  ) {
    const filter: RootFilterQuery<AppConfig> = {
      ...(query.appId && { appId: query.appId }),
      ...(query.key && { key: query.key }),
    }
    const total = await this.model.countDocuments(filter).exec()
    const result = await this.model.find(filter).skip((page.pageNo - 1) * page.pageSize).limit(page.pageSize).exec()

    return { total, list: result }
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
