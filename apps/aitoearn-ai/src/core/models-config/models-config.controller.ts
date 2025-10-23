import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { ModelsConfigDto } from './models-config.dto'
import { ModelsConfigService } from './models-config.service'
import { ModelsConfigVo } from './models-config.vo'

@Controller()
export class ModelsConfigController {
  constructor(
    private readonly configService: ModelsConfigService,
  ) {}

  @NatsMessagePattern('ai.models-config.save')
  async saveConfig(@Payload() data: ModelsConfigDto) {
    await this.configService.saveConfig(data)
  }

  @NatsMessagePattern('ai.models-config.get')
  async getConfig() {
    return ModelsConfigVo.create(this.configService.config)
  }
}
