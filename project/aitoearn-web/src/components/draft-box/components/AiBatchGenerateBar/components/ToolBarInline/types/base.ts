import type { AiBatchGenerateBarLocalState } from '../../../store'
import type { EffectiveLimitsDetailed } from '../../../utils/platformLimits'
import type { DraftContentType, ImageModelPricing, VideoModelInfo, VideoModelType } from '@/api/ai/ai.types'
import type { PlatType } from '@/app/config/platConfig'
import type { ModelSelectionMode, VideoModelParams } from '@/store/draft-box/draftBoxConfigStore'

export interface ToolBarInlineActions {
  onDraftModeChange: (isDraft: boolean) => void
  onContentTypeChange: (contentType: DraftContentType) => void
  onVideoModelsChange: (modelTypes: VideoModelType[]) => void
  onVideoModelSelectionModeChange: (mode: ModelSelectionMode) => void
  onVideoModelParamChange: (modelType: VideoModelType, params: VideoModelParams) => void
  onResolutionChange: (resolution: string) => void
  onAspectRatioChange: (ratio: string) => void
  onDurationChange: (duration: number) => void
  onQuantityChange: (quantity: number) => void
  onImageModelsChange: (imageModels: string[]) => void
  onImageModelSelectionModeChange: (mode: ModelSelectionMode) => void
  onImageCountChange: (imageCount: number) => void
  onImageSizeChange: (size: string) => void
  onPlatformsChange: (platforms: PlatType[]) => void
  onMoreOptionsChange: (open: boolean) => void
  onSubmit: () => void
}

export interface ToolBarInlineProps {
  configKey: string
  fallbackState: AiBatchGenerateBarLocalState
  imageAspectRatios: string[]
  imageModelOptions: ImageModelOption[]
  imagePricing: ImageModelPricing[]
  videoModels?: VideoModelInfo[]
  videoAspectRatios: string[]
  videoResolutions: string[]
  videoModelOptions: VideoModelOption[]
  resolvedVideoModelParams: Record<string, VideoModelParams>
  videoDurationLimits: DurationLimits
  isVideoEditMode: boolean
  inputVideoDuration: number | null
  isLoading: boolean
  promptsExploreUrl: string
  promptsExploreLabel: string
  hideNonDraftModes?: boolean
  effectiveLimitsDetailed: EffectiveLimitsDetailed
  disabledPlatforms: Map<PlatType, string[]>
  actions: ToolBarInlineActions
}

export interface ImageModelOption {
  value: string
  label: string
  tags: string[]
}

export interface VideoModelOption {
  value: string
  label: string
}

export interface DurationLimits {
  min: number
  max: number
}

export interface PopoverControl {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface RatioPreviewOption {
  label: string
  w: number
  h: number
}

export interface CurrentModelDisplay {
  label: string
  extraCount: number
}

export interface VideoModelParamInfo {
  model: VideoModelInfo
  params: VideoModelParams
  resolutions: string[]
  aspectRatios: string[]
  durationLimits: DurationLimits
}
