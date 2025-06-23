import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./calendarTimingItem.module.scss";
import { DayCellContentArg } from "@fullcalendar/core";
import { Button } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { PlusOutlined } from "@ant-design/icons";

export interface ICalendarTimingItemRef {}

export interface ICalendarTimingItemProps {
  arg: DayCellContentArg;
}

const CalendarTimingItem = memo(
  forwardRef(
    (
      { arg }: ICalendarTimingItemProps,
      ref: ForwardedRef<ICalendarTimingItemRef>,
    ) => {
      const { t } = useTransClient("account");
      // arg.date 是当前格子的日期，Date 类型
      const today = new Date();
      // 去掉时分秒，只比较年月日
      const argDate = new Date(
        arg.date.getFullYear(),
        arg.date.getMonth(),
        arg.date.getDate(),
      );
      const nowDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      return (
        <div
          className={[
            styles.calendarTimingItem,
            argDate < nowDate ? styles.calendarTimingItemPast : "",
          ].join(" ")}
        >
          <div className="calendarTimingItem-top">
            <div className="calendarTimingItem-top-day">
              {arg.date.getDate()}
            </div>

            {argDate >= nowDate && (
              <Button size="small" icon={<PlusOutlined />} />
            )}
          </div>

          {argDate >= nowDate && (
            <div className="calendarTimingItem-con">
              <Button size="small" type="dashed">
                <div className="calendarTimingItem-con-btn1">04:12 PM</div>
                <div className="calendarTimingItem-con-btn2">
                  {t("addPost")}
                </div>
              </Button>
              <Button size="small" type="dashed">
                <div className="calendarTimingItem-con-btn1">05:34 PM</div>
                <div className="calendarTimingItem-con-btn2">
                  {t("addPost")}
                </div>
              </Button>
            </div>
          )}
        </div>
      );
    },
  ),
);

export default CalendarTimingItem;
