import { Injectable, Logger } from '@nestjs/common'
import { AppConfigRepository } from '@yikart/mongodb'
import { config } from '../../../config'
import { ModelsConfigDto } from './models-config.dto'

@Injectable()
export class ModelsConfigService {
  private readonly logger = new Logger(ModelsConfigService.name)
  private modelsConfig = config.ai.models

  constructor(
    private readonly appConfigRepo: AppConfigRepository,
  ) {}

  async saveConfig(_: ModelsConfigDto) {
  }

  get config() {
    return this.modelsConfig
  }
}
