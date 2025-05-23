import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./styles/lyaoutHeader.module.scss";

export interface ILyaoutHeaderRef {}

export interface ILyaoutHeaderProps {}

const LyaoutHeader = memo(
  forwardRef(({}: ILyaoutHeaderProps, ref: ForwardedRef<ILyaoutHeaderRef>) => {
    return <div className={styles.lyaoutHeader}>header</div>;
  }),
);

export default LyaoutHeader;
