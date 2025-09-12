"use client";

import styles from "./dataStatistics.module.scss";
import DataStatisticsHeader from "@/app/[lng]/dataStatistics/components/DataStatisticsHeader";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { useAccountStore } from "@/store/account";

export const DataStatisticsCore = () => {
  const { setChoosedGroupIds } = useDataStatisticsStore(
    useShallow((state) => ({
      setChoosedGroupIds: state.setChoosedGroupIds,
    })),
  );
  const { accountGroupList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
    })),
  );

  useEffect(() => {
    if (accountGroupList.length > 0) {
      setChoosedGroupIds(accountGroupList.map((group) => group.id));
    }
  }, [setChoosedGroupIds, accountGroupList]);

  return (
    <div className={styles.dataStatistics}>
      <DataStatisticsHeader />
    </div>
  );
};
