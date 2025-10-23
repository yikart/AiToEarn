import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AppConfigRepository } from '@yikart/mongodb'
import { config } from '../../config'
import { ModelsConfigDto } from './models-config.dto'

@Injectable()
export class ModelsConfigService implements OnModuleInit {
  private readonly logger = new Logger(ModelsConfigService.name)
  private modelsConfig = config.ai.models

  constructor(
    private readonly appConfigRepo: AppConfigRepository,
  ) {}

  async onModuleInit() {
    const [config] = await this.appConfigRepo.listByAppIdAndKey('aitoearn-ai', 'models')
    if (config == null) {
      return
    }
    this.modelsConfig = config.value as ModelsConfigDto
  }

  async saveConfig(config: ModelsConfigDto) {
    await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
      appId: 'aitoearn-ai',
      key: 'models',
      value: config,
    })
    this.modelsConfig = config
  }

  get config() {
    return this.modelsConfig
  }
}
