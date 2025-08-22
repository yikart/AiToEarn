import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TableDto } from '@/common/global/dto/table.dto'
import { AppConfigs } from '@/libs/database/schema/appConfig.entity'

@Injectable()
export class AppConfigsService {
  constructor(
    @InjectModel(AppConfigs.name)
    private configModel: Model<AppConfigs>,
  ) {}

  async getConfig(appId: string): Promise<Record<string, any>> {
    const configs = await this.configModel.find({
      appId,
      enabled: true,
    }).exec()

    return configs
  }

  async getConfigHistory(appId: string, key: string, limit = 10): Promise<AppConfigs[]> {
    return await this.configModel.find({ appId, key })
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
  ): Promise<AppConfigs> {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    const updatedConfig = await this.configModel.findOneAndUpdate(
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

    const result = await this.configModel.bulkWrite(bulkOps)
    return {
      success: true,
      updatedCount: result.modifiedCount + result.upsertedCount,
    }
  }

  async deleteConfig(appId: string, key: string): Promise<boolean> {
    const result = await this.configModel.deleteOne({ appId, key }).exec()
    return result.deletedCount > 0
  }

  async getConfigList(
    page: TableDto,
    query: {
      appId?: string
      key?: string
    },
  ) {
    const filter: RootFilterQuery<AppConfigs> = {
      ...(query.appId && { appId: query.appId }),
      ...(query.key && { key: query.key }),
    }
    const total = await this.configModel.countDocuments(filter).exec()
    const result = await this.configModel.find(filter).skip((page.pageNo - 1) * page.pageSize).limit(page.pageSize).exec()

    return { total, list: result }
  }
}
