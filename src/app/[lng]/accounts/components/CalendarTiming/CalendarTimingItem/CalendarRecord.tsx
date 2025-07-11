import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import styles from "./calendarRecord.module.scss";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import RecordCore from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/RecordCore";
import {
  PublishRecordItem,
  PublishStatus,
} from "@/api/plat/types/publish.types";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import {
  getDays,
  getUtcDays,
} from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { updatePublishRecordTimeApi } from "@/api/plat/publish";

export interface ICalendarRecordRef {}

export interface ICalendarRecordProps {
  publishRecord: PublishRecordItem;
}

const CalendarRecord = memo(
  forwardRef(
    (
      { publishRecord }: ICalendarRecordProps,
      ref: ForwardedRef<ICalendarRecordRef>,
    ) => {
      const { setRecordMap, recordMap } = useCalendarTiming(
        useShallow((state) => ({
          setRecordMap: state.setRecordMap,
          recordMap: state.recordMap,
        })),
      );
      const [{ opacity }, drag, preview] = useDrag(
        () => ({
          type: "box",
          item: { publishRecord },
          end(item, monitor) {
            const dropResult: any = monitor.getDropResult();
            if (!dropResult) return null;

            const { publishRecord } = item;
            const newRecordMap = new Map(recordMap);
            const days = getDays(publishRecord.publishTime);
            const timeStr = days.format("YYYY-MM-DD");
            const newTimeStr = getDays(dropResult!.time.date).format(
              "YYYY-MM-DD",
            );

            // 更新时间
            item.publishRecord.publishTime = dropResult!.time.date;
            // 移除旧数据
            newRecordMap.set(
              timeStr,
              newRecordMap
                .get(timeStr)!
                .filter((v) => v.id !== publishRecord.id),
            );
            // 添加新数据
            let list = newRecordMap.get(newTimeStr);
            if (!list) {
              list = [];
              newRecordMap.set(newTimeStr, list);
            }
            list.push(publishRecord);
            // 排序
            list = list.sort(
              (a, b) =>
                new Date(a.publishTime).getTime() -
                new Date(b.publishTime).getTime(),
            );
            newRecordMap.set(newTimeStr, list);

            setRecordMap(newRecordMap);

            // 更新API
            updatePublishRecordTimeApi({
              id: publishRecord.id,
              publishTime: getUtcDays(publishRecord.publishTime).format(),
            });
          },
          collect: (monitor: DragSourceMonitor) => ({
            opacity: monitor.isDragging() ? 0 : 1,
          }),
        }),
        [recordMap],
      );

      useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
      }, []);

      return (
        <div
          style={{ opacity: opacity }}
          ref={(node) => {
            if (publishRecord.status === PublishStatus.UNPUBLISH) {
              drag(node);
            }
          }}
          className={styles.calendarRecord}
          role="DraggableBox"
        >
          <RecordCore publishRecord={publishRecord} />
        </div>
      );
    },
  ),
);

export default CalendarRecord;
