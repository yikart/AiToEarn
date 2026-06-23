import type { PlatformInfo, PlatformMetadataVo } from '@/api/channels/channel.types'
import type { PlatType } from '@/app/config/platConfig'
import { cache } from 'react'
import { serverFetch } from '@/api/_server/server-fetch'
import {
  getEnabledPlatformInfos,
  getPublishPlatformInfos,
  getTaskPlatformInfos,
  normalizePlatformMetadataList,
  platformInfoListToTuples,
} from '@/store/platformMetadata/utils'

const PLATFORM_METADATA_REVALIDATE_SECONDS = 300

export const getPlatformMetadataInitialData = cache(async () => {
  const res = await serverFetch<PlatformMetadataVo[]>(
    'v2/channels/platforms',
    undefined,
    {
      revalidate: PLATFORM_METADATA_REVALIDATE_SECONDS,
      tags: ['platform-metadata'],
    },
  )

  if (Number(res?.code) !== 0 || !res?.data)
    return undefined

  return res.data
})

export const getPlatformMetadataSSR = cache(async (lng: string) => {
  const rawList = await getPlatformMetadataInitialData() ?? []
  return normalizePlatformMetadataList(rawList, lng)
})

export async function getPlatformInfoMapSSR(lng: string) {
  const { map } = await getPlatformMetadataSSR(lng)
  return map
}

export async function getPlatformInfoSSR(lng: string, platType?: PlatType | null) {
  if (!platType)
    return undefined
  const map = await getPlatformInfoMapSSR(lng)
  return map.get(platType)
}

export async function getEnabledPlatformsSSR(lng: string) {
  const { list } = await getPlatformMetadataSSR(lng)
  return platformInfoListToTuples(getEnabledPlatformInfos(list))
}

export async function getPublishPlatformsSSR(lng: string) {
  const { list } = await getPlatformMetadataSSR(lng)
  return platformInfoListToTuples(getPublishPlatformInfos(list))
}

export async function getTaskPlatformsSSR(lng: string) {
  const { list } = await getPlatformMetadataSSR(lng)
  return platformInfoListToTuples(getTaskPlatformInfos(list))
}

export function getPlatformNameFromMap(map: Map<PlatType, PlatformInfo>, platType?: PlatType | null, fallback = '') {
  if (!platType)
    return fallback
  return map.get(platType)?.name ?? (fallback || platType)
}
