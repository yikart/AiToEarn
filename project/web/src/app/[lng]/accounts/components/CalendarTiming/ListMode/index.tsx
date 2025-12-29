import type { ForwardedRef } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { forwardRef, memo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccountStore } from '@/store/account'
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
          <div className="w-full h-full flex flex-col p-2.5 px-[15px] box-border">
            <div className="flex justify-between items-center mb-[15px] pb-2.5 border-b border-border">
              <div className="flex flex-col gap-1">
                <h3 className="m-0 text-lg font-semibold text-foreground">
                  {t('listMode.title')}
                </h3>
              </div>
            </div>
            <div className="h-full p-0 pr-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="py-3 px-0.5 border-b border-border last:border-b-0">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      const queueTabContent = (
        <div className="h-full p-0 pr-1.5">
          <DndProvider backend={HTML5Backend}>
            {queueRecords.length > 0
              ? (
                  <div className="h-full overflow-y-auto overflow-x-hidden p-0">
                    {queueRecords.map(renderRecordItem)}
                  </div>
                )
              : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-sm">{t('listMode.noRecords')}</p>
                  </div>
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

      return (
        <div className="w-full h-full flex flex-col p-2.5 px-[15px] box-border">
          <Tabs defaultValue="queue" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue" className="gap-2">
                <span>{t('listMode.queue')}</span>
                {queueRecords.length > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {queueRecords.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <span>{t('listMode.sent')}</span>
                {sentCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {sentCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="flex-1 min-h-0 mt-4">
              {queueTabContent}
            </TabsContent>
            <TabsContent value="sent" className="flex-1 min-h-0 mt-4">
              {sentTabContent}
            </TabsContent>
          </Tabs>
        </div>
      )
    },
  ),
)

export default ListMode
