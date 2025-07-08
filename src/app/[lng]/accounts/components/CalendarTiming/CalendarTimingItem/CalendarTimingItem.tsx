import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./calendarTimingItem.module.scss";
import { DayCellContentArg } from "@fullcalendar/core";
import { Button, Skeleton } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { PlusOutlined } from "@ant-design/icons";
import { useDrop } from "react-dnd";
import CalendarRecord from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarRecord";
import { CustomDragLayer } from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CustomDragLayer";
import dayjs from "dayjs";
import { PublishRecordItem } from "@/api/plat/types/publish.types";

export interface ICalendarTimingItemRef {}

export interface ICalendarTimingItemProps {
  arg: DayCellContentArg;
  onClickPub: (date: string) => void;
  loading: boolean;
  // 发布记录数据
  records?: PublishRecordItem[];
}

const CalendarTimingItem = memo(
  forwardRef(
    (
      { arg, onClickPub, loading, records }: ICalendarTimingItemProps,
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
      const [{ canDrop, isOver }, drop] = useDrop(
        () => ({
          accept: "box",
          drop: () => ({
            time: arg,
          }),
          collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
          }),
        }),
        [],
      );

      return (
        <div
          ref={(node) => {
            if (argDate >= nowDate) {
              drop(node);
            }
          }}
          className={[
            "calendarTimingItem--js",
            styles.calendarTimingItem,
            argDate < nowDate ? styles.calendarTimingItemPast : "",
            isOver ? styles.calendarTimingItem_over : "",
          ].join(" ")}
        >
          <div className="calendarTimingItem-top">
            <div className="calendarTimingItem-top-day">
              {arg.date.getDate()}
            </div>

            {argDate >= nowDate && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const days = dayjs(arg.date);
                  const today = dayjs();

                  if (today.date() === days.date()) {
                    onClickPub(today.add(10, "minute").format());
                  } else {
                    onClickPub(days.format());
                  }
                }}
              />
            )}
          </div>

          {loading ? (
            <>
              <Skeleton.Button active={true} block={true} size="small" />
            </>
          ) : (
            <div className="calendarTimingItem-con">
              {argDate >= nowDate && (
                <Button
                  size="small"
                  type="dashed"
                  onClick={() => {
                    const days = dayjs(arg.date)
                      .set("hour", 16)
                      .set("minute", 12);
                    onClickPub(days.format());
                  }}
                >
                  <div className="calendarTimingItem-con-btn1">04:12 PM</div>
                  <div className="calendarTimingItem-con-btn2">
                    {t("addPost")}
                  </div>
                </Button>
              )}

              {records &&
                records.map((v) => {
                  return (
                    <>
                      <CustomDragLayer
                        key={v.id + "1"}
                        publishRecord={v}
                        snapToGrid={false}
                      />
                      <CalendarRecord key={v.id + "2"} publishRecord={v} />
                    </>
                  );
                })}
            </div>
          )}
        </div>
      );
    },
  ),
);

export default CalendarTimingItem;
