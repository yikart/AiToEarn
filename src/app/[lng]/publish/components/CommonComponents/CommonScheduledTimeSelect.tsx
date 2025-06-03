import React, { ForwardedRef, forwardRef, memo, useMemo } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import styles from "./commonComponents.module.scss";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";

export interface ICommonScheduledTimeSelectRef {}

export interface ICommonScheduledTimeSelectProps {
  // 分钟、当前时间 + 这个分钟之后的时间才可以选择
  timeOffset?: number;
  // 天，昨天 ~ maxDate
  maxDate?: number;
  value?: dayjs.Dayjs | null | undefined;
  onChange?:
    | ((date: dayjs.Dayjs, dateString: string | string[]) => void)
    | undefined;
  platType?: PlatType;
  isTitle?: boolean;
}

// 通用定时发布
const CommonScheduledTimeSelect = memo(
  forwardRef(
    (
      {
        timeOffset,
        maxDate,
        value,
        onChange,
        platType,
        isTitle = true,
      }: ICommonScheduledTimeSelectProps,
      ref: ForwardedRef<ICommonScheduledTimeSelectRef>,
    ) => {
      const getMaxTimes = useMemo(() => {
        const accountPlatInfo = AccountPlatInfoMap.get(
          platType || PlatType.Douyin,
        )!;
        const timingMax = accountPlatInfo.commonPubParamsConfig.timingMax;

        return {
          timeOffset: timeOffset || timingMax!.timeOffset,
          maxDate: maxDate || timingMax!.maxDate,
        };
      }, [platType]);

      const range = (start: number, end: number) => {
        const result = [];
        for (let i = start; i < end; i++) {
          result.push(i);
        }
        return result;
      };

      const disabledDate = (current: dayjs.Dayjs) => {
        const yesterday = dayjs().subtract(0, "day").startOf("day");
        const futureDate = dayjs().add(getMaxTimes.maxDate, "day").endOf("day");
        return (
          current &&
          (current.isBefore(yesterday, "day") ||
            current.isAfter(futureDate, "day"))
        );
      };

      const disabledTime = (current: dayjs.Dayjs | null) => {
        const now = dayjs();
        const minutesOffset = now.add(getMaxTimes.timeOffset, "minute");
        if (current && current.isBefore(minutesOffset)) {
          const hours = minutesOffset.hour();
          const minutes = minutesOffset.minute();
          return {
            disabledHours: () => range(0, hours),
            disabledMinutes: () => range(0, minutes),
          };
        }
        return {
          disabledHours: () => [],
          disabledMinutes: () => [],
        };
      };

      return (
        <>
          {isTitle && <h1>定时发布</h1>}
          <DatePicker
            format="YYYY-MM-DD HH:mm"
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            showTime={{ defaultValue: dayjs("00:00:00", "HH:mm:ss") }}
            value={value}
            onChange={onChange}
          />
          <p className={styles.tips}>
            支持{getMaxTimes.timeOffset}分钟后及{getMaxTimes.maxDate}
            天内的定时发布
          </p>
        </>
      );
    },
  ),
);
CommonScheduledTimeSelect.displayName = "CommonScheduledTimeSelect";

export default CommonScheduledTimeSelect;
