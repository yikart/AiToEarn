import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AppConfigRepository } from '@yikart/mongodb'
import { merge } from 'lodash'
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
    const [dbConfig] = await this.appConfigRepo.listByAppIdAndKey('aitoearn-ai', 'models')

    if (dbConfig == null) {
      await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
        appId: 'aitoearn-ai',
        key: 'models',
        value: config.ai.models,
      })
      return
    }

    const mergedConfig = this.mergeModelsConfig(config.ai.models, dbConfig.value)

    await this.appConfigRepo.upsertByAppIdAndKey('aitoearn-ai', 'models', {
      appId: 'aitoearn-ai',
      key: 'models',
      value: mergedConfig,
    })

    this.modelsConfig = mergedConfig as ModelsConfigDto
  }

  async saveConfig(inputConfig: ModelsConfigDto) {
    const mergedConfig = this.mergeModelsConfig(config.ai.models, inputConfig)

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

  /**
   * 自定义合并函数：以 config 为基准，仅保留 config 中存在的模型
   * 基础属性（sizes、qualities、styles、maxInputImages、resolutions、durations、supportedParameters）不允许被数据库覆盖
   */
  private mergeModelsConfig(configModels: any, dbModels: any): any {
    return {
      chat: this.mergeChatModels(configModels.chat, dbModels.chat || []),
      image: {
        generation: this.mergeImageGenerationModels(configModels.image.generation, dbModels.image?.generation || []),
        edit: this.mergeImageEditModels(configModels.image.edit, dbModels.image?.edit || []),
      },
      video: {
        generation: this.mergeVideoGenerationModels(configModels.video.generation, dbModels.video?.generation || []),
      },
    }
  }

  /**
   * 合并 chat 模型：所有属性都可以从数据库合并
   */
  private mergeChatModels(configModels: any[], dbModels: any[]): any[] {
    return configModels.map((configModel) => {
      const dbModel = dbModels.find(m => m.name === configModel.name)
      if (dbModel) {
        return merge({}, configModel, dbModel)
      }
      return configModel
    })
  }

  /**
   * 合并 image.generation 模型：sizes、qualities、styles 必须使用 config 的值
   */
  private mergeImageGenerationModels(configModels: any[], dbModels: any[]): any[] {
    return configModels.map((configModel) => {
      const dbModel = dbModels.find(m => m.name === configModel.name)
      if (dbModel) {
        const merged = merge({}, configModel, dbModel)
        // 强制使用 config 中的基础属性
        merged.sizes = configModel.sizes
        merged.qualities = configModel.qualities
        merged.styles = configModel.styles
        return merged
      }
      return configModel
    })
  }

  /**
   * 合并 image.edit 模型：sizes、qualities、styles、maxInputImages 必须使用 config 的值
   */
  private mergeImageEditModels(configModels: any[], dbModels: any[]): any[] {
    return configModels.map((configModel) => {
      const dbModel = dbModels.find(m => m.name === configModel.name)
      if (dbModel) {
        const merged = merge({}, configModel, dbModel)
        // 强制使用 config 中的基础属性
        merged.sizes = configModel.sizes
        merged.maxInputImages = configModel.maxInputImages
        if (configModel.qualities !== undefined) {
          merged.qualities = configModel.qualities
        }
        if (configModel.styles !== undefined) {
          merged.styles = configModel.styles
        }
        return merged
      }
      return configModel
    })
  }

  /**
   * 合并 video.generation 模型：channel、modes、resolutions、durations、supportedParameters 必须使用 config 的值
   */
  private mergeVideoGenerationModels(configModels: any[], dbModels: any[]): any[] {
    return configModels.map((configModel) => {
      const dbModel = dbModels.find(m => m.name === configModel.name)
      if (dbModel) {
        const merged = merge({}, configModel, dbModel)
        // 强制使用 config 中的基础属性
        merged.channel = configModel.channel
        merged.modes = configModel.modes
        merged.resolutions = configModel.resolutions
        merged.durations = configModel.durations
        merged.supportedParameters = configModel.supportedParameters
        return merged
      }
      return configModel
    })
  }
}
