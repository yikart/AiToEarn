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
      const { setRecordMap, recordMap,  } = useCalendarTiming(
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
            const dropResult = monitor.getDropResult();
            const { publishRecord } = item;
            const newRecordMap = new Map(recordMap);
            newRecordMap.delete(publishRecord.id);

            console.log(item, dropResult);
          },
          collect: (monitor: DragSourceMonitor) => ({
            opacity: monitor.isDragging() ? 0 : 1,
          }),
        }),
        [],
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
