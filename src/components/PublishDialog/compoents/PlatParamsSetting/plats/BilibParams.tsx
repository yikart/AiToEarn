import { ForwardedRef, forwardRef, memo } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";

const BilibParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { pubParmasTextareaCommonParams } = usePlatParamsCommon(pubItem);

      return (
        <>
          <PubParmasTextarea {...pubParmasTextareaCommonParams} />
        </>
      );
    },
  ),
);

export default BilibParams;
