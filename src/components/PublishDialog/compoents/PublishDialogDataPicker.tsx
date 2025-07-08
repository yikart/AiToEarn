import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { DatePicker } from "antd";
import type { DatePickerProps, GetProps } from "antd";
import dayjs from "dayjs";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

export interface IPublishDialogDataPickerRef {}

export interface IPublishDialogDataPickerProps {}

// 日期选择器
const PublishDialogDataPicker = memo(
  forwardRef(
    (
      {}: IPublishDialogDataPickerProps,
      ref: ForwardedRef<IPublishDialogDataPickerRef>,
    ) => {
      const { pubTime } = usePublishDialog(
        useShallow((state) => ({
          pubTime: state.pubTime,
        })),
      );

      const onOk = (
        value: DatePickerProps["value"] | RangePickerProps["value"],
      ) => {
        console.log("onOk: ", value);
      };

      // 禁用今天之前的日期
      const disabledDate = (current: dayjs.Dayjs) => {
        return current && current < dayjs().startOf("day");
      };

      // 禁用当前时间之前和当前时间半小时内的时间（只精确到分钟，不考虑秒）
      const disabledDateTime = (current: dayjs.Dayjs | null) => {
        if (!current) return {};

        const now = dayjs();
        const minTime = now.add(20, "minute");

        // 只对今天限制
        if (current.isSame(now, "day")) {
          const minHour = minTime.hour();
          const minMinute = minTime.minute();

          // 禁用小时
          const disabledHours = () => {
            const hours: number[] = [];
            for (let i = 0; i < 24; i++) {
              if (i < minHour) hours.push(i);
            }
            return hours;
          };

          // 禁用分钟
          const disabledMinutes = (selectedHour: number) => {
            const minutes: number[] = [];
            if (selectedHour === minHour) {
              for (let i = 0; i < minMinute; i++) {
                minutes.push(i);
              }
            } else if (selectedHour < minHour) {
              // 小时都禁用了，分钟全部禁用
              for (let i = 0; i < 60; i++) {
                minutes.push(i);
              }
            }
            return minutes;
          };

          return {
            disabledHours,
            disabledMinutes,
          };
        }
        // 非今天不限制
        return {};
      };

      const pubTimeValue = useMemo(() => {
        if (pubTime) {
          return dayjs(pubTime);
        }
      }, [pubTime]);

      return pubTime ? (
        <DatePicker
          value={pubTimeValue}
          showTime={{ format: "HH:mm" }}
          allowClear={false}
          disabledDate={disabledDate}
          disabledTime={disabledDateTime}
          onChange={(value, dateString) => {
            console.log("Selected Time: ", value);
            console.log("Formatted Selected Time: ", dateString);
          }}
          onOk={onOk}
        />
      ) : (
        <div />
      );
    },
  ),
);

export default PublishDialogDataPicker;
