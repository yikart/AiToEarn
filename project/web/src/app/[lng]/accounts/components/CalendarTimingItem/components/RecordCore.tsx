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
  Maximize2,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
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
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem
}

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
       * 删除按钮显示逻辑：
       * 1. 未发布的、发布失败的，直接显示删除按钮。
       * 2. 已发布的，除了小红书、抖音、视频号、ins、tiktok之外，其他平台均显示删除按钮。
       *    注意：Facebook 只有post类型显示删除按钮。
       */
      const shouldShowDelete = useMemo(() => {
        // 规则1：未发布或发布失败的，显示删除按钮
        if (
          publishRecord.status === PublishStatus.UNPUBLISH
          || publishRecord.status === PublishStatus.FAIL
        ) {
          return true
        }

        // 规则2：已发布的，根据平台判断
        if (publishRecord.status === PublishStatus.RELEASED) {
          // 不允许删除的平台列表
          const noDeletablePlats = [
            PlatType.Xhs, // 小红书
            PlatType.Douyin, // 抖音
            PlatType.WxSph, // 视频号
            PlatType.Instagram, // ins
            PlatType.Tiktok, // tiktok
          ]

          // 如果是不允许删除的平台，不显示删除按钮
          if (noDeletablePlats.includes(publishRecord.accountType)) {
            return false
          }

          // Facebook特殊处理：post类型不显示删除按钮
          if (publishRecord.accountType === PlatType.Facebook) {
            // 如果是post类型，不显示删除按钮
            return publishRecord.option?.facebook?.content_category === 'post'
          }

          // 其他已发布的平台，显示删除按钮
          return true
        }

        // 发布中的状态，不显示删除按钮
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

      /**
       * 根据 clientType 获取显示的标签文本
       * @param clientType 客户端类型（web/app）
       * @returns 标签显示文本
       */
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
            icon: <Eye className="h-4 w-4" />,
            key: 'viewCount',
          },
          {
            label: t('record.metrics.comments'),
            icon: <MessageCircle className="h-4 w-4" />,
            key: 'commentCount',
          },
          {
            label: t('record.metrics.likes'),
            icon: <Heart className="h-4 w-4" />,
            key: 'likeCount',
          },
          {
            label: t('record.metrics.shares'),
            icon: <Share2 className="h-4 w-4" />,
            key: 'shareCount',
          },
        ]
      }, [t])

      const desc = useMemo(() => {
        return `${publishRecord.desc} ${publishRecord.topics ? publishRecord.topics?.map(v => `#${v}`).join(' ') : ''}`
      }, [publishRecord])

      // 构建媒体预览 items
      const mediaPreviewItems = useMemo(() => {
        const items: Array<{ type: 'image' | 'video', src: string }> = []

        // 如果有视频，添加视频
        if (publishRecord.videoUrl) {
          items.push({
            type: 'video',
            src: getOssUrl(publishRecord.videoUrl),
          })
        }

        // 如果有图片列表，添加所有图片
        if (publishRecord.imgUrlList && publishRecord.imgUrlList.length > 0) {
          publishRecord.imgUrlList.forEach((imgUrl) => {
            items.push({
              type: 'image',
              src: getOssUrl(imgUrl),
            })
          })
        }

        // 如果只有封面图，也添加封面图
        if (items.length === 0 && publishRecord.coverUrl) {
          items.push({
            type: 'image',
            src: getOssUrl(publishRecord.coverUrl),
          })
        }

        return items
      }, [publishRecord])

      // 处理封面点击
      const handleCoverClick = (e: React.MouseEvent) => {
        e.stopPropagation() // 阻止事件冒泡，防止 Popover 关闭
        e.preventDefault()
        if (mediaPreviewItems.length > 0) {
          setMediaPreviewIndex(0)
          setMediaPreviewOpen(true)
        }
      }

      // 阻止鼠标按下事件冒泡
      const handleCoverMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation() // 阻止事件冒泡，防止 Popover 关闭
      }

      return (
        <>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex justify-between items-center box-border px-1.5 w-full h-auto py-1.5',
                  'bg-card hover:bg-accent border-border',
                  'rounded-md transition-colors',
                  'text-foreground font-normal',
                  'shadow-none',
                )}
                style={{ width: `${calendarCallWidth}px` }}
              >
                <div className="flex items-center gap-1.5">
                  <img
                    src={platIcon}
                    className="w-[25px] h-[25px]"
                    alt="platform"
                  />
                  <div className="font-semibold text-sm">{days.format('HH:mm')}</div>
                </div>
                {publishRecord.coverUrl && (
                  <div className="flex items-center">
                    <img
                      src={getOssUrl(publishRecord.coverUrl || '')}
                      className="w-6 h-6 rounded object-cover"
                      alt="cover"
                    />
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              className="w-[450px] p-0"
              align="start"
              onInteractOutside={(e) => {
              // MediaPreview 打开时，完全阻止 Popover 关闭
                if (mediaPreviewOpen) {
                  e.preventDefault()
                  return
                }
                // 如果点击的是封面区域，阻止 Popover 关闭
                const target = e.target as HTMLElement
                if (target.closest('[data-cover-preview]')) {
                  e.preventDefault()
                }
              }}
              onPointerDownOutside={(e) => {
              // MediaPreview 打开时，完全阻止 Popover 关闭
                if (mediaPreviewOpen) {
                  e.preventDefault()
                  return
                }
                // 如果点击的是封面区域，阻止 Popover 关闭
                const target = e.target as HTMLElement
                if (target.closest('[data-cover-preview]')) {
                  e.preventDefault()
                }
              }}
            >
              <div className="w-full box-border" onMouseDown={e => e.stopPropagation()}>
                {/* 顶部：时间和全屏按钮 */}
                <div className="flex justify-between items-center border-b border-border p-3">
                  <div className="font-semibold flex items-center gap-2">
                    {days.format('YYYY-MM-DD HH:mm')}
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>

                {/* 中间：用户信息和内容 */}
                <div className="flex justify-between gap-3 border-b border-border p-3">
                  <div className="flex-1 min-h-[150px]">
                    <div className="flex items-center mb-3">
                      <AvatarPlat account={account} size="large" />
                      <span className="ml-2.5 inline-block font-bold">
                        {account?.nickname}
                      </span>
                      {account?.clientType && (
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ml-2',
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
                      className="line-clamp-2 overflow-hidden text-ellipsis mt-2.5 pr-2.5"
                    >
                      {desc}
                    </div>
                    <div className="mt-4">
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
                  {mediaPreviewItems.length > 0 && (
                    <div className="shrink-0" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
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
                        className="w-[145px] h-[145px] rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border"
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
                  <div className="flex gap-4 p-2.5 border-b border-border">
                    {recordInfo.map(v => (
                      <div key={v.label} className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {v.icon}
                          <span className="text-xs text-muted-foreground">{v.label}</span>
                        </div>
                        {publishRecord.engagement && (
                          <div className="text-base font-semibold mt-1">
                            {publishRecord.engagement[v.key as 'viewCount'] ?? 0}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollButtonContainer>

                {/* 底部：操作按钮 */}
                <div className="flex justify-end gap-2.5 p-3">
                  {publishRecord.workLink && (
                    <Button
                      onClick={() => {
                        window.open(publishRecord.workLink, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('record.viewWork')}
                    </Button>
                  )}

                  {publishRecord.status !== PublishStatus.RELEASED
                    && publishRecord.status !== PublishStatus.PUB_LOADING
                    ? (
                        <Button
                          disabled={nowPubLoading}
                          onClick={async () => {
                            setNowPubLoading(true)
                            await nowPubTaskApi(publishRecord.id)
                            getPubRecord()
                            setNowPubLoading(false)
                          }}
                        >
                          {nowPubLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          {t('buttons.publishNow')}
                        </Button>
                      )
                    : null}

                  {(publishRecord.workLink || shouldShowDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
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
            </PopoverContent>
          </Popover>

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
