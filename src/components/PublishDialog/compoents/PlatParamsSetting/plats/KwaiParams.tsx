import { ForwardedRef, forwardRef, memo } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";

const KwaiParams = memo(
  forwardRef(({}: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
    return <div>快手</div>;
  }),
);

export default KwaiParams;
