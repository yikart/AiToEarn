/**
 * useMaterialValidation - 素材平台参数校验 hook
 * 根据选中平台计算参数限制并生成警告信息
 */

import type { FormParams } from './useCreateMaterialForm'
import { useMemo } from 'react'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { isAspectRatioInRange } from '@/components/PublishDialog/PublishDialog.util'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { calcEffectiveLimitsDetailed } from '../AiBatchGenerateBar/utils/platformLimits'

type MaterialValidationT = (key: string, options?: Record<string, number | string>) => string

export interface MaterialValidationIssue {
  platform: PlatType
  platformName: string
  messages: string[]
}

function pushPlatformIssue(
  issues: MaterialValidationIssue[],
  platform: PlatType,
  platformName: string,
  message: string,
) {
  const issue = issues.find(item => item.platform === platform)

  if (issue) {
    if (!issue.messages.includes(message))
      issue.messages.push(message)
    return
  }

  issues.push({
    platform,
    platformName,
    messages: [message],
  })
}

function getUploadedImages(params: FormParams) {
  return params.images.filter(img => img.ossUrl)
}

function hasInvalidImageAspectRatio(params: FormParams) {
  return getUploadedImages(params).some(img => img.width && img.height && !isAspectRatioInRange(img.width, img.height, 4 / 5, 1.91))
}

function hasInvalidVideoAspectRatio(params: FormParams) {
  return !!(params.video?.width && params.video?.height
    && !isAspectRatioInRange(params.video.width, params.video.height, 9 / 16, 4 / 5))
}

export function getMaterialValidationIssues(
  params: FormParams,
  selectedPlatforms: PlatType[],
  t: MaterialValidationT,
) {
  const issues: MaterialValidationIssue[] = []

  if (selectedPlatforms.length === 0)
    return issues

  const uploadedImages = getUploadedImages(params)
  const hasImages = uploadedImages.length > 0
  const hasVideo = !!params.video?.ossUrl

  for (const platform of selectedPlatforms) {
    const platformInfo = getPlatformInfoSync(platform)
    if (!platformInfo)
      continue

    const platformName = platformInfo.name
    const limits = platformInfo.commonPubParamsConfig

    if (params.title && typeof limits.titleMax === 'number' && limits.titleMax > 0 && params.title.length > limits.titleMax) {
      pushPlatformIssue(
        issues,
        platform,
        platformName,
        t('createMaterial.titleExceeded', { platform: platformName, max: limits.titleMax }),
      )
    }

    if (params.des && typeof limits.desMax === 'number' && limits.desMax > 0 && params.des.length > limits.desMax) {
      pushPlatformIssue(
        issues,
        platform,
        platformName,
        t('createMaterial.descExceeded', { platform: platformName, max: limits.desMax }),
      )
    }

    if (hasImages) {
      const imagesMax = limits.imagesMax
      if (!platformInfo.pubTypes.has(PubType.ImageText) || imagesMax === 0) {
        pushPlatformIssue(
          issues,
          platform,
          platformName,
          t('createMaterial.imageUnsupported', { platform: platformName }),
        )
      }
      else if (typeof imagesMax === 'number' && imagesMax > 0 && uploadedImages.length > imagesMax) {
        pushPlatformIssue(
          issues,
          platform,
          platformName,
          t('createMaterial.imageExceeded', { platform: platformName, max: imagesMax }),
        )
      }
    }

    if (hasVideo && !platformInfo.pubTypes.has(PubType.VIDEO)) {
      pushPlatformIssue(
        issues,
        platform,
        platformName,
        t('createMaterial.videoUnsupported', { platform: platformName }),
      )
    }

    if (platform === PlatType.Instagram) {
      if (hasImages && hasInvalidImageAspectRatio(params)) {
        pushPlatformIssue(issues, platform, platformName, t('createMaterial.instagramImageAspectRatio'))
      }
      if (hasVideo && hasInvalidVideoAspectRatio(params)) {
        pushPlatformIssue(issues, platform, platformName, t('createMaterial.instagramVideoAspectRatio'))
      }
    }

    if (platform === PlatType.Facebook) {
      if (hasImages && hasInvalidImageAspectRatio(params)) {
        pushPlatformIssue(issues, platform, platformName, t('createMaterial.facebookImageAspectRatio'))
      }
      if (hasVideo && hasInvalidVideoAspectRatio(params)) {
        pushPlatformIssue(issues, platform, platformName, t('createMaterial.facebookVideoAspectRatio'))
      }
    }
  }

  return issues
}

export function useMaterialValidation(selectedPlatforms: PlatType[]) {
  const effectiveLimits = useMemo(
    () => calcEffectiveLimitsDetailed(selectedPlatforms),
    [selectedPlatforms],
  )

  return { effectiveLimits }
}
