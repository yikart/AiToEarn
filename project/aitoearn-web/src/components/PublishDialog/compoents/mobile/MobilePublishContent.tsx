/**
 * MobilePublishContent - 移动端发布内容组件
 * 专为移动端优化的发布编辑界面，无内容管理左栏
 */
import type { SocialAccount } from '@/api/accounts/account.types'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import { ArrowRight, ChevronDown, FolderOpen, Layers, Plus, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager/channelManagerStore'
import AvatarPlat from '@/components/common/AvatarPlat'
import { DouyinLaunchModal } from '@/components/PublishDialog/compoents/DouyinLaunchModal'
import ErrorSummary from '@/components/PublishDialog/compoents/ErrorSummary'
import PlatParamsSetting from '@/components/PublishDialog/compoents/PlatParamsSetting'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import PublishDatePicker from '@/components/PublishDialog/compoents/PublishDatePicker'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { useAutoPublishOnReady } from '@/components/PublishDialog/hooks/useAutoPublishOnReady'
import { useCloseDialog } from '@/components/PublishDialog/hooks/useCloseDialog'
import { usePlatformAuth } from '@/components/PublishDialog/hooks/usePlatformAuth'
import { usePublishActions } from '@/components/PublishDialog/hooks/usePublishActions'
import usePubParamsVerify from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { useValidatedPublishTrigger } from '@/components/PublishDialog/hooks/useValidatedPublishTrigger'
import { getCommonPublishTitleMax } from '@/components/PublishDialog/PublishDialog.util'
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
import { usePlatformInfoMap } from '@/hooks/usePlatformMetadata'
import { useAccountStore } from '@/store/account'
import { cn } from '@/utils/className'
import { parseTopicString } from '@/utils/common'

export interface IMobilePublishContentProps {
  open: boolean
  accounts: SocialAccount[]
  onClose: () => void
  onPubSuccess?: () => void
  defaultAccountIds?: string[]
  suppressAutoPublish?: boolean
  taskIdForPublish?: string
  materialGroupIdForPublish?: string
  materialIdForPublish?: string
  onPublishConfirmed?: (taskId?: string, publishRecordId?: string) => void
  onPublishStart?: () => void
  autoPublishOnReady?: boolean
  createLoading: boolean
  setCreateLoading: (loading: boolean) => void
  setCurrentPublishTaskId: (taskId: string | undefined) => void
  setPublishDetailVisible: (visible: boolean) => void
}

// 移动端发布内容组件
const MobilePublishContent = memo(
  ({
    open,
    accounts,
    onClose,
    onPubSuccess,
    suppressAutoPublish,
    taskIdForPublish,
    materialGroupIdForPublish,
    materialIdForPublish,
    onPublishConfirmed,
    onPublishStart,
    autoPublishOnReady,
    createLoading,
    setCreateLoading,
    setCurrentPublishTaskId,
    setPublishDetailVisible,
  }: IMobilePublishContentProps) => {
    const { t } = useTransClient('publish')
    const platformInfoMap = usePlatformInfoMap()

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
      prefillLoading,
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
        prefillLoading: state.prefillLoading,
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

    const commonTitleMax = useMemo(() => {
      return getCommonPublishTitleMax(pubListChoosed)
    }, [platformInfoMap, pubListChoosed])

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

    const [douyinPermalink, setDouyinPermalink] = useState('')
    const [douyinQRCodeVisible, setDouyinQRCodeVisible] = useState(false)

    // ============ Computed Values ============

    // 追踪是否是用户主动切换频道
    const isUserSwitchingSpace = useRef(false)
    const appliedAccountActiveIdRef = useRef<string | undefined>(undefined)

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
    const { handleOfflineAvatarClick } = usePlatformAuth()

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
      suppressAutoPublish,
      taskIdForPublish,
      materialGroupIdForPublish,
      materialIdForPublish,
      onPublishConfirmed,
      onPublishStart,
      onClose,
      onPubSuccess,
      setCreateLoading,
      setCurrentPublishTaskId,
      setPublishDetailVisible,
      t,
    })
    const { triggerPublish } = useValidatedPublishTrigger(pubClick)

    useAutoPublishOnReady({
      enabled: autoPublishOnReady,
      open,
      ready: !prefillLoading && !createLoading,
      selectedCount: pubListChoosed.length,
      triggerPublish,
    })

    // ============ Callbacks ============

    // 处理账户项点击（包装 handleAccountClick，添加离线检查）
    const handleAccountItemClick = useCallback(
      (pubItem: PubItem, isOffline: boolean) => {
        if (isOffline) {
          return
        }
        handleAccountClick(pubItem)
      },
      [handleAccountClick],
    )

    // ============ Effects ============

    // 当选择单个账号时，自动选中该账号
    useEffect(() => {
      if (!accountActive) {
        appliedAccountActiveIdRef.current = undefined
        return
      }

      if (pubList.length === 0) {
        appliedAccountActiveIdRef.current = undefined
        return
      }

      if (appliedAccountActiveIdRef.current === accountActive.id) {
        return
      }

      // 找到对应的 pubItem
      const targetPubItem = pubList.find(pubItem => pubItem.account.id === accountActive.id)
      if (targetPubItem) {
        setPubListChoosed([targetPubItem])
        appliedAccountActiveIdRef.current = accountActive.id
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
              const platConfig = platformInfoMap.get(pubItem.account.type)
              if (!platConfig)
                return null
              const isChoosed = pubListChoosed.find(v => v.account.id === pubItem.account.id)
              const isOffline = pubItem.account.status === 0

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
                          handleAccountItemClick(pubItem, isOffline)
                        }}
                      >
                        <div className="relative">
                          <AvatarPlat
                            className={`cursor-pointer transition-all duration-300 p-[1px] ${
                              isChoosed && !isOffline
                                ? '[&>img]:grayscale-0'
                                : '[&>img]:grayscale hover:[&>img]:grayscale-0'
                            }`}
                            account={pubItem.account}
                            size="large"
                            disabled={isOffline || !isChoosed}
                          />
                          {isOffline && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOfflineAvatarClick(pubItem.account)
                              }}
                              className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                            >
                              {t('badges.offline')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {isOffline && (
                      <TooltipContent>
                        {t('tips.accountOffline')}
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
                    isMobile
                  />
                )}
                {pubListChoosed.length >= 2 && (
                  <PubParmasTextarea
                    key={`${commonPubParams.images?.length || 0}-${commonPubParams.video ? 'video' : 'no-video'}`}
                    platType={pubListChoosed[0].account.type}
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
                    extend={commonTitleMax !== undefined && (
                      <CommonTitleInput
                        titleValue={commonPubParams.title || ''}
                        titleMax={commonTitleMax}
                        onTitleChange={title => setAccountAllParams({ title })}
                        isMobile
                      />
                    )}
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
                    isMobile
                  />
                ))}
              </>
            )}

            {pubList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                <p className="text-muted-foreground text-sm">{t('tips.noAccount')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => useChannelManagerStore.getState().openConnectList()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('tips.addChannel')}
                </Button>
              </div>
            ) : pubListChoosed.length === 0
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
                  onClick={triggerPublish}
                  isMobile
                />
              </div>
            )}
          </div>
        </div>

        {/* 移动端抖音唤起引导弹窗 */}
        {douyinQRCodeVisible && (
          <DouyinLaunchModal
            open={douyinQRCodeVisible}
            permalink={douyinPermalink}
            onClose={() => setDouyinQRCodeVisible(false)}
          />
        )}
      </div>
    )
  },
)

MobilePublishContent.displayName = 'MobilePublishContent'

export default MobilePublishContent
