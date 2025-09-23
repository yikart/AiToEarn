import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./calendarTiming.module.scss";

export interface IAllPlatIconRef {}

export interface IAllPlatIconProps {
  size?: number;
  style?: React.CSSProperties;
}

const AllPlatIcon = memo(
  forwardRef(
    (
      { size = 50, style = {} }: IAllPlatIconProps,
      ref: ForwardedRef<IAllPlatIconRef>,
    ) => {
      const widthChild = useMemo(() => {
        return size / 5;
      }, [size]);

      const childStyle = useMemo(() => {
        return {
          width: widthChild + "px",
          height: widthChild + "px",
        };
      }, [widthChild]);

      return (
        <div
          className={styles.allPlatIcon}
          style={{ width: size + "px", height: size + "px", ...style }}
        >
          <ul>
            <li style={childStyle}></li>
            <li style={childStyle}></li>
          </ul>
          <ul>
            <li style={childStyle}></li>
            <li style={childStyle}></li>
          </ul>
        </div>
      );
    },
  ),
);

export default AllPlatIcon;
