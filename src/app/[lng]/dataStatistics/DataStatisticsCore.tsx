"use client";

import styles from "./dataStatistics.module.scss";
import DataStatisticsHeader from "@/app/[lng]/dataStatistics/components/DataStatisticsHeader";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { useAccountStore } from "@/store/account";
import DataStatisticsDetails from "@/app/[lng]/dataStatistics/components/DataStatisticsDetails";

export const DataStatisticsCore = () => {
  const { setChoosedGroupIds, setFilteredAccountList, choosedGroupIds, init } =
    useDataStatisticsStore(
      useShallow((state) => ({
        setChoosedGroupIds: state.setChoosedGroupIds,
        setFilteredAccountList: state.setFilteredAccountList,
        choosedGroupIds: state.choosedGroupIds,
        init: state.init,
      })),
    );
  const { accountGroupList, accountList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
      accountList: state.accountList,
    })),
  );

  useEffect(() => {
    init();
  }, []);

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
      <DataStatisticsDetails />
    </div>
  );
};
