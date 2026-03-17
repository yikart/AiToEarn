import { Injectable } from '@nestjs/common'
import { config } from '../../../config'

@Injectable()
export class ModelsConfigService {
  private modelsConfig = config.ai.models

  get config() {
    return this.modelsConfig
  }
}
