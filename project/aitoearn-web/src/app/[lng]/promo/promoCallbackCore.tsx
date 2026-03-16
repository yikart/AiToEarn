/**
 * PromoCallbackCore - OAuth 回调核心组件
 * 处理 TikTok/Instagram 授权后的重定向逻辑
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Card } from '@/components/ui/card'

interface PromoCallbackCoreProps {
  lng: string
}

export default function PromoCallbackCore({ lng }: PromoCallbackCoreProps) {
  const { t } = useTransClient('promo')
  const router = useRouter()
  const searchParams = useSearchParams()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current)
      return
    processedRef.current = true

    const accountId = searchParams.get('accountId')
    // 兼容 TikTok (promotionCode) 和 Instagram (materialGroupId) 两种回调参数
    const promotionCode = searchParams.get('promotionCode') || searchParams.get('materialGroupId')

    if (!promotionCode || !accountId) {
      router.replace(`/${lng}`)
      return
    }

    // 跳转到推广页面，带上 accountId
    const targetUrl = accountId
      ? `/${lng}/promo/${promotionCode}?accountId=${accountId}`
      : `/${lng}/promo/${promotionCode}`

    router.replace(targetUrl)
  }, [lng, router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-0 py-4 md:p-8">
      <div className="mx-auto max-w-2xl px-4 md:px-0">
        <Card className="p-0 shadow-lg border-primary/10">
          <div className="p-4 text-center md:p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary md:h-10 md:w-10" />
            </div>
            <h3 className="text-lg font-semibold md:text-xl">
              {t('callback.processing')}
            </h3>
          </div>
        </Card>
      </div>
    </div>
  )
}
