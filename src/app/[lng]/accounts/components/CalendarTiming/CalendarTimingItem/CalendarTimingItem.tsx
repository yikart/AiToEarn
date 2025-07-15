import { ForwardedRef, forwardRef, memo, useMemo, useState } from "react";
import styles from "./calendarTimingItem.module.scss";
import { DayCellContentArg } from "@fullcalendar/core";
import { Button, Skeleton } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { DownOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import { useDrop } from "react-dnd";
import CalendarRecord from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarRecord";
import { CustomDragLayer } from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CustomDragLayer";
import dayjs from "dayjs";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";

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
      // [[小时，分钟]] [[4, 12]]
      const [reservationsTimes, setReservationsTimes] = useState([]);
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
      const [isMore, setIsMore] = useState(false);
      const { recordMap } = useCalendarTiming(
        useShallow((state) => ({
          recordMap: state.recordMap,
        })),
      );

      const reservationsTimesLast = useMemo(() => {
        return argDate >= nowDate ? reservationsTimes : [];
      }, [reservationsTimes]);

      const recordsLast = useMemo(() => {
        if (!records) return [];
        if (isMore) {
          return records;
        } else {
          return records?.slice(0, 3 - reservationsTimesLast.length);
        }
      }, [isMore, records, reservationsTimesLast, recordMap]);

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
              {argDate >= nowDate &&
                reservationsTimesLast.map((v, i) => {
                  return (
                    <Button
                      key={i}
                      size="small"
                      type="dashed"
                      onClick={() => {
                        const days = dayjs(arg.date)
                          .set("hour", v[0])
                          .set("minute", v[1]);
                        onClickPub(days.format());
                      }}
                    >
                      <div className="calendarTimingItem-con-btn1">
                        {v[0]}:{v[1]} PM
                      </div>
                      <div className="calendarTimingItem-con-btn2">
                        {t("addPost")}
                      </div>
                    </Button>
                  );
                })}
              {records &&
                recordsLast.map((v) => {
                  return (
                    <div key={v.id}>
                      <CustomDragLayer publishRecord={v} snapToGrid={false} />
                      <CalendarRecord publishRecord={v} />
                    </div>
                  );
                })}

              {records && records.length > 3 - reservationsTimesLast.length && (
                <Button
                  type="text"
                  style={{
                    height: "auto",
                    width: "auto",
                    padding: "3px 10px",
                    fontSize: "var(--fs-sm)",
                    marginBottom: "0",
                  }}
                  onClick={() => {
                    setIsMore(!isMore);
                  }}
                >
                  {isMore ? (
                    <>
                      <UpOutlined style={{ marginRight: "8px" }} />
                      隐藏更多
                    </>
                  ) : (
                    <>
                      <DownOutlined style={{ marginRight: "8px" }} />
                      {records.length - recordsLast?.length} 更多
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      );
    },
  ),
);

export default CalendarTimingItem;
