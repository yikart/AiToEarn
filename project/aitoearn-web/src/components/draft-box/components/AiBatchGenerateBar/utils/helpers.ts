import type { ImageModelInfo, VideoModelInfo, VideoModelInputConstraint } from '@/api/ai/ai.types'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { IPersistedMedia, VideoModelParams } from '@/store/draft-box/draftBoxConfigStore'
import {
  filterVideoPricingByResolution,
  getImageModelsCommonResolutions,
  getNearestVideoPricing,
  getVideoModelAspectRatios,
  getVideoModelCreditsScope,
  getVideoModelDefaultResolution,
  getVideoModelDurationLimits,
  getVideoModelResolutions,
} from './constants'

export const PROMPT_MAX_LENGTH = 2000
const MEDIA_DURATION_LIMIT_TOLERANCE_SECONDS = 0.1
export const MEDIA_MENTION_MAX_IMAGES = 9
export const MEDIA_MENTION_MAX_VIDEOS = 3
export const MEDIA_MENTION_MAX_AUDIOS = 3
const MEDIA_MENTION_TOKEN_PATTERN = /@(Image[1-9]|Video[1-3]|Audio[1-3])/g

function getMediaMentionLimit(type: IUploadedMedia['type']) {
  if (type === 'image')
    return { prefix: 'Image', max: MEDIA_MENTION_MAX_IMAGES }
  if (type === 'video')
    return { prefix: 'Video', max: MEDIA_MENTION_MAX_VIDEOS }
  if (type === 'audio')
    return { prefix: 'Audio', max: MEDIA_MENTION_MAX_AUDIOS }
  return null
}

function getMediaIdentity(media: IUploadedMedia) {
  if (media.id)
    return media.id
  if (media.url)
    return media.url
  return media.file ? `${media.file.name}${media.file.size}` : ''
}

function getMediaMentionTokenForMedia(media: IUploadedMedia | undefined, medias: IUploadedMedia[]) {
  if (!media || !media.url || media.progress !== undefined)
    return ''

  const limit = getMediaMentionLimit(media.type)
  if (!limit)
    return ''

  const mediaIdentity = getMediaIdentity(media)
  const sameTypeMedias = medias.filter(
    item => item.type === media.type && item.url && item.progress === undefined,
  )
  const mediaIndex = sameTypeMedias.findIndex((item) => {
    if (item === media)
      return true
    const itemIdentity = getMediaIdentity(item)
    return Boolean(mediaIdentity && itemIdentity && mediaIdentity === itemIdentity)
  })

  if (mediaIndex < 0 || mediaIndex >= limit.max)
    return ''

  return `@${limit.prefix}${mediaIndex + 1}`
}

function getMediaMentionOrdinalForMedia(media: IUploadedMedia | undefined, medias: IUploadedMedia[]) {
  if (!media || !media.url || media.progress !== undefined)
    return 0

  const limit = getMediaMentionLimit(media.type)
  if (!limit)
    return 0

  const mediaIdentity = getMediaIdentity(media)
  const sameTypeMedias = medias.filter(
    item => item.type === media.type && item.url && item.progress === undefined,
  )
  const mediaIndex = sameTypeMedias.findIndex((item) => {
    if (item === media)
      return true
    const itemIdentity = getMediaIdentity(item)
    return Boolean(mediaIdentity && itemIdentity && mediaIdentity === itemIdentity)
  })

  if (mediaIndex < 0 || mediaIndex >= limit.max)
    return 0

  return mediaIndex + 1
}

export function removeAndReindexMediaMentionTokensAfterRemove(value: string, media: IUploadedMedia | undefined, medias: IUploadedMedia[]) {
  const limit = media ? getMediaMentionLimit(media.type) : null
  const removedOrdinal = getMediaMentionOrdinalForMedia(media, medias)
  if (!limit || removedOrdinal <= 0)
    return value

  const removedToken = `@${limit.prefix}${removedOrdinal}`
  const nextValue = value
    .split(/\r?\n/)
    .map((line) => {
      const nextLine = line.replace(MEDIA_MENTION_TOKEN_PATTERN, (token, mentionValue) => {
        if (!mentionValue.startsWith(limit.prefix))
          return token

        const ordinal = Number(mentionValue.slice(limit.prefix.length))
        if (ordinal === removedOrdinal)
          return ''
        if (ordinal > removedOrdinal && ordinal <= limit.max)
          return `@${limit.prefix}${ordinal - 1}`
        return token
      })

      if (line.includes(removedToken) && nextLine.trim() === '')
        return null

      return nextLine
    })
    .filter((line): line is string => line !== null)
    .join('\n')

  return normalizeMediaMentionBlankLines(nextValue)
}

function isMediaMentionOnlyLine(line: string) {
  return /^\s*(?:@(?:Image[1-9]|Video[1-3]|Audio[1-3])\s*)+$/.test(line)
}

