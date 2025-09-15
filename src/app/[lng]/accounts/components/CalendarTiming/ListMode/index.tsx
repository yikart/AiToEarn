import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import styles from "./listMode.module.scss";
import { Button, List, Skeleton, Empty, Tabs } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import CalendarRecord from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarRecord";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import SentList from "./SentList";
import { useAccountStore } from "@/store/account";

export interface IListModeRef {}
export interface IListModeProps {
  onClickPub?: (date: string) => void;
}

const ListMode = memo(
  forwardRef(
    ({ onClickPub }: IListModeProps, ref: ForwardedRef<IListModeRef>) => {
      const { t } = useTransClient("account");
      const { recordMap, listLoading, getPubRecord } = useCalendarTiming(
        useShallow((state) => ({
          recordMap: state.recordMap,
          listLoading: state.listLoading,
          getPubRecord: state.getPubRecord,
        })),
      );

      const { accountActive } = useAccountStore(
        useShallow((state) => ({
          accountActive: state.accountActive,
        })),
      );

      const [sentCount, setSentCount] = useState(0);

      // 将所有记录转换为列表格式
      const allRecords = Array.from(recordMap.values()).flat();

      // 按时间排序
      const sortedRecords = allRecords.sort(
        (a, b) => new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime(),
      );

      useEffect(() => {
        getPubRecord();
      }, [getPubRecord]);

      const renderRecordItem = (record: PublishRecordItem) => {
        const days = getDays(record.publishTime);
        
        return (
          <List.Item
            key={record.id}
            className={styles.listItem}
            actions={[
              <div key="time" className={styles.timeInfo}>
                <span className={styles.date}>{days.format("MM-DD")}</span>
                <span className={styles.time}>{days.format("HH:mm")}</span>
              </div>
            ]}
          >
            <div className={styles.recordWrapper}>
              <CalendarRecord publishRecord={record} />
            </div>
          </List.Item>
        );
      };

      if (listLoading) {
        return (
          <div className={styles.listMode}>
            <div className={styles.listHeader}>
              <div className={styles.listHeaderLeft}>
                <h3>{t('listMode.title' as any)}</h3>
              </div>
            </div>
            <div className={styles.listContent}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.skeletonItem}>
                  <Skeleton active />
                </div>
              ))}
            </div>
          </div>
        );
      }

      const queueTabContent = (
        <div className={styles.tabContent}>
          <DndProvider backend={HTML5Backend}>
            {sortedRecords.length > 0 ? (
              <List
                dataSource={sortedRecords}
                renderItem={renderRecordItem}
                className={styles.recordList}
              />
            ) : (
              <Empty
                description={t('listMode.noRecords' as any)}
                className={styles.emptyState}
              />
            )}
          </DndProvider>
        </div>
      );

      const sentTabContent = accountActive ? (
        <SentList 
          platform={accountActive.type} 
          uid={accountActive.uid}
          onDataChange={setSentCount}
          accountInfo={{
            avatar: accountActive.avatar,
            nickname: accountActive.nickname,
            account: accountActive.account
          }}
        />
      ) : (
        <Empty
          description="请先选择一个账号"
          className={styles.emptyState}
        />
      );

      const tabItems = [
        {
          key: 'queue',
          label: (
            <div className={styles.tabLabel}>
              <span>列表</span>
              <span className={styles.tabBadge}>{sortedRecords.length}</span>
            </div>
          ),
          children: queueTabContent,
        },
        {
          key: 'sent',
          label: (
            <div className={styles.tabLabel}>
              <span>发布历史</span>
              <span className={styles.tabBadge}>{sentCount>0?sentCount:''}</span>
            </div>
          ),
          children: sentTabContent,
        },
      ];

      return (
        <div className={styles.listMode}>
          <Tabs
            items={tabItems}
            className={styles.listTabs}
            size="small"
          />
        </div>
      );
    },
  ),
);

export default ListMode; 