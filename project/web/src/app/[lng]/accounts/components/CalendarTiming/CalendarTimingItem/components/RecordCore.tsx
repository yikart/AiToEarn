import type {
  ForwardedRef,
} from 'react'
import type {
  PublishRecordItem,
} from '@/api/plat/types/publish.types'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  FullscreenOutlined,
  LikeOutlined,
  LoadingOutlined,
  MessageOutlined,
  MoreOutlined,
  SendOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import {
  forwardRef,
  memo,
  useMemo,
  useRef,
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
import ScrollButtonContainer from '@/components/ScrollButtonContainer'
import { MediaPreview, type MediaPreviewItem } from '@/components/common/MediaPreview'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem
}

function PubStatus({ status }: { status: PublishStatus }) {
  const { t } = useTransClient('publish')

  return (
    <div className="pubStatus">
      {status === PublishStatus.FAIL
        ? (
            <Badge variant="destructive" className="gap-1">
              {t('status.publishFailed')}
              <CloseCircleOutlined />
            </Badge>
          )
        : status === PublishStatus.PUB_LOADING
          ? (
              <Badge variant="secondary" className="gap-1">
                {t('status.publishing')}
                <LoadingOutlined />
              </Badge>
            )
          : status === PublishStatus.RELEASED
            ? (
                <Badge className="gap-1 bg-success text-success-foreground">
                  {t('status.publishSuccess')}
                  <CheckCircleOutlined />
                </Badge>
              )
            : status === PublishStatus.UNPUBLISH
              ? (
                  <Badge variant="outline" className="gap-1">
                    {t('status.waitingPublish')}
                    <ClockCircleOutlined />
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
      const { calendarCallWidth, setListLoading, getPubRecord }
        = useCalendarTiming(
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
      const [previewOpen, setPreviewOpen] = useState(false)
      const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])

      // 处理媒体预览
      const handleMediaClick = () => {
        const items: MediaPreviewItem[] = []

        if (publishRecord.videoUrl) {
          items.push({
            type: 'video',
            src: publishRecord.videoUrl,
            title: publishRecord.title || publishRecord.desc,
          })
        } else if (publishRecord.imgUrlList && publishRecord.imgUrlList.length > 0) {
          items.push(...publishRecord.imgUrlList.map(url => ({
            type: 'image' as const,
            src: getOssUrl(url),
          })))
        }

        if (items.length > 0) {
          setPreviewItems(items)
          setPreviewOpen(true)
        }
      }

      const dropdownItems = useMemo(() => {
        const items: Array<{ label: string, onClick: () => void, danger?: boolean }> = []

        if (publishRecord.workLink) {
          items.push({
            label: t('buttons.copyLink'),
            onClick: async () => {
              await navigator.clipboard.writeText(
                publishRecord?.workLink ?? '',
              )
            },
          })
        }

        /**
         * 删除按钮显示逻辑：
         * 1. 未发布的、发布失败的，直接显示删除按钮。
         * 2. 已发布的，除了小红书、抖音、视频号、ins、tiktok之外,其他平台均显示删除按钮。
         *    注意：Facebook 只有post类型显示删除按钮。
         */
        const shouldShowDelete = (() => {
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
        })()

        if (shouldShowDelete) {
          items.push({
            label: t('buttons.delete'),
            danger: true,
            onClick: async () => {
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
            },
          })
        }

        return items
      }, [publishRecord, t, setListLoading, getPubRecord])

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
        if (!clientType) return null
        if (clientType === ClientType.WEB) {
          return t('clientType.web' as any)
        }
        if (clientType === ClientType.APP) {
          return t('clientType.app' as any)
        }
        return null
      }

      const recordInfo = useMemo(() => {
        return [
          {
            label: t('record.metrics.views'),
            icon: <EyeOutlined />,
            key: 'viewCount',
          },
          {
            label: t('record.metrics.comments'),
            icon: <MessageOutlined />,
            key: 'commentCount',
          },
          {
            label: t('record.metrics.likes'),
            icon: <LikeOutlined />,
            key: 'likeCount',
          },
          {
            label: t('record.metrics.shares'),
            icon: <ShareAltOutlined />,
            key: 'shareCount',
          },
        ]
      }, [t])

      return (
        <>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="recordCore"
              style={{ width: `${calendarCallWidth}px` }}
            >
              <div className="recordCore-left">
                <img src={platIcon} style={{ width: '25px', height: '25px' }} />
                <div className="recordCore-left-date">{days.format('HH:mm')}</div>
              </div>
              {
                publishRecord.coverUrl
                && (
                  <div className="recordCore-right">
                    <img src={getOssUrl(publishRecord.coverUrl || '')} />
                  </div>
                )
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="recordPopover">
            {(() => {
              const desc = `${publishRecord.desc} ${publishRecord.topics ? publishRecord.topics?.map(v => `#${v}`).join(' ') : ''}`
              return (
            <div className="recordDetails">
              <div className="recordDetails-top">
                <div className="recordDetails-top-left">
                  {days.format('YYYY-MM-DD HH:mm')}
                  <FieldTimeOutlined />
                </div>
                <Button variant="ghost" size="sm">
                  <FullscreenOutlined />
                </Button>
              </div>
                <div className="recordDetails-center">
                  <div className="recordDetails-center-left">
                    <div className="recordDetails-center-left-user">
                      <AvatarPlat account={account} size="large" />
                      <span className="recordDetails-center-title">
                        {account?.nickname}
                      </span>
                      {/* 客户端来源标签（web/flutter app），为空不显示 */}
                      {account?.clientType && (
                        <span
                          className="recordDetails-center-clientType"
                          data-type={account.clientType}
                        >
                          {getClientTypeLabel(account.clientType)}
                        </span>
                      )}
                    </div>
                    <div
                      title={desc}
                      className="recordDetails-center-left-desc"
                    >
                      {desc}
                    </div>
                    <div className="recordDetails-center-left-status">
                      {publishRecord && (
                        <PubStatus status={publishRecord.status} />
                      )}
                    </div>
                    <div
                      title={publishRecord.errorMsg}
                      className="recordDetails-center-left-failMsg"
                    >
                      {publishRecord.errorMsg}
                    </div>
                  </div>
                  {
                    (publishRecord.videoUrl || publishRecord.imgUrlList?.length > 0)
                    && (
                      <div className="recordDetails-center-right">
                        <img
                          src={getOssUrl(publishRecord.coverUrl || '')}
                          alt="preview"
                          className="cursor-pointer max-w-full rounded"
                          onClick={handleMediaClick}
                        />
                      </div>
                    )
                  }
                </div>
                <ScrollButtonContainer>
                  <div className="recordDetails-info">
                    {recordInfo.map(v => (
                      <div key={v.label} className="recordDetails-info-item">
                        <div className="recordDetails-info-item-top">
                          {v.icon}
                          <span>{v.label}</span>
                        </div>
                        {publishRecord.engagement && (
                          <div className="recordDetails-info-item-num">
                            {publishRecord.engagement[v.key as 'viewCount'] ?? 0}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollButtonContainer>
                <div className="recordDetails-bottom">
                  {publishRecord.workLink && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(publishRecord.workLink, '_blank')
                      }}
                    >
                      <ExportOutlined />
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
                          <SendOutlined />
                          {t('buttons.publishNow')}
                        </Button>
                      )
                    : (
                        <></>
                      )}
                  {dropdownItems && dropdownItems.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreOutlined />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {dropdownItems.map((item, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={item.onClick}
                            className={item.danger ? 'text-destructive' : ''}
                          >
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              )
            })()}
          </PopoverContent>
        </Popover>

        {/* 媒体预览 */}
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          onClose={() => setPreviewOpen(false)}
        />
      </>
      )
    },
  ),
)

export default RecordCore