function normalizeMediaMentionBlankLines(value: string) {
  const lines = value.split(/\r?\n/)
  return lines
    .filter((line, index) => {
      if (line.trim())
        return true

      const previousLine = lines.slice(0, index).reverse().find(item => item.trim())
      const nextLine = lines.slice(index + 1).find(item => item.trim())

      if (!previousLine && nextLine && isMediaMentionOnlyLine(nextLine))
        return false
      if (previousLine && !nextLine && isMediaMentionOnlyLine(previousLine))
        return false
      if (previousLine && nextLine && isMediaMentionOnlyLine(previousLine) && isMediaMentionOnlyLine(nextLine))
        return false

      return true
    })
    .join('\n')
}

export function removeUnavailableMediaMentionTokens(value: string, availableValues: Set<string>) {
  return value.replace(MEDIA_MENTION_TOKEN_PATTERN, (token, mentionValue) => {
    return availableValues.has(mentionValue) ? token : ''
  })
}

export function isDurationBelowLimit(duration: number, min: number) {
  return min - duration > MEDIA_DURATION_LIMIT_TOLERANCE_SECONDS
}

export function isDurationAboveLimit(duration: number, max: number) {
  return duration - max > MEDIA_DURATION_LIMIT_TOLERANCE_SECONDS
}

export function buildPersistedMediaSignature(
  medias: Array<Pick<IPersistedMedia, 'id' | 'url' | 'type' | 'name' | 'duration'>>,
) {
  return JSON.stringify(
    medias.map(media => [
      media.id,
      media.url,
      media.type,
      media.name ?? '',
      media.duration ?? null,
    ]),
  )
}

export function normalizeSelectedValues(
  selectedValues: string[],
  availableValues: string[],
  fallbackValue?: string,
) {
  const normalized = selectedValues.filter(
    (value, index, array) => availableValues.includes(value) && array.indexOf(value) === index,
  )
  if (normalized.length > 0)
    return normalized
  if (fallbackValue && availableValues.includes(fallbackValue))
    return [fallbackValue]
  return availableValues[0] ? [availableValues[0]] : []
}

function getOptionCompareKey(value?: string) {
  return (value ?? '').trim().replace(/\s+/g, '').toLowerCase()
}

export function includesOption(values: string[], value?: string) {
  const compareKey = getOptionCompareKey(value)
  return compareKey.length > 0 && values.some(item => getOptionCompareKey(item) === compareKey)
}

export function includesExactStringOption(values: string[], value?: string): value is string {
  return value !== undefined && values.includes(value)
}

function includesExactNumberOption(values: number[], value?: number): value is number {
  return value !== undefined && values.includes(value)
}

export function getVideoModelFallbackResolution(model?: VideoModelInfo) {
  const resolutions = getVideoModelResolutions(model)
  const defaultResolution = model?.defaults?.resolution
  if (includesExactStringOption(resolutions, defaultResolution))
    return defaultResolution!
  return resolutions[0] ?? defaultResolution ?? ''
}

function getResolvedVideoModelResolution(model: VideoModelInfo, requestedResolution?: string) {
  const resolutions = getVideoModelResolutions(model)
  if (includesExactStringOption(resolutions, requestedResolution))
    return requestedResolution!
  return getVideoModelFallbackResolution(model)
}

function getVideoModelDurationOptions(
  model: VideoModelInfo | undefined,
  resolution: string,
  isVideoEditMode: boolean,
) {
  if (!model)
    return []
  const pricing = filterVideoPricingByResolution(model.pricing, resolution, isVideoEditMode)
  const durations = pricing.length > 0 ? pricing.map(item => item.duration) : model.durations
  return Array.from(new Set(durations))
}

function getVideoModelFallbackDuration(
  model: VideoModelInfo | undefined,
  resolution: string,
  fallbackDuration: number,
  isVideoEditMode: boolean,
) {
  const durations = getVideoModelDurationOptions(model, resolution, isVideoEditMode)
  const defaultDuration = model?.defaults?.duration
  if (includesExactNumberOption(durations, defaultDuration))
    return defaultDuration!
  return durations[0] ?? defaultDuration ?? fallbackDuration
}

function getResolvedVideoModelDuration(
  model: VideoModelInfo,
  resolution: string,
  requestedDuration: number,
  fallbackDuration: number,
  isVideoEditMode: boolean,
) {
  const durations = getVideoModelDurationOptions(model, resolution, isVideoEditMode)
  if (includesExactNumberOption(durations, requestedDuration))
    return requestedDuration
  const duration = getVideoModelFallbackDuration(
    model,
    resolution,
    fallbackDuration,
    isVideoEditMode,
  )
  const durationLimits = getVideoModelDurationLimits(model, resolution, isVideoEditMode)
  return clampDuration(duration, durationLimits.min, durationLimits.max)
}

