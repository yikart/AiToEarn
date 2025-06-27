import type { CSSProperties, FC } from "react";
import { memo, useEffect, useState } from "react";
import { Button } from "antd";

const styles: CSSProperties = {
  display: "inline-block",
  transform: "rotate(-7deg)",
  WebkitTransform: "rotate(-7deg)",
};

export interface BoxDragPreviewProps {
  title: string;
}

export interface BoxDragPreviewState {
  tickTock: any;
}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(
  function BoxDragPreview({ title }) {
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
        <Button style={{ width: "152px" }}>123456</Button>
      </div>
    );
  },
);
