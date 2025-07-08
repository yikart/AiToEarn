import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { Button } from "antd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import styles from "./recordCore.module.scss";
import dayjs from "dayjs";
import { AccountPlatInfoMap } from "@/app/config/platConfig";

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem;
}

const RecordCore = memo(
  forwardRef(
    (
      { publishRecord }: IRecordCoreProps,
      ref: ForwardedRef<IRecordCoreRef>,
    ) => {
      const { calendarCallWidth } = useCalendarTiming(
        useShallow((state) => ({
          calendarCallWidth: state.calendarCallWidth,
        })),
      );

      const days = useMemo(() => {
        return dayjs(publishRecord.publishTime);
      }, [publishRecord]);

      const platIcon = useMemo(() => {
        return AccountPlatInfoMap.get(publishRecord.accountType)?.icon;
      }, [publishRecord]);

      return (
        <Button
          className={styles.recordCore}
          style={{ width: calendarCallWidth + "px" }}
        >
          <div className="recordCore-left">
            <img src={platIcon} />
            <div className="recordCore-left-date">{days.format("HH:mm")}</div>
          </div>
          <div className="recordCore-right">
            <img src={publishRecord.coverUrl} />
          </div>
        </Button>
      );
    },
  ),
);

export default RecordCore;
