"use client";

import styles from "./dataStatistics.module.scss";
import DataStatisticsHeader from "@/app/[lng]/dataStatistics/components/DataStatisticsHeader";

export const DataStatisticsCore = () => {
  return (
    <div className={styles.dataStatistics}>
      <DataStatisticsHeader />
    </div>
  );
};
