import type { VideoModelParamsSelectProps } from '../../types'
import { Lock, SlidersHorizontal } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/utils/className'
import { ratioToPreviewSize } from '../../../../utils/constants'
import { pillClass } from '../../utils/styles'

export function VideoModelParamsSelect({
  draftVideoModelDurations,
  isVideoEditMode,
  labels,
  popover,
  selectedVideoModelParamInfos,
  videoModelOptions,
  onVideoModelDurationCommit,
  onVideoModelDurationDraftChange,
  onVideoModelParamChange,
}: VideoModelParamsSelectProps) {
  if (selectedVideoModelParamInfos.length === 0)
    return null

  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button
          data-testid="draftbox-ai-video-model-params"
          type="button"
          className={pillClass}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {labels.videoModelParams}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(92vw,560px)] p-0"
        side="top"
        align="start"
        allowInnerScroll
      >
        <div className="border-b border-border px-3 py-2">
          <span className="text-xs font-medium text-foreground">
            {labels.videoModelParams}
          </span>
        </div>
        <div className="max-h-[min(58vh,440px)] space-y-2.5 overflow-y-auto p-2.5 sm:space-y-3 sm:p-3">
          {selectedVideoModelParamInfos.map(
            ({ model, params, resolutions, aspectRatios, durationLimits }) => {
              const modelLabel
                = videoModelOptions.find(item => item.value === model.name)?.label
                  || model.description
                  || model.name
              const durationValue
                = draftVideoModelDurations[model.name] ?? params.duration ?? durationLimits.min
              const durationLocked
                = isVideoEditMode || durationLimits.min === durationLimits.max

              return (
                <div
                  key={model.name}
                  className="rounded-lg border border-border bg-background p-2.5 sm:p-3"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-xs font-medium text-foreground">
                      {modelLabel}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{params.resolution || '-'}</span>
                      <span className="text-muted-foreground/60">·</span>
                      <span>{params.aspectRatio || '-'}</span>
                      <span className="text-muted-foreground/60">·</span>
                      <span>{`${durationValue}s`}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {resolutions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {labels.videoResolution}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {resolutions.map(item => (
                            <button
                              key={item}
                              type="button"
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-[11px] leading-none transition-colors cursor-pointer',
                                item === params.resolution
                                  ? 'border-primary/40 bg-primary/10 text-foreground'
                                  : 'border-border text-muted-foreground hover:bg-muted',
                              )}
                              onClick={() =>
                                onVideoModelParamChange(model.name, { resolution: item })}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {labels.aspectRatio}
                      </span>
                      {isVideoEditMode ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          {params.aspectRatio}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {aspectRatios.map((label) => {
                            const preview = ratioToPreviewSize(label)
                            const isActive = label === params.aspectRatio
                            return (
                              <button
                                key={label}
                                type="button"
                                className={cn(
                                  'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors cursor-pointer',
                                  isActive
                                    ? 'border-primary/40 bg-primary/10 text-foreground'
                                    : 'border-border text-muted-foreground hover:bg-muted',
                                )}
                                onClick={() =>
                                  onVideoModelParamChange(model.name, { aspectRatio: label })}
                              >
                                <span
                                  className={cn(
                                    'rounded-sm border',
                                    isActive ? 'border-primary' : 'border-muted-foreground/40',
                                  )}
                                  style={{ width: preview.w, height: preview.h }}
                                />
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {labels.duration}
                    </span>
                    {durationLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {`${durationValue}s`}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[durationValue]}
                          onValueChange={([value]) =>
                            onVideoModelDurationDraftChange(model.name, value)}
                          onValueCommit={([value]) =>
                            onVideoModelDurationCommit(model.name, value, params.duration)}
                          min={durationLimits.min}
                          max={durationLimits.max}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {`${durationValue}s`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            },
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
