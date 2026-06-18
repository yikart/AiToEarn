import type {
  CurrentModelDisplay,
  DurationLimits,
  ImageModelOption,
  PopoverControl,
  RatioPreviewOption,
  VideoModelOption,
  VideoModelParamInfo,
} from './base'
import type { DraftContentType, ImageModelPricing, VideoModelInfo, VideoModelType } from '@/api/ai/ai.types'
import type { ModelSelectionMode, VideoModelParams } from '@/store/draft-box/draftBoxConfigStore'

export interface VideoEditModeBadgeProps {
  label: string
}

export interface GenerationModeSelectLabels {
  contentTypeImageText: string
  contentTypeVideo: string
  draftModeOffImage: string
  draftModeOffVideo: string
  draftModeOn: string
}

export interface GenerationModeSelectProps {
  contentType: DraftContentType
  hideNonDraftModes: boolean
  isDraftMode: boolean
  isVideoMode: boolean
  labels: GenerationModeSelectLabels
  popover: PopoverControl
  onContentTypeChange: (contentType: DraftContentType) => void
  onDraftModeChange: (isDraft: boolean) => void
}

export interface ModelSelectLabels {
  imageModel: string
  modelType: string
  multiSelect: string
  selectedModelsCount: (values: { selected: number, total: number }) => string
  singleSelect: string
  timeLimitedModelTip: string
}

export interface ModelSelectProps {
  currentModelDisplay: CurrentModelDisplay
  imageModelOptions: ImageModelOption[]
  imageModelSelectionMode: ModelSelectionMode
  isTimeLimitedModel: boolean
  isVideoMode: boolean
  modelOptionsCount: number
  popover: PopoverControl
  selectedImageModels: string[]
  selectedModelValues: string[]
  selectedVideoModels: VideoModelType[]
  videoModelOptions: VideoModelOption[]
  videoModelSelectionMode: ModelSelectionMode
  videoModels?: VideoModelInfo[]
  labels: ModelSelectLabels
  onImageModelSelectionModeChange: (mode: ModelSelectionMode) => void
  onImageModelToggle: (modelName: string) => void
  onVideoModelSelectionModeChange: (mode: ModelSelectionMode) => void
  onVideoModelToggle: (modelName: VideoModelType) => void
}

export interface VideoModelParamsSelectLabels {
  aspectRatio: string
  duration: string
  videoModelParams: string
  videoResolution: string
}

export interface VideoModelParamsSelectProps {
  draftVideoModelDurations: Record<string, number>
  isVideoEditMode: boolean
  labels: VideoModelParamsSelectLabels
  popover: PopoverControl
  selectedVideoModelParamInfos: VideoModelParamInfo[]
  videoModelOptions: VideoModelOption[]
  onVideoModelDurationCommit: (
    modelName: VideoModelType,
    value?: number,
    currentValue?: number,
  ) => void
  onVideoModelDurationDraftChange: (modelName: VideoModelType, value?: number) => void
  onVideoModelParamChange: (modelType: VideoModelType, params: VideoModelParams) => void
}

export interface ImageSizeSelectProps {
  imagePricing: ImageModelPricing[]
  imageSize: string
  label: string
  popover: PopoverControl
  onImageSizeChange: (size: string) => void
}

export interface VideoResolutionSelectProps {
  label: string
  popover: PopoverControl
  resolution: string
  videoResolutions: string[]
  onResolutionChange: (resolution: string) => void
}

export interface AspectRatioSelectProps {
  aspectRatio: string
  isLocked: boolean
  label: string
  lockedLabel: string
  popover: PopoverControl
  supportedRatios: RatioPreviewOption[]
  onAspectRatioChange: (ratio: string) => void
}

export interface DurationSelectProps {
  draftDuration: number | null
  duration: number
  inputVideoDuration: number | null
  isVideoEditMode: boolean
  label: string
  lockedByVideoLabel: string
  popover: PopoverControl
  videoDurationLimits: DurationLimits
  onDurationCommit: (value: number[]) => void
  onDurationDraftChange: (value: number[]) => void
}

export interface ImageCountSelectProps {
  imageCount: number
  label: string
  popover: PopoverControl
  onImageCountChange: (value: number[]) => void
}

export interface QuantitySelectProps {
  label: string
  popover: PopoverControl
  quantity: number
  onQuantityChange: (value: number[]) => void
}

export interface MoreOptionsToggleProps {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface ToolbarLinksProps {
  isVideoMode: boolean
  promptsExploreLabel: string
  promptsExploreUrl: string
}

export interface CreditsSubmitControlProps {
  isLoading: boolean
  onSubmit: () => void
}
