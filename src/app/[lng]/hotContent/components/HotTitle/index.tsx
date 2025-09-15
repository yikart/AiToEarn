import {
  ForwardedRef,
  forwardRef,
  memo
} from "react";

export interface IHotTitleRef {
}

export interface IHotTitleProps {
}

const HotTitle = memo(
  forwardRef(
    (
      {}: IHotTitleProps,
      ref: ForwardedRef<IHotTitleRef>
    ) => {
      return (
        <div></div>
      );
    }
  )
);

export default HotTitle;
