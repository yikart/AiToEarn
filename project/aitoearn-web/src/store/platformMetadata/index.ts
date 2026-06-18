import type { PlatformInfo, PlatformMetadataVo } from '@/api/channels/channel.types'
import type { PlatType } from '@/app/config/platConfig'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getChannelPlatformsApi } from '@/api/channels/channel.api'
import {
  getChannelPlatformInfos,
  getEnabledPlatformInfos,
  getPublishPlatformInfos,
  getTaskPlatformInfos,
  isPlatCollectSupported,
  isPlatformAvailable,
  isPlatformComingSoon,
  isPlatViewSupported,
  isTaskPlatformSupported,
  normalizePlatformMetadataList,
} from '@/store/platformMetadata/utils'

type PlatformMetadataStatus = 'idle' | 'loading' | 'success' | 'error'

interface PlatformMetadataState {
  rawList: PlatformMetadataVo[]
  list: PlatformInfo[]
  map: Map<PlatType, PlatformInfo>
  status: PlatformMetadataStatus
  loadedLng?: string
  errorMessage?: string
}

const initialState: PlatformMetadataState = {
  rawList: [],
  list: [],
  map: new Map(),
  status: 'idle',
  loadedLng: undefined,
  errorMessage: undefined,
}

let latestRequestedLng: string | undefined
let latestFetchVersion = 0

async function fetchPlatformMetadata(options?: { fresh?: boolean }) {
  try {
    const res = await getChannelPlatformsApi(options)
    if (Number(res?.code) !== 0 || !res?.data) {
      return {
        rawList: undefined,
        errorMessage: res?.message,
      }
    }
    return {
      rawList: res.data,
      errorMessage: undefined,
    }
  }
  catch (error: unknown) {
    return {
      rawList: undefined,
      errorMessage: error instanceof Error ? error.message : undefined,
    }
  }
}

let pendingRequest: Promise<Awaited<ReturnType<typeof fetchPlatformMetadata>>> | null = null

function createPlatformMetadataRequest(options?: { fresh?: boolean }) {
  const version = ++latestFetchVersion
  const request = fetchPlatformMetadata(options).finally(() => {
    if (pendingRequest === request)
      pendingRequest = null
  })
  pendingRequest = request

  return { request, version }
}

function createPlatformMetadataState(rawList: PlatformMetadataVo[], lng: string): PlatformMetadataState {
  const { list, map } = normalizePlatformMetadataList(rawList, lng)

  if (typeof window !== 'undefined') {
    console.info('[PlatformMetadata] initialized', {
      lng,
      rawList,
      list,
    })
  }

  return {
    rawList,
    list,
    map,
    status: 'success',
    loadedLng: lng,
    errorMessage: undefined,
  }
}

export const usePlatformMetadataStore = create(
  combine(initialState, (set, get) => ({
    setPlatformMetadata(rawList: PlatformMetadataVo[], lng: string) {
      latestRequestedLng = lng
      set(createPlatformMetadataState(rawList, lng))
    },

    async ensureLoaded(lng: string, options?: { force?: boolean }) {
      latestRequestedLng = lng
      const force = options?.force === true
      const state = get()
      if (!force && state.status === 'success' && state.loadedLng === lng)
        return true
      if (!force && state.rawList.length > 0) {
        set(createPlatformMetadataState(state.rawList, lng))
        return true
      }

      let request = pendingRequest
      let version = latestFetchVersion

      if (force) {
        ;({ request, version } = createPlatformMetadataRequest({ fresh: true }))
      }
      else if (!request) {
        set({ status: 'loading', errorMessage: undefined })
        ;({ request, version } = createPlatformMetadataRequest())
      }

      const { rawList, errorMessage } = await request!
      if (!rawList) {
        if (version === latestFetchVersion) {
          set({
            status: 'error',
            errorMessage,
          })
        }
        return false
      }

      if (version !== latestFetchVersion || latestRequestedLng !== lng)
        return false

      set(createPlatformMetadataState(rawList, lng))

      return true
    },
  })),
)

export function getPlatformInfoSync(platType?: PlatType | null) {
  if (!platType)
    return undefined
  return usePlatformMetadataStore.getState().map.get(platType)
}

export function getPlatformInfoMapSync() {
  return usePlatformMetadataStore.getState().map
}

export function getPlatformInfoListSync() {
  return usePlatformMetadataStore.getState().list
}

export function getEnabledPlatformInfosSync() {
  return getEnabledPlatformInfos(usePlatformMetadataStore.getState().list)
}

export function getChannelPlatformInfosSync() {
  return getChannelPlatformInfos(usePlatformMetadataStore.getState().list)
}

export function getPublishPlatformInfosSync() {
  return getPublishPlatformInfos(usePlatformMetadataStore.getState().list)
}

export function getTaskPlatformInfosSync() {
  return getTaskPlatformInfos(usePlatformMetadataStore.getState().list)
}

export function isPlatformMetadataReadySync() {
  return usePlatformMetadataStore.getState().status === 'success'
}

export function isPlatformEnabledSync(platType?: PlatType | null) {
  const platformInfo = getPlatformInfoSync(platType)
  return isPlatformAvailable(platformInfo)
}

export function isPlatformDisabledSync(platType?: PlatType | null) {
  const platformInfo = getPlatformInfoSync(platType)
  return isPlatformComingSoon(platformInfo)
}

export {
  isPlatCollectSupported,
  isPlatViewSupported,
  isTaskPlatformSupported,
}
