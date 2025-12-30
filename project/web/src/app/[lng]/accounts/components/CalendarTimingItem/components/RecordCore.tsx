/**
 * RecordCore 组件
 *
 * 功能描述: 发布记录详情组件
 * - 桌面端：使用 Popover 显示详情
 * - 移动端：使用全屏 Dialog 显示详情
 */

import type {
  ForwardedRef,
} from 'react'
import type {
  PublishRecordItem,
} from '@/api/plat/types/publish.types'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
  X,
  XCircle,
} from 'lucide-react'
import {
  forwardRef,
  memo,
  useMemo,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { deletePlatWorkApi, deletePublishRecordApi, nowPubTaskApi } from '@/api/plat/publish'
import {
  PublishStatus,
} from '@/api/plat/types/publish.types'
import { ClientType } from '@/app/[lng]/accounts/accounts.enums'
import { getDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { MediaPreview } from '@/components/common/MediaPreview'
import ScrollButtonContainer from '@/components/ScrollButtonContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem
}

// 发布状态组件
function PubStatus({ status }: { status: PublishStatus }) {
  const { t } = useTransClient('publish')

  return (
    <div className="inline-flex items-center">
      {status === PublishStatus.FAIL
        ? (
            <Badge variant="destructive" className="gap-1.5">
              {t('status.publishFailed')}
              <XCircle className="h-3 w-3" />
            </Badge>
          )
        : status === PublishStatus.PUB_LOADING
          ? (
              <Badge variant="secondary" className="gap-1.5 bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700">
                {t('status.publishing')}
                <Loader2 className="h-3 w-3 animate-spin" />
              </Badge>
            )
          : status === PublishStatus.RELEASED
            ? (
                <Badge variant="secondary" className="gap-1.5 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                  {t('status.publishSuccess')}
                  <CheckCircle2 className="h-3 w-3" />
                </Badge>
              )
            : status === PublishStatus.UNPUBLISH
              ? (
                  <Badge variant="secondary" className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                    {t('status.waitingPublish')}
                    <Clock className="h-3 w-3" />
                  </Badge>
                )
              : (
                  <></>
                )}
    </div>
  )
}

const RecordCore = memo(
  forwardRef(
    (
      { publishRecord }: IRecordCoreProps,
      ref: ForwardedRef<IRecordCoreRef>,
    ) => {
      const isMobile = useIsMobile()
      const { calendarCallWidth, setListLoading, getPubRecord } = useCalendarTiming(
        useShallow(state => ({
          calendarCallWidth: state.calendarCallWidth,
          setListLoading: state.setListLoading,
          getPubRecord: state.getPubRecord,
        })),
      )
      const { accountMap } = useAccountStore(
        useShallow(state => ({
          accountMap: state.accountMap,
        })),
      )
      const [popoverOpen, setPopoverOpen] = useState(false)
      const { t } = useTransClient('publish')
      const [nowPubLoading, setNowPubLoading] = useState(false)
      const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false)
      const [mediaPreviewIndex, setMediaPreviewIndex] = useState(0)

      /**
       * 删除按钮显示逻辑
       */
      const shouldShowDelete = useMemo(() => {
        if (
          publishRecord.status === PublishStatus.UNPUBLISH
          || publishRecord.status === PublishStatus.FAIL
        ) {
          return true
        }

        if (publishRecord.status === PublishStatus.RELEASED) {
          const noDeletablePlats = [
            PlatType.Xhs,
            PlatType.Douyin,
            PlatType.WxSph,
            PlatType.Instagram,
            PlatType.Tiktok,
          ]

          if (noDeletablePlats.includes(publishRecord.accountType)) {
            return false
          }

          if (publishRecord.accountType === PlatType.Facebook) {
            return publishRecord.option?.facebook?.content_category === 'post'
          }

          return true
        }

        return false
      }, [publishRecord])

      const days = useMemo(() => {
        return getDays(publishRecord.publishTime)
      }, [publishRecord])

      const account = useMemo(() => {
        return accountMap.get(publishRecord?.accountId ?? '')
      }, [accountMap, publishRecord.accountId])

      const platIcon = useMemo(() => {
        return AccountPlatInfoMap.get(
          publishRecord?.accountType ?? PlatType.Xhs,
        )?.icon
      }, [publishRecord])

      const getClientTypeLabel = (clientType?: ClientType) => {
        if (!clientType)
          return null
        if (clientType === ClientType.WEB) {
          return t('clientType.web')
        }
        if (clientType === ClientType.APP) {
          return t('clientType.app')
        }
        return null
      }

      const recordInfo = useMemo(() => {
        return [
          {
            label: t('record.metrics.views'),
            icon: <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />,
            key: 'viewCount',
          },
          {
            label: t('record.metrics.comments'),
            icon: <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />,
            key: 'commentCount',
          },
          {
            label: t('record.metrics.likes'),
            icon: <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />,
            key: 'likeCount',
          },
          {
            label: t('record.metrics.shares'),
            icon: <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />,
            key: 'shareCount',
          },
        ]
      }, [t])

      const desc = useMemo(() => {
        return `${publishRecord.desc} ${publishRecord.topics ? publishRecord.topics?.map(v => `#${v}`).join(' ') : ''}`
      }, [publishRecord])

      const mediaPreviewItems = useMemo(() => {
        const items: Array<{ type: 'image' | 'video', src: string }> = []

        if (publishRecord.videoUrl) {
          items.push({
            type: 'video',
            src: getOssUrl(publishRecord.videoUrl),
          })
        }

        if (publishRecord.imgUrlList && publishRecord.imgUrlList.length > 0) {
          publishRecord.imgUrlList.forEach((imgUrl) => {
            items.push({
              type: 'image',
              src: getOssUrl(imgUrl),
            })
          })
        }

        if (items.length === 0 && publishRecord.coverUrl) {
          items.push({
            type: 'image',
            src: getOssUrl(publishRecord.coverUrl),
          })
        }

        return items
      }, [publishRecord])

      const handleCoverClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (mediaPreviewItems.length > 0) {
          setMediaPreviewIndex(0)
          setMediaPreviewOpen(true)
        }
      }

      const handleCoverMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation()
      }

      // 触发按钮
      const TriggerButton = (
        <Button
          variant="outline"
          className={cn(
            'flex justify-between items-center box-border px-1 md:px-1.5 w-full h-auto py-1 md:py-1.5',
            'bg-card hover:bg-accent border-border',
            'rounded-md transition-colors',
            'text-foreground font-normal',
            'shadow-none cursor-pointer',
          )}
          style={{ width: isMobile ? '100%' : `${calendarCallWidth}px` }}
        >
          <div className="flex items-center gap-1 md:gap-1.5">
            <img
              src={platIcon}
              className="w-5 h-5 md:w-[25px] md:h-[25px]"
              alt="platform"
            />
            <div className="font-semibold text-xs md:text-sm">{days.format('HH:mm')}</div>
          </div>
          {publishRecord.coverUrl && (
            <div className="flex items-center">
              <img
                src={getOssUrl(publishRecord.coverUrl || '')}
                className="w-5 h-5 md:w-6 md:h-6 rounded object-cover"
                alt="cover"
              />
            </div>
          )}
        </Button>
      )

      // 详情内容（复用于 Popover 和 Dialog）
      const RecordContent = ({ inDialog = false }: { inDialog?: boolean }) => (
        <div className={cn('w-full box-border', inDialog && 'flex flex-col h-full')} onMouseDown={e => e.stopPropagation()}>
          {/* 顶部：时间 */}
          <div className={cn(
            'flex justify-between items-center border-b border-border p-2.5 md:p-3',
            inDialog && 'shrink-0',
          )}
          >
            <div className="font-semibold flex items-center gap-2 text-sm md:text-base">
              {days.format('YYYY-MM-DD HH:mm')}
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </div>
            {inDialog && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
                onClick={() => setPopoverOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 中间：用户信息和内容 */}
          <div className={cn(
            'flex flex-col md:flex-row justify-between gap-3 border-b border-border p-2.5 md:p-3',
            inDialog && 'flex-1 overflow-auto',
          )}
          >
            <div className="flex-1 min-h-[120px] md:min-h-[150px]">
              <div className="flex items-center mb-2 md:mb-3">
                <AvatarPlat account={account} size={isMobile ? 'default' : 'large'} />
                <span className="ml-2 md:ml-2.5 inline-block font-bold text-sm md:text-base">
                  {account?.nickname}
                </span>
                {account?.clientType && (
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.5 rounded text-[10px] md:text-[11px] font-medium ml-2',
                      account.clientType === 'web'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                        : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
                    )}
                  >
                    {getClientTypeLabel(account.clientType)}
                  </span>
                )}
              </div>
              <div
                title={desc}
                className="line-clamp-3 md:line-clamp-2 overflow-hidden text-ellipsis mt-2 md:mt-2.5 pr-0 md:pr-2.5 text-sm md:text-base"
              >
                {desc}
              </div>
              <div className="mt-3 md:mt-4">
                {publishRecord && (
                  <PubStatus status={publishRecord.status} />
                )}
              </div>
              {publishRecord.errorMsg && (
                <div
                  title={publishRecord.errorMsg}
                  className="mt-1 text-xs text-destructive"
                >
                  {publishRecord.errorMsg}
                </div>
              )}
            </div>

            {/* 媒体预览 */}
            {mediaPreviewItems.length > 0 && (
              <div
                className={cn('shrink-0', isMobile ? 'w-full' : '')}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              >
                <div
                  data-cover-preview
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleCoverClick(e)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleCoverMouseDown(e)
                  }}
                  className={cn(
                    'rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border',
                    isMobile ? 'w-full h-48' : 'w-[145px] h-[145px]',
                  )}
                >
                  <img
                    src={getOssUrl(publishRecord.coverUrl || publishRecord.imgUrlList?.[0] || '')}
                    className="w-full h-full object-cover pointer-events-none"
                    alt="cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 信息指标 */}
          <ScrollButtonContainer>
            <div className="flex gap-3 md:gap-4 p-2 md:p-2.5 border-b border-border overflow-x-auto">
              {recordInfo.map(v => (
                <div key={v.label} className="flex-shrink-0 md:flex-1 min-w-[60px] md:min-w-0">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    {v.icon}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{v.label}</span>
                  </div>
                  {publishRecord.engagement && (
                    <div className="text-sm md:text-base font-semibold mt-0.5 md:mt-1">
                      {publishRecord.engagement[v.key as 'viewCount'] ?? 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollButtonContainer>

          {/* 底部：操作按钮 */}
          <div className={cn(
            'flex gap-2 md:gap-2.5 p-2.5 md:p-3',
            isMobile ? 'flex-col' : 'flex-row justify-end',
            inDialog && 'shrink-0',
          )}
          >
            {publishRecord.workLink && (
              <Button
                className={cn('cursor-pointer', isMobile && 'w-full')}
                onClick={() => {
                  window.open(publishRecord.workLink, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('record.viewWork')}
              </Button>
            )}

            {publishRecord.status !== PublishStatus.RELEASED
              && publishRecord.status !== PublishStatus.PUB_LOADING
              ? (
                  <Button
                    className={cn('cursor-pointer', isMobile && 'w-full')}
                    disabled={nowPubLoading}
                    onClick={async () => {
                      setNowPubLoading(true)
                      await nowPubTaskApi(publishRecord.id)
                      getPubRecord()
                      setNowPubLoading(false)
                    }}
                  >
                    {nowPubLoading
                      ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )
                      : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                    {t('buttons.publishNow')}
                  </Button>
                )
              : null}

            {(publishRecord.workLink || shouldShowDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className={cn('cursor-pointer', isMobile && 'w-full')}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {publishRecord.workLink && (
                    <DropdownMenuItem
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          publishRecord?.workLink ?? '',
                        )
                      }}
                    >
                      {t('buttons.copyLink')}
                    </DropdownMenuItem>
                  )}
                  {shouldShowDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        setPopoverOpen(false)
                        setListLoading(true)
                        if (publishRecord.status === PublishStatus.RELEASED) {
                          const res = await deletePlatWorkApi(publishRecord.accountId!, publishRecord.dataId)
                          if (!res) {
                            setListLoading(false)
                            return
                          }
                        }
                        await deletePublishRecordApi(publishRecord.id)
                        getPubRecord()
                      }}
                    >
                      {t('buttons.delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )

      return (
        <>
          {isMobile
            ? (
                // 移动端：全屏 Dialog
                <>
                  <div onClick={() => setPopoverOpen(true)}>
                    {TriggerButton}
                  </div>
                  <Dialog open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <DialogContent
                      className="w-[calc(100%-24px)] h-[85vh] max-w-full p-0 flex flex-col overflow-hidden"
                      onInteractOutside={(e) => {
                        if (mediaPreviewOpen) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <DialogTitle className="sr-only">
                        {days.format('YYYY-MM-DD HH:mm')}
                      </DialogTitle>
                      <RecordContent inDialog />
                    </DialogContent>
                  </Dialog>
                </>
              )
            : (
                // 桌面端：Popover
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    {TriggerButton}
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    className="w-[450px] p-0"
                    align="start"
                    onInteractOutside={(e) => {
                      if (mediaPreviewOpen) {
                        e.preventDefault()
                        return
                      }
                      const target = e.target as HTMLElement
                      if (target.closest('[data-cover-preview]')) {
                        e.preventDefault()
                      }
                    }}
                    onPointerDownOutside={(e) => {
                      if (mediaPreviewOpen) {
                        e.preventDefault()
                        return
                      }
                      const target = e.target as HTMLElement
                      if (target.closest('[data-cover-preview]')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <RecordContent />
                  </PopoverContent>
                </Popover>
              )}

          {/* 媒体预览 */}
          <MediaPreview
            open={mediaPreviewOpen}
            items={mediaPreviewItems}
            initialIndex={mediaPreviewIndex}
            onClose={() => setMediaPreviewOpen(false)}
          />
        </>
      )
    },
  ),
)

export default RecordCore
