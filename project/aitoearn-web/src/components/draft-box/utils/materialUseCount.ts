import type { PromotionMaterial } from '@/api/materials/material.types'
import type { PlatType } from '@/app/config/platConfig'
import { getPlatformInfoSync } from '@/store/platformMetadata'

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

export const UNLIMITED_PLATFORM_MAX_USE_COUNT = 999999

function getMaterialUseCountPlatforms(material: PromotionMaterial): PlatType[] {
  const platformSet = new Set<PlatType>()

  material.accountTypes?.forEach(type => platformSet.add(type as PlatType))
  Object.keys(material.useCountByAccountType ?? {}).forEach(type => platformSet.add(type as PlatType))
  Object.keys(material.maxUseCountByAccountType ?? {}).forEach(type => platformSet.add(type as PlatType))

  return [...platformSet]
}

export function getMaterialUseCountLabels(
  material: PromotionMaterial,
  t: TranslateFn,
  options?: { showZeroTotal?: boolean },
) {
  const useCountByAccountType = material.useCountByAccountType ?? {}
  const maxUseCountByAccountType = material.maxUseCountByAccountType ?? {}
  const hasAccountTypeUseCount = Object.keys(useCountByAccountType).length > 0
  const hasAccountTypeMaxUseCount = Object.keys(maxUseCountByAccountType).length > 0

  if (!hasAccountTypeUseCount && !hasAccountTypeMaxUseCount) {
    if (material.useCount != null && (options?.showZeroTotal || material.useCount > 0))
      return [t('material.useCount', { count: material.useCount })]

    return []
  }

  return getMaterialUseCountPlatforms(material)
    .map((platform) => {
      const platformName = getPlatformInfoSync(platform)?.name ?? platform
      const usedCount = useCountByAccountType[platform] ?? 0
      const maxUseCount = maxUseCountByAccountType[platform]

      if (maxUseCount === UNLIMITED_PLATFORM_MAX_USE_COUNT) {
        return usedCount > 0
          ? t('material.platformUseCount', {
              platform: platformName,
              count: usedCount,
            })
          : null
      }

      if (typeof maxUseCount === 'number' && maxUseCount > 0) {
        return t('material.platformUseLimit', {
          platform: platformName,
          used: usedCount,
          max: maxUseCount,
        })
      }

      if (usedCount > 0) {
        return t('material.platformUseCount', {
          platform: platformName,
          count: usedCount,
        })
      }

      return null
    })
    .filter((label): label is string => !!label)
}
