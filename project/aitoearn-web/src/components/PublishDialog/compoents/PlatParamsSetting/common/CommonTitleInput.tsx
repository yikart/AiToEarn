/**
 * CommonTitleInput - 通用标题输入组件
 */
import type { ForwardedRef } from 'react'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ICommonTitleInputRef {}

export interface ICommonTitleInputProps {
  pubItem: PubItem
  /** 是否为移动端 */
  isMobile?: boolean
}

const CommonTitleInput = memo(
  forwardRef(
    ({ pubItem, isMobile }: ICommonTitleInputProps, ref: ForwardedRef<ICommonTitleInputRef>) => {
      const { t } = useTransClient('publish')
      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!
      }, [pubItem])

      const { setOnePubParams, pubList } = usePublishDialog(
        useShallow(state => ({
          setOnePubParams: state.setOnePubParams,
          pubList: state.pubList,
        })),
      )

      // 判断是否需要显示必填标识
      const isRequired = pubItem.account.type === PlatType.Pinterest

      const maxLength = platConfig.commonPubParamsConfig.titleMax || 20
      const currentLength = pubItem.params.title?.length || 0

      return (
        <div className={cn('flex', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}>
          <div className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}>
            {t('form.title')}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </div>
          <div className="flex-1 relative">
            <Input
              value={pubItem.params.title}
              maxLength={maxLength}
              placeholder={t('form.titlePlaceholder')}
              className="pr-16 h-8"
              data-testid="publish-title-input"
              onChange={(e) => {
                setOnePubParams(
                  {
                    title: e.target.value,
                  },
                  pubItem.account.id,
                )
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {currentLength}
              /
              {maxLength}
            </span>
          </div>
        </div>
      )
    },
  ),
)

export default CommonTitleInput
