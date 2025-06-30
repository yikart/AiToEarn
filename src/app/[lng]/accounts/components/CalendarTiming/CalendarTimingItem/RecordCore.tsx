import { ForwardedRef, forwardRef, memo } from "react";
import { Button } from "antd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";

export interface IRecordCoreRef {}

export interface IRecordCoreProps {}

const RecordCore = memo(
  forwardRef(({}: IRecordCoreProps, ref: ForwardedRef<IRecordCoreRef>) => {
    const { calendarCallWidth } = useCalendarTiming(
      useShallow((state) => ({
        calendarCallWidth: state.calendarCallWidth,
      })),
    );

    return <Button style={{ width: calendarCallWidth + "px" }}>123456</Button>;
  }),
);

export default RecordCore;
