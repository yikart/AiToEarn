import { ForwardedRef, forwardRef, memo } from "react";
import { Button } from "antd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import { PublishRecordItem } from "@/api/plat/types/publish.types";

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem;
}

const RecordCore = memo(
  forwardRef(
    (
      { publishRecord }: IRecordCoreProps,
      ref: ForwardedRef<IRecordCoreRef>,
    ) => {
      const { calendarCallWidth } = useCalendarTiming(
        useShallow((state) => ({
          calendarCallWidth: state.calendarCallWidth,
        })),
      );

      return (
        <Button style={{ width: calendarCallWidth + "px" }}>123456</Button>
      );
    },
  ),
);

export default RecordCore;
