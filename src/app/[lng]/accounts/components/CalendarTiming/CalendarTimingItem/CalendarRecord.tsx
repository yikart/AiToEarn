import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import styles from "./calendarRecord.module.scss";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import RecordCore from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/RecordCore";
import {
  PublishRecordItem,
  PublishStatus,
} from "@/api/plat/types/publish.types";

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
      const [{ opacity }, drag, preview] = useDrag(
        () => ({
          type: "box",
          item: { name: "1" },
          end(item, monitor) {
            const dropResult = monitor.getDropResult();
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
