import type { ModelSelectProps } from '../../types'
import { AlertTriangle, Check, Monitor } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/className'
import { modelOptionClassName, modelTagClassName, pillClass } from '../../utils/styles'

export function ModelSelect({
  currentModelDisplay,
  imageModelOptions,
  imageModelSelectionMode,
  isTimeLimitedModel,
  isVideoMode,
  modelOptionsCount,
  popover,
  selectedImageModels,
  selectedModelValues,
  selectedVideoModels,
  videoModelOptions,
  videoModelSelectionMode,
  videoModels,
  labels,
  onImageModelSelectionModeChange,
  onImageModelToggle,
  onVideoModelSelectionModeChange,
  onVideoModelToggle,
}: ModelSelectProps) {
  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button
          data-testid="draftbox-ai-model"
          type="button"
          className={cn(pillClass, 'max-w-[220px]')}
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="truncate">{currentModelDisplay.label}</span>
          {currentModelDisplay.extraCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
              +
              {currentModelDisplay.extraCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(92vw,380px)] p-0"
        side="top"
        align="start"
        allowInnerScroll
      >
        <div className="flex flex-col items-stretch gap-2 border-b border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-foreground sm:shrink-0">
            {isVideoMode ? labels.modelType : labels.imageModel}
          </span>
          <div className="flex flex-wrap items-center gap-1 sm:justify-end">
            {(['single', 'multiple'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] transition-colors cursor-pointer',
                  (isVideoMode ? videoModelSelectionMode : imageModelSelectionMode) === mode
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  if (isVideoMode) {
                    onVideoModelSelectionModeChange(mode)
                  }
                  else {
                    onImageModelSelectionModeChange(mode)
                  }
                }}
              >
                {mode === 'single' ? labels.singleSelect : labels.multiSelect}
              </button>
            ))}
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {labels.selectedModelsCount({
                selected: selectedModelValues.length,
                total: modelOptionsCount,
              })}
            </span>
          </div>
        </div>
        <div className="max-h-[min(50vh,360px)] overflow-y-auto p-2">
          <div className="flex flex-col gap-1">
            {isVideoMode
              ? (videoModels ?? []).map((model) => {
                  const key = model.name
                  const isActive = selectedVideoModels.includes(key)
                  const resolutionLabel = model.defaults?.resolution ?? model.resolutions[0]
                  const durationRange = model.durations.length > 1
                    ? `${Math.min(...model.durations)}-${Math.max(...model.durations)}s`
                    : model.durations[0]
                      ? `${model.durations[0]}s`
                      : ''

                  return (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        modelOptionClassName,
                        isActive
                          ? 'border-primary/30 bg-primary/5 text-foreground shadow-sm'
                          : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/60',
                      )}
                      onClick={() => {
                        onVideoModelToggle(key)
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'text-xs',
                              isActive ? 'font-medium text-foreground' : 'text-foreground',
                            )}
                          >
                            {model.description || model.name}
                          </span>
                          {model.tags.map(tag => (
                            <Badge key={tag} className={modelTagClassName}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                          {resolutionLabel && <span>{resolutionLabel}</span>}
                          {resolutionLabel && durationRange && <span>·</span>}
                          {durationRange && <span>{durationRange}</span>}
                        </div>
                      </div>
                      {isActive && (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  )
                })
              : imageModelOptions.map(({ value, label, tags }) => {
                  const isActive = selectedImageModels.includes(value)

                  return (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        modelOptionClassName,
                        'items-start text-xs',
                        isActive
                          ? 'border-primary/30 bg-primary/5 text-foreground shadow-sm'
                          : 'border-transparent text-foreground hover:border-border/70 hover:bg-muted/60',
                      )}
                      onClick={() => {
                        onImageModelToggle(value)
                      }}
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <span>{label}</span>
                        {tags.map(tag => (
                          <Badge key={tag} className={modelTagClassName}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {isActive && (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  )
                })}
          </div>
        </div>
        {isTimeLimitedModel && (
          <div className="flex items-start gap-1.5 border-t border-border px-3 py-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{labels.timeLimitedModelTip}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
