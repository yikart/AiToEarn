/**
 * QueueItem 组件
 * 功能：显示发布队列中的单个记录项
 */
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PublishStatus } from '@/api/plat/types/publish.types'
import { getDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'

interface QueueItemProps {
  record: PublishRecordItem
  onRetry?: (record: PublishRecordItem) => void
  onEdit?: (record: PublishRecordItem) => void
  onMore?: (record: PublishRecordItem) => void
}

const QueueItem = memo(({ record, onRetry, onEdit, onMore }: QueueItemProps) => {
  const { t } = useTransClient('publish')
  const { accountMap, accountActive } = useAccountStore(
    useShallow(state => ({
      accountMap: state.accountMap,
      accountActive: state.accountActive,
    })),
  )

  const account = accountMap.get(record.accountId)
  const platInfo = AccountPlatInfoMap.get(record.accountType)
  const days = getDays(record.publishTime)

  const getStatusInfo = () => {
    switch (record.status) {
      case PublishStatus.FAIL:
        return {
          color: 'error',
          text: t('status.publishFailed'),
          icon: <CloseCircleOutlined />,
        }
      case PublishStatus.PUB_LOADING:
        return {
          color: 'cyan',
          text: t('status.publishing'),
          icon: <LoadingOutlined />,
        }
      case PublishStatus.RELEASED:
        return {
          color: 'success',
          text: t('status.publishSuccess'),
          icon: <CheckCircleOutlined />,
        }
      case PublishStatus.UNPUBLISH:
        return {
          color: 'processing',
          text: t('status.waitingPublish'),
          icon: <ClockCircleOutlined />,
        }
      default:
        return {
          color: 'default',
          text: t('status.unknown'),
          icon: null,
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300 ease-in-out mb-4 last:mb-0 hover:shadow-md hover:-translate-y-0.5">
      {/* 状态头部 */}
      <div className="flex justify-between items-start p-4 pb-3 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">{days.format('MMM DD')}</span>
            <span className="text-sm text-muted-foreground font-medium">{days.format('h:mm A')}</span>
          </div>
          <span className="text-base font-semibold text-foreground">{statusInfo.text}</span>
        </div>
        <div className="flex-shrink-0">
          {/* 可以在这里添加状态徽章 */}
        </div>
      </div>

      {/* 错误信息横幅 */}
      {record.status === PublishStatus.FAIL && record.errorMsg && (
        <div className="flex items-center gap-3 p-3 px-5 bg-destructive/10 border-b border-destructive/30">
          <div className="text-destructive text-base flex-shrink-0">
            <CloseCircleOutlined />
          </div>
          <div className="text-destructive text-sm leading-tight flex-1">
            {record.errorMsg}
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="p-5">
        <div className="flex flex-row justify-between gap-3">
          {/* 左侧：账户信息和文本内容 */}
          <div className="flex flex-col gap-3">
            {/* 账户信息 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOssUrl(accountActive?.avatar || '')} alt={accountActive?.nickname || accountActive?.account} />
                  <AvatarFallback>
                    {accountActive?.nickname?.charAt(0) || accountActive?.account?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-background rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                  <img
                    src={platInfo?.icon}
                    alt="platform"
                    className="w-3 h-3 object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-foreground mb-1 leading-tight">
                  {account?.nickname}
                </div>
                <div className="text-sm text-muted-foreground leading-tight">
                  @
                  {account?.account}
                </div>
              </div>
            </div>

            {/* 发布内容文本 */}
            <div className="text-base text-foreground leading-relaxed mb-4 break-words">
              {record.desc}
            </div>
          </div>

          {/* 右侧：媒体内容 */}
          <div className="relative">
            {(record.coverUrl || record.imgUrlList?.length > 0) && (
              <div className="mb-4">
                {record.videoUrl
                  ? (
                      <div className="relative rounded-lg overflow-hidden bg-muted max-w-[300px]">
                        <img
                          src={getOssUrl(record.coverUrl || '')}
                          alt="video thumbnail"
                          className="w-full h-auto block rounded-lg"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/80 hover:scale-110">
                          <div className="text-white text-base ml-0.5">▶</div>
                        </div>
                      </div>
                    )
                  : (
                      <div className="rounded-lg overflow-hidden bg-muted max-w-[300px]">
                        <img
                          src={getOssUrl(record.coverUrl || record.imgUrlList?.[0] || '')}
                          alt="post image"
                          className="w-full h-auto block rounded-lg"
                        />
                      </div>
                    )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex justify-between items-center p-4 px-5 border-t border-border bg-muted/30">
        <div className="text-sm text-muted-foreground">
          {t('creationInfo', { date: days.format('YYYY-MM-DD') })}
        </div>
        <div className="flex items-center gap-2">
          {record.status === PublishStatus.UNPUBLISH && (
            <Button
              onClick={() => onRetry?.(record)}
              size="sm"
              className="h-8 rounded-md font-medium"
            >
              <SendOutlined />
              {t('buttons.publishNow')}
            </Button>
          )}
          {record.workLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(record.workLink)
                  // 可以添加一个提示消息
                }
                catch (err) {
                  console.error('复制链接失败:', err)
                }
              }}
              className="h-8 rounded-md font-medium border border-border bg-background transition-all hover:border-primary hover:bg-accent"
            >
              <SendOutlined />
              {t('buttons.copyLink')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

QueueItem.displayName = 'QueueItem'

export default QueueItem
