import {
  ForwardedRef,
  forwardRef,
  memo
} from "react";

export interface IHotEventRef {
}

export interface IHotEventProps {
}

const HotEvent = memo(
  forwardRef(
    (
      {}: IHotEventProps,
      ref: ForwardedRef<IHotEventRef>
    ) => {
      return (
        <div></div>
      );
    }
  )
);

export default HotEvent;
