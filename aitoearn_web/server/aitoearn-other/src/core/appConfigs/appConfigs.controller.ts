import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from 'src/common/decorators/custom-message-pattern.decorator'
import { AppException } from '@/common'
import { AppConfigsService } from './appConfigs.service'
import { AppConfigListDto, DeleteConfigDto, GetAppConfigDto, UpdateConfigDto, UpdateConfigsDto } from './dto/appConfigs.dto'

@Controller('appConfigs')
export class AppConfigsController {
  constructor(private readonly appConfigsService: AppConfigsService) {}

  @NatsMessagePattern('other.appConfigs.list')
  async getAppConfig(@Payload() data: GetAppConfigDto) {
    const { appId } = data
    const config = await this.appConfigsService.getConfig(appId)
    return config
  }

  @NatsMessagePattern('other.appConfigs.update')
  async updateConfig(@Payload() data: UpdateConfigDto) {
    try {
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
    catch (error) {
      Logger.error('---- updateConfig ----', error)
      throw new AppException(
        1,
        '更新配置失败',
      )
    }
  }

  // 批量更新配置
  @NatsMessagePattern('other.appConfigs.batchUpdate')
  async batchUpdateConfigs(@Payload() data: UpdateConfigsDto) {
    try {
      const result = await this.appConfigsService.batchUpdateConfigs(data.appId, data.configs)

      return {
        success: true,
        data: result,
      }
    }
    catch (error) {
      Logger.error('---- updateConfig ----', error)
      throw new AppException(
        1,
        '批量更新配置失败',
      )
    }
  }

  // 删除配置项
  @NatsMessagePattern('other.appConfigs.delete')
  async deleteConfig(@Payload() data: DeleteConfigDto) {
    try {
      const result = await this.appConfigsService.deleteConfig(data.appId, data.key)

      return {
        success: result,
        message: result ? '删除成功' : '配置项不存在',
      }
    }
    catch (error) {
      Logger.error('---- updateConfig ----', error)
      throw new AppException(
        1,
        '删除配置失败',
      )
    }
  }

  // 获取配置列表
  @NatsMessagePattern('other.appConfigs.getList')
  async getConfigList(@Payload() data: AppConfigListDto) {
    const res = await this.appConfigsService.getConfigList(data.page, data.filter)
    return res
  }
}
