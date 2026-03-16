/**
 * PromoPageCore - 推广码发布页面核心组件
 * 推广者通过推广码（素材组ID）进入后选择平台发布内容
 */

'use client'

import type { OptimalMaterialVo } from '@/api/types/open/promotionCode'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGetOptimalMaterial } from '@/api/open/promotionCode'
import { apiDouyinPublishCreate } from '@/api/plat/douyin'
import { apiGetInstagramNoUserAuthUrl } from '@/api/plat/instagram'
import { apiPubCreate } from '@/api/plat/publish'
import { apiGetTikTokNoUserAuthUrl } from '@/api/plat/tiktok'
import { getUtcDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { generateUUID, parseTopicString } from '@/utils'
import { AiToEarnIntro } from './components/AiToEarnIntro'
import { PlatformSelectStep } from './components/PlatformSelectStep'
import { PublishResultStep } from './components/PublishResultStep'

interface PromoPageCoreProps {
  lng: string
  code: string
}

// 页面状态枚举
type PageStep
  = | 'loading' // 加载中
    | 'error' // 错误
    | 'platform_select' // 平台选择
    | 'publishing' // 发布中
    | 'redirecting' // 跳转中（倒计时）
    | 'platform_not_supported' // 平台不支持
    | 'result' // 发布结果

// 获取/保存选中平台的 key
const getSelectedPlatformKey = (code: string) => `promo_platform_${code}`

// 保存选中的平台（授权前保存，授权回调后使用）
// 使用 sessionStorage，仅在当前会话中有效
function saveSelectedPlatform(code: string, platform: PlatType) {
  try {
    sessionStorage.setItem(getSelectedPlatformKey(code), platform)
  }
  catch {
    // 忽略存储错误
  }
}

// 获取保存的平台
function getSavedPlatform(code: string): PlatType | null {
  try {
    const platform = sessionStorage.getItem(getSelectedPlatformKey(code))
    return platform as PlatType | null
  }
  catch {
    return null
  }
}

// 清除保存的平台
function clearSavedPlatform(code: string) {
  try {
    sessionStorage.removeItem(getSelectedPlatformKey(code))
  }
  catch {
    // 忽略错误
  }
}

// 根据 accountId 前缀推断平台类型
// accountId 格式: {platform}_{id}，如 tiktok_xxx, instagram_xxx, douyin_xxx
function inferPlatformFromAccountId(accountId: string): PlatType | null {
  // 按第一个下划线分割，取平台前缀
  const underscoreIndex = accountId.indexOf('_')
  if (underscoreIndex === -1)
    return null

  const platformPrefix = accountId.substring(0, underscoreIndex).toLowerCase()

  switch (platformPrefix) {
    case 'tiktok':
      return PlatType.Tiktok
    // case 'instagram': // 暂时隐藏 Instagram
    //   return PlatType.INSTAGRAM
    case 'douyin':
      return PlatType.Douyin
    default:
      return null
  }
}

export default function PromoPageCore({ lng, code }: PromoPageCoreProps) {
  const { t } = useTransClient('promo')
  const router = useRouter()
  const searchParams = useSearchParams()

  // 页面状态
  const [step, setStep] = useState<PageStep>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // 数据状态
  const [material, setMaterial] = useState<OptimalMaterialVo | null>(null)

  // 发布状态
  const [publishResult, setPublishResult] = useState<{
    success: boolean
    message?: string
    flowId?: string
  } | null>(null)

  // 跳转倒计时状态
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // TikTok 是否需要提交作品链接（TikTok 不需要）
  const [requireWorkLink, setRequireWorkLink] = useState(true)

  // 当前发布的平台类型
  const [currentPlatform, setCurrentPlatform] = useState<PlatType | null>(null)

  // 用户选择的平台（根据语言环境设置默认值：中文选抖音，其他选TikTok）
  const [selectedPlatform, setSelectedPlatform] = useState<PlatType | null>(
    lng.startsWith('zh') ? PlatType.Douyin : PlatType.Tiktok,
  )

  // 防止 OAuth 回调重复处理
  const oauthProcessedRef = useRef(false)

  // 抖音发布逻辑
  const handleDouyinPublish = useCallback(async (materialData: OptimalMaterialVo) => {
    setCurrentPlatform(PlatType.Douyin)
    setStep('publishing')

    try {
      const hasVideo = materialData?.mediaList?.some(m => m.type === 'video')
      const { topics, cleanedString } = parseTopicString(materialData?.desc || '')
      const topicsAll = [...new Set((materialData.topics ?? []).concat(topics))]

      const publishParams: {
        title?: string
        desc?: string
        materialGroupId?: string
        materialId?: string
        videoUrl?: string
        coverUrl?: string
        imgUrlList?: string[]
        topics: string[]
      } = {
        title: materialData?.title || '',
        desc: cleanedString,
        materialGroupId: code,
        materialId: materialData?._id,
        topics: topicsAll,
      }

      if (hasVideo) {
        const videoMedia = materialData?.mediaList?.find(m => m.type === 'video')
        publishParams.videoUrl = videoMedia?.url
        publishParams.coverUrl = materialData?.coverUrl
      }
      else if (materialData?.mediaList && materialData.mediaList.length > 0) {
        publishParams.imgUrlList = materialData.mediaList
          .filter(m => m.type === 'img')
          .map(m => m.url)
        publishParams.coverUrl = materialData.coverUrl || publishParams.imgUrlList[0]
      }

      const res = await apiDouyinPublishCreate(publishParams)

      if (res?.code === 0) {
        if (res.data) {
          window.location.href = res.data
        }

        setPublishResult({
          success: true,
          message: t('publish.success'),
        })
        setStep('result')
      }
      else {
        setPublishResult({
          success: false,
          message: res?.message || t('publish.failed'),
        })
        setStep('result')
      }
    }
    catch (error) {
      console.error('Publish failed:', error)
      setPublishResult({
        success: false,
        message: t('publish.failed'),
      })
      setStep('result')
    }
  }, [code, t])

  // TikTok 授权流程
  const startTikTokAuth = useCallback(async () => {
    setCurrentPlatform(PlatType.Tiktok)
    setStep('publishing')
    try {
      const res = await apiGetTikTokNoUserAuthUrl({
        promotionCode: code,
      })

      if (res?.code === 0 && res.data?.url) {
        setRedirectUrl(res.data.url)
        setRedirectCountdown(2)
        setStep('redirecting')
      }
      else {
        setPublishResult({
          success: false,
          message: res?.message || t('publish.authFailed'),
        })
        setStep('result')
      }
    }
    catch (error) {
      console.error('TikTok auth failed:', error)
      setPublishResult({
        success: false,
        message: t('publish.authFailed'),
      })
      setStep('result')
    }
  }, [code, t])

  // Instagram 授权流程
  const startInstagramAuth = useCallback(async () => {
    setCurrentPlatform(PlatType.Instagram)
    setStep('publishing')
    try {
      const res = await apiGetInstagramNoUserAuthUrl({
        materialGroupId: code,
      })

      if (res?.code === 0 && res.data?.url) {
        setRedirectUrl(res.data.url)
        setRedirectCountdown(2)
        setStep('redirecting')
      }
      else {
        setPublishResult({
          success: false,
          message: res?.message || t('publish.authFailed'),
        })
        setStep('result')
      }
    }
    catch (error) {
      console.error('Instagram auth failed:', error)
      setPublishResult({
        success: false,
        message: t('publish.authFailed'),
      })
      setStep('result')
    }
  }, [code, t])

  // TikTok 发布（直接发布，已有 accountId）
  const doTikTokPublish = useCallback(async (materialData: OptimalMaterialVo) => {
    const accountId = searchParams.get('accountId')
    if (!accountId)
      return

    setCurrentPlatform(PlatType.Tiktok)
    setStep('publishing')
    setRequireWorkLink(false)

    try {
      const hasVideo = materialData?.mediaList?.some(m => m.type === 'video')
      const title = materialData?.title || ''
      const { topics, cleanedString } = parseTopicString(materialData?.desc || '')
      const topicsAll = [...new Set((materialData.topics ?? []).concat(topics))]

      const publishType = hasVideo ? PubType.VIDEO : PubType.ImageText
      const videoMedia = hasVideo ? materialData?.mediaList?.find(m => m.type === 'video') : null
      const photoImages = !hasVideo
        ? materialData?.mediaList?.filter(m => m.type === 'img').map(m => m.url) || []
        : undefined

      const publishTime = getUtcDays(new Date()).format()
      const res = await apiPubCreate({
        accountId,
        flowId: generateUUID(),
        accountType: PlatType.Tiktok,
        type: publishType,
        title,
        desc: cleanedString,
        materialGroupId: code,
        materialId: materialData?._id,
        videoUrl: hasVideo ? videoMedia?.url : undefined,
        imgUrlList: !hasVideo ? photoImages : undefined,
        coverUrl: materialData?.coverUrl,
        publishTime,
        topics: topicsAll,
        option: materialData?.option?.tiktok || {
          tiktok: {
            privacy_level: 'PUBLIC_TO_EVERYONE',
            comment_disabled: false,
            duet_disabled: false,
            stitch_disabled: false,
            brand_organic_toggle: false,
            brand_content_toggle: false,
            brand_disclosure_enabled: false,
          },
        },
      })

      if (res?.code === 0) {
        clearSavedPlatform(code) // 发布成功后清除保存的平台
        setPublishResult({
          success: true,
          message: t('publish.success'),
        })
        setStep('result')
      }
      else {
        setPublishResult({
          success: false,
          message: res?.message || t('publish.failed'),
        })
        setStep('result')
      }
    }
    catch (error) {
      console.error('TikTok publish failed:', error)
      setPublishResult({
        success: false,
        message: t('publish.failed'),
      })
      setStep('result')
    }
  }, [code, searchParams, t])

  // Instagram 发布（直接发布，已有 accountId）
  const doInstagramPublish = useCallback(async (materialData: OptimalMaterialVo) => {
    const accountId = searchParams.get('accountId')
    if (!accountId)
      return

    setCurrentPlatform(PlatType.Instagram)
    setStep('publishing')
    setRequireWorkLink(false)

    try {
      const hasVideo = materialData?.mediaList?.some(m => m.type === 'video')
      const title = materialData?.title || ''
      const { topics, cleanedString } = parseTopicString(materialData?.desc || '')
      const topicsAll = [...new Set((materialData.topics ?? []).concat(topics))]

      const publishType = hasVideo ? PubType.VIDEO : PubType.ImageText
      const videoMedia = hasVideo ? materialData?.mediaList?.find(m => m.type === 'video') : null
      const photoImages = !hasVideo
        ? materialData?.mediaList?.filter(m => m.type === 'img').map(m => m.url) || []
        : undefined

      const publishTime = getUtcDays(new Date()).format()
      const res = await apiPubCreate({
        accountId,
        flowId: generateUUID(),
        accountType: PlatType.Instagram,
        type: publishType,
        title,
        desc: cleanedString,
        materialGroupId: code,
        materialId: materialData?._id,
        videoUrl: hasVideo ? videoMedia?.url : undefined,
        imgUrlList: !hasVideo ? photoImages : undefined,
        coverUrl: materialData?.coverUrl,
        publishTime,
        topics: topicsAll,
        option: materialData?.option?.instagram || {
          instagram: {
            content_category: publishType === PubType.VIDEO ? 'reel' : 'post',
          },
        },
      })

      if (res?.code === 0) {
        clearSavedPlatform(code) // 发布成功后清除保存的平台
        setPublishResult({
          success: true,
          message: t('publish.success'),
        })
        setStep('result')
      }
      else {
        setPublishResult({
          success: false,
          message: res?.message || t('publish.failed'),
        })
        setStep('result')
      }
    }
    catch (error) {
      console.error('Instagram publish failed:', error)
      setPublishResult({
        success: false,
        message: t('publish.failed'),
      })
      setStep('result')
    }
  }, [code, searchParams, t])

  // 获取素材信息（公开接口，无需登录）
  const fetchMaterial = useCallback(async (accountType: PlatType) => {
    try {
      setStep('loading')

      const res = await apiGetOptimalMaterial(code, accountType)

      if (res?.code === 0 && res.data) {
        const materialData = res.data
        setMaterial(materialData)
        return materialData
      }
      else if (res?.code === 0 && !res.data) {
        setErrorMessage(t('error.noDraft'))
        setStep('error')
      }
      else {
        setErrorMessage(t('error.invalidCode'))
        setStep('error')
      }
    }
    catch (error) {
      console.error('Failed to fetch material:', error)
      setErrorMessage(t('error.taskNotFound'))
      setStep('error')
    }
    return null
  }, [code, t])

  // OAuth 回调处理（有 accountId 参数时自动获取素材并发布）
  const handleOAuthCallback = useCallback(async () => {
    const accountId = searchParams.get('accountId')
    if (!accountId || oauthProcessedRef.current)
      return false

    // 优先从 accountId 前缀推断平台类型（解决跨标签页 sessionStorage 不共享的问题）
    // fallback 到 sessionStorage 中保存的平台
    const inferredPlatform = inferPlatformFromAccountId(accountId)
    const platform = inferredPlatform || getSavedPlatform(code)

    if (!platform)
      return false

    // 标记为已处理，防止 React Strict Mode 或依赖变化导致的重复执行
    oauthProcessedRef.current = true
    setSelectedPlatform(platform)
    setCurrentPlatform(platform)

    // 先获取素材
    const materialData = await fetchMaterial(platform)
    if (!materialData)
      return true // 已处理但素材获取失败，fetchMaterial 内部已设置错误状态

    // 直接发布
    if (platform === PlatType.Tiktok) {
      await doTikTokPublish(materialData)
    }
    // 暂时隐藏 Instagram
    // else if (platform === PlatType.INSTAGRAM) {
    //   await doInstagramPublish(materialData)
    // }
    return true
  }, [searchParams, code, fetchMaterial, doTikTokPublish, doInstagramPublish])

  // 重新发布（返回平台选择）
  const handleRetry = useCallback(() => {
    setPublishResult(null)
    setSelectedPlatform(null)
    setStep('platform_select')
  }, [])

  // 平台选择处理
  const handlePlatformSelect = useCallback((platform: PlatType) => {
    setSelectedPlatform(platform)
  }, [])

  // 确认平台选择并开始发布
  const handleConfirmPlatform = useCallback(async () => {
    if (!selectedPlatform)
      return

    const accountId = searchParams.get('accountId')
    // 暂时隐藏 Instagram: 原为 selectedPlatform === PlatType.TIKTOK || selectedPlatform === PlatType.INSTAGRAM
    const needsOAuth = selectedPlatform === PlatType.Tiktok

    if (needsOAuth && !accountId) {
      // 保存选中的平台到 localStorage，授权回调后使用
      saveSelectedPlatform(code, selectedPlatform)

      if (selectedPlatform === PlatType.Tiktok) {
        await startTikTokAuth()
      }
      // 暂时隐藏 Instagram
      // else if (selectedPlatform === PlatType.INSTAGRAM) {
      //   await startInstagramAuth()
      // }
      return
    }

    // 先获取素材
    const materialData = await fetchMaterial(selectedPlatform)
    if (!materialData)
      return

    // 抖音直接发布
    if (selectedPlatform === PlatType.Douyin) {
      await handleDouyinPublish(materialData)
    }
    else {
      // 其他平台暂不支持
      setStep('platform_not_supported')
    }
  }, [selectedPlatform, searchParams, code, startTikTokAuth, startInstagramAuth, fetchMaterial, handleDouyinPublish])

  // 初始化
  useEffect(() => {
    const accountId = searchParams.get('accountId')
    if (accountId) {
      // OAuth 回调：获取素材并自动发布
      handleOAuthCallback()
    }
    else {
      // 正常流程：直接展示平台选择
      setStep('platform_select')
    }
  }, [searchParams, handleOAuthCallback])

  // 跳转倒计时逻辑
  useEffect(() => {
    if (redirectCountdown === null)
      return

    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (redirectCountdown === 0 && redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [redirectCountdown, redirectUrl])

  // 加载状态
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-0 py-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-4 px-4 md:px-0">
          <Card className="p-0 shadow-lg">
            <div className="p-4 md:p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
            <div className="space-y-4 px-4 pb-4 md:px-6 md:pb-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // 错误状态
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 px-0 py-4 md:p-8">
        <div className="mx-auto max-w-2xl px-4 md:px-0">
          <Card className="p-0 shadow-lg border-destructive/10">
            <div className="p-6 text-center md:p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 md:h-20 md:w-20">
                <AlertCircle className="h-8 w-8 text-destructive md:h-10 md:w-10" />
              </div>
              <h3 className="text-lg font-semibold md:text-xl">
                {t('error.title')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button
                onClick={() => {
                  const accountId = searchParams.get('accountId')
                  if (accountId) {
                    oauthProcessedRef.current = false
                    handleOAuthCallback()
                  }
                  else {
                    setStep('platform_select')
                  }
                }}
                className="mt-6 cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('error.retry')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // 获取发布中状态的文案
  const getPublishingText = () => {
    switch (currentPlatform) {
      case PlatType.Douyin:
        return {
          title: t('autoPublish.publishingDouyin'),
          desc: t('autoPublish.douyinPublishingDesc'),
        }
      case PlatType.Instagram:
        return {
          title: t('autoPublish.publishingInstagram'),
          desc: t('autoPublish.instagramPublishingDesc'),
        }
      default:
        return {
          title: t('autoPublish.publishingTikTok'),
          desc: t('autoPublish.tiktokPublishingDesc'),
        }
    }
  }

  // 获取跳转授权的文案
  const getRedirectingText = () => {
    switch (currentPlatform) {
      case PlatType.Instagram:
        return t('autoPublish.redirectingToInstagram')
      default:
        return t('autoPublish.redirectingToTikTok')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-0 py-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4 px-4 md:space-y-6 md:px-0">
        {/* 平台选择 */}
        {step === 'platform_select' && (
          <PlatformSelectStep
            selectedPlatform={selectedPlatform}
            onSelect={handlePlatformSelect}
            onConfirm={handleConfirmPlatform}
          />
        )}

        {/* 发布中状态 */}
        {step === 'publishing' && (
          <Card className="p-0 shadow-lg border-primary/10">
            <div className="p-4 text-center md:p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary md:h-10 md:w-10" />
              </div>
              <h3 className="text-lg font-semibold md:text-xl">
                {getPublishingText().title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {getPublishingText().desc}
              </p>
            </div>
          </Card>
        )}

        {/* 跳转授权倒计时 */}
        {step === 'redirecting' && (
          <Card className="p-0 shadow-lg border-primary/10">
            <div className="p-4 text-center md:p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary md:h-10 md:w-10" />
              </div>
              <h3 className="text-lg font-semibold md:text-xl">
                {getRedirectingText()}
              </h3>
              <p className="mt-2 text-3xl font-bold text-primary">
                {redirectCountdown}
                s
              </p>
            </div>
          </Card>
        )}

        {/* 平台不支持状态 */}
        {step === 'platform_not_supported' && (
          <Card className="p-0 shadow-lg border-destructive/10">
            <div className="p-4 text-center md:p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 md:h-20 md:w-20">
                <AlertCircle className="h-8 w-8 text-destructive md:h-10 md:w-10" />
              </div>
              <h3 className="text-lg font-semibold md:text-xl">
                {t('autoPublish.platformNotSupported')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('autoPublish.platformNotSupportedDesc')}
              </p>
            </div>
          </Card>
        )}

        {/* 发布结果 */}
        {step === 'result' && publishResult && (
          <PublishResultStep
            result={publishResult}
            materialGroupId={code}
            materialId={material?._id}
            accountType={currentPlatform || selectedPlatform || undefined}
            videoUrl={material?.mediaList?.find(m => m.type === 'video')?.url}
            coverUrl={material?.coverUrl}
            imgUrlList={material?.mediaList?.filter(m => m.type === 'img').map(m => m.url)}
            title={material?.title}
            desc={material?.desc}
            topics={material?.topics}
            requireWorkLink={requireWorkLink}
            onRetry={handleRetry}
            onGoHome={() => router.push(`/${lng}`)}
          />
        )}

        {/* 平台介绍 - 仅在发布后显示 */}
        {step === 'result' && <AiToEarnIntro />}
      </div>
    </div>
  )
}
