/**
 * ToolBarInline - 内联工具栏
 * 扁平化单行 pill 按钮（内容类型、平台、模型、比例、时长/图片数、数量），右侧积分 + 提交按钮
 */

'use client'

import type { EffectiveLimitsDetailed } from '../platformLimits'
import type { DraftContentType, VideoModelType } from '@/api/draftGeneration'
import type { ImageModelPricing, VideoModelInfo } from '@/api/types/draftGeneration'
import type { PlatType } from '@/app/config/platConfig'
import { AlertTriangle, ArrowUp, Clock, Coins, ExternalLink, FileText, Grid2x2, Image, Layers, Loader2, Lock, Monitor, Ruler, Video } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  IMAGE_COUNT_LIMITS,
  IMAGE_TEXT_ASPECT_RATIOS,
  ratioToPreviewSize,
} from '../constants'
import PlatformSelector from '../PlatformSelector'

interface ToolBarInlineProps {
  contentType: DraftContentType
  modelType: VideoModelType
  aspectRatio: string
  duration: number
  quantity: number
  imageModel: string
  imageCount: number
  imageSize: string
  imageModelOptions: { value: string, label: string }[]
  imagePricing: ImageModelPricing[]
  videoModels?: VideoModelInfo[]
  videoModelOptions: { value: string, label: string }[]
  videoDurationLimits: { min: number, max: number }
  videoCredits: number
  isVideoEditMode: boolean
  inputVideoDuration: number | null
  isPricingLoading: boolean
  isLoading: boolean
  hasVideos: boolean
  promptsExploreUrl: string
  promptsExploreLabel: string
  isDraftMode: boolean
  selectedPlatforms: PlatType[]
  effectiveLimitsDetailed: EffectiveLimitsDetailed
  disabledPlatforms: Map<PlatType, string[]>
  onDraftModeChange: (isDraft: boolean) => void
  onContentTypeChange: (contentType: DraftContentType) => void
  onModelTypeChange: (modelType: VideoModelType) => void
  onAspectRatioChange: (ratio: string) => void
  onDurationChange: (duration: number) => void
  onQuantityChange: (quantity: number) => void
  onImageModelChange: (imageModel: string) => void
  onImageCountChange: (imageCount: number) => void
  onImageSizeChange: (size: string) => void
  onPlatformsChange: (platforms: PlatType[]) => void
  onSubmit: () => void
}

/** 通用 pill 按钮样式 */
const pillClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border'

/** 点击触发 Popover 的 hook */
function useClickPopover() {
  const [open, setOpen] = useState(false)
  const onOpenChange = useCallback((val: boolean) => setOpen(val), [])
  return { open, onOpenChange }
}

