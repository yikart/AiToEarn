import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AppConfigRepository } from '@yikart/mongodb'

@Injectable()
export class AppConfigsService {
  constructor(private readonly appConfigRepository: AppConfigRepository) { }

  // 获取
  async getConfig(appId: string) {
    const res = await this.appConfigRepository.getConfig(appId)
    return res
  }

  // 更新配置
  async updateConfig(appId: string, key: string, value: any, description?: string, metadata?: Record<string, any>) {
    return await this.appConfigRepository.updateConfig(
      appId,
      key,
      value,
      description,
      metadata,
    )
  }

  // 批量更新配置
  async batchUpdateConfigs(appId: string, configs: Record<string, any>[]) {
    return await this.appConfigRepository.batchUpdateConfigs(appId, configs)
  }

  // 删除配置
  async deleteConfig(appId: string, key: string) {
    return await this.appConfigRepository.deleteConfig(appId, key)
  }

  // 获取配置列表
  async getConfigList(page: TableDto, filter: { appId?: string, key?: string }) {
    return await this.appConfigRepository.getConfigList(page, filter)
  }
}
