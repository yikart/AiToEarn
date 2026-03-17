/**
 * 内容安全检测 Hook
 * 处理发布内容的安全检测功能
 */

import type { IPubParams, PubItem } from '@/components/PublishDialog/publishDialog.type'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toolsApi } from '@/api/tools'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { toast } from '@/lib/toast'

export interface ModerationState {
  // 内容安全检测状态
  moderationLoading: boolean
  moderationResult: boolean | null
  moderationDesc: string
  moderationLevel: any
}

export interface ContentModerationHook extends ModerationState {
  // 执行内容检测
  handleContentModeration: () => Promise<void>
  // 重置检测状态
  resetModerationState: () => void
  // 是否有描述内容
  hasDescription: boolean
  // 是否需要内容安全检测
  needsContentModeration: boolean
}

interface UseContentModerationParams {
  step: number
  pubListChoosed: PubItem[]
  commonPubParams: IPubParams
  expandedPubItem?: PubItem
  t: (key: string) => string
}

/**
 * 内容安全检测 Hook
 */
export function useContentModeration({
  step,
  pubListChoosed,
  commonPubParams,
  expandedPubItem,
  t,
}: UseContentModerationParams): ContentModerationHook {
  // 内容安全检测状态
  const [moderationLoading, setModerationLoading] = useState(false)
  const [moderationResult, setModerationResult] = useState<boolean | null>(null)
  const [moderationDesc, setModerationDesc] = useState<string>('')
  const [moderationLevel, setModerationLevel] = useState<any>(null)

  // 重置检测状态
  const resetModerationState = useCallback(() => {
    setModerationResult(null)
    setModerationDesc('')
    setModerationLevel(null)
  }, [])

  // 获取当前要检测的内容
  const getCurrentContent = useCallback(() => {
    if (step === 0 && pubListChoosed.length >= 2) {
      return commonPubParams.des || ''
    }
    else if (step === 1 && expandedPubItem) {
      return expandedPubItem.params.des || ''
    }
    else if (pubListChoosed.length === 1) {
      return pubListChoosed[0].params.des || ''
    }
    return ''
  }, [step, pubListChoosed, commonPubParams, expandedPubItem])

  // 检查是否有描述内容
  const hasDescription = useMemo(() => {
    const content = getCurrentContent()
    return !!(content && content.trim())
  }, [getCurrentContent])

  // 检查选中的平台是否需要内容安全检测
  const needsContentModeration = useMemo(() => {
    if (pubListChoosed.length === 0)
      return false

    // 检查所有选中的账户对应的平台是否需要内容检测
    return pubListChoosed.some((pubItem) => {
      const platInfo = AccountPlatInfoMap.get(pubItem.account.type)
      return platInfo?.jiancha === true
    })
  }, [pubListChoosed])

  // 内容安全检测函数
  const handleContentModeration = useCallback(async () => {
    const contentToCheck = getCurrentContent()

    if (!contentToCheck.trim()) {
      toast.warning(t('messages.pleaseInputContent'))
      return
    }

    try {
      setModerationLoading(true)
      resetModerationState()

      const result = await toolsApi.textModeration(contentToCheck)

      if (result?.code === 0) {
        const data: any = result?.data || {}
        const descriptions: string = (data && (data.descriptions as string)) || ''
        const labels: string = (data && (data.labels as string)) || ''
        const reason: any = data && (data.reason ? JSON.parse(data.reason) : '')
        const isSafe = !descriptions && !labels && !reason

        setModerationResult(isSafe)
        setModerationLevel(reason)
        setModerationDesc(isSafe ? '' : descriptions || reason || t('actions.contentUnsafe'))

        if (isSafe) {
          toast.success(t('actions.contentSafe'))
        }
        else {
          toast.error(t('actions.contentUnsafe'))
        }
      }
    }
    catch (error) {
      console.error(t('messages.contentModerationError'), error)
      toast.error(t('messages.contentModerationFailed'))
    }
    finally {
      setModerationLoading(false)
    }
  }, [getCurrentContent, resetModerationState, t])

  // 监听内容变化，重置内容安全检测状态
  useEffect(() => {
    resetModerationState()
  }, [
    commonPubParams.des,
    expandedPubItem?.params.des,
    pubListChoosed.map(item => item.params.des).join(','),
    resetModerationState,
  ])

  // 当内容被清空时，也重置检测状态
  useEffect(() => {
    if (!hasDescription) {
      resetModerationState()
    }
  }, [hasDescription, resetModerationState])

  return {
    moderationLoading,
    moderationResult,
    moderationDesc,
    moderationLevel,
    handleContentModeration,
    resetModerationState,
    hasDescription,
    needsContentModeration,
  }
}
