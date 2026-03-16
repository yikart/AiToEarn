/**
 * WxGzhParams - 微信公众号平台参数设置
 * - 独立参数：title（与通用 title 区分，使用 option.wxGzh.title 保存）
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { forwardRef, memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Input } from '@/components/ui/input'

const WxGzhParams = memo(
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
                <div className="flex items-center h-8 mt-2.5">
                  <div className="shrink-0 w-[90px] mr-2.5">{t('form.title')}</div>
                  <Input
                    value={pubItem.params.title}
                    placeholder={t('form.titlePlaceholder')}
                    data-testid="publish-title-input"
                    onChange={(e) => {
                      setOnePubParams({ title: e.target.value }, pubItem.account.id)
                    }}
                  />
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default WxGzhParams