export function getVideoDurationLimits(
  models: VideoModelInfo[],
  resolutions: Record<string, string>,
  isVideoEditMode: boolean,
) {
  const limits = models.map((model) => {
    const resolution = resolutions[model.name] ?? getVideoModelFallbackResolution(model)
    return getVideoModelDurationLimits(model, resolution, isVideoEditMode)
  })

  if (limits.length === 0)
    return { min: 4, max: 15 }

  const min = Math.max(...limits.map(item => item.min))
  const max = Math.min(...limits.map(item => item.max))
  return min <= max ? { min, max } : { min: 4, max: 15 }
}

function getVideoModelCredits(
  model: VideoModelInfo,
  params: Record<string, VideoModelParams>,
  isVideoEditMode: boolean,
) {
  const modelParams = params[model.name] ?? {}
  const resolution = modelParams.resolution ?? getVideoModelDefaultResolution(model)
  const pricing = filterVideoPricingByResolution(model.pricing, resolution, isVideoEditMode)
  return (
    getNearestVideoPricing(pricing, modelParams.duration ?? model.defaults?.duration ?? 8)?.price
    ?? 0
  )
}

export function getVideoModelsCredits(
  models: VideoModelInfo[],
  params: Record<string, VideoModelParams>,
  isVideoEditMode: boolean,
  quantity: number,
) {
  const total = models.reduce((sum, model) => {
    return sum + getVideoModelCredits(model, params, isVideoEditMode)
  }, 0)
  return Math.ceil(total * quantity * 100) / 100
}

export function getVideoCreditsByScope(
  models: VideoModelInfo[],
  params: Record<string, VideoModelParams>,
  isVideoEditMode: boolean,
  quantity: number,
) {
  const totals = models.reduce(
    (result, model) => {
      const credits = getVideoModelCredits(model, params, isVideoEditMode)
      if (getVideoModelCreditsScope(model) === 'seedance') {
        result.seedance += credits
      }
      else {
        result.general += credits
      }
      return result
    },
    { general: 0, seedance: 0 },
  )

  return {
    general: Math.ceil(totals.general * quantity * 100) / 100,
    seedance: Math.ceil(totals.seedance * quantity * 100) / 100,
  }
}

export function getVideoModelResolutionMap(models: VideoModelInfo[], stored: Record<string, string>) {
  const map: Record<string, string> = {}
  models.forEach((model) => {
    const resolutions = getVideoModelResolutions(model)
    const storedResolution = stored[model.name]
    map[model.name] = includesExactStringOption(resolutions, storedResolution)
      ? storedResolution!
      : getVideoModelFallbackResolution(model)
  })
  return map
}

