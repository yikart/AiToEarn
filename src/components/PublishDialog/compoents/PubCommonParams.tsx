import { ForwardedRef, forwardRef, memo } from "react";

export interface IPubCommonParamsRef {}

export interface IPubCommonParamsProps {}

const PubCommonParams = memo(
  forwardRef(
    ({}: IPubCommonParamsProps, ref: ForwardedRef<IPubCommonParamsRef>) => {
      return <div>发布通用参数</div>;
    },
  ),
);

export default PubCommonParams;
