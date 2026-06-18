/**
 * useDraftGenerationPricing - AI 草稿生成定价数据 Hook
 * 复用 ai/draft-generation/pricing 接口，提供模块级缓存与防重复请求
 */

import type { DraftGenerationPricingVo } from '@/api/ai/ai.types'
import { useEffect, useState } from 'react'
import { apiGetDraftGenerationPricing } from '@/api/ai/ai.api'

interface DraftGenerationPricingCache {
  data: DraftGenerationPricingVo | null
  promise: Promise<DraftGenerationPricingVo | null> | null
}

const globalPricingCache = globalThis as typeof globalThis & {
  __draftGenerationPricingCache?: DraftGenerationPricingCache
}

function getPricingCache() {
  if (!globalPricingCache.__draftGenerationPricingCache) {
    globalPricingCache.__draftGenerationPricingCache = {
      data: null,
      promise: null,
    }
  }

  return globalPricingCache.__draftGenerationPricingCache
}

async function fetchPricing(): Promise<DraftGenerationPricingVo | null> {
  const cache = getPricingCache()
  if (cache.data) {
    return cache.data
  }
  if (cache.promise) {
    return cache.promise
  }

  cache.promise = apiGetDraftGenerationPricing()
    .then((res) => {
      if (res?.data) {
        cache.data = res.data
        return cache.data
      }
      return null
    })
    .catch(() => {
      return null
    })
    .finally(() => {
      cache.promise = null
    })

  return cache.promise
}

export function useDraftGenerationPricing() {
  const [pricingData, setPricingData] = useState<DraftGenerationPricingVo | null>(() => getPricingCache().data)
  const [isLoading, setIsLoading] = useState(() => !getPricingCache().data)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cache = getPricingCache()
    if (cache.data) {
      setPricingData(cache.data)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchPricing().then((data) => {
      if (cancelled) {
        return
      }

      if (data) {
        setPricingData(data)
      }
      else {
        setError(true)
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { pricingData, isLoading, error }
}
