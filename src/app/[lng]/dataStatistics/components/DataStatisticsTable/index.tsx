import React, { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./dataStatisticsTable.module.scss";
import { Table } from "antd";
import type { TableProps } from "antd";
import {
  StatisticsPeriodItems,
  StatisticsPeriodItems2,
} from "@/api/types/dataStatistics";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import { useShallow } from "zustand/react/shallow";
import { useAccountStore } from "@/store/account";
import AvatarPlat from "@/components/AvatarPlat";

export interface IDataStatisticsTableRef {}

export interface IDataStatisticsTableProps {}

const DataStatisticsTable = memo(
  forwardRef(
    (
      {}: IDataStatisticsTableProps,
      ref: ForwardedRef<IDataStatisticsTableRef>,
    ) => {
      const { originData, dataDetails } = useDataStatisticsStore(
        useShallow((state) => ({
          originData: state.originData,
          dataDetails: state.dataDetails,
        })),
      );
      const { accountList } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
        })),
      );

      // key=uid, value=该账号对应的数据,此数据是累加的值
      const data = useMemo(() => {
        const d: { [key: string]: Partial<StatisticsPeriodItems2> } = {};

        originData?.items?.map((v) => {
          if (!d[v.uid]) {
            d[v.uid] = {
              commentCount: 0,
              followingCount: 0,
              likeCount: 0,
              fansCount: 0,
              readCount: 0,
              collectCount: 0,
              forwardCount: 0,
              workCount: 0,
            };
          }
          // 累加该账号的各项数据
          v.items?.map((item) => {
            d[v.uid]!.commentCount! += item.commentCount || 0;
            d[v.uid]!.followingCount! += item.followingCount || 0;
            d[v.uid]!.likeCount! += item.likeCount || 0;
            d[v.uid]!.fansCount! += item.fansCount || 0;
            d[v.uid]!.readCount! += item.readCount || 0;
            d[v.uid]!.collectCount! += item.collectCount || 0;
            d[v.uid]!.forwardCount! += item.forwardCount || 0;
            d[v.uid]!.workCount! += item.workCount || 0;
          });
        });

        return d;
      }, [originData]);

      const columns = useMemo(() => {
        const columns: TableProps<StatisticsPeriodItems>["columns"] = [
          {
            title: "账号",
            key: "uid",
            render: (text, item) => {
              const account = accountList.find((v) => v.uid === item.uid)!;

              return (
                <div>
                  <AvatarPlat account={account} />
                  <span style={{ display: "inline-block", marginLeft: "10px" }}>
                    {account?.nickname}
                  </span>
                </div>
              );
            },
          },
        ];

        dataDetails.map((v) => {
          columns.push({
            title: v.title,
            key: v.value,
            sorter: (a, b) => {
              // @ts-ignore
              const aValue = data[a.uid]?.[v.value] || 0;
              // @ts-ignore
              const bValue = data[b.uid]?.[v.value] || 0;
              return aValue - bValue;
            },
            render: (text, item) => {
              // @ts-ignore
              return <span>{data[item.uid]?.[v.value] || 0}</span>;
            },
          });
        });

        return columns;
      }, [accountList, data, dataDetails]);

      return (
        <div className={styles.dataStatisticsTable}>
          <Table<StatisticsPeriodItems>
            columns={columns}
            key="uid"
            dataSource={originData?.items?.map((item) => ({
              ...item,
              key: item.uid,
            }))}
            scroll={{ y: "400px" }}
          />
        </div>
      );
    },
  ),
);

export default DataStatisticsTable;
