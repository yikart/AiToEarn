import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import styles from "./calendarRecord.module.scss";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { Button } from "antd";
import { getEmptyImage } from "react-dnd-html5-backend";

export interface ICalendarRecordRef {}

export interface ICalendarRecordProps {}

const CalendarRecord = memo(
  forwardRef(
    ({}: ICalendarRecordProps, ref: ForwardedRef<ICalendarRecordRef>) => {
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
            drag(node);
          }}
          className={styles.calendarRecord}
          role="DraggableBox"
        >
          <Button>123456</Button>
        </div>
      );
    },
  ),
);

export default CalendarRecord;
