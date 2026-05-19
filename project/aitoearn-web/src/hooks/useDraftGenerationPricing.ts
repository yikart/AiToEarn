/**
 * useDraftGenerationPricing - AI 草稿生成定价数据 Hook
 * 复用 ai/draft-generation/pricing 接口，提供模块级缓存与防重复请求
 */

import type { DraftGenerationPricingVo } from '@/api/types/draftGeneration'
import { useEffect, useState } from 'react'
import { apiGetDraftGenerationPricing } from '@/api/draftGeneration'

let cachedData: DraftGenerationPricingVo | null = null
let fetchPromise: Promise<DraftGenerationPricingVo | null> | null = null

async function fetchPricing(): Promise<DraftGenerationPricingVo | null> {
  if (cachedData)
    return cachedData
  if (fetchPromise)
    return fetchPromise

  fetchPromise = apiGetDraftGenerationPricing()
    .then((res) => {
      if (res?.data) {
        cachedData = res.data
        return cachedData
      }
      return null
    })
    .catch(() => null)
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

export function useDraftGenerationPricing() {
  const [pricingData, setPricingData] = useState<DraftGenerationPricingVo | null>(cachedData)
  const [isLoading, setIsLoading] = useState(!cachedData)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (cachedData) {
      setPricingData(cachedData)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchPricing().then((data) => {
      if (cancelled)
        return

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
