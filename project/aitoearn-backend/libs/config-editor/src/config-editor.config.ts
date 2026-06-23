import type { ZodDto } from '@yikart/common'
import type { ZodType } from 'zod'
import { AppException, ResponseCode } from '@yikart/common'

interface ConfigEditorSourceConfig {
  meta?: {
    configPath?: string
  }
}

export interface ConfigEditorModuleOptions<T> {
  schema: ZodDto<T, any> | ZodType
  config: ConfigEditorSourceConfig
  routePrefix?: string
}

export class ConfigEditorConfig<T> {
  schema: ZodDto<T, any> | ZodType
  configPath: string
  routePrefix: string

  constructor(options: ConfigEditorModuleOptions<T>) {
    const configPath = options.config.meta?.configPath
    if (!configPath) {
      throw new AppException(ResponseCode.ConfigEditorConfigPathMissing)
    }

    this.schema = options.schema
    this.configPath = configPath
    this.routePrefix = (options.routePrefix ?? 'config').replace(/^\/+|\/+$/g, '') || 'config'
  }
}
