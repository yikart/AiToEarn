/**
 * PublishResultStep - 发布结果步骤组件
 * 显示发布成功或失败的结果，并提供作品链接提交功能
 */

'use client'

import { CheckCircle2, CircleAlert, HelpCircle, Home, Link2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { apiCreateOpenPublishRecord } from '@/api/open/promotionCode'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'

import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import guideImage1 from '../assets/1.png'
import guideImage2 from '../assets/2.png'
import guideImage3 from '../assets/3.png'
import guideImage4 from '../assets/4.png'

interface PublishResultStepProps {
  result: {
    success: boolean
    message?: string
    flowId?: string
  }
  materialGroupId?: string
  materialId?: string
  accountType?: PlatType
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  title?: string
  desc?: string
  topics?: string[]
  /** 是否需要提交作品链接，默认 true（抖音需要，TikTok 不需要） */
  requireWorkLink?: boolean
  onRetry: () => void
  onGoHome: () => void
}

export const PublishResultStep = memo(({
  result,
  materialGroupId,
  materialId,
  accountType = PlatType.Tiktok,
  videoUrl,
  coverUrl,
  imgUrlList,
  title,
  desc,
  topics,
  requireWorkLink = true,
  onRetry,
  onGoHome,
}: PublishResultStepProps) => {
  const { t } = useTransClient('promo')

  // 获取平台信息
  const platInfo = useMemo(() => {
    return AccountPlatInfoMap.get(accountType as unknown as PlatType)
  }, [accountType])

  // 作品链接相关状态
  const [workLink, setWorkLink] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  // 教程图片列表
  const guideImages = [
    { type: 'image' as const, src: guideImage1.src, title: '步骤1' },
    { type: 'image' as const, src: guideImage2.src, title: '步骤2' },
    { type: 'image' as const, src: guideImage3.src, title: '步骤3' },
    { type: 'image' as const, src: guideImage4.src, title: '步骤4' },
  ]

  // 提交作品链接
  const handleSubmitWorkLink = useCallback(async () => {
    if (!workLink.trim() || !materialGroupId || !accountType)
      return

    setSubmitStatus('loading')
    setSubmitError('')

    try {
      const res = await apiCreateOpenPublishRecord({
        materialGroupId,
        materialId,
        workLink: workLink.trim(),
        accountType,
        videoUrl,
        coverUrl,
        imgUrlList,
        title,
        desc,
        topics,
      })

      if (res?.code === 0 && res.data?.success) {
        setSubmitStatus('success')
      }
      else {
        setSubmitStatus('error')
        setSubmitError(res?.message || t('result.submitFailed'))
      }
    }
    catch (error) {
      console.error('Submit work link failed:', error)
      setSubmitStatus('error')
      setSubmitError(t('result.submitFailed'))
    }
  }, [workLink, materialGroupId, materialId, accountType, videoUrl, coverUrl, imgUrlList, title, desc, topics, t])

  if (result.success) {
    return (
      <Card className="p-0">
        {/* Header - 根据提交状态显示不同内容 */}
        <div className="p-6 pb-4">
          <div className="flex flex-col items-center text-center">
            {submitStatus === 'success' || !requireWorkLink ? (
              <>
                <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                <h3 className="text-xl font-semibold">
                  {!requireWorkLink ? t('result.successTitle') : t('result.linkSubmitSuccessTitle')}
                </h3>
                {!requireWorkLink && platInfo && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Image src={platInfo.icon} alt={platInfo.name} width={20} height={20} />
                    <p>{t('result.platformSuccessDescription', { platform: platInfo.name })}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <CircleAlert className="mb-4 h-16 w-16 text-amber-500" />
                <h3 className="text-xl font-semibold">{t('result.pendingTitle')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('result.pendingDescription')}</p>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          {/* 在链接提交成功或不需要提交链接时显示结果信息 */}
          {(submitStatus === 'success' || !requireWorkLink) && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {result.message || t('result.defaultSuccessMessage')}
              </p>
              {result.flowId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('result.flowId')}
                  :
                  {result.flowId}
                </p>
              )}
            </div>
          )}

          {/* 作品链接提交区域 - 仅在需要提交链接时显示 */}
          {requireWorkLink && materialGroupId && accountType && submitStatus !== 'success' && (
            <div className="mt-4 space-y-3">
              <Label htmlFor="workLink" className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="h-4 w-4" />
                {t('result.workLinkLabel')}
              </Label>
              <Input
                id="workLink"
                value={workLink}
                onChange={e => setWorkLink(e.target.value)}
                placeholder={t('result.workLinkPlaceholder')}
                disabled={submitStatus === 'loading'}
              />
              {submitStatus === 'error' && submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}
              <Button
                onClick={handleSubmitWorkLink}
                disabled={!workLink.trim() || submitStatus === 'loading'}
                className="w-full cursor-pointer"
              >
                {submitStatus === 'loading'
                  ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('result.submitting')}
                      </>
                    )
                  : t('result.submitWorkLink')}
              </Button>

              {/* 如何获取作品链接按钮 */}
              <Button
                variant="outline"
                onClick={() => setShowGuide(true)}
                className="w-full cursor-pointer border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {t('result.howToGetLink')}
              </Button>
            </div>
          )}

          {/* 提交成功提示 */}
          {submitStatus === 'success' && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <p className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('result.submitSuccess')}
                </p>
              </div>
              {/* 显示已提交的链接 */}
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">{t('result.submittedLink')}</p>
                <a
                  href={workLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 break-all text-sm text-primary hover:underline"
                >
                  <Link2 className="h-4 w-4 shrink-0" />
                  {workLink}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 pt-0">
          <Button variant="outline" onClick={onRetry} className="cursor-pointer">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('result.publishAgain')}
          </Button>
          <Button onClick={onGoHome} className="flex-1 cursor-pointer">
            <Home className="mr-2 h-4 w-4" />
            {t('result.goHome')}
          </Button>
        </div>

        {/* 教程图片预览 */}
        <MediaPreview
          open={showGuide}
          items={guideImages}
          onClose={() => setShowGuide(false)}
        />
      </Card>
    )
  }

  return (
    <Card className="p-0">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex flex-col items-center text-center">
          <XCircle className="mb-4 h-16 w-16 text-destructive" />
          <h3 className="text-xl font-semibold">{t('result.failedTitle')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('result.failedDescription')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">
            {result.message || t('result.defaultFailedMessage')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-6 pt-0">
        <Button variant="outline" onClick={onGoHome} className="cursor-pointer">
          <Home className="mr-2 h-4 w-4" />
          {t('result.goHome')}
        </Button>
        <Button onClick={onRetry} className="flex-1 cursor-pointer">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('result.retry')}
        </Button>
      </div>
    </Card>
  )
})

PublishResultStep.displayName = 'PublishResultStep'
