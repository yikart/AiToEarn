import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AppConfigRepository } from '@yikart/mongodb'
import { merge } from 'lodash'
import { config } from '../../../config'
import { ModelsConfigDto } from './models-config.dto'

@Injectable()
export class ModelsConfigService implements OnModuleInit {
  private readonly logger = new Logger(ModelsConfigService.name)
  private modelsConfig = config.ai.models

  constructor(
    private readonly appConfigRepo: AppConfigRepository,
  ) {}

  async onModuleInit() {
    const [dbConfig] = await this.appConfigRepo.listByAppIdAndKey('aitoearn-ai', 'models')

    if (dbConfig == null) {
      await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
        appId: 'aitoearn-ai',
        key: 'models',
        value: config.ai.models,
      })
      return
    }

    const mergedConfig = merge({}, config.ai.models, dbConfig.value)

    await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
      appId: 'aitoearn-ai',
      key: 'models',
      value: mergedConfig,
    })

    this.modelsConfig = mergedConfig as ModelsConfigDto
  }

  async saveConfig(inputConfig: ModelsConfigDto) {
    const mergedConfig = merge({}, config.ai.models, inputConfig)

    await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
      appId: 'aitoearn-ai',
      key: 'models',
      value: mergedConfig,
    })

    this.modelsConfig = mergedConfig
  }

  get config() {
    return this.modelsConfig
  }
}
