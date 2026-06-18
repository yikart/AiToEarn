export enum ConfigFileFormat {
  Json = 'json',
  Yaml = 'yaml',
}

export enum ConfigEditorServiceTarget {
  Server = 'server',
  Ai = 'ai',
}

export interface ConfigEditorConfigVo {
  config: Record<string, unknown>
  format: ConfigFileFormat
}

export interface ConfigEditorConfigDto {
  config: Record<string, unknown>
}
