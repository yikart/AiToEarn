import {
  ForwardedRef,
  forwardRef,
  memo,
  PropsWithChildren,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import styles from "./scrollButtonContainer.module.scss";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

export interface IScrollButtonContainerRef {}

export interface IScrollButtonContainerProps {
  width?: string;
  step?: number;
  duration?: number; // 降级动画时长(ms)
  edgeOffset?: number; // 边界容差
}

const ScrollButtonContainer = memo(
  forwardRef(function ScrollButtonContainerInner(
    {
      children,
      width = "100%",
      step = 200,
      duration = 300,
      edgeOffset = 2,
    }: PropsWithChildren<IScrollButtonContainerProps>,
    ref: ForwardedRef<IScrollButtonContainerRef>,
  ) {
    const scrollContentRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const updateEdgeState = useCallback(() => {
      const el = scrollContentRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const noOverflow = scrollWidth <= clientWidth + edgeOffset;
      if (noOverflow) {
        setAtStart(true);
        setAtEnd(true);
        return;
      }
      setAtStart(scrollLeft <= edgeOffset);
      setAtEnd(scrollLeft >= scrollWidth - clientWidth - edgeOffset);
    }, [edgeOffset]);

    useEffect(() => {
      updateEdgeState();
      const el = scrollContentRef.current;
      if (!el) return;
      const handler = () => updateEdgeState();
      el.addEventListener("scroll", handler, { passive: true });
      // 尺寸变化时也重算
      const ro = new ResizeObserver(() => updateEdgeState());
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", handler);
        ro.disconnect();
      };
    }, [updateEdgeState, children]);

    const fallbackAnimate = useCallback(
      (target: number) => {
        const el = scrollContentRef.current;
        if (!el) return;
        const start = el.scrollLeft;
        const diff = target - start;
        if (diff === 0) return;
        const startTime = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          // ease-out
          const eased = 1 - Math.pow(1 - progress, 3);
          el.scrollLeft = start + diff * eased;
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      },
      [duration],
    );

    const smoothScrollTo = useCallback(
      (delta: number) => {
        const el = scrollContentRef.current;
        if (!el) return;
        const target = el.scrollLeft + delta;
        if ("scrollBy" in el) {
          try {
            el.scrollBy({ left: delta, behavior: "smooth" });
            return;
          } catch {
            // fallback
          }
        }
        fallbackAnimate(target);
      },
      [fallbackAnimate],
    );

    const leftMove = useCallback(() => {
      if (!atStart) smoothScrollTo(-step);
    }, [smoothScrollTo, step, atStart]);

    const rightMove = useCallback(() => {
      if (!atEnd) smoothScrollTo(step);
    }, [smoothScrollTo, step, atEnd]);

    return (
      <div className={styles.scrollButtonContainer}>
        {!atStart && (
          <Button
            className="scrollButtonContainer-btn scrollButtonContainer-btn--left"
            icon={<LeftOutlined />}
            size="small"
            onClick={leftMove}
          />
        )}
        <div
          ref={scrollContentRef}
          className="scrollButtonContainer-content"
          style={{ width }}
        >
          {children}
        </div>
        {!atEnd && (
          <Button
            className="scrollButtonContainer-btn scrollButtonContainer-btn--right"
            icon={<RightOutlined />}
            size="small"
            onClick={rightMove}
          />
        )}
      </div>
    );
  }),
);

export default ScrollButtonContainer;
