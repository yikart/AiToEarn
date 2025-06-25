import { ForwardedRef, forwardRef, memo } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";

const KwaiParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      return (
        <>
          <PubParmasTextarea
            desValue={pubItem.params.des}
            imageFileListValue={pubItem.params.images}
            videoFileValue={pubItem.params.video}
            onChange={(v) => {
              console.log(v);
            }}
          />
        </>
      );
    },
  ),
);

export default KwaiParams;
