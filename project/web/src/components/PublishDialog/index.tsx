import type {
  ForwardedRef,
} from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import {
  ArrowRightOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Button, message, Modal, Tooltip } from 'antd'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { CSSTransition } from 'react-transition-group'
import { useWindowSize } from 'react-use'
import { useShallow } from 'zustand/react/shallow'
import { apiCreatePublish } from '@/api/plat/publish'
import { toolsApi } from '@/api/tools'
import {
  getDays,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { bilibiliSkip } from '@/app/[lng]/accounts/plat/BilibiliLogin'
import {
  FacebookPagesModal,
  facebookSkip,
} from '@/app/[lng]/accounts/plat/FacebookLogin'
import { instagramSkip } from '@/app/[lng]/accounts/plat/InstagramLogin'
// 导入各平台授权函数
import { kwaiSkip } from '@/app/[lng]/accounts/plat/kwaiLogin'
import { linkedinSkip } from '@/app/[lng]/accounts/plat/LinkedinLogin'
import { pinterestSkip } from '@/app/[lng]/accounts/plat/PinterestLogin'
import { threadsSkip } from '@/app/[lng]/accounts/plat/ThreadsLogin'
import { tiktokSkip } from '@/app/[lng]/accounts/plat/TiktokLogin'
import { twitterSkip } from '@/app/[lng]/accounts/plat/TwtterLogin'
import { wxGzhSkip } from '@/app/[lng]/accounts/plat/WxGzh'
import { youtubeSkip } from '@/app/[lng]/accounts/plat/YoutubeLogin'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import PlatParamsSetting from '@/components/PublishDialog/compoents/PlatParamsSetting'
import PublishDialogAi from '@/components/PublishDialog/compoents/PublishDialogAi'
import PublishDialogDataPicker from '@/components/PublishDialog/compoents/PublishDialogDataPicker'
import PublishDialogPreview from '@/components/PublishDialog/compoents/PublishDialogPreview'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import usePubParamsVerify from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { generateUUID } from '@/utils'
import styles from './publishDialog.module.scss'

export interface IPublishDialogRef {
  // 设置发布时间
  setPubTime: (pubTime?: string) => void
}

export interface IPublishDialogProps {
  open: boolean
  onClose: () => void
  accounts: SocialAccount[]
  // 发布成功事件
  onPubSuccess?: () => void
  // 默认选中的账户Id
  defaultAccountId?: string
}

const { confirm } = Modal

// 发布作品弹框
const PublishDialog = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        accounts,
        onPubSuccess,
        defaultAccountId,
      }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const { width } = useWindowSize()
      const {
        pubListChoosed,
        setPubListChoosed,
        init,
        clear,
        pubList,
        setStep,
        step,
        setAccountAllParams,
        commonPubParams,
        setExpandedPubItem,
        expandedPubItem,
        setErrParamsMap,
        setPubTime,
        pubTime,
        setOnePubParams,
        setWarningParamsMap,
        setOpenLeft,
        openLeft,
        setPubList,
      } = usePublishDialog(
        useShallow(state => ({
          pubListChoosed: state.pubListChoosed,
          setPubListChoosed: state.setPubListChoosed,
          init: state.init,
          clear: state.clear,
          pubList: state.pubList,
          setPubList: state.setPubList,
          setStep: state.setStep,
          step: state.step,
          setAccountAllParams: state.setAccountAllParams,
          commonPubParams: state.commonPubParams,
          setExpandedPubItem: state.setExpandedPubItem,
          expandedPubItem: state.expandedPubItem,
          setErrParamsMap: state.setErrParamsMap,
          setWarningParamsMap: state.setWarningParamsMap,
          setPubTime: state.setPubTime,
          pubTime: state.pubTime,
          setOnePubParams: state.setOnePubParams,
          openLeft: state.openLeft,
          setOpenLeft: state.setOpenLeft,
        })),
      )
      const { errParamsMap, warningParamsMap }
        = usePubParamsVerify(pubListChoosed)
      const [createLoading, setCreateLoading] = useState(false)
      // 内容安全检测状态
      const [moderationLoading, setModerationLoading] = useState(false)
      const [moderationResult, setModerationResult] = useState<boolean | null>(
        null,
      )
      const [moderationDesc, setModerationDesc] = useState<string>('')
      const [moderationLevel, setModerationLevel] = useState<any>(null)
      // 下载App弹窗状态
      const [downloadModalVisible, setDownloadModalVisible] = useState(false)
      const [currentPlatform, setCurrentPlatform] = useState<string>('')
      // Facebook页面选择弹窗状态
      const [showFacebookPagesModal, setShowFacebookPagesModal]
        = useState(false)
      const { t } = useTransClient('publish')
      const { tasks, md5Cache } = usePublishManageUpload(
        useShallow(state => ({
          tasks: state.tasks,
          md5Cache: state.md5Cache,
        })),
      )

      // 获取账户store
      const { accountGroupList, getAccountList } = useAccountStore(
        useShallow(state => ({
          accountGroupList: state.accountGroupList,
          getAccountList: state.getAccountList,
        })),
      )

      // 匹配上传结果的ossUrl到发布参数中
      useEffect(() => {
        const newPubList = pubListChoosed.map((v) => {
          const newPubItem = { ...v }
          const video = newPubItem.params.video
          const images = newPubItem.params.images

          // 视频匹配
          if (video && !video.ossUrl) {
            newPubItem.params.video!.ossUrl
              = md5Cache[tasks[video.uploadTaskIds!.video!].md5!]?.ossUrl
            newPubItem.params.video!.cover.ossUrl
              = md5Cache[tasks[video.uploadTaskIds!.cover!].md5!]?.ossUrl
            return newPubItem
          }
          // 图片匹配
          if (images) {
            newPubItem.params.images = images.map((img) => {
              img.ossUrl = md5Cache[tasks[img.uploadTaskId!].md5!]?.ossUrl
              return img
            })
            return newPubItem
          }
          return newPubItem
        })
        setPubListChoosed(newPubList)
      }, [md5Cache, tasks])

      // 处理离线账户头像点击，直接跳转到对应平台授权页面
      const handleOfflineAvatarClick = useCallback(
        async (account: SocialAccount) => {
          const platform = account.type
          const targetSpaceId = account.groupId // 使用账户原本的空间ID

          try {
            // 记录授权前的账号数量，用于后续识别新账号
            const beforeAuthCount = accountGroupList.reduce(
              (total, group) => total + group.children.length,
              0,
            )

            // 根据平台类型调用对应的授权函数，传递目标空间ID
            switch (platform) {
              case PlatType.KWAI:
                await kwaiSkip(platform, targetSpaceId)
                break
              case PlatType.BILIBILI:
                await bilibiliSkip(platform, targetSpaceId)
                break
              case PlatType.YouTube:
                await youtubeSkip(platform, targetSpaceId)
                break
              case PlatType.Twitter:
                await twitterSkip(platform, targetSpaceId)
                break
              case PlatType.Tiktok:
                await tiktokSkip(platform, targetSpaceId)
                break
              case PlatType.Facebook:
                try {
                  await facebookSkip(platform, targetSpaceId)
                  // Facebook授权成功后显示页面选择弹窗
                  handleFacebookAuthSuccess()
                }
                catch (error) {
                  console.error(t('messages.facebookAuthFailed' as any), error)
                }
                break
              case PlatType.Instagram:
                await instagramSkip(platform, targetSpaceId)
                break
              case PlatType.Threads:
                await threadsSkip(platform, targetSpaceId)
                break
              case PlatType.WxGzh:
                await wxGzhSkip(platform, targetSpaceId)
                break
              case PlatType.Pinterest:
                await pinterestSkip(platform, targetSpaceId)
                break
              case PlatType.LinkedIn:
                await linkedinSkip(platform, targetSpaceId)
                break
              default:
                console.warn(
                  `${t('messages.unsupportedPlatformType' as any)}: ${platform}`,
                )
                message.warning(
                  t('messages.platformNotSupportedDirect' as any, { platform }),
                )
                return
            }

            // 授权完成后刷新账号列表
            setTimeout(async () => {
              try {
                await getAccountList()
                console.log(t('messages.accountListRefreshed' as any))
              }
              catch (error) {
                console.error(
                  t('messages.refreshAccountListFailed' as any),
                  error,
                )
              }
            }, 3000) // 等待3秒让授权完成
          }
          catch (error) {
            console.error(t('messages.authFailed' as any), error)
            message.error(t('messages.authFailedRetry' as any))
          }
        },
        [accountGroupList, getAccountList],
      )

      // 处理Facebook授权成功后的页面选择
      const handleFacebookAuthSuccess = () => {
        setShowFacebookPagesModal(true)
      }

      // 处理Facebook页面选择成功
      const handleFacebookPagesSuccess = () => {
        setShowFacebookPagesModal(false)
        // 可以在这里添加成功提示或其他逻辑
      }

      // 内容安全检测函数
      const handleContentModeration = useCallback(async () => {
        // 获取当前描述内容
        let contentToCheck = ''
        if (step === 0 && pubListChoosed.length >= 2) {
          contentToCheck = commonPubParams.des || ''
        }
        else if (step === 1 && expandedPubItem) {
          contentToCheck = expandedPubItem.params.des || ''
        }
        else if (pubListChoosed.length === 1) {
          contentToCheck = pubListChoosed[0].params.des || ''
        }

        if (!contentToCheck.trim()) {
          message.warning(t('messages.pleaseInputContent' as any))
          return
        }

        try {
          setModerationLoading(true)
          setModerationResult(null)
          setModerationDesc('')
          setModerationLevel(null)
          const result = await toolsApi.textModeration(contentToCheck)
          console.log('result', result)

          if (result?.code === 0) {
            const data: any = result?.data || ({} as any)
            const descriptions: string
              = (data && (data.descriptions as string)) || ''
            const labels: string = (data && (data.labels as string)) || ''
            const reason: any
              = data && (data.reason ? JSON.parse(data.reason) : '')
            const isSafe = !descriptions && !labels && !reason
            setModerationResult(isSafe)
            setModerationLevel(reason)
            setModerationDesc(
              isSafe
                ? ''
                : descriptions || reason || t('actions.contentUnsafe' as any),
            )
            if (isSafe) {
              message.success(t('actions.contentSafe' as any))
            }
            else {
              message.error(t('actions.contentUnsafe' as any))
            }
          }
        }
        catch (error) {
          console.error(t('messages.contentModerationError' as any), error)
          message.error(t('messages.contentModerationFailed' as any))
        }
        finally {
          setModerationLoading(false)
        }
      }, [step, pubListChoosed, commonPubParams, expandedPubItem, t])

      // 检查是否有描述内容
      const hasDescription = useMemo(() => {
        if (step === 0 && pubListChoosed.length >= 2) {
          return !!(commonPubParams.des && commonPubParams.des.trim())
        }
        else if (step === 1 && expandedPubItem) {
          return !!(
            expandedPubItem.params.des && expandedPubItem.params.des.trim()
          )
        }
        else if (pubListChoosed.length === 1) {
          return !!(
            pubListChoosed[0].params.des && pubListChoosed[0].params.des.trim()
          )
        }
        return false
      }, [step, pubListChoosed, commonPubParams, expandedPubItem])

      // 检查选中的平台是否需要内容安全检测
      const needsContentModeration = useMemo(() => {
        if (pubListChoosed.length === 0)
          return false

        // 检查所有选中的账户对应的平台是否需要内容检测
        return pubListChoosed.some((pubItem) => {
          const platInfo = AccountPlatInfoMap.get(
            pubItem.account.type as PlatType,
          )
          return platInfo?.jiancha === true
        })
      }, [pubListChoosed])

      // 监听内容变化，重置内容安全检测状态
      useEffect(() => {
        setModerationResult(null)
        setModerationDesc('')
        setModerationLevel(null)
      }, [
        commonPubParams.des,
        expandedPubItem?.params.des,
        pubListChoosed.map(item => item.params.des).join(','),
      ])

      // 当内容被清空时，也重置检测状态
      useEffect(() => {
        if (!hasDescription) {
          setModerationResult(null)
          setModerationDesc('')
          setModerationLevel(null)
        }
      }, [hasDescription])

      useEffect(() => {
        if (open) {
          init(accounts, defaultAccountId)
        }
        else {
          setPubListChoosed([])
          clear()
        }
      }, [accounts, open])

      // 离线账号（status === 0）不可参与发布：如被默认选中则自动移除
      useEffect(() => {
        const filtered = pubListChoosed.filter(
          item => item.account.status !== 0,
        )
        if (filtered.length !== pubListChoosed.length) {
          setPubListChoosed(filtered)
        }
      }, [pubListChoosed, setPubListChoosed])

      // 移除PC端不支持的平台账户过滤逻辑，改为在UI中显示遮罩

      // 关闭弹框并确认关闭
      const closeDialog = useCallback(() => {
        confirm({
          title: t('confirmClose.title'),
          icon: <ExclamationCircleFilled />,
          content: t('confirmClose.content'),
          okType: 'danger',
          okButtonProps: {
            type: 'primary',
          },
          cancelButtonProps: {
            type: 'text',
          },
          centered: true,
          onOk() {
            onClose()
          },
        })
      }, [onClose, t])

      // 是否打开右侧预览
      const openRight = useMemo(() => {
        if (step === 0) {
          return pubListChoosed.length !== 0
        }
        else {
          return expandedPubItem !== undefined
        }
      }, [pubListChoosed, expandedPubItem, step])

      // 是否打开左侧
      const openLeftSide = useMemo(() => {
        if (!openLeft)
          return false
        if (step === 0) {
          return pubListChoosed.length !== 0
        }
        else {
          return expandedPubItem !== undefined
        }
      }, [openLeft, step, pubListChoosed.length, expandedPubItem])

      useEffect(() => {
        setErrParamsMap(errParamsMap)
      }, [errParamsMap])
      useEffect(() => {
        setWarningParamsMap(warningParamsMap)
      }, [warningParamsMap])

      const pubClick = useCallback(async () => {
        setCreateLoading(true)
        const publishTime = getUtcDays(
          pubTime || getDays().add(6, 'minute'),
        ).format()

        const flowId = generateUUID()
        for (const item of pubListChoosed) {
          const res = await apiCreatePublish({
            topics: [],
            flowId,
            type: item.params.video?.cover.ossUrl
              ? PubType.VIDEO
              : PubType.ImageText,
            title: item.params.title || '',
            desc: item.params.des,
            accountId: item.account.id,
            accountType: item.account.type,
            videoUrl: item.params.video?.ossUrl,
            coverUrl:
              item.params.video?.cover.ossUrl
              || (item.params.images && item.params.images.length > 0
                ? item.params.images[0].ossUrl
                : undefined),
            imgUrlList:
              item.params.images
                ?.map(v => v.ossUrl)
                .filter((url): url is string => url !== undefined) || [],
            publishTime,
            option: item.params.option,
          })
          if (res?.code !== 0) {
            return setCreateLoading(false)
          }
        }
        onClose()
        setCreateLoading(false)

        if (onPubSuccess)
          onPubSuccess()
      }, [pubListChoosed])

      const imperativeHandle: IPublishDialogRef = {
        setPubTime,
      }
      useImperativeHandle(ref, () => imperativeHandle)

      return (
        <>
          <Modal
            className={styles.publishDialog}
            closeIcon={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
            styles={{ wrapper: { textAlign: 'center' } }}
          >
            {width >= 1400 && (
              <CSSTransition
                in={openLeftSide}
                timeout={300}
                classNames="left"
                unmountOnExit
              >
                <PublishDialogAi onClose={() => setOpenLeft(false)} />
              </CSSTransition>
            )}

            <div
              className="publishDialog-wrapper"
              onClick={() => {
                if (step === 1) {
                  setExpandedPubItem(undefined)
                }
              }}
            >
              <div className="publishDialog-con">
                <div className="publishDialog-con-head">
                  <span className="publishDialog-con-head-title">
                    {t('title')}
                  </span>
                </div>
                <div className="publishDialog-con-acconts">
                  {pubList.map((pubItem) => {
                    const platConfig = AccountPlatInfoMap.get(
                      pubItem.account.type,
                    )!
                    const isChoosed = pubListChoosed.find(
                      v => v.account.id === pubItem.account.id,
                    )
                    const isOffline = pubItem.account.status === 0
                    const isPcNotSupported
                      = platConfig && platConfig.pcNoThis === true

                    return (
                      <Tooltip
                        title={
                          isPcNotSupported
                            ? t('tips.pcNotSupported' as any)
                            : isOffline
                              ? t('tips.accountOffline' as any)
                              : undefined
                        }
                        key={pubItem.account.id}
                      >
                        <div
                          className={[
                            'publishDialog-con-acconts-item',
                            isChoosed
                              ? 'publishDialog-con-acconts-item--active'
                              : '',
                          ].join(' ')}
                          style={{
                            borderColor: isChoosed
                              ? platConfig.themeColor
                              : 'transparent',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            // 离线账户的点击由头像容器处理，这里不处理
                            if (isOffline) {
                              return
                            }
                            if (isPcNotSupported) {
                              setCurrentPlatform(platConfig?.name || '')
                              setDownloadModalVisible(true)
                              return
                            }
                            const newPubListChoosed = [...pubListChoosed]
                            // 查找当前账户是否已被选择
                            const index = newPubListChoosed.findIndex(
                              v => v.account.id === pubItem.account.id,
                            )
                            if (index !== -1) {
                              newPubListChoosed.splice(index, 1)
                            }
                            else {
                              newPubListChoosed.push(pubItem)
                            }
                            // 是否自动回到第一步
                            if (newPubListChoosed.length === 0 && step === 1) {
                              const isBack = newPubListChoosed.every(
                                v =>
                                  !v.params.des
                                  && !v.params.video
                                  && !v.params.images?.length,
                              )
                              if (isBack) {
                                setStep(0)
                              }
                            }
                            // 是否自动前往第二步
                            if (step === 0 && newPubListChoosed.length !== 0) {
                              const isFront = newPubListChoosed.every(
                                v =>
                                  v.params.des
                                  || v.params.video
                                  || v.params.images?.length !== 0,
                              )
                              if (isFront) {
                                setStep(1)
                              }
                            }
                            if (newPubListChoosed.length === 1) {
                              setExpandedPubItem(newPubListChoosed[0])
                            }
                            setPubListChoosed(newPubListChoosed)
                          }}
                        >
                          {/* 账号头像：离线或PC不支持显示遮罩并禁用 */}
                          <div style={{ position: 'relative' }}>
                            <AvatarPlat
                              className={`publishDialog-con-acconts-item-avatar ${!isChoosed || isOffline || isPcNotSupported ? 'disabled' : ''}`}
                              account={pubItem.account}
                              size="large"
                              disabled={
                                isOffline || !isChoosed || isPcNotSupported
                              }
                            />
                            {isOffline && (
                              <div
                                onClick={(e) => {
                                  // 小红书平台即使是掉线状态也显示下载App弹窗
                                  if (pubItem.account.type === PlatType.Xhs) {
                                    setCurrentPlatform(t('rednote' as any))
                                    setDownloadModalVisible(true)
                                    return
                                  }
                                  // 其他平台的离线账户触发授权跳转
                                  if (isOffline) {
                                    handleOfflineAvatarClick(pubItem.account)
                                  }
                                  // 正常账户的点击事件由父容器处理，这里不需要额外处理
                                }}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.45)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  pointerEvents: 'auto',
                                  cursor: 'pointer',
                                }}
                              >
                                {t('badges.offline' as any)}
                              </div>
                            )}
                            {isPcNotSupported && !isOffline && (
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.6)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  pointerEvents: 'none',
                                  textAlign: 'center',
                                  lineHeight: 1.2,
                                }}
                              >
                                APP
                              </div>
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>

                <div className="publishDialog-paramsSet">
                  {step === 0
                    ? (
                        <>
                          {pubListChoosed.length == 1 && (
                            <PlatParamsSetting pubItem={pubListChoosed[0]} />
                          )}
                          {pubListChoosed.length >= 2 && (
                            <PubParmasTextarea
                              key={`${commonPubParams.images?.length || 0}-${commonPubParams.video ? 'video' : 'no-video'}`}
                              platType={PlatType.Instagram}
                              rows={16}
                              desValue={commonPubParams.des}
                              videoFileValue={commonPubParams.video}
                              imageFileListValue={commonPubParams.images}
                              onChange={(values) => {
                                setAccountAllParams({
                                  des: values.value,
                                  images: values.imgs,
                                  video: values.video,
                                })
                              }}
                            />
                          )}
                        </>
                      )
                    : (
                        <>
                          {pubListChoosed.map((v) => {
                            return (
                              <PlatParamsSetting
                                pubItem={v}
                                key={v.account.id}
                                style={{ marginBottom: '12px' }}
                              />
                            )
                          })}
                        </>
                      )}

                  {pubListChoosed.length === 0
                    && pubList.some(
                      v =>
                        v.params.des
                        || v.params.video
                        || (v.params.images && v.params.images.length > 0),
                    )
                    ? (
                        <div
                          className="publishDialog-con-tips"
                          style={{ height: '400px' }}
                        >
                          {t('tips.workSaved')}
                        </div>
                      )
                    : (
                        <>
                          {pubListChoosed.length === 0 && (
                            <div className="publishDialog-con-tips">
                              {t('tips.selectAccount')}
                            </div>
                          )}
                        </>
                      )}
                </div>
              </div>
              <div
                className="publishDialog-footer"
                onClick={e => e.stopPropagation()}
              >
                <PublishDialogDataPicker />

                <div
                  className="publishDialog-footer-btns"
                  style={{ display: 'flex', flexDirection: 'row', gap: 12 }}
                >
                  {step === 0 && pubListChoosed.length >= 2
                    ? (
                        <Button
                          size="large"
                          onClick={() => {
                            setExpandedPubItem(undefined)
                            setStep(1)
                          }}
                        >
                          {t('buttons.customizePerAccount')}
                          <ArrowRightOutlined />
                        </Button>
                      )
                    : (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            {moderationResult !== null && (
                              <div
                                style={{ display: 'flex', flexDirection: 'column' }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    color: moderationResult ? '#52c41a' : '#ff4d4f',
                                    fontWeight: 500,
                                  }}
                                >
                                  {moderationResult
                                    ? t('actions.contentSafe' as any)
                                    : moderationLevel?.riskLevel
                                      ? `${t('actions.riskLevel' as any)} ${moderationLevel.riskLevel}`
                                      : t('actions.contentUnsafe' as any)}
                                </span>
                                {!moderationResult && !!moderationDesc && (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: '#ff4d4f',
                                      maxWidth: 360,
                                      whiteSpace: 'pre-wrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    {moderationDesc}
                                    <Tooltip
                                      title={moderationLevel?.riskTips || ''}
                                      placement="top"
                                    >
                                      <InfoCircleOutlined
                                        style={{ color: '#ff4d4f' }}
                                      />
                                    </Tooltip>
                                  </span>
                                )}
                              </div>
                            )}

                            {hasDescription && needsContentModeration && (
                              <Button
                                size="large"
                                loading={moderationLoading}
                                onClick={handleContentModeration}
                                type={
                                  moderationResult === true
                                    ? 'primary'
                                    : moderationResult === false
                                      ? 'default'
                                      : 'default'
                                }
                                style={{
                                  backgroundColor:
                                moderationResult === true
                                  ? '#52c41a'
                                  : moderationResult === false
                                    ? '#ff4d4f'
                                    : undefined,
                                  borderColor:
                                moderationResult === true
                                  ? '#52c41a'
                                  : moderationResult === false
                                    ? '#ff4d4f'
                                    : undefined,
                                  color:
                                moderationResult === true
                                || moderationResult === false
                                  ? '#fff'
                                  : undefined,
                                }}
                              >
                                {moderationLoading
                                  ? t('actions.checkingContent' as any)
                                  : t('actions.contentModeration' as any)}
                              </Button>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <Button size="large" onClick={closeDialog}>
                              {t('buttons.cancelPublish')}
                            </Button>
                            <Button
                              size="large"
                              type="primary"
                              loading={createLoading}
                              onClick={() => {
                                for (const [key, errVideoItem] of errParamsMap) {
                                  if (errVideoItem) {
                                    const pubItem = pubListChoosed.find(
                                      v => v.account.id === key,
                                    )!
                                    if (step === 1) {
                                      setExpandedPubItem(pubItem)
                                    }
                                    message.warning(errVideoItem.parErrMsg)
                                    return
                                  }
                                }
                                pubClick()
                              }}
                            >
                              {t('buttons.schedulePublish')}
                            </Button>
                          </div>
                        </>
                      )}
                </div>
              </div>
            </div>

            <div className="publishDialog-right">
              {width < 1400 && (
                <CSSTransition
                  in={openLeftSide}
                  timeout={300}
                  classNames="left"
                  unmountOnExit
                >
                  <PublishDialogAi onClose={() => setOpenLeft(false)} />
                </CSSTransition>
              )}
              <CSSTransition
                in={openRight}
                timeout={300}
                classNames="right"
                unmountOnExit
              >
                <PublishDialogPreview />
              </CSSTransition>
            </div>
          </Modal>

          {/* 下载App弹窗 */}
          <DownloadAppModal
            visible={downloadModalVisible}
            onClose={() => setDownloadModalVisible(false)}
            platform={currentPlatform}
            appName="Aitoearn App"
          />

          {/* Facebook页面选择弹窗 */}
          <FacebookPagesModal
            open={showFacebookPagesModal}
            onClose={() => setShowFacebookPagesModal(false)}
            onSuccess={handleFacebookPagesSuccess}
          />
        </>
      )
    },
  ),
)

export default PublishDialog
