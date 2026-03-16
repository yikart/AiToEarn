/**
 * 发布弹框底部操作栏
 * 包含内容检测、发布按钮等操作
 */

import { ArrowRight, Info } from 'lucide-react'
import { memo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import PublishDatePicker from '@/components/PublishDialog/compoents/PublishDatePicker'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'

interface PublishFooterProps {
  // 内容检测相关（来自 modalState）
  createLoading: boolean
  hasDescription: boolean
  needsContentModeration: boolean
  moderationLoading: boolean
  moderationResult: boolean | null
  moderationDesc: string
  moderationLevel: any
  // 外部回调
  onContentModeration: () => Promise<void>
  onPublish: () => void
  onNextStep: () => void
}

/**
 * 发布弹框底部操作栏
 */
export const PublishFooter = memo(
  ({
    createLoading,
    hasDescription,
    needsContentModeration,
    moderationLoading,
    moderationResult,
    moderationDesc,
    moderationLevel,
    onContentModeration,
    onPublish,
    onNextStep,
  }: PublishFooterProps) => {
    const { t } = useTransClient('publish')

    // ============ 从 Store 获取状态 ============

    const { step, pubListChoosed, errParamsMap, setExpandedPubItem } = usePublishDialog(
      useShallow(state => ({
        step: state.step,
        pubListChoosed: state.pubListChoosed,
        errParamsMap: state.errParamsMap,
        setExpandedPubItem: state.setExpandedPubItem,
      })),
    )

    // ============ Handlers ============

    // 处理发布点击
    const handlePublishClick = useCallback(() => {
      // 检查错误
      if (errParamsMap) {
        for (const [key, errVideoItem] of errParamsMap) {
          if (errVideoItem) {
            const pubItem = pubListChoosed.find(v => v.account.id === key)!
            if (step === 1) {
              setExpandedPubItem(pubItem)
            }
            toast.warning(errVideoItem.parErrMsg)
            return
          }
        }
      }
      onPublish()
    }, [errParamsMap, pubListChoosed, step, setExpandedPubItem, onPublish])

    // ============ Render ============

    return (
      <div
        className="flex items-center border-t border-border justify-between box-border p-5"
        onClick={e => e.stopPropagation()}
        data-testid="publish-footer"
      >
        <div className="flex w-full justify-end gap-3">
          {step === 0 && pubListChoosed.length >= 2 ? (
            <Button
              size="lg"
              variant="outline"
              onClick={onNextStep}
              className="gap-2 cursor-pointer"
              data-testid="publish-customize-button"
            >
              {t('buttons.customizePerAccount')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {/* 内容检测结果显示 */}
                {moderationResult !== null && (
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${
                        moderationResult ? 'text-green-500' : 'text-destructive'
                      }`}
                    >
                      {moderationResult
                        ? t('actions.contentSafe')
                        : moderationLevel?.riskLevel
                          ? `${t('actions.riskLevel')} ${moderationLevel.riskLevel}`
                          : t('actions.contentUnsafe')}
                    </span>
                    {!moderationResult && !!moderationDesc && (
                      <span className="text-xs text-destructive max-w-[360px] whitespace-pre-wrap inline-flex items-center gap-1.5">
                        {moderationDesc}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-destructive cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>{moderationLevel?.riskTips || ''}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                    )}
                  </div>
                )}

                {/* 内容检测按钮 */}
                {hasDescription && needsContentModeration && (
                  <Button
                    size="lg"
                    disabled={moderationLoading}
                    onClick={onContentModeration}
                    variant={moderationResult === true ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      moderationResult === true
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                        : moderationResult === false
                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive'
                          : ''
                    }`}
                    data-testid="publish-content-moderation-button"
                  >
                    {moderationLoading
                      ? t('actions.checkingContent')
                      : t('actions.contentModeration')}
                  </Button>
                )}
              </div>

              {/* 发布日期选择器 */}
              <PublishDatePicker loading={createLoading} onClick={handlePublishClick} />
            </>
          )}
        </div>
      </div>
    )
  },
)

PublishFooter.displayName = 'PublishFooter'

export default PublishFooter
