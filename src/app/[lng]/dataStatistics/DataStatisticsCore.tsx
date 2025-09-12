"use client";

import styles from "./dataStatistics.module.scss";
import DataStatisticsHeader from "@/app/[lng]/dataStatistics/components/DataStatisticsHeader";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { useAccountStore } from "@/store/account";

export const DataStatisticsCore = () => {
  const { setChoosedGroupIds, setFilteredAccountList, choosedGroupIds } =
    useDataStatisticsStore(
      useShallow((state) => ({
        setChoosedGroupIds: state.setChoosedGroupIds,
        setFilteredAccountList: state.setFilteredAccountList,
        choosedGroupIds: state.choosedGroupIds,
      })),
    );
  const { accountGroupList, accountList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
      accountList: state.accountList,
    })),
  );

  useEffect(() => {
    if (accountGroupList.length > 0) {
      setChoosedGroupIds(accountGroupList.map((group) => group.id));
    }
  }, [setChoosedGroupIds, accountGroupList]);

  // 过滤账户
  useEffect(() => {
    setFilteredAccountList(
      accountList.filter((v) => {
        return choosedGroupIds.includes(v.groupId);
      }),
    );
  }, [choosedGroupIds, accountList]);

  return (
    <div className={styles.dataStatistics}>
      <DataStatisticsHeader />
    </div>
  );
};
