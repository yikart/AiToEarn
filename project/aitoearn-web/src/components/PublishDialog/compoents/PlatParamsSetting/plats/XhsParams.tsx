import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import type { IPlatOption, IXhsUserDeclarationOrigin } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import CommonTitleInput from '../common/CommonTitleInput'

const XHS_USER_DECLARATION_OPTIONS: IXhsUserDeclarationOrigin[] = [1, 2, 3]
const XHS_USER_DECLARATION_EMPTY_VALUE = 'none'

function ensureXhsOption(option: IPlatOption): IPlatOption & { xhs: NonNullable<IPlatOption['xhs']> } {
  const newOption = { ...option }
  newOption.xhs = {
    ...newOption.xhs,
  }

  return newOption as IPlatOption & { xhs: NonNullable<IPlatOption['xhs']> }
}

const XhsParams = memo(
  forwardRef(
    (
      { pubItem, onImageToImage, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        onImageToImage,
        isMobile,
      )

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                <CommonTitleInput pubItem={pubItem} isMobile={isMobile} />

                <div
                  className={cn(
                    'flex mt-4',
                    isMobile ? 'flex-col gap-1.5' : 'items-center h-8',
                  )}
                >
                  <Label
                    htmlFor="xhs-declaration"
                    className={cn(
                      'shrink-0',
                      isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5',
                    )}
                  >
                    {t('xhs.declaration.title')}
                  </Label>
                  <div className="flex-1">
                    <Select
                      value={
                        pubItem.params.option.xhs?.userDeclarationBind?.origin
                          ? `${pubItem.params.option.xhs.userDeclarationBind.origin}`
                          : XHS_USER_DECLARATION_EMPTY_VALUE
                      }
                      onValueChange={(value) => {
                        const option = ensureXhsOption(pubItem.params.option)
                        if (value === XHS_USER_DECLARATION_EMPTY_VALUE) {
                          option.xhs.userDeclarationBind = null
                        }
                        else {
                          option.xhs.userDeclarationBind = {
                            origin: Number(value) as IXhsUserDeclarationOrigin,
                          }
                        }
                        setOnePubParams({ option }, pubItem.account.id)
                      }}
                    >
                      <SelectTrigger
                        id="xhs-declaration"
                        className="h-8 w-full"
                        data-testid="publish-xhs-declaration-select"
                      >
                        <SelectValue placeholder={t('xhs.declaration.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={XHS_USER_DECLARATION_EMPTY_VALUE}>
                          {t('xhs.declaration.none')}
                        </SelectItem>
                        {XHS_USER_DECLARATION_OPTIONS.map(origin => (
                          <SelectItem key={origin} value={`${origin}`}>
                            {t(`xhs.declaration.options.${origin}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default XhsParams
