/**
 * PC端发布弹框主内容组件
 * 包含账户选择、内容编辑、预览等核心功能
 */

import type { RefObject } from 'react'
import type {
  AIAction,
  IPublishDialogAiRef,
} from '@/components/PublishDialog/compoents/PublishDialogAi'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'

import { ChevronDown, FolderOpen, Layers, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { useWindowSize } from 'react-use'
import { useShallow } from 'zustand/react/shallow'
import { PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AccountSelector from '@/components/PublishDialog/compoents/AccountSelector'
import ErrorSummary from '@/components/PublishDialog/compoents/ErrorSummary'
import PlatParamsSetting from '@/components/PublishDialog/compoents/PlatParamsSetting'
import PublishDialogAi from '@/components/PublishDialog/compoents/PublishDialogAi'
import PublishDialogPreview from '@/components/PublishDialog/compoents/PublishDialogPreview'
import PublishFooter from '@/components/PublishDialog/compoents/PublishFooter'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import TextSelectionToolbar from '@/components/PublishDialog/compoents/TextSelectionToolbar'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { usePlatformAuth } from '@/components/PublishDialog/hooks/usePlatformAuth'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { parseTopicString } from '@/utils'

/**
 * 外部必须传入的 props（无法从 store 获取的）
 */
interface DesktopPublishContentProps {
  // 外部回调
  onClose: () => void
  // AI 相关
  chatModels: any[]
  aiAssistantRef: RefObject<IPublishDialogAiRef>
  onSyncToEditor: (content: string, images?: IImgFile[], video?: any, append?: boolean) => void
  onTextSelection: (action: AIAction, selectedText: string) => void
  onImageToImage: (imageFile: IImgFile) => void
  // 内容检测相关
  createLoading: boolean
  hasDescription: boolean
  needsContentModeration: boolean
  moderationLoading: boolean
  moderationResult: boolean | null
  moderationDesc: string
  moderationLevel: any
  onContentModeration: () => Promise<void>
  // 发布
  onPublish: () => void
  // 下载App弹窗回调
  onPcNotSupportedClick: (platformName: string) => void
  // Facebook 授权成功回调
  onFacebookAuthSuccess: () => void
}

/**
 * PC端发布弹框主内容组件
 */
export const DesktopPublishContent = memo(
  ({
    onClose,
    chatModels,
    aiAssistantRef,
    onSyncToEditor,
    onTextSelection,
    onImageToImage,
    createLoading,
    hasDescription,
    needsContentModeration,
    moderationLoading,
    moderationResult,
    moderationDesc,
    moderationLevel,
    onContentModeration,
    onPublish,
    onPcNotSupportedClick,
    onFacebookAuthSuccess,
  }: DesktopPublishContentProps) => {
    const { t } = useTransClient('publish')
    const { width } = useWindowSize()

    // ============ 从 Store 获取状态（不再通过 props 传递）============

    const {
      pubList,
      pubListChoosed,
      commonPubParams,
      step,
      expandedPubItem,
      errParamsMap,
      warningParamsMap,
      openLeft,
      setOpenLeft,
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
        openLeft: state.openLeft,
        setOpenLeft: state.setOpenLeft,
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
    const { handleOfflineAvatarClick } = usePlatformAuth({
      accountGroupList,
      getAccountList,
      onFacebookAuthSuccess,
      t,
    })

    // ============ Local State & Refs ============

    // 中间内容区域ref，用于划词功能
    const contentAreaRef = useRef<HTMLDivElement>(null)

    // 追踪是否是用户主动切换频道（而非初始化或数据变化）
    const isUserSwitchingSpace = useRef(false)

    // ============ Computed Values ============

    // 获取当前选中的频道信息
    const selectedSpace = useMemo(() => {
      if (!activeSpaceId)
        return undefined
      return accountGroupList.find(g => g.id === activeSpaceId)
    }, [activeSpaceId, accountGroupList])

    // 是否打开右侧预览
    const openRight = useMemo(() => {
      if (step === 0) {
        return pubListChoosed.length !== 0
      }
      else {
        return expandedPubItem !== undefined
      }
    }, [pubListChoosed, expandedPubItem, step])

    // 是否打开左侧AI助手
    const openLeftSide = useMemo(() => {
      if (!openLeft)
        return false
      return true
    }, [openLeft])

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
      (values: { value?: string, imgs?: IImgFile[], video?: any }) => {
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
      <div className="flex-1 flex max-h-[calc(100vh-80px)]" data-testid="publish-dialog-container">
        {/* 左侧 AI 助手（宽屏时） */}
        {width >= 1400 && (
          <CSSTransition in={openLeftSide} timeout={300} classNames="left" unmountOnExit>
            <PublishDialogAi
              ref={aiAssistantRef}
              onClose={() => setOpenLeft(false)}
              onSyncToEditor={onSyncToEditor}
              chatModels={chatModels}
            />
          </CSSTransition>
        )}

        {/* 中间主内容区域 */}
        <div
          className="bg-background relative z-10 rounded-lg w-[720px] flex flex-col min-h-0"
          onClick={() => {
            if (step === 1) {
              setExpandedPubItem(undefined)
            }
          }}
        >
          {/* 划词工具栏 */}
          <TextSelectionToolbar onAction={onTextSelection} />

          <div className="box-border p-5 flex-1 min-h-0 overflow-auto" ref={contentAreaRef}>
            {/* 头部标题和频道选择器 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
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

              <X
                onClick={onClose}
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                data-testid="publish-close-button"
              />
            </div>

            {/* 账户选择器 */}
            <AccountSelector
              onOfflineClick={handleOfflineAvatarClick}
              onPcNotSupportedClick={onPcNotSupportedClick}
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
                      onImageToImage={onImageToImage}
                    />
                  )}
                  {pubListChoosed.length >= 2 && (
                    <PubParmasTextarea
                      key={`${commonPubParams.images?.length || 0}-${
                        commonPubParams.video ? 'video' : 'no-video'
                      }`}
                      platType={PlatType.Instagram}
                      rows={16}
                      desValue={commonPubParams.des}
                      videoFileValue={commonPubParams.video}
                      imageFileListValue={commonPubParams.images}
                      onChange={handleParamsChange}
                      onImageToImage={onImageToImage}
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
                      onImageToImage={onImageToImage}
                    />
                  ))}
                </>
              )}

              {/* 空状态提示 */}
              {pubListChoosed.length === 0
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
            hasDescription={hasDescription}
            needsContentModeration={needsContentModeration}
            moderationLoading={moderationLoading}
            moderationResult={moderationResult}
            moderationDesc={moderationDesc}
            moderationLevel={moderationLevel}
            onContentModeration={onContentModeration}
            onPublish={onPublish}
            onNextStep={handleNextStep}
          />
        </div>

        {/* 右侧预览和AI助手（窄屏时） */}
        <div className="flex relative [&>#publishDialogAi]:absolute [&>#publishDialogAi]:top-0 [&>#publishDialogAi]:h-full [&>#publishDialogAi]:z-20">
          {/* 屏幕宽度不够时，AI助手绝对定位覆盖在预览上方 */}
          {width < 1400 && (
            <CSSTransition in={openLeftSide} timeout={300} classNames="left" unmountOnExit>
              <PublishDialogAi
                ref={aiAssistantRef}
                onClose={() => setOpenLeft(false)}
                onSyncToEditor={onSyncToEditor}
                chatModels={chatModels}
              />
            </CSSTransition>
          )}
          <CSSTransition in={openRight} timeout={300} classNames="right" unmountOnExit>
            <PublishDialogPreview />
          </CSSTransition>
        </div>
      </div>
    )
  },
)

DesktopPublishContent.displayName = 'DesktopPublishContent'

export default DesktopPublishContent
