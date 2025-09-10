import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./hotContentSidebar.module.scss";

export interface IHotContentSidebarRef {}

export interface IHotContentSidebarProps {}

const HotContentSidebar = memo(
  forwardRef(
    ({}: IHotContentSidebarProps, ref: ForwardedRef<IHotContentSidebarRef>) => {
      return <div className={styles.hotContentSidebar}></div>;
    },
  ),
);

export default HotContentSidebar;
