import { ForwardedRef, forwardRef, memo } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/plats/plats.type";

const BilibParams = memo(
  forwardRef(({}: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
    return <div>b站</div>;
  }),
);

export default BilibParams;
