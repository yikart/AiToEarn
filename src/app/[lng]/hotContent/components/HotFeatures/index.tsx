import {
  ForwardedRef,
  forwardRef,
  memo
} from "react";

export interface IHotFeaturesRef {
}

export interface IHotFeaturesProps {
}

const HotFeatures = memo(
  forwardRef(
    (
      {}: IHotFeaturesProps,
      ref: ForwardedRef<IHotFeaturesRef>
    ) => {
      return (
        <div></div>
      );
    }
  )
);

export default HotFeatures;
