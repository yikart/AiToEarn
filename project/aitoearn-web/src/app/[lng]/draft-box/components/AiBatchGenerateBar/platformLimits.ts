/**
 * platformLimits - 平台参数限制计算工具
 * 根据选中的平台组合，取各限制字段的最小值
 */

import type { PlatType } from '@/app/config/platConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'

/** 有效限制（null 表示所有选中平台都没有该限制） */
export interface EffectiveLimits {
  titleMax: number | null
  desMax: number | null
  topicMax: number | null
  imagesMax: number | null
}

/** 带来源信息的限制详情 */
export interface LimitDetail {
  value: number
  limitedBy: PlatType
}

/** 带来源的有效限制 */
export type EffectiveLimitsDetailed = Record<keyof EffectiveLimits, LimitDetail | null>

/**
 * 计算选中平台的有效参数限制（取最小值）
 * 无选中平台时返回全 null（无限制）
 */
export function calcEffectiveLimits(platforms: PlatType[]): EffectiveLimits {
  if (platforms.length === 0) {
    return { titleMax: null, desMax: null, topicMax: null, imagesMax: null }
  }

  const detailed = calcEffectiveLimitsDetailed(platforms)
  return {
    titleMax: detailed.titleMax?.value ?? null,
    desMax: detailed.desMax?.value ?? null,
    topicMax: detailed.topicMax?.value ?? null,
    imagesMax: detailed.imagesMax?.value ?? null,
  }
}

/**
 * 计算选中平台的有效参数限制（带来源平台信息）
 * 记录是哪个平台施加了最严限制
 */
export function calcEffectiveLimitsDetailed(platforms: PlatType[]): EffectiveLimitsDetailed {
  const result: EffectiveLimitsDetailed = {
    titleMax: null,
    desMax: null,
    topicMax: null,
    imagesMax: null,
  }

  if (platforms.length === 0)
    return result

  for (const plat of platforms) {
    const info = AccountPlatInfoMap.get(plat)
    if (!info)
      continue

    const config = info.commonPubParamsConfig

    if (config.titleMax !== undefined) {
      if (result.titleMax === null || config.titleMax < result.titleMax.value) {
        result.titleMax = { value: config.titleMax, limitedBy: plat }
      }
    }

    if (result.desMax === null || config.desMax < (result.desMax?.value ?? Infinity)) {
      result.desMax = { value: config.desMax, limitedBy: plat }
    }

    if (result.topicMax === null || config.topicMax < (result.topicMax?.value ?? Infinity)) {
      result.topicMax = { value: config.topicMax, limitedBy: plat }
    }

    if (config.imagesMax !== undefined) {
      if (result.imagesMax === null || config.imagesMax < result.imagesMax.value) {
        result.imagesMax = { value: config.imagesMax, limitedBy: plat }
      }
    }
  }

  return result
}
