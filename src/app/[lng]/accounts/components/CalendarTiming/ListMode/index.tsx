import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import styles from "./listMode.module.scss";
import { Button, List, Skeleton, Empty } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import CalendarRecord from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarRecord";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

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
                <h3>发布计划列表</h3>
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

      return (
        <div className={styles.listMode}>
          <div className={styles.listHeader}>
            <div className={styles.listHeaderLeft}>
              <h3>发布计划列表</h3>
              <span className={styles.recordCount}>
                共 {sortedRecords.length} 条发布计划
              </span>
            </div>
            <div className={styles.listHeaderRight}>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (onClickPub) {
                    const now = new Date();
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(10, 0, 0, 0);
                    onClickPub(tomorrow.toISOString());
                  }
                }}
              >
                新建作品
              </Button>
            </div>
          </div>
          <div className={styles.listContent}>
            <DndProvider backend={HTML5Backend}>
              {sortedRecords.length > 0 ? (
                <List
                  dataSource={sortedRecords}
                  renderItem={renderRecordItem}
                  className={styles.recordList}
                />
              ) : (
                <Empty
                  description="暂无发布计划"
                  className={styles.emptyState}
                />
              )}
            </DndProvider>
          </div>
        </div>
      );
    },
  ),
);

export default ListMode; 