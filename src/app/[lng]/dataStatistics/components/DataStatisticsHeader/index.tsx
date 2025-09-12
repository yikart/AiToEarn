import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./dataStatisticsHeader.module.scss";

export interface IDataStatisticsHeaderRef {}

export interface IDataStatisticsHeaderProps {}

const DataStatisticsHeader = memo(
  forwardRef(
    (
      {}: IDataStatisticsHeaderProps,
      ref: ForwardedRef<IDataStatisticsHeaderRef>,
    ) => {
      return <div className={styles.dataStatisticsHeader}></div>;
    },
  ),
);

export default DataStatisticsHeader;
