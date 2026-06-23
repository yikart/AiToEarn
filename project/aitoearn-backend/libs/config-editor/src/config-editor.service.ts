import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Injectable } from '@nestjs/common'
import { AppException, isZodDto, ResponseCode } from '@yikart/common'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { z } from 'zod'
import { ConfigEditorConfig } from './config-editor.config'
import { ConfigFileFormat } from './config-editor.vo'

@Injectable()
export class ConfigEditorService {
  constructor(
    private readonly config: ConfigEditorConfig<unknown>,
  ) {}

  async getConfig() {
    const configPath = resolve(process.cwd(), this.config.configPath)
    const format = this.getConfigFileFormat(configPath)
    const content = await this.readConfigFile(configPath)
    const config = this.validateConfigValue(this.parseConfig(content, format))
    return {
      config,
      format,
    }
  }

  validateConfig(config: Record<string, unknown>) {
    this.validateConfigValue(config)
  }

  async saveConfig(config: Record<string, unknown>) {
    const configPath = resolve(process.cwd(), this.config.configPath)
    const format = this.getConfigFileFormat(configPath)
    const content = this.serializeConfig(this.validateConfigValue(config), format)
    await this.writeConfigFile(configPath, content)
  }

  private getConfigFileFormat(filePath: string): ConfigFileFormat {
    const lowerPath = filePath.toLowerCase()
    if (lowerPath.endsWith('.json')) {
      return ConfigFileFormat.Json
    }
    if (lowerPath.endsWith('.yaml') || lowerPath.endsWith('.yml')) {
      return ConfigFileFormat.Yaml
    }
    throw new AppException(ResponseCode.ConfigEditorUnsupportedFormat)
  }

  private parseConfig(content: string, format: ConfigFileFormat) {
    try {
      return format === ConfigFileFormat.Json
        ? JSON.parse(content)
        : parseYaml(content)
    }
    catch (error) {
      throw new AppException(
        ResponseCode.ConfigEditorParseFailed,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  private validateConfigValue(config: unknown): Record<string, unknown> {
    const schema = isZodDto(this.config.schema) ? this.config.schema.schema : this.config.schema
    if (!(schema instanceof z.ZodType)) {
      throw new AppException(ResponseCode.ConfigEditorValidationFailed)
    }

    const result = schema.safeParse(config)
    if (!result.success) {
      throw new AppException(ResponseCode.ConfigEditorValidationFailed, z.prettifyError(result.error))
    }
    return result.data as Record<string, unknown>
  }

  private serializeConfig(config: Record<string, unknown>, format: ConfigFileFormat) {
    if (format === ConfigFileFormat.Json) {
      return `${JSON.stringify(config, null, 2)}\n`
    }
    return stringifyYaml(config)
  }

  private async readConfigFile(configPath: string) {
    try {
      return await readFile(configPath, 'utf-8')
    }
    catch (error) {
      throw new AppException(
        ResponseCode.ConfigEditorReadFailed,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  private async writeConfigFile(configPath: string, content: string) {
    try {
      await writeFile(configPath, content, 'utf-8')
    }
    catch (error) {
      throw new AppException(
        ResponseCode.ConfigEditorWriteFailed,
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}
