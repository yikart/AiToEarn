import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { forwardRef, memo } from 'react'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'

const DouyinParams = memo(
  forwardRef(
    ({ pubItem, onImageToImage }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { pubParmasTextareaCommonParams } = usePlatParamsCommon(pubItem, onImageToImage)

      return (
        <>
          <PubParmasTextarea {...pubParmasTextareaCommonParams}
            
          />
        </>
      )
    },
  ),
)

export default DouyinParams
