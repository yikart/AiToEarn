import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { AppConfigListDto, DeleteConfigDto, GetAppConfigDto, UpdateConfigDto, UpdateConfigsDto } from './app-config.dto'
import { AppConfigService } from './app-config.service'

@Controller('appConfigs')
export class AppConfigController {
  constructor(private readonly appConfigsService: AppConfigService) {}

  @NatsMessagePattern('other.appConfigs.list')
  async getAppConfig(@Payload() data: GetAppConfigDto) {
    const { appId } = data
    const config = await this.appConfigsService.getConfig(appId)
    return config
  }

  @NatsMessagePattern('other.appConfigs.update')
  async updateConfig(@Payload() data: UpdateConfigDto) {
    const config = await this.appConfigsService.updateConfig(
      data.appId,
      data.key,
      data.value,
      data.description,
      data.metadata,
    )

    return {
      success: true,
      data: config,
    }
  }

  // 批量更新配置
  @NatsMessagePattern('other.appConfigs.batchUpdate')
  async batchUpdateConfigs(@Payload() data: UpdateConfigsDto) {
    const result = await this.appConfigsService.batchUpdateConfigs(data.appId, data.configs)

    return {
      success: true,
      data: result,
    }
  }

  // 删除配置项
  @NatsMessagePattern('other.appConfigs.delete')
  async deleteConfig(@Payload() data: DeleteConfigDto) {
    const result = await this.appConfigsService.deleteConfig(data.appId, data.key)

    return {
      success: result,
      message: result ? '删除成功' : '配置项不存在',
    }
  }

  // 获取配置列表
  @NatsMessagePattern('other.appConfigs.getList')
  async getConfigList(@Payload() data: AppConfigListDto) {
    const res = await this.appConfigsService.getConfigList(data.page, data.filter)
    return res
  }
}
