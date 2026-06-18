import type { MutableRefObject } from 'react'
import type { ConfigFileFormat } from '@/api/config-editor/config-editor.types'

export type ConfigPathSegment = string | number
export type ConfigPath = ConfigPathSegment[]
export type ConfigValue = unknown

export interface ConfigSectionView {
  id: string
  label: string
  description: string
  paths: ConfigPath[]
  fieldCount: number
}

export interface ConfigEditorStatus {
  service: 'unknown' | 'running' | 'restarting' | 'failed'
  format?: ConfigFileFormat
  dirty: boolean
}

export interface ConfigFormPanelProps {
  sections: ConfigSectionView[]
  config: Record<string, unknown>
  disabled: boolean
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
  onSectionClick: (sectionId: string) => void
}

export interface ConfigFieldProps {
  path: ConfigPath
  fieldKey: string
  value: ConfigValue
  disabled: boolean
  depth?: number
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
}
