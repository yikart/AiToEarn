/**
 * MobilePublishContent - 移动端发布内容组件
 * 专为移动端优化的发布编辑界面，无 AI 助手和预览面板
 */
import type { SocialAccount } from '@/api/types/account.type'
import type { IImgFile, PubItem } from '@/components/PublishDialog/publishDialog.type'

import { ArrowRight, ChevronDown, FolderOpen, Layers, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap, isPlatformAvailable, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { DouyinLaunchModal } from '@/components/PublishDialog/compoents/DouyinLaunchModal'
import ErrorSummary from '@/components/PublishDialog/compoents/ErrorSummary'
import PlatParamsSetting from '@/components/PublishDialog/compoents/PlatParamsSetting'
import PublishDatePicker from '@/components/PublishDialog/compoents/PublishDatePicker'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import FacebookPagesModal from '@/components/PublishDialog/compoents/PublishModals/FacebookPagesModal'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { useCloseDialog } from '@/components/PublishDialog/hooks/useCloseDialog'
import { usePlatformAuth } from '@/components/PublishDialog/hooks/usePlatformAuth'
import { usePublishActions } from '@/components/PublishDialog/hooks/usePublishActions'
import usePubParamsVerify from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { parseTopicString } from '@/utils'

export interface IMobilePublishContentProps {
  accounts: SocialAccount[]
  onClose: () => void
  onPubSuccess?: () => void
  defaultAccountIds?: string[]
  suppressAutoPublish?: boolean
  taskIdForPublish?: string
  onPublishConfirmed?: (taskId?: string) => void
  onPublishStart?: () => void
}

// 移动端发布内容组件
const MobilePublishContent = memo(
  ({
    accounts,
    onClose,
    onPubSuccess,
    suppressAutoPublish,
    taskIdForPublish,
    onPublishConfirmed,
    onPublishStart,
  }: IMobilePublishContentProps) => {
    const { t } = useTransClient('publish')

    // ============ Store Hooks ============

    // 发布弹框核心状态
    const {
      pubListChoosed,
      setPubListChoosed,
      pubList,
      setStep,
      step,
      setAccountAllParams,
      commonPubParams,
      setExpandedPubItem,
      expandedPubItem,
      setErrParamsMap,
      pubTime,
      setWarningParamsMap,
    } = usePublishDialog(
      useShallow(state => ({
        pubListChoosed: state.pubListChoosed,
        setPubListChoosed: state.setPubListChoosed,
        pubList: state.pubList,
        setStep: state.setStep,
        step: state.step,
        setAccountAllParams: state.setAccountAllParams,
        commonPubParams: state.commonPubParams,
        setExpandedPubItem: state.setExpandedPubItem,
        expandedPubItem: state.expandedPubItem,
        setErrParamsMap: state.setErrParamsMap,
        setWarningParamsMap: state.setWarningParamsMap,
        pubTime: state.pubTime,
      })),
    )

    // 账户 store
    const { accountGroupList, getAccountList, activeSpaceId, setActiveSpaceId, accountActive }
      = useAccountStore(
        useShallow(state => ({
          accountGroupList: state.accountGroupList,
          getAccountList: state.getAccountList,
          activeSpaceId: state.activeSpaceId,
          setActiveSpaceId: state.setActiveSpaceId,
          accountActive: state.accountActive,
        })),
      )

    // 上传管理
    const { tasks, md5Cache } = usePublishManageUpload(
      useShallow(state => ({
        tasks: state.tasks,
        md5Cache: state.md5Cache,
      })),
    )

    // 参数校验
    const { errParamsMap, warningParamsMap } = usePubParamsVerify(pubListChoosed)

    // ============ Local State ============

    const [createLoading, setCreateLoading] = useState(false)
    const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false)

    const [douyinPermalink, setDouyinPermalink] = useState('')
    const [douyinQRCodeVisible, setDouyinQRCodeVisible] = useState(false)
    const [currentPublishTaskId, setCurrentPublishTaskId] = useState<string | undefined>()
    const [publishDetailVisible, setPublishDetailVisible] = useState(false)

    // ============ Computed Values ============

    // 追踪是否是用户主动切换频道
    const isUserSwitchingSpace = useRef(false)

    // 获取当前选中的频道信息
    const selectedSpace = useMemo(() => {
      if (!activeSpaceId)
        return undefined
      return accountGroupList.find(g => g.id === activeSpaceId)
    }, [activeSpaceId, accountGroupList])

    // ============ Custom Hooks ============

    // 关闭弹窗确认
    const { closeDialog } = useCloseDialog({ onClose, t })

    // 平台授权
    const { handleOfflineAvatarClick } = usePlatformAuth({
      accountGroupList,
      getAccountList,
      onFacebookAuthSuccess: () => setShowFacebookPagesModal(true),
      t,
    })

    // 账户点击处理
    const { handleAccountClick } = useAccountClickHandler({
      pubListChoosed,
      step,
      setStep,
      setExpandedPubItem,
      setPubListChoosed,
    })

    // 发布操作
    const { pubClick } = usePublishActions({
      pubListChoosed,
      pubTime,
      isMobile: true,
      suppressAutoPublish,
      taskIdForPublish,
      onPublishConfirmed,
      onPublishStart,
      onClose,
      onPubSuccess,
      setCreateLoading,
      setDouyinPermalink,
      setDouyinQRCodeVisible,
      setCurrentPublishTaskId,
      setPublishDetailVisible,
      t,
    })

    // ============ Callbacks ============

    // 处理 PC 不支持平台点击
    const handlePcNotSupportedClick = useCallback((_platformName: string) => {
      // DownloadAppModal has been removed; no-op for now
    }, [])

    // 处理图生图（移动端暂不支持）
    const handleImageToImage = useCallback(
      (_imageFile: IImgFile) => {
        toast.info(t('messages.mobileNotSupported'))
      },
      [t],
    )

    // 处理账户项点击（包装 handleAccountClick，添加离线和 PC 不支持检查）
    const handleAccountItemClick = useCallback(
      (pubItem: PubItem, isOffline: boolean, isPcNotSupported: boolean, platConfig: any) => {
        if (isOffline) {
          return
        }
        if (isPcNotSupported) {
          handlePcNotSupportedClick(platConfig?.name || '')
          return
        }
        handleAccountClick(pubItem)
      },
      [handleAccountClick, handlePcNotSupportedClick],
    )

    // ============ Effects ============

    // 当选择单个账号时，自动选中该账号
    useEffect(() => {
      if (!accountActive) {
        return
      }

      // 找到对应的 pubItem
      const targetPubItem = pubList.find(pubItem => pubItem.account.id === accountActive.id)
      if (targetPubItem) {
        setPubListChoosed([targetPubItem])
      }
    }, [accountActive, pubList, setPubListChoosed])

    // 用户主动切换频道的处理函数
    const handleSpaceChange = useCallback(
      (spaceId: string | undefined) => {
        isUserSwitchingSpace.current = true
        setActiveSpaceId(spaceId)
      },
      [setActiveSpaceId],
    )

    // 当用户主动选择频道时，自动选中该频道下的所有账户
    useEffect(() => {
      // 只有用户主动切换频道时才执行
      if (!isUserSwitchingSpace.current) {
        return
      }
      isUserSwitchingSpace.current = false

      if (!activeSpaceId || !accountGroupList || accountGroupList.length === 0) {
        return
      }

      const selectedGroup = accountGroupList.find(g => g.id === activeSpaceId)
      if (!selectedGroup) {
        return
      }

      // 找出该频道下的所有账户
      const channelAccountIds = new Set(selectedGroup.children.map(child => child.id))
      const channelAccounts = pubList.filter(pubItem => channelAccountIds.has(pubItem.account.id))

      // 自动选中这些账户
      if (channelAccounts.length > 0) {
        setPubListChoosed(channelAccounts)
      }
    }, [activeSpaceId, accountGroupList, pubList, setPubListChoosed])

    // ============ Render ============

    return (
      <div className="flex flex-col h-full bg-background overflow-hidden p-3">
        {/* 头部 */}
        <div className="flex flex-col px-4 py-3 border-b border-border flex-shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-base">{t('title')}</span>
            <X
              onClick={closeDialog}
              className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            />
          </div>

          {/* 频道选择器下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md border border-border',
                  'hover:bg-muted cursor-pointer transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'w-full',
                )}
              >
                {selectedSpace ? (
                  <>
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-sm text-foreground text-left">
                      {selectedSpace.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm text-foreground text-left">
                      {t('allChannels')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)]">
              {/* 全部频道选项 */}
              <DropdownMenuItem
                onClick={() => handleSpaceChange(undefined)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 cursor-pointer',
                  !activeSpaceId && 'bg-accent',
                )}
              >
                <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm">{t('allChannels')}</span>
              </DropdownMenuItem>

              {accountGroupList.length > 0 && <DropdownMenuSeparator />}

              {/* 频道列表 */}
              <ScrollArea className="max-h-[300px]">
                {accountGroupList.map(group => (
                  <DropdownMenuItem
                    key={group.id}
                    onClick={() => handleSpaceChange(group.id)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 cursor-pointer',
                      activeSpaceId === group.id && 'bg-accent',
                    )}
                  >
                    <FolderOpen className="h-5 w-5 shrink-0 text-primary" />
                    <span className="flex-1 text-sm truncate">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.children.length}</span>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {/* 账号选择区域 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {pubList.map((pubItem) => {
              const platConfig = AccountPlatInfoMap.get(pubItem.account.type)!
              const isChoosed = pubListChoosed.find(v => v.account.id === pubItem.account.id)
              const isOffline = pubItem.account.status === 0
              const isPcNotSupported = platConfig && platConfig.pcNoThis === true
              const isRegionRestricted = !isPlatformAvailable(pubItem.account.type)

              return (
                <TooltipProvider key={pubItem.account.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`border-2 rounded-full transition-all duration-300 ${
                          isChoosed ? '' : 'border-transparent'
                        } ${isChoosed ? 'active:border-primary' : ''}`}
                        style={{
                          borderColor: isChoosed ? platConfig.themeColor : 'transparent',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAccountItemClick(pubItem, isOffline, isPcNotSupported, platConfig)
                        }}
                      >
                        <div className="relative">
                          <AvatarPlat
                            className={`cursor-pointer transition-all duration-300 p-[1px] ${
                              isChoosed && !isOffline && !isPcNotSupported && !isRegionRestricted
                                ? '[&>img]:grayscale-0'
                                : '[&>img]:grayscale hover:[&>img]:grayscale-0'
                            }`}
                            account={pubItem.account}
                            size="large"
                            disabled={
                              isOffline || !isChoosed || isPcNotSupported || isRegionRestricted
                            }
                          />
                          {isOffline && !isRegionRestricted && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                if (pubItem.account.type === PlatType.Xhs) {
                                  handlePcNotSupportedClick(t('rednote'))
                                  return
                                }
                                handleOfflineAvatarClick(pubItem.account)
                              }}
                              className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                            >
                              {t('badges.offline')}
                            </div>
                          )}
                          {isRegionRestricted && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-semibold pointer-events-auto cursor-pointer text-center leading-tight">
                              🌐
                            </div>
                          )}
                          {isPcNotSupported && !isOffline && !isRegionRestricted && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-semibold pointer-events-none text-center leading-tight">
                              APP
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {(isPcNotSupported || isOffline || isRegionRestricted) && (
                      <TooltipContent>
                        {isRegionRestricted
                          ? t('tips.regionRestricted')
                          : isPcNotSupported
                            ? t('tips.pcNotSupported')
                            : t('tips.accountOffline')}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>

          {/* 错误汇总组件 - 展示所有账号的校验错误和警告 */}
          <ErrorSummary
            pubListChoosed={pubListChoosed}
            errParamsMap={errParamsMap}
            warningParamsMap={warningParamsMap}
            onAccountClick={(accountId) => {
              const pubItem = pubListChoosed.find(v => v.account.id === accountId)
              if (pubItem) {
                // 如果是多账号模式（step=1），展开对应账号设置
                if (step === 1) {
                  setExpandedPubItem(pubItem)
                }
              }
            }}
          />

          {/* 编辑区域 */}
          <div className="mt-4">
            {step === 0 ? (
              <>
                {pubListChoosed.length === 1 && (
                  <PlatParamsSetting
                    pubItem={pubListChoosed[0]}
                    onImageToImage={handleImageToImage}
                    isMobile
                  />
                )}
                {pubListChoosed.length >= 2 && (
                  <PubParmasTextarea
                    key={`${commonPubParams.images?.length || 0}-${commonPubParams.video ? 'video' : 'no-video'}`}
                    platType={PlatType.Instagram}
                    rows={10}
                    desValue={commonPubParams.des}
                    videoFileValue={commonPubParams.video}
                    imageFileListValue={commonPubParams.images}
                    onChange={(values) => {
                      const { topics } = parseTopicString(values.value || '')
                      setAccountAllParams({
                        des: values.value,
                        images: values.imgs,
                        video: values.video,
                        topics,
                      })
                    }}
                    onImageToImage={handleImageToImage}
                    isMobile
                  />
                )}
              </>
            ) : (
              <>
                {pubListChoosed.map(v => (
                  <PlatParamsSetting
                    key={v.account.id}
                    pubItem={v}
                    style={{ marginBottom: '12px' }}
                    onImageToImage={handleImageToImage}
                    isMobile
                  />
                ))}
              </>
            )}

            {pubListChoosed.length === 0
              && pubList.some(
                v =>
                  v.params.des || v.params.video || (v.params.images && v.params.images.length > 0),
              ) ? (
                  <div className="flex items-center justify-center text-center text-muted-foreground h-[150px]">
                    {t('tips.workSaved')}
                  </div>
                ) : (
                  <>
                    {pubListChoosed.length === 0 && (
                      <div className="flex items-center justify-center text-center text-muted-foreground py-10">
                        {t('tips.selectAccount')}
                      </div>
                    )}
                  </>
                )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center border-t border-border justify-between px-4 py-3 flex-shrink-0 bg-background">
          <div className="flex w-full justify-end gap-3">
            {step === 0 && pubListChoosed.length >= 2 ? (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setExpandedPubItem(undefined)
                  setStep(1)
                }}
                className="gap-2 cursor-pointer flex-1"
              >
                {t('buttons.customizePerAccount')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex-1">
                <PublishDatePicker
                  loading={createLoading}
                  onClick={() => {
                    for (const [key, errVideoItem] of errParamsMap) {
                      if (errVideoItem) {
                        const pubItem = pubListChoosed.find(v => v.account.id === key)!
                        if (step === 1) {
                          setExpandedPubItem(pubItem)
                        }
                        toast.warning(errVideoItem.parErrMsg)
                        return
                      }
                    }
                    pubClick()
                  }}
                  isMobile
                />
              </div>
            )}
          </div>
        </div>

        {/* Facebook页面选择弹窗 */}
        <FacebookPagesModal
          open={showFacebookPagesModal}
          onClose={() => setShowFacebookPagesModal(false)}
          onSuccess={() => setShowFacebookPagesModal(false)}
        />

        {/* 移动端抖音唤起引导弹窗 */}
        <DouyinLaunchModal
          open={douyinQRCodeVisible}
          permalink={douyinPermalink}
          onClose={() => setDouyinQRCodeVisible(false)}
        />
      </div>
    )
  },
)

MobilePublishContent.displayName = 'MobilePublishContent'

export default MobilePublishContent
