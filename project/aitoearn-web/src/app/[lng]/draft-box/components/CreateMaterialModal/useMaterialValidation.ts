/**
 * useMaterialValidation - 素材平台参数校验 hook
 * 根据选中平台计算参数限制并生成警告信息
 */

import type { FormParams } from './useCreateMaterialForm'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { isAspectRatioInRange } from '@/components/PublishDialog/PublishDialog.util'
import { calcEffectiveLimitsDetailed } from '../AiBatchGenerateBar/platformLimits'

export function useMaterialValidation(params: FormParams, selectedPlatforms: PlatType[]) {
  const { t } = useTranslation('brandPromotion')

  const effectiveLimits = useMemo(
    () => calcEffectiveLimitsDetailed(selectedPlatforms),
    [selectedPlatforms],
  )

  const warnings = useMemo(() => {
    const result: string[] = []
    if (selectedPlatforms.length === 0)
      return result

    // 标题超长
    if (params.title && effectiveLimits.titleMax) {
      if (params.title.length > effectiveLimits.titleMax.value) {
        const platName = AccountPlatInfoMap.get(effectiveLimits.titleMax.limitedBy)?.name ?? effectiveLimits.titleMax.limitedBy
        result.push(t('createMaterial.titleExceeded', { platform: platName, max: effectiveLimits.titleMax.value }))
      }
    }

    // 描述超长
    if (params.des && effectiveLimits.desMax) {
      if (params.des.length > effectiveLimits.desMax.value) {
        const platName = AccountPlatInfoMap.get(effectiveLimits.desMax.limitedBy)?.name ?? effectiveLimits.desMax.limitedBy
        result.push(t('createMaterial.descExceeded', { platform: platName, max: effectiveLimits.desMax.value }))
      }
    }

    // 图片数超限
    if (params.images.length > 0 && effectiveLimits.imagesMax) {
      if (params.images.length > effectiveLimits.imagesMax.value) {
        const platName = AccountPlatInfoMap.get(effectiveLimits.imagesMax.limitedBy)?.name ?? effectiveLimits.imagesMax.limitedBy
        result.push(t('createMaterial.imageExceeded', { platform: platName, max: effectiveLimits.imagesMax.value }))
      }
    }

    // Instagram 比例校验
    if (selectedPlatforms.includes(PlatType.Instagram)) {
      if (params.images.length > 0) {
        for (const img of params.images) {
          if (img.width && img.height && !isAspectRatioInRange(img.width, img.height, 4 / 5, 1.91)) {
            result.push(t('createMaterial.instagramImageAspectRatio'))
            break
          }
        }
      }
      if (params.video?.width && params.video?.height
        && !isAspectRatioInRange(params.video.width, params.video.height, 9 / 16, 4 / 5)) {
        result.push(t('createMaterial.instagramVideoAspectRatio'))
      }
    }

    // Facebook 比例校验
    if (selectedPlatforms.includes(PlatType.Facebook)) {
      if (params.images.length > 0) {
        for (const img of params.images) {
          if (img.width && img.height && !isAspectRatioInRange(img.width, img.height, 4 / 5, 1.91)) {
            result.push(t('createMaterial.facebookImageAspectRatio'))
            break
          }
        }
      }
      if (params.video?.width && params.video?.height
        && !isAspectRatioInRange(params.video.width, params.video.height, 9 / 16, 4 / 5)) {
        result.push(t('createMaterial.facebookVideoAspectRatio'))
      }
    }

    return result
  }, [params.title, params.des, params.images, params.video, effectiveLimits, selectedPlatforms, t])

  return { warnings, effectiveLimits }
}