const ToolBarInline = memo(({
  contentType,
  modelType,
  aspectRatio,
  duration,
  quantity,
  imageModel,
  imageCount,
  imageSize,
  imageModelOptions,
  imagePricing,
  videoModels,
  videoModelOptions,
  videoDurationLimits,
  videoCredits,
  isVideoEditMode,
  inputVideoDuration,
  isPricingLoading,
  isLoading,
  hasVideos,
  promptsExploreUrl,
  promptsExploreLabel,
  isDraftMode,
  selectedPlatforms,
  effectiveLimitsDetailed,
  disabledPlatforms,
  onDraftModeChange,
  onContentTypeChange,
  onModelTypeChange,
  onAspectRatioChange,
  onDurationChange,
  onQuantityChange,
  onImageModelChange,
  onImageCountChange,
  onImageSizeChange,
  onPlatformsChange,
  onSubmit,
}: ToolBarInlineProps) => {
  const { t } = useTransClient('brandPromotion')

  const isVideoMode = contentType === 'video'

  // 图文模式积分计算（从 pricing 动态获取）
  const currentPricePerImage = useMemo(() => {
    const found = imagePricing.find(p => p.resolution === imageSize)
    return found?.pricePerImage ?? 0
  }, [imagePricing, imageSize])
  const imageTextCredits = isPricingLoading ? 0 : Math.ceil(currentPricePerImage * imageCount * quantity * 100) / 100

  const totalCredits = isVideoMode ? videoCredits : imageTextCredits

  // 当前模型的完整信息
  const currentVideoModel = useMemo(() => {
    if (!isVideoMode || !videoModels)
      return undefined
    return videoModels.find(m => m.name === modelType)
  }, [isVideoMode, videoModels, modelType])

  // 判断是否限时模型
  const isTimeLimitedModel = useMemo(() => {
    if (!currentVideoModel)
      return false
    return currentVideoModel.tags.some(tag =>
      /限时|limited/i.test(tag),
    )
  }, [currentVideoModel])

  const supportedRatios = useMemo(() => {
    if (isVideoMode && currentVideoModel) {
      return currentVideoModel.aspectRatios.map(label => ({ label, ...ratioToPreviewSize(label) }))
    }
    return IMAGE_TEXT_ASPECT_RATIOS
  }, [currentVideoModel, isVideoMode])

  const currentModelLabel = isVideoMode
    ? (videoModelOptions.find(m => m.value === modelType)?.label || modelType)
    : (imageModelOptions.find(m => m.value === imageModel)?.label || imageModel)

  const handleDurationChange = useCallback(([val]: number[]) => {
    onDurationChange(val)
  }, [onDurationChange])

  const handleQuantityChange = useCallback(([val]: number[]) => {
    onQuantityChange(val)
  }, [onQuantityChange])

  const handleImageCountChange = useCallback(([val]: number[]) => {
    onImageCountChange(val)
  }, [onImageCountChange])

  // Popover 状态
  const genModePopover = useClickPopover()
  const modelPopover = useClickPopover()
  const ratioPopover = useClickPopover()
  const durationPopover = useClickPopover()
  const quantityPopover = useClickPopover()
  const imageSizePopover = useClickPopover()
  const imageCountPopover = useClickPopover()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 视频编辑模式 badge */}
      {isVideoEditMode && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
          <Video className="h-3 w-3" />
          {t('detail.videoEditMode')}
        </span>
      )}

      {/* 生成模式选择 pill（草稿/图片/视频 三选一） */}
      <Popover open={genModePopover.open} onOpenChange={genModePopover.onOpenChange}>
        <PopoverTrigger asChild>
          <button
            data-testid="draftbox-ai-gen-mode"
            type="button"
            className={pillClass}
          >
            {isDraftMode
              ? <FileText className="h-3.5 w-3.5" />
              : isVideoMode
                ? <Video className="h-3.5 w-3.5" />
                : <Image className="h-3.5 w-3.5" />}
            {isDraftMode
              ? `${t('detail.draftModeOn')}(${isVideoMode ? t('detail.contentTypeVideo') : t('detail.contentTypeImageText')})`
              : isVideoMode
                ? t('detail.draftModeOffVideo')
                : t('detail.draftModeOffImage')}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          side="top"
          align="start"
        >
          <div className="flex flex-col gap-1">
            {/* 草稿模式选项 */}
            {([
              { key: 'draft_image', label: `${t('detail.draftModeOn')}(${t('detail.contentTypeImageText')})`, icon: FileText, isDraft: true, ct: 'image_text' as const },
              { key: 'draft_video', label: `${t('detail.draftModeOn')}(${t('detail.contentTypeVideo')})`, icon: FileText, isDraft: true, ct: 'video' as const },
            ]).map(({ key, label, icon: Icon, isDraft, ct }) => {
              const isActive = isDraftMode && contentType === ct
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                    isActive
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                  onClick={() => {
                    onDraftModeChange(true)
                    if (contentType !== ct)
                      onContentTypeChange(ct)
                    genModePopover.onOpenChange(false)
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              )
            })}
            {/* 分割线 */}
            <div className="border-t border-border my-1" />
            {/* 非草稿模式选项 */}
            {([
              { key: 'image', label: t('detail.draftModeOffImage'), icon: Image, ct: 'image_text' as const },
              { key: 'video', label: t('detail.draftModeOffVideo'), icon: Video, ct: 'video' as const },
            ]).map(({ key, label, icon: Icon, ct }) => {
              const isActive = !isDraftMode && contentType === ct
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                    isActive
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                  onClick={() => {
                    onDraftModeChange(false)
                    if (contentType !== ct)
                      onContentTypeChange(ct)
                    genModePopover.onOpenChange(false)
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 平台选择 pill（内含参数限制 ⓘ）— 仅草稿模式显示 */}
      {isDraftMode && (
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformsChange={onPlatformsChange}
          pillClass={pillClass}
          disabledPlatforms={disabledPlatforms}
          effectiveLimitsDetailed={effectiveLimitsDetailed}
        />
      )}

      {/* 模型选择 pill */}
      <Popover open={modelPopover.open} onOpenChange={modelPopover.onOpenChange}>
        <PopoverTrigger asChild>
          <button
            data-testid="draftbox-ai-model"
            type="button"
            className={pillClass}
          >
            <Monitor className="h-3.5 w-3.5" />
            {currentModelLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          side="top"
          align="start"
        >
          <span className="text-xs font-medium text-foreground mb-2 block">
            {isVideoMode ? t('detail.modelType') : t('detail.imageModel')}
          </span>
          <div className="flex flex-col gap-1">
            {isVideoMode
              ? (videoModels ?? []).map((model) => {
                  const key = model.name
                  const isActive = key === modelType
                  // 每秒价格：取默认 duration 对应的 pricing 计算
                  const defaultDuration = model.defaults?.duration ?? model.durations[0]
                  const defaultPricing = model.pricing.find(p => p.duration === defaultDuration) ?? model.pricing[0]
                  const pricePerSecond = defaultPricing && defaultPricing.duration > 0
                    ? Math.round((defaultPricing.price / defaultPricing.duration) * 100) / 100
                    : null
                  const originPricePerSecond = defaultPricing?.originPrice != null && defaultPricing.duration > 0
                    ? Math.round((defaultPricing.originPrice / defaultPricing.duration) * 100) / 100
                    : null
                  const durationRange = model.durations.length > 1
                    ? `${Math.min(...model.durations)}-${Math.max(...model.durations)}s`
                    : model.durations[0] ? `${model.durations[0]}s` : ''
                  const resolutionLabel = model.defaults?.resolution ?? model.resolutions[0] ?? ''
                  return (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        'px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                        isActive
                          ? 'bg-primary/10 text-foreground font-medium'
                          : 'hover:bg-muted text-muted-foreground',
                      )}
                      onClick={() => onModelTypeChange(key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{model.description || model.name}</span>
                        {model.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        {resolutionLabel && <span>{resolutionLabel}</span>}
                        {resolutionLabel && durationRange && <span>·</span>}
                        {durationRange && <span>{durationRange}</span>}
                        {pricePerSecond != null && (
                          <>
                            <span>·</span>
                            {originPricePerSecond != null && originPricePerSecond !== pricePerSecond && (
                              <span className="line-through opacity-60">
                                {originPricePerSecond}
                                {t('detail.creditsPerSecond')}
                              </span>
                            )}
                            <span>
                              {pricePerSecond}
                              {t('detail.creditsPerSecond')}
                            </span>
                            {defaultPricing?.discount && (
                              <span className="px-1 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 font-medium">{defaultPricing.discount}</span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  )
                })
              : imageModelOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                      value === imageModel
                        ? 'bg-primary/10 text-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground',
                    )}
                    onClick={() => onImageModelChange(value)}
                  >
                    {label}
                  </button>
                ))}
          </div>
          {isTimeLimitedModel && (
            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border px-1 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400 max-w-65">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t('detail.timeLimitedModelTip')}</span>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* 图文模式：分辨率选择 pill */}
      {!isVideoMode && imagePricing.length > 0 && (
        <Popover open={imageSizePopover.open} onOpenChange={imageSizePopover.onOpenChange}>
          <PopoverTrigger asChild>
            <button
              data-testid="draftbox-ai-resolution"
              type="button"
              className={pillClass}
            >
              <Ruler className="h-3.5 w-3.5" />
              {imageSize}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2"
            side="top"
            align="start"
          >
            <span className="text-xs font-medium text-foreground mb-2 block">
              {t('detail.imageResolution')}
            </span>
            <div className="flex flex-col gap-1">
              {imagePricing.map(({ resolution, pricePerImage }) => (
                <button
                  key={resolution}
                  type="button"
                  className={cn(
                    'px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                    resolution === imageSize
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                  onClick={() => onImageSizeChange(resolution)}
                >
                  {resolution}
                  <span className="ml-2 text-muted-foreground">
                    {t('detail.creditsPerImage', { credits: pricePerImage })}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* 比例选择 pill */}
      {isVideoEditMode
        ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(pillClass, 'opacity-50 pointer-events-none')}
                  >
                    <Lock className="h-3 w-3" />
                    <Grid2x2 className="h-3.5 w-3.5" />
                    {aspectRatio}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('detail.ratioLockedByVideo')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        : (
            <Popover open={ratioPopover.open} onOpenChange={ratioPopover.onOpenChange}>
              <PopoverTrigger asChild>
                <button
                  data-testid="draftbox-ai-ratio"
                  type="button"
                  className={pillClass}
                >
                  <Grid2x2 className="h-3.5 w-3.5" />
                  {aspectRatio}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2"
                side="top"
                align="start"
              >
                <span className="text-xs font-medium text-foreground mb-2 block">{t('detail.aspectRatio')}</span>
                <div className="flex gap-1">
                  {supportedRatios.map(({ label, w, h }) => {
                    const isActive = label === aspectRatio
                    return (
                      <button
                        key={label}
                        type="button"
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 w-10 py-1.5 rounded-md cursor-pointer transition-colors',
                          isActive
                            ? 'bg-primary/10 text-foreground'
                            : 'hover:bg-muted text-muted-foreground',
                        )}
                        onClick={() => onAspectRatioChange(label)}
                      >
                        <span className="flex items-center justify-center h-5">
                          <span
                            className={cn(
                              'rounded-sm',
                              isActive ? 'border-[1.5px] border-primary' : 'border-[1.5px] border-muted-foreground/40',
                            )}
                            style={{ width: w, height: h }}
                          />
                        </span>
                        <span className="text-[10px] leading-none">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

      {/* 视频模式：时长 pill */}
      {isVideoMode && (
        (isVideoEditMode && inputVideoDuration !== null)
          ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(pillClass, 'opacity-50 pointer-events-none')}
                    >
                      <Lock className="h-3 w-3" />
                      <Clock className="h-3.5 w-3.5" />
                      {duration}
                      s
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('detail.durationLockedByVideo')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          : videoDurationLimits.min === videoDurationLimits.max
            ? (
                <span className={cn(pillClass, 'opacity-50 pointer-events-none')}>
                  <Lock className="h-3 w-3" />
                  <Clock className="h-3.5 w-3.5" />
                  {duration}
                  s
                </span>
              )
            : (
                <Popover open={durationPopover.open} onOpenChange={durationPopover.onOpenChange}>
                  <PopoverTrigger asChild>
                    <button
                      data-testid="draftbox-ai-duration"
                      type="button"
                      className={pillClass}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {duration}
                      s
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-48 p-3"
                    side="top"
                    align="start"
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-foreground">{t('detail.duration')}</span>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[duration]}
                          onValueChange={handleDurationChange}
                          min={videoDurationLimits.min}
                          max={videoDurationLimits.max}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {duration}
                          s
                        </span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
      )}

      {/* 图文模式：图片数量 pill */}
      {!isVideoMode && (
        <Popover open={imageCountPopover.open} onOpenChange={imageCountPopover.onOpenChange}>
          <PopoverTrigger asChild>
            <button
              data-testid="draftbox-ai-image-count"
              type="button"
              className={pillClass}
            >
              <Image className="h-3.5 w-3.5" />
              x
              {imageCount}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-3"
            side="top"
            align="start"
          >
            <div className="space-y-2">
              <span className="text-xs font-medium text-foreground">{t('detail.imageCount')}</span>
              <div className="flex items-center gap-2">
                <Slider
                  value={[imageCount]}
                  onValueChange={handleImageCountChange}
                  min={IMAGE_COUNT_LIMITS.min}
                  max={IMAGE_COUNT_LIMITS.max}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-6 text-right">{imageCount}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* 数量 pill */}
      <Popover open={quantityPopover.open} onOpenChange={quantityPopover.onOpenChange}>
        <PopoverTrigger asChild>
          <button
            data-testid="draftbox-ai-quantity"
            type="button"
            className={pillClass}
          >
            <Layers className="h-3.5 w-3.5" />
            x
            {quantity}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-3"
          side="top"
          align="start"
        >
          <div className="space-y-2">
            <span className="text-xs font-medium text-foreground">{t('detail.quantity')}</span>
            <div className="flex items-center gap-2">
              <Slider
                value={[quantity]}
                onValueChange={handleQuantityChange}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-6 text-right">{quantity}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 探索更多提示词链接 */}
      {isVideoMode && (
        <a
          href={promptsExploreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {promptsExploreLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {/* 右侧：积分 + 提交按钮 */}
      <div data-testid="draftbox-ai-credits-display" className="flex items-center gap-1.5 ml-auto">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-foreground">
          {(!isVideoMode && isPricingLoading) ? '--' : totalCredits}
        </span>
        <button
          data-testid="draftbox-ai-submit-btn"
          type="button"
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ml-1',
            'bg-foreground text-background hover:bg-foreground/90',
            isLoading && 'opacity-60 pointer-events-none',
          )}
          disabled={isLoading}
          onClick={onSubmit}
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
})

ToolBarInline.displayName = 'ToolBarInline'

export default ToolBarInline
