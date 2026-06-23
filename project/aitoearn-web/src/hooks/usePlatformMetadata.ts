'use client'

import type { PlatType } from '@/app/config/platConfig'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useGetClientLng } from '@/hooks/useSystem'
import { usePlatformMetadataStore } from '@/store/platformMetadata'
import {
  getChannelPlatformInfos,
  getEnabledPlatformInfos,
  getPublishPlatformInfos,
  getTaskPlatformInfos,
  platformInfoListToTuples,
} from '@/store/platformMetadata/utils'

export function usePlatformMetadata() {
  const lng = useGetClientLng()
  const { list, map, status, ensureLoaded } = usePlatformMetadataStore(
    useShallow(state => ({
      list: state.list,
      map: state.map,
      status: state.status,
      ensureLoaded: state.ensureLoaded,
    })),
  )

  useEffect(() => {
    ensureLoaded(lng)
  }, [ensureLoaded, lng])

  return {
    list,
    map,
    status,
    ready: status === 'success',
  }
}

export function usePlatformMetadataReady() {
  const status = usePlatformMetadataStore(state => state.status)
  const lng = useGetClientLng()
  const ensureLoaded = usePlatformMetadataStore(state => state.ensureLoaded)

  useEffect(() => {
    ensureLoaded(lng)
  }, [ensureLoaded, lng])

  return status === 'success'
}

export function usePlatformInfo(platType?: PlatType | null) {
  const map = usePlatformMetadataStore(state => state.map)
  const lng = useGetClientLng()
  const ensureLoaded = usePlatformMetadataStore(state => state.ensureLoaded)

  useEffect(() => {
    ensureLoaded(lng)
  }, [ensureLoaded, lng])

  return platType ? map.get(platType) : undefined
}

export function usePlatformInfoMap() {
  usePlatformMetadata()
  return usePlatformMetadataStore(state => state.map)
}

export function usePlatformInfoList(scene: 'all' | 'enabled' | 'publish' | 'task' = 'all') {
  const { list } = usePlatformMetadata()

  if (scene === 'enabled')
    return getEnabledPlatformInfos(list)
  if (scene === 'publish')
    return getPublishPlatformInfos(list)
  if (scene === 'task')
    return getTaskPlatformInfos(list)
  return list
}

export function useRegionSortedPlatforms() {
  const { list } = usePlatformMetadata()
  return platformInfoListToTuples(getChannelPlatformInfos(list))
}

export function useTaskPlatforms() {
  return platformInfoListToTuples(usePlatformInfoList('task'))
}

export function useFreshTaskPlatforms() {
  const lng = useGetClientLng()
  const { list, loadedLng, status, ensureLoaded } = usePlatformMetadataStore(
    useShallow(state => ({
      list: state.list,
      loadedLng: state.loadedLng,
      status: state.status,
      ensureLoaded: state.ensureLoaded,
    })),
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled)
        setReady(true)
    }, 3000)

    if (loadedLng !== lng && list.length === 0)
      setReady(false)
    else
      setReady(true)

    ensureLoaded(lng, { force: true }).then(() => {
      if (!cancelled)
        setReady(true)
    }).finally(() => {
      clearTimeout(timeout)
    })
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [ensureLoaded, list.length, loadedLng, lng])

  return {
    platforms: platformInfoListToTuples(getTaskPlatformInfos(list)),
    ready: ready || list.length > 0 || status === 'error',
  }
}

export function usePlatformName(platType?: PlatType | null, fallback?: string) {
  const platformInfo = usePlatformInfo(platType)
  return platformInfo?.name ?? fallback ?? platType ?? ''
}
