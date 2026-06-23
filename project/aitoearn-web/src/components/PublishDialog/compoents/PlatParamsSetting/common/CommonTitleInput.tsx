/**
 * CommonTitleInput - 通用标题输入组件
 */
import type { ForwardedRef } from 'react'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo } from 'react'
import { PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Input } from '@/components/ui/input'
import { usePlatformInfo } from '@/hooks/usePlatformMetadata'
import { cn } from '@/utils/className'

export interface ICommonTitleInputRef {}

interface AccountTitleInputProps {
  pubItem: PubItem
  isMobile?: boolean
}

interface ControlledTitleInputProps {
  titleValue: string
  titleMax: number
  onTitleChange: (title: string) => void
  isRequired?: boolean
  isMobile?: boolean
}

export type ICommonTitleInputProps = AccountTitleInputProps | ControlledTitleInputProps

function isAccountTitleInputProps(props: ICommonTitleInputProps): props is AccountTitleInputProps {
  return 'pubItem' in props
}

const CommonTitleInput = memo(
  forwardRef(
    (props: ICommonTitleInputProps, ref: ForwardedRef<ICommonTitleInputRef>) => {
      const { t } = useTransClient('publish')
      const isMobile = props.isMobile
      const platConfig = usePlatformInfo(isAccountTitleInputProps(props) ? props.pubItem.account.type : undefined)

      const setOnePubParams = usePublishDialog(state => state.setOnePubParams)

      const titleInputConfig = isAccountTitleInputProps(props)
        ? {
            isRequired: props.pubItem.account.type === PlatType.Pinterest,
            maxLength: platConfig?.commonPubParamsConfig.titleMax || 20,
            value: props.pubItem.params.title || '',
            onTitleChange: (title: string) => {
              setOnePubParams(
                {
                  title,
                },
                props.pubItem.account.id,
              )
            },
          }
        : {
            isRequired: props.isRequired === true,
            maxLength: props.titleMax,
            value: props.titleValue,
            onTitleChange: props.onTitleChange,
          }

      const { isRequired, maxLength, value, onTitleChange } = titleInputConfig
      const currentLength = value.length

      return (
        <div className={cn('flex', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}>
          <div className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}>
            {t('form.title')}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </div>
          <div className="flex-1 relative">
            <Input
              value={value}
              maxLength={maxLength}
              placeholder={t('form.titlePlaceholder')}
              className="pr-16 h-8"
              data-testid="publish-title-input"
              onChange={(e) => {
                onTitleChange(e.target.value)
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
