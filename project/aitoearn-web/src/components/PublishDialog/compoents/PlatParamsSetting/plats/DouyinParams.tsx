import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { forwardRef, memo } from 'react'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'

const DouyinParams = memo(
  forwardRef(
    (
      { pubItem, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { pubParmasTextareaCommonParams } = usePlatParamsCommon(
        pubItem,
        isMobile,
      )

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={<CommonTitleInput pubItem={pubItem} isMobile={isMobile} />}
          />
        </>
      )
    },
  ),
)

export default DouyinParams
