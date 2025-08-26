import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./calendarTiming.module.scss";

export interface IAllPlatIconRef {}

export interface IAllPlatIconProps {
  width?: number;
}

const AllPlatIcon = memo(
  forwardRef(
    ({ width = 50 }: IAllPlatIconProps, ref: ForwardedRef<IAllPlatIconRef>) => {
      const widthChild = useMemo(() => {
        return width / 5;
      }, [width]);

      const childStyle = useMemo(() => {
        return {
          width: widthChild + "px",
          height: widthChild + "px",
        };
      }, [widthChild]);

      return (
        <div
          className={styles.allPlatIcon}
          style={{ width: width + "px", height: width + "px" }}
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
