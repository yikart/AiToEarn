import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AppConfig, AppConfigRepository } from '@yikart/mongodb'

@Injectable()
export class AppConfigService {
  constructor(
    private readonly appConfigRepository: AppConfigRepository,
  ) {}

  async getConfig(appId: string): Promise<Record<string, any>> {
    const configs = await this.appConfigRepository.listByAppIdWithEnabled(appId)
    return configs
  }

  async getConfigHistory(appId: string, key: string, limit = 10): Promise<AppConfig[]> {
    return await this.appConfigRepository.listByAppIdAndKey(appId, key, limit)
  }

  async updateConfig(
    appId: string,
    key: string,
    value: any,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<AppConfig> {
    return await this.appConfigRepository.upsertByAppIdAndKey(
      appId,
      key,
      {
        value,
        description,
        metadata,
        enabled: true,
      },
    )
  }

  async batchUpdateConfigs(
    appId: string,
    configs: Record<string, any>,
  ): Promise<{ success: boolean, updatedCount: number }> {
    const configEntries = Object.entries(configs).map(([key, value]) => ({
      appId,
      key,
      value,
      enabled: true,
    }))

    const result = await this.appConfigRepository.bulkUpsert(configEntries)
    return {
      success: true,
      updatedCount: result,
    }
  }

  async deleteConfig(appId: string, key: string): Promise<boolean> {
    const result = await this.appConfigRepository.deleteByAppIdAndKey(appId, key)
    return result > 0
  }

  async getConfigList(
    page: TableDto,
    query: {
      appId?: string
      key?: string
    },
  ) {
    return await this.appConfigRepository.listWithPagination({
      page: page.pageNo,
      pageSize: page.pageSize,
      appId: query.appId,
      key: query.key,
    })
  }
}
