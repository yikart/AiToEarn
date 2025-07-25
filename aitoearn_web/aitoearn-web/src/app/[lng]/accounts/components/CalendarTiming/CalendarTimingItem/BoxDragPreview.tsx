import type { CSSProperties, FC } from "react";
import { memo, useEffect, useState } from "react";
import RecordCore from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/RecordCore";
import { PublishRecordItem } from "@/api/plat/types/publish.types";

const styles: CSSProperties = {
  display: "inline-block",
  transform: "rotate(-7deg)",
  WebkitTransform: "rotate(-7deg)",
  transition: "0.3s",
};

export interface BoxDragPreviewProps {
  publishRecord: PublishRecordItem;
}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(
  function BoxDragPreview({ publishRecord }) {
    const [tickTock, setTickTock] = useState(false);

    useEffect(
      function subscribeToIntervalTick() {
        const interval = setInterval(() => setTickTock(!tickTock), 500);
        return () => clearInterval(interval);
      },
      [tickTock],
    );

    return (
      <div style={styles}>
        <RecordCore publishRecord={publishRecord} />
      </div>
    );
  },
);
