import type { ForwardedRef } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { Empty, Skeleton, Tabs } from 'antd'
import { forwardRef, memo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useTransClient } from '@/app/i18n/client'
import { useAccountStore } from '@/store/account'
import styles from './listMode.module.scss'
import QueueItem from './QueueItem'
import SentList from './SentList'

export interface IListModeRef {}
export interface IListModeProps {
  onClickPub?: (date: string) => void
}

const ListMode = memo(
  forwardRef(
    ({ onClickPub }: IListModeProps, ref: ForwardedRef<IListModeRef>) => {
      const { t } = useTransClient('account')
      const { recordMap, listLoading } = useCalendarTiming(
        useShallow(state => ({
          recordMap: state.recordMap,
          listLoading: state.listLoading,
        })),
      )

      const { accountActive } = useAccountStore(
        useShallow(state => ({
          accountActive: state.accountActive,
        })),
      )

      const [sentCount, setSentCount] = useState(0)

      // 将所有记录转换为列表格式，保持后端原始顺序
      const queueRecords = Array.from(recordMap.values()).flat()

      const renderRecordItem = (record: PublishRecordItem) => {
        return (
          <QueueItem
            key={record.id}
            record={record}
            onRetry={(record) => {
              // TODO: 实现重试逻辑
              console.log('Retry record:', record)
            }}
            onEdit={(record) => {
              // TODO: 实现编辑逻辑
              console.log('Edit record:', record)
            }}
            onMore={(record) => {
              // TODO: 实现更多操作逻辑
              console.log('More actions for record:', record)
            }}
          />
        )
      }

      if (listLoading) {
        return (
          <div className={styles.listMode}>
            <div className={styles.listHeader}>
              <div className={styles.listHeaderLeft}>
                <h3>{t('listMode.title' as any)}</h3>
              </div>
            </div>
            <div className={styles.listContent}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.skeletonItem}>
                  <Skeleton active />
                </div>
              ))}
            </div>
          </div>
        )
      }

      const queueTabContent = (
        <div className={styles.tabContent}>
          <DndProvider backend={HTML5Backend}>
            {queueRecords.length > 0
              ? (
                  <div className={styles.queueList}>
                    {queueRecords.map(renderRecordItem)}
                  </div>
                )
              : (
                  <Empty
                    description={t('listMode.noRecords' as any)}
                    className={styles.emptyState}
                  />
                )}
          </DndProvider>
        </div>
      )

      const sentTabContent = (
        <SentList
          platform={accountActive?.type || ''}
          uid={accountActive?.uid || ''}
          onDataChange={setSentCount}
          accountInfo={accountActive
            ? {
                avatar: accountActive.avatar,
                nickname: accountActive.nickname,
                account: accountActive.account,
              }
            : undefined}
        />
      )

      const tabItems = [
        {
          key: 'queue',
          label: (
            <div className={styles.tabLabel}>
              <span>{t('listMode.queue' as any)}</span>
              {queueRecords.length > 0
                ? (
                    <span className={styles.tabBadge}>
                      {queueRecords.length}
                    </span>
                  )
                : (
                    <span className={styles.tabBadgeNone}>
                    </span>
                  )}
            </div>
          ),
          children: queueTabContent,
        },
        {
          key: 'sent',
          label: (
            <div className={styles.tabLabel}>
              <span>{t('listMode.sent' as any)}</span>
              {sentCount > 0 ? <span className={styles.tabBadge}>{sentCount}</span> : ''}
            </div>
          ),
          children: sentTabContent,
        },
      ]

      return (
        <div className={styles.listMode}>
          <Tabs
            items={tabItems}
            className={styles.listTabs}
            size="small"
          />
        </div>
      )
    },
  ),
)

export default ListMode
