import type { TFunction } from 'i18next'
import type { DraftContentType } from '@/api/ai/ai.types'
import type { PlatType } from '@/app/config/platConfig'
import { useEffect, useMemo } from 'react'
import { buildDraftPromptLimitText } from '../../../utils/promptLimits'
import { checkPlatformCompatibility } from '../utils/platformCompatibility'
import { calcEffectiveLimitsDetailed } from '../utils/platformLimits'

interface UseAiBatchPlatformPromptStateParams {
  configKey: string
  hydrated: boolean
  contentType: DraftContentType
  aspectRatio: string
  duration: number
  imageCount: number
  availablePlatforms: PlatType[]
  selectedPlatforms: PlatType[]
  isDraftMode: boolean
  captionSystemPromptDefault: string
  setCaptionSystemPrompt: (value: string) => void
  setCaptionSystemPromptDefault: (value: string) => void
  updateConfig: (
    groupId: string,
    partial: Partial<{
      captionSystemPrompt: string
      captionSystemPromptDefault: string
    }>,
  ) => void
  t: TFunction
}

export function useAiBatchPlatformPromptState({
  configKey,
  hydrated,
  contentType,
  aspectRatio,
  duration,
  imageCount,
  availablePlatforms,
  selectedPlatforms,
  isDraftMode,
  captionSystemPromptDefault,
  setCaptionSystemPrompt,
  setCaptionSystemPromptDefault,
  updateConfig,
  t,
}: UseAiBatchPlatformPromptStateParams) {
  const incompatiblePlatforms = useMemo(() => {
    return checkPlatformCompatibility(
      { contentType, aspectRatio, duration, imageCount },
      availablePlatforms,
      t,
    )
  }, [contentType, aspectRatio, duration, imageCount, availablePlatforms, t])

  const effectiveSelectedPlatforms = useMemo(
    () => selectedPlatforms.filter(p => !incompatiblePlatforms.has(p)),
    [selectedPlatforms, incompatiblePlatforms],
  )

  const effectiveLimitsDetailed = useMemo(() => {
    return calcEffectiveLimitsDetailed(effectiveSelectedPlatforms)
  }, [effectiveSelectedPlatforms])

  const defaultCaptionSystemPrompt = useMemo(() => {
    if (!isDraftMode)
      return ''

    const limits: string[] = []
    if (effectiveLimitsDetailed.titleMax) {
      limits.push(t('detail.titleLimitPrompt', { max: effectiveLimitsDetailed.titleMax.value }))
    }
    if (effectiveLimitsDetailed.desMax) {
      limits.push(
        t('detail.descriptionLimitPrompt', { max: effectiveLimitsDetailed.desMax.value }),
      )
    }
    if (effectiveLimitsDetailed.topicMax) {
      limits.push(t('detail.topicLimitPrompt', { max: effectiveLimitsDetailed.topicMax.value }))
    }
    limits.push(t('detail.titleNoEmojiPrompt'))

    return buildDraftPromptLimitText(limits, {
      prefix: t('detail.systemCaptionPromptPrefix'),
      separator: t('detail.systemCaptionPromptSeparator'),
    })
  }, [effectiveLimitsDetailed, isDraftMode, t])

  useEffect(() => {
    if (!hydrated || !isDraftMode)
      return

    if (captionSystemPromptDefault === defaultCaptionSystemPrompt) {
      return
    }

    setCaptionSystemPromptDefault(defaultCaptionSystemPrompt)
    setCaptionSystemPrompt(defaultCaptionSystemPrompt)
    updateConfig(configKey, {
      captionSystemPrompt: defaultCaptionSystemPrompt,
      captionSystemPromptDefault: defaultCaptionSystemPrompt,
    })
  }, [
    hydrated,
    captionSystemPromptDefault,
    configKey,
    defaultCaptionSystemPrompt,
    isDraftMode,
    setCaptionSystemPrompt,
    setCaptionSystemPromptDefault,
    updateConfig,
  ])

  return {
    defaultCaptionSystemPrompt,
    effectiveLimitsDetailed,
    effectiveSelectedPlatforms,
    incompatiblePlatforms,
  }
}