export function clampDuration(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getDefaultVideoAspectRatio(model: VideoModelInfo, fallbackAspectRatio: string) {
  const ratios = getVideoModelAspectRatios(model)
  const defaultAspectRatio = model.defaults?.aspectRatio
  if (includesExactStringOption(ratios, defaultAspectRatio))
    return defaultAspectRatio
  return ratios[0] ?? defaultAspectRatio ?? fallbackAspectRatio
}

function getResolvedVideoModelAspectRatio(
  model: VideoModelInfo,
  requestedAspectRatio: string,
  fallbackAspectRatio: string,
) {
  const ratios = getVideoModelAspectRatios(model)
  if (includesExactStringOption(ratios, requestedAspectRatio))
    return requestedAspectRatio
  return getDefaultVideoAspectRatio(model, fallbackAspectRatio)
}

function getResolvedVideoModelParams(
  model: VideoModelInfo,
  storedParams: VideoModelParams | undefined,
  legacyResolution: string | undefined,
  fallback: Required<VideoModelParams>,
  isVideoEditMode: boolean,
): VideoModelParams {
  const requestedResolution = storedParams?.resolution ?? legacyResolution ?? fallback.resolution
  const resolution = getResolvedVideoModelResolution(model, requestedResolution)
  const requestedAspectRatio = isVideoEditMode
    ? fallback.aspectRatio
    : (storedParams?.aspectRatio ?? fallback.aspectRatio)
  const aspectRatio = getResolvedVideoModelAspectRatio(
    model,
    requestedAspectRatio,
    fallback.aspectRatio,
  )
  const requestedDuration = isVideoEditMode
    ? fallback.duration
    : (storedParams?.duration ?? fallback.duration)
  const duration = getResolvedVideoModelDuration(
    model,
    resolution,
    requestedDuration,
    fallback.duration,
    isVideoEditMode,
  )

  return {
    resolution,
    duration,
    aspectRatio,
  }
}

export function getVideoModelParamsMap(
  models: VideoModelInfo[],
  storedParams: Record<string, VideoModelParams>,
  legacyResolutions: Record<string, string>,
  fallback: Required<VideoModelParams>,
  isVideoEditMode: boolean,
) {
  const params: Record<string, VideoModelParams> = {}
  models.forEach((model) => {
    params[model.name] = getResolvedVideoModelParams(
      model,
      storedParams[model.name],
      legacyResolutions[model.name],
      fallback,
      isVideoEditMode,
    )
  })
  return params
}

export function getVideoModelParamsResolutionMap(params: Record<string, VideoModelParams>) {
  const resolutions: Record<string, string> = {}
  Object.entries(params).forEach(([model, modelParams]) => {
    if (modelParams.resolution) {
      resolutions[model] = modelParams.resolution
    }
  })
  return resolutions
}

export function getSeededVideoModelParamsMap(
  models: VideoModelInfo[],
  storedParams: Record<string, VideoModelParams>,
  seedParams: Required<VideoModelParams>,
) {
  const params: Record<string, VideoModelParams> = {}
  models.forEach((model) => {
    const stored = storedParams[model.name]
    params[model.name] = {
      resolution: stored?.resolution ?? seedParams.resolution,
      duration: stored?.duration ?? seedParams.duration,
      aspectRatio: stored?.aspectRatio ?? seedParams.aspectRatio,
    }
  })
  return params
}

export function isFileSizeAllowed(file: File, maxSizeMb?: number) {
  return maxSizeMb === undefined || file.size <= maxSizeMb * 1024 * 1024
}

export function getMediaDurationLimit(
  constraint: VideoModelInputConstraint | undefined,
  fallback: number,
) {
  return constraint?.maxTotalDuration ?? constraint?.maxDuration ?? fallback
}

function supportsVideoEditMode(model: Pick<VideoModelInfo, 'modes'>) {
  return model.modes.includes('video2video')
}

export function shouldUseVideoEditMode(models: VideoModelInfo[]) {
  return models.length > 0 && models.every(supportsVideoEditMode)
}

function getMediaCacheKey(media: Pick<IUploadedMedia, 'file'>) {
  return media.file ? `${media.file.name}${media.file.size}` : undefined
}

export function getMediaDuration(media: IUploadedMedia, durationMap: Map<string, number>) {
  if (media.id) {
    const idDuration = durationMap.get(media.id)
    if (idDuration !== undefined)
      return idDuration
  }
  const cacheKey = getMediaCacheKey(media)
  return cacheKey ? durationMap.get(cacheKey) : undefined
}

export function getMediaDurationKeys(media: IUploadedMedia) {
  return [media.id, getMediaCacheKey(media)].filter((key): key is string => Boolean(key))
}

function isPersistedMediaType(type: IUploadedMedia['type']): type is IPersistedMedia['type'] {
  return type === 'image' || type === 'video' || type === 'audio'
}

function getMediaFileNameFromUrl(url: string) {
  const pathname = url.split('?')[0] ?? ''
  const filename = pathname.split('/').filter(Boolean).pop() ?? ''
  if (!filename)
    return ''
  try {
    return decodeURIComponent(filename)
  }
  catch {
    return filename
  }
}

export function getMediaDisplayName(media: IUploadedMedia, fallback: string) {
  return media.name || media.file?.name || getMediaFileNameFromUrl(media.url) || fallback
}

export function toPersistedLocalMedia(media: IUploadedMedia): IPersistedMedia | null {
  if (!media.id || !media.url || media.progress !== undefined || !isPersistedMediaType(media.type))
    return null
  return {
    id: media.id,
    url: media.url,
    type: media.type,
    name: media.name,
    duration: undefined,
  }
}

export function buildAggregateImagePricing(models: ImageModelInfo[]) {
  const commonResolutions = getImageModelsCommonResolutions(models)
  return commonResolutions.map(resolution => ({
    resolution,
    pricePerImage:
      Math.ceil(
        models.reduce((sum, model) => {
          return (
            sum + (model.pricing.find(item => item.resolution === resolution)?.pricePerImage ?? 0)
          )
        }, 0) * 100,
      ) / 100,
  }))
}

/** youmind.com URL 语言路径映射：英语等无前缀，日语/韩语使用不同代码 */
export const PROMPTS_EXPLORE_LNG_MAP: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
}

const DEFAULT_PROMPTS_EXPLORE_SLUG = 'grok-imagine-prompts'
const SEEDANCE_PROMPTS_EXPLORE_SLUG = 'seedance-2-0-prompts'

export function getPromptsExploreSlugByCreditsScope(creditsScope?: VideoModelInfo['creditsScope']) {
  if (creditsScope === 'seedance')
    return SEEDANCE_PROMPTS_EXPLORE_SLUG
  return DEFAULT_PROMPTS_EXPLORE_SLUG
}
