/**
 * PC端发布弹框主内容组件
 * 包含 AI 内容创作、账户选择、内容编辑等核心功能
 */

import type { IImgFile, IVideoFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import type { PublishDialogDragItem } from '@/components/PublishDialog/PublishDialog.util'

import { ChevronDown, FolderOpen, Layers, PanelLeftClose, PanelLeftOpen, Plus, UploadCloud, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useShallow } from 'zustand/react/shallow'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager/channelManagerStore'
import AccountSelector from '@/components/PublishDialog/compoents/AccountSelector'
import ErrorSummary from '@/components/PublishDialog/compoents/ErrorSummary'
import PlatParamsSetting from '@/components/PublishDialog/compoents/PlatParamsSetting'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import PublishFooter from '@/components/PublishDialog/compoents/PublishFooter'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { usePlatformAuth } from '@/components/PublishDialog/hooks/usePlatformAuth'
import {
  buildPublishParamsFromDraft,
  buildPublishParamsFromMedia,
  getCommonPublishTitleMax,
  PUBLISH_DIALOG_DND_TYPE,
} from '@/components/PublishDialog/PublishDialog.util'
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
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { cn } from '@/utils/className'
import { parseTopicString } from '@/utils/common'
import { notification } from '@/utils/ui/notification'
import PublishDialogDraftPanel from './PublishDialogDraftPanel'
import { PublishDialogDragPreviewLayer } from './PublishDialogDragPreviewLayer'
import { useDesktopPublishLayout } from './useDesktopPublishLayout'

/**
 * 外部必须传入的 props（无法从 store 获取的）
 */
interface DesktopPublishContentProps {
  // 外部回调
  onClose: () => void
  createLoading: boolean
  // 发布
  onPublish: () => void
}

const DRAG_UNSUPPORTED_NOTIFICATION_ID = 'publish-dialog-drag-unsupported'

function getDragItemPubType(item: PublishDialogDragItem) {
  if (item.kind === 'media')
    return item.media.type === 'video' ? PubType.VIDEO : PubType.ImageText

  const mediaList = item.material.mediaList || []
  if (mediaList.some(media => media.type === 'video'))
    return PubType.VIDEO
  if (mediaList.some(media => media.type === 'img'))
    return PubType.ImageText

  return undefined
}

function getPublishDropTargetItems(pubListChoosed: PubItem[], pubList: PubItem[]) {
  return pubListChoosed.length > 0 ? pubListChoosed : pubList
}

function getUnsupportedTargetPlatformNames(pubItems: PubItem[], pubType: PubType) {
  return pubItems.reduce<string[]>((names, pubItem) => {
    const platformInfo = getPlatformInfoSync(pubItem.account.type)
    if (platformInfo?.pubTypes.has(pubType))
      return names

    names.push(platformInfo?.name || pubItem.account.type)
    return names
  }, [])
}

/**
 * PC端发布弹框主内容组件
 */
export const DesktopPublishContent = memo(
  ({
    onClose,
    createLoading,
    onPublish,
  }: DesktopPublishContentProps) => {
    const { t } = useTransClient('publish')
    const platformInfoMap = usePlatformInfoMap()
    const {
      containerRef,
      layout,
      resizeHandleWidth,
      isDraftPanelOpen,
      isResizing,
      setDraftPanelOpen,
      handleResizeStart,
    } = useDesktopPublishLayout()

    // ============ 从 Store 获取状态（不再通过 props 传递）============

    const {
      pubList,
      pubListChoosed,
      commonPubParams,
      step,
      expandedPubItem,
      errParamsMap,
      warningParamsMap,
      setExpandedPubItem,
      setStep,
      setPubListChoosed,
      setAccountAllParams,
    } = usePublishDialog(
      useShallow(state => ({
        pubList: state.pubList,
        pubListChoosed: state.pubListChoosed,
        commonPubParams: state.commonPubParams,
        step: state.step,
        expandedPubItem: state.expandedPubItem,
        errParamsMap: state.errParamsMap,
        warningParamsMap: state.warningParamsMap,
        setExpandedPubItem: state.setExpandedPubItem,
        setStep: state.setStep,
        setPubListChoosed: state.setPubListChoosed,
        setAccountAllParams: state.setAccountAllParams,
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

    // ============ Custom Hooks ============

    // 账户点击处理
    const { handleAccountClick } = useAccountClickHandler({
      pubListChoosed,
      step,
      setStep,
      setExpandedPubItem,
      setPubListChoosed,
    })

    // 平台授权
    const { handleOfflineAvatarClick } = usePlatformAuth()

    // 追踪是否是用户主动切换频道（而非初始化或数据变化）
    const isUserSwitchingSpace = useRef(false)
    const appliedAccountActiveIdRef = useRef<string | undefined>(undefined)

    // ============ Computed Values ============

    // 获取当前选中的频道信息
    const selectedSpace = useMemo(() => {
      if (!activeSpaceId)
        return undefined
      return accountGroupList.find(g => g.id === activeSpaceId)
    }, [activeSpaceId, accountGroupList])

    const handlePublishDrop = useCallback(async (item: PublishDialogDragItem) => {
      const publishDialogStore = usePublishDialog.getState()

      const targetPubType = getDragItemPubType(item)
      const targetPubItems = getPublishDropTargetItems(
        publishDialogStore.pubListChoosed,
        publishDialogStore.pubList,
      )

      if (targetPubType && targetPubItems.length > 0) {
        const unsupportedPlatformNames = getUnsupportedTargetPlatformNames(targetPubItems, targetPubType)
        if (unsupportedPlatformNames.length > 0) {
          const allUnsupported = unsupportedPlatformNames.length === targetPubItems.length
          const platformNames = unsupportedPlatformNames.join(', ')
          const warningText = targetPubType === PubType.ImageText
            ? t(allUnsupported ? 'validation.dragImageUnsupported' : 'validation.dragImagePartiallyUnsupported', { platformNames })
            : t(allUnsupported ? 'validation.dragVideoUnsupported' : 'validation.dragVideoPartiallyUnsupported', { platformNames })

          notification.warning({
            key: DRAG_UNSUPPORTED_NOTIFICATION_ID,
            duration: 5,
            content: (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t('validation.dragUnsupportedTitle')}
                </p>
                <p className="text-sm font-normal text-muted-foreground">
                  {warningText}
                </p>
              </div>
            ),
          })

          if (allUnsupported)
            return
        }
      }

      publishDialogStore.setPublishContentLoading(true)
      try {
        const params = item.kind === 'draft'
          ? await buildPublishParamsFromDraft(item.material)
          : await buildPublishParamsFromMedia(item.media, publishDialogStore.commonPubParams.images || [])

        publishDialogStore.setAccountAllParams(params)
      }
      finally {
        usePublishDialog.getState().setPublishContentLoading(false)
      }
    }, [t])

    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: PUBLISH_DIALOG_DND_TYPE,
        drop: (item: PublishDialogDragItem) => {
          void handlePublishDrop(item)
        },
        collect: monitor => ({
          isOver: monitor.isOver({ shallow: true }),
          canDrop: monitor.canDrop(),
        }),
      }),
      [handlePublishDrop],
    )

    // ============ Handlers ============

    // 处理下一步
    const handleNextStep = useCallback(() => {
      setExpandedPubItem(undefined)
      setStep(1)
    }, [setExpandedPubItem, setStep])

    // 处理错误点击，展开对应账号
    const handleErrorAccountClick = useCallback(
      (accountId: string) => {
        const pubItem = pubListChoosed.find(v => v.account.id === accountId)
        if (pubItem) {
          if (step === 1) {
            setExpandedPubItem(pubItem)
          }
        }
      },
      [pubListChoosed, step, setExpandedPubItem],
    )

    // 处理参数变更
    const handleParamsChange = useCallback(
      (values: { value?: string, imgs?: IImgFile[], video?: IVideoFile }) => {
        const { topics } = parseTopicString(values.value || '')
        setAccountAllParams({
          des: values.value,
          images: values.imgs,
          video: values.video,
          topics,
        })
      },
      [setAccountAllParams],
    )

    const commonTitleMax = useMemo(() => {
      return getCommonPublishTitleMax(pubListChoosed)
    }, [platformInfoMap, pubListChoosed])

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

      // 如果没有选择任何频道（全部频道），选中所有账号
      if (!activeSpaceId) {
        if (pubList.length > 0) {
          setPubListChoosed(pubList)
        }
        return
      }

      if (!accountGroupList || accountGroupList.length === 0) {
        return
      }

      const selectedGroup = accountGroupList.find(g => g.id === activeSpaceId)
      if (!selectedGroup) {
        return
      }

      // 找出该频道下的所有账户
      const channelAccountIds = new Set(selectedGroup.children.map(child => child.id))
      const channelAccounts = pubList.filter(pubItem => channelAccountIds.has(pubItem.account.id))

      // 如果频道下没有账户，回退到全部频道
      if (channelAccounts.length === 0) {
        setActiveSpaceId(undefined)
        return
      }

      // 自动选中这些账户
      setPubListChoosed(channelAccounts)
    }, [activeSpaceId, accountGroupList, pubList, setPubListChoosed, setActiveSpaceId])

    // ============ Render ============

    return (
      <div
        ref={containerRef}
        className="flex h-full min-h-0 w-full overflow-hidden bg-background"
        data-testid="publish-dialog-container"
      >
        <PublishDialogDragPreviewLayer />

        {/* 左侧 AI 内容创作区域 */}
        <div
          className={cn(
            'min-h-0 shrink-0 overflow-hidden border-r border-border bg-background',
            isResizing ? 'transition-none' : 'transition-[width,opacity] duration-300 ease-in-out',
            isDraftPanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          style={{ width: isDraftPanelOpen ? layout?.draftPanelWidth ?? '52%' : 0 }}
          aria-hidden={!isDraftPanelOpen}
        >
          <div className="h-full min-w-[320px]">
            <PublishDialogDraftPanel />
          </div>
        </div>

        {/* 双栏拖拽条 */}
        <div
          role="separator"
          aria-orientation="vertical"
          className={cn(
            'group relative shrink-0 overflow-hidden bg-border/60 transition-[width,background-color] duration-300 ease-in-out hover:bg-primary/30',
            isResizing && 'transition-none',
            isDraftPanelOpen ? 'cursor-col-resize' : 'cursor-default',
          )}
          style={{ width: isDraftPanelOpen ? resizeHandleWidth : 0 }}
          onPointerDown={handleResizeStart}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary" />
        </div>

        {/* 右侧发布内容区域 */}
        <div
          ref={(node) => {
            drop(node)
          }}
          className={cn(
            'relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-background transition-colors',
            isOver && canDrop && 'bg-primary/5 ring-2 ring-inset ring-primary/50',
          )}
          onClick={() => {
            if (step === 1) {
              setExpandedPubItem(undefined)
            }
          }}
        >
          {isOver && canDrop && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card px-8 py-6 shadow-xl">
                <UploadCloud className="h-10 w-10 text-primary" />
                <p className="text-base font-medium text-foreground">
                  {t('upload.dropPublishContent')}
                </p>
              </div>
            </div>
          )}

          <div className="box-border p-5 flex-1 min-h-0 overflow-auto">
            {/* 头部标题和频道选择器 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shadow-sm"
                        aria-label={isDraftPanelOpen
                          ? t('layout.hideContentManagement')
                          : t('layout.showContentManagement')}
                        onClick={() => setDraftPanelOpen(!isDraftPanelOpen)}
                      >
                        {isDraftPanelOpen
                          ? <PanelLeftClose className="h-4 w-4" />
                          : <PanelLeftOpen className="h-4 w-4" />}
                        {t('layout.showContentManagement')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="max-w-72 text-xs leading-relaxed">
                      {t('layout.contentManagementTooltip')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-semibold text-base">{t('title')}</span>

                {/* 频道选择器下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md border border-border',
                        'hover:bg-muted cursor-pointer transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'min-w-[120px]',
                      )}
                      data-testid="publish-channel-selector"
                    >
                      {selectedSpace ? (
                        <>
                          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                          <span className="flex-1 truncate text-xs text-foreground text-left">
                            {selectedSpace.name}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        </>
                      ) : (
                        <>
                          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-xs text-foreground text-left">
                            {t('allChannels')}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-[240px]">
                    {/* 全部频道选项 */}
                    <DropdownMenuItem
                      onClick={() => handleSpaceChange(undefined)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 cursor-pointer',
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
                            'flex items-center gap-3 px-3 py-2.5 cursor-pointer',
                            activeSpaceId === group.id && 'bg-accent',
                          )}
                        >
                          <FolderOpen className="h-5 w-5 shrink-0 text-primary" />
                          <span className="flex-1 text-sm truncate">{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.children.length}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-background shadow-sm hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                aria-label={t('layout.closeDialog')}
                title={t('layout.closeDialog')}
                data-testid="publish-close-button"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 账户选择器 */}
            <AccountSelector
              onOfflineClick={handleOfflineAvatarClick}
            />

            {/* 错误汇总 */}
            <ErrorSummary
              pubListChoosed={pubListChoosed}
              errParamsMap={errParamsMap}
              warningParamsMap={warningParamsMap}
              onAccountClick={handleErrorAccountClick}
            />

            {/* 内容编辑区域 */}
            <div className="mt-5">
              {step === 0 ? (
                <>
                  {pubListChoosed.length === 1 && (
                    <PlatParamsSetting
                      pubItem={pubListChoosed[0]}
                    />
                  )}
                  {pubListChoosed.length >= 2 && (
                    <PubParmasTextarea
                      key={`${commonPubParams.images?.length || 0}-${
                        commonPubParams.video ? 'video' : 'no-video'
                      }`}
                      platType={pubListChoosed[0].account.type}
                      rows={16}
                      desValue={commonPubParams.des}
                      videoFileValue={commonPubParams.video}
                      imageFileListValue={commonPubParams.images}
                      onChange={handleParamsChange}
                      extend={commonTitleMax !== undefined && (
                        <CommonTitleInput
                          titleValue={commonPubParams.title || ''}
                          titleMax={commonTitleMax}
                          onTitleChange={title => setAccountAllParams({ title })}
                        />
                      )}
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
                    />
                  ))}
                </>
              )}

              {/* 空状态提示 */}
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
                    <div className="flex items-center justify-center text-center text-muted-foreground h-[200px]">
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
          <PublishFooter
            createLoading={createLoading}
            onPublish={onPublish}
            onNextStep={handleNextStep}
          />
        </div>

      </div>
    )
  },
)

DesktopPublishContent.displayName = 'DesktopPublishContent'

export default DesktopPublishContent
