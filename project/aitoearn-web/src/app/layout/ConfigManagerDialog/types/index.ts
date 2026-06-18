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
  modifiedFieldCount: number
  notRecommended?: boolean
}

export interface ConfigPathFocusRequest {
  id: number
  path: ConfigPath
}

export interface ConfigEditorStatus {
  service: 'unknown' | 'running' | 'restarting' | 'failed'
  format?: ConfigFileFormat
  dirty: boolean
}

export interface ConfigFormPanelProps {
  sections: ConfigSectionView[]
  config: Record<string, unknown>
  originalConfig: Record<string, unknown> | null
  disabled: boolean
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>
  focusRequest: ConfigPathFocusRequest | null
  highlightedPathKey: string
  initialScrollTop: number
  onFocusRequestHandled: (requestId: number) => void
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
  onNavigateToJson: (path: ConfigPath) => void
  onScrollTopChange: (scrollTop: number) => void
  onSectionClick: (sectionId: string) => void
}

export interface ConfigFieldProps {
  path: ConfigPath
  fieldKey: string
  value: ConfigValue
  originalValue?: ConfigValue
  disabled: boolean
  depth?: number
  focusPath: ConfigPath | null
  highlightedPathKey: string
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
  onNavigateToJson: (path: ConfigPath) => void
}
