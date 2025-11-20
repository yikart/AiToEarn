import type { MenuProps } from 'antd'
import type { TooltipRef } from 'antd/lib/tooltip'
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
import { Button, Dropdown, Image, Popover, Tag } from 'antd'
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
import { getDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import ScrollButtonContainer from '@/components/ScrollButtonContainer'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'
import styles from './recordCore.module.scss'

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem
}

function PubStatus({ status }: { status: PublishStatus }) {
  const { t } = useTransClient('publish')

  return (
    <div className={styles.pubStatus}>
      {status === PublishStatus.FAIL
        ? (
            <Tag color="error">
              {t('status.publishFailed')}
              <CloseCircleOutlined />
            </Tag>
          )
        : status === PublishStatus.PUB_LOADING
          ? (
              <Tag color="cyan">
                {t('status.publishing')}
                <LoadingOutlined />
              </Tag>
            )
          : status === PublishStatus.RELEASED
            ? (
                <Tag color="success">
                  {t('status.publishSuccess')}
                  <CheckCircleOutlined />
                </Tag>
              )
            : status === PublishStatus.UNPUBLISH
              ? (
                  <Tag color="processing">
                    {t('status.waitingPublish')}
                    <ClockCircleOutlined />
                  </Tag>
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
      const popoverRef = useRef<TooltipRef>(null)
      const { t } = useTransClient('publish')
      const [nowPubLoading, setNowPubLoading] = useState(false)

      const dropdownItems: MenuProps['items'] = useMemo(() => {
        const dropdownItemsArr: MenuProps['items'] = []

        if (publishRecord.workLink) {
          dropdownItemsArr.push({
            key: '2',
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
         * 2. 已发布的，除了小红书、抖音、视频号、ins、tiktok之外，其他平台均显示删除按钮。
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
          dropdownItemsArr.push({
            key: '3',
            danger: true,
            label: t('buttons.delete'),
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

        return dropdownItemsArr
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
        <Popover
          ref={popoverRef}
          placement="right"
          rootClassName={styles.recordPopover}
          open={popoverOpen}
          onOpenChange={e => setPopoverOpen(e)}
          content={() => {
            const desc = `${publishRecord.desc} ${publishRecord.topics ? publishRecord.topics?.map(v => `#${v}`).join(' ') : ''}`
            return (
              <div className={styles.recordDetails}>
                <div className="recordDetails-top">
                  <div className="recordDetails-top-left">
                    {days.format('YYYY-MM-DD HH:mm')}
                    <FieldTimeOutlined />
                  </div>
                  <Button icon={<FullscreenOutlined />} size="small" />
                </div>
                <div className="recordDetails-center">
                  <div className="recordDetails-center-left">
                    <div className="recordDetails-center-left-user">
                      <AvatarPlat account={account} size="large" />
                      <span className="recordDetails-center-title">
                        {account?.nickname}
                      </span>
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
                    (publishRecord.videoUrl && publishRecord.imgUrlList.length !== 0)
                    && (
                      <div className="recordDetails-center-right">
                        {publishRecord.videoUrl
                          ? (
                              <>
                                <Image
                                  src={getOssUrl(publishRecord.coverUrl || '')}
                                  preview={{
                                    destroyOnHidden: true,
                                    imageRender: () => (
                                      <video
                                        muted
                                        width="80%"
                                        height={500}
                                        controls
                                        src={publishRecord.videoUrl}
                                      />
                                    ),
                                    toolbarRender: () => null,
                                  }}
                                />
                              </>
                            )
                          : (
                              <Image.PreviewGroup items={publishRecord.imgUrlList}>
                                <Image src={getOssUrl(publishRecord.coverUrl || '')} />
                              </Image.PreviewGroup>
                            )}
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
                      icon={<ExportOutlined />}
                      onClick={() => {
                        window.open(publishRecord.workLink, '_blank')
                      }}
                    >
                      {t('record.viewWork')}
                    </Button>
                  )}

                  {publishRecord.status !== PublishStatus.RELEASED
                    && publishRecord.status !== PublishStatus.PUB_LOADING
                    ? (
                        <Button
                          loading={nowPubLoading}
                          icon={<SendOutlined />}
                          onClick={async () => {
                            setNowPubLoading(true)
                            await nowPubTaskApi(publishRecord.id)
                            getPubRecord()
                            setNowPubLoading(false)
                          }}
                        >
                          {t('buttons.publishNow')}
                        </Button>
                      )
                    : (
                        <></>
                      )}
                  {dropdownItems && dropdownItems.length > 0 && (
                    <Dropdown menu={{ items: dropdownItems }} placement="top">
                      <Button icon={<MoreOutlined />} />
                    </Dropdown>
                  )}
                </div>
              </div>
            )
          }}
          trigger="click"
        >
          <Button
            className={styles.recordCore}
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
        </Popover>
      )
    },
  ),
)

export default RecordCore
