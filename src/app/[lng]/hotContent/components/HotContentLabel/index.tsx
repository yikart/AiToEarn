import {
  ForwardedRef,
  forwardRef,
  memo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import styles from "./hotContentLabel.module.scss";

export interface IHotContentLabelRef {}

export interface IHotContentLabelProps {
  labels: string[];
  value: string;
  onChange: (label: string) => void;
}

const HotContentLabel = memo(
  forwardRef(
    (
      { labels, value, onChange }: IHotContentLabelProps,
      ref: ForwardedRef<IHotContentLabelRef>,
    ) => {
      const listRef = useRef<HTMLUListElement>(null);
      const [expanded, setExpanded] = useState(false);
      const [showToggle, setShowToggle] = useState(false);
      const [collapsedHeight, setCollapsedHeight] = useState(0);
      const [fullHeight, setFullHeight] = useState(0);

      useLayoutEffect(() => {
        const ul = listRef.current;
        if (ul) {
          const firstLi = ul.querySelector("li");
          if (firstLi) {
            const lineHeight = firstLi.getBoundingClientRect().height;
            setCollapsedHeight(lineHeight);
            setFullHeight(ul.scrollHeight);
            setShowToggle(ul.scrollHeight > lineHeight + 2);
          }
        }
      }, [labels]);

      return (
        <div className={styles.hotContentLabelWrapper}>
          <ul
            className="hotContentLabel"
            ref={listRef}
            style={{
              maxHeight: expanded ? fullHeight : collapsedHeight,
              overflow: "hidden",
              transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {labels.map((label) => (
              <li
                key={label}
                className={`hotContentLabel-item ${
                  label === value ? "hotContentLabel-item--active" : ""
                }`}
                title={label}
                onClick={() => onChange(label)}
              >
                {label}
              </li>
            ))}
          </ul>
          {showToggle && (
            <a
              className="hotContentLabel-toggle"
              onClick={(e) => {
                e.preventDefault();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "收起" : "展开"}
            </a>
          )}
        </div>
      );
    },
  ),
);

export default HotContentLabel;
