export enum ConfigFileFormat {
  Json = 'json',
  Yaml = 'yaml',
}

export interface ConfigEditorConfigVo {
  config: Record<string, unknown>
  format: ConfigFileFormat
}

export interface ConfigEditorConfigDto {
  config: Record<string, unknown>
}
