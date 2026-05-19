/**
 * 发布弹框底部操作栏
 * 包含发布按钮等操作
 */

import { ArrowRight } from 'lucide-react'
import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import PublishDatePicker from '@/components/PublishDialog/compoents/PublishDatePicker'
import { useValidatedPublishTrigger } from '@/components/PublishDialog/hooks/useValidatedPublishTrigger'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'

interface PublishFooterProps {
  createLoading: boolean
  // 外部回调
  onPublish: () => void
  onNextStep: () => void
}

/**
 * 发布弹框底部操作栏
 */
export const PublishFooter = memo(
  ({
    createLoading,
    onPublish,
    onNextStep,
  }: PublishFooterProps) => {
    const { t } = useTransClient('publish')
    const { step, pubListChoosed } = usePublishDialog(
      useShallow(state => ({
        step: state.step,
        pubListChoosed: state.pubListChoosed,
      })),
    )
    const { triggerPublish } = useValidatedPublishTrigger(onPublish)

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
            <PublishDatePicker loading={createLoading} onClick={triggerPublish} />
          )}
        </div>
      </div>
    )
  },
)

PublishFooter.displayName = 'PublishFooter'

export default PublishFooter
