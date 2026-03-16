/**
 * 发布作品弹框
 * 支持多平台内容发布，包含 AI 助手、内容编辑、预览等功能
 */

import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import type { IPublishDialogAiRef } from '@/components/PublishDialog/compoents/PublishDialogAi'

import { Loader2 } from 'lucide-react'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'

import { getChatModels } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import DesktopPublishContent from '@/components/PublishDialog/compoents/DesktopPublishContent'
import MobilePublishContent from '@/components/PublishDialog/compoents/mobile/MobilePublishContent'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import PublishModals from '@/components/PublishDialog/compoents/PublishModals'
import { useAISync } from '@/components/PublishDialog/hooks/useAISync'
import { useCloseDialog } from '@/components/PublishDialog/hooks/useCloseDialog'
import { useContentModeration } from '@/components/PublishDialog/hooks/useContentModeration'
import { usePublishActions } from '@/components/PublishDialog/hooks/usePublishActions'
import {
  usePublishDetailModalActions,
  usePublishModalState,
} from '@/components/PublishDialog/hooks/usePublishState'
import usePubParamsVerify from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { useUploadSync } from '@/components/PublishDialog/hooks/useUploadSync'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { Modal } from '@/components/ui/modal'
import { useIsMobile } from '@/hooks/useIsMobile'

import './publishDialogTransition.css'

// ============ 类型定义 ============

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
  // 默认选中的账户Id列表
  defaultAccountIds?: string[]
  // 是否抑制自动发布（用于从任务页面打开，先让用户确认后再发布）
  suppressAutoPublish?: boolean
  // 关联的任务ID（如果是从任务流程打开）
  taskIdForPublish?: string
  // 发布确认回调（发布完成时触发，并携带 taskIdForPublish）
  onPublishConfirmed?: (taskId?: string, publishRecordId?: string, workLink?: string) => void
  // 发布开始回调（pubClick 开头触发，用于提前设置外部 loading）
  onPublishStart?: () => void
}

// ============ 主组件 ============

const PublishDialog = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        accounts,
        onPubSuccess,
        defaultAccountIds,
        suppressAutoPublish,
        taskIdForPublish,
        onPublishConfirmed,
        onPublishStart,
      }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const isMobile = useIsMobile()
      const { t } = useTransClient('publish')

      // ============ Store Hooks ============

      // 持久化存储
      const { setPubData, restorePubData, _hasHydrated, setPubListData }
        = usePublishDialogStorageStore(
          useShallow(state => ({
            setPubData: state.setPubData,
            restorePubData: state.restorePubData,
            _hasHydrated: state._hasHydrated,
            setPubListData: state.setPubListData,
          })),
        )

      // 发布弹框核心状态
      const {
        pubListChoosed,
        setPubListChoosed,
        init,
        clear,
        pubList,
        setStep,
        step,
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
        setAccountAllParams,
        prefillLoading,
      } = usePublishDialog(
        useShallow(state => ({
          pubListChoosed: state.pubListChoosed,
          setPubListChoosed: state.setPubListChoosed,
          init: state.init,
          clear: state.clear,
          pubList: state.pubList,
          setStep: state.setStep,
          step: state.step,
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
          setAccountAllParams: state.setAccountAllParams,
          prefillLoading: state.prefillLoading,
        })),
      )

      // 上传管理
      const { tasks, md5Cache, enqueueUpload } = usePublishManageUpload(
        useShallow(state => ({
          tasks: state.tasks,
          md5Cache: state.md5Cache,
          enqueueUpload: state.enqueueUpload,
        })),
      )

      // 参数校验
      const { errParamsMap, warningParamsMap } = usePubParamsVerify(pubListChoosed)

      // ============ Local State ============

      // 各种弹窗状态
      const modalState = usePublishModalState()
      const { closePublishDetailModal } = usePublishDetailModalActions(
        modalState.setPublishDetailVisible,
        modalState.setCurrentPublishTaskId,
      )

      // 聊天模型列表
      const [chatModels, setChatModels] = useState<any[]>([])

      // AI 助手 ref
      const aiAssistantRef = useRef<IPublishDialogAiRef>(null)

      // 控制标记
      const isClear = useRef(true)
      const isInit = useRef(false)
      const hasInitRef = useRef(false)

      // ============ Custom Hooks ============

      // 内容安全检测
      const contentModeration = useContentModeration({
        step,
        pubListChoosed,
        commonPubParams,
        expandedPubItem,
        t,
      })

      // 发布操作
      const { pubClick } = usePublishActions({
        pubListChoosed,
        pubTime,
        isMobile,
        suppressAutoPublish,
        taskIdForPublish,
        onPublishConfirmed,
        onPublishStart,
        onClose,
        onPubSuccess,
        setCreateLoading: modalState.setCreateLoading,
        setDouyinPermalink: modalState.setDouyinPermalink,
        setDouyinQRCodeVisible: modalState.setDouyinQRCodeVisible,
        setCurrentPublishTaskId: modalState.setCurrentPublishTaskId,
        setPublishDetailVisible: modalState.setPublishDetailVisible,
        t,
      })

      // AI 同步
      const { handleTextSelection, handleImageToImage, handleSyncToEditor } = useAISync({
        pubListChoosed,
        step,
        commonPubParams,
        expandedPubItem,
        openLeft,
        aiAssistantRef,
        setOpenLeft,
        setOnePubParams,
        setAccountAllParams,
        enqueueUpload: params =>
          enqueueUpload({
            file: params.file,
            fileName: params.fileName,
            type: params.type,
          }),
      })

      // 上传结果同步
      useUploadSync({
        pubListChoosed,
        tasks,
        md5Cache,
        setPubListChoosed,
      })

      // ============ Effects ============

      // 同步错误和警告到 store
      useEffect(() => {
        setErrParamsMap(errParamsMap)
      }, [errParamsMap, setErrParamsMap])

      useEffect(() => {
        setWarningParamsMap(warningParamsMap)
      }, [warningParamsMap, setWarningParamsMap])

      // 恢复持久化数据
      useEffect(() => {
        if (open && _hasHydrated) {
          restorePubData()
        }
      }, [open, _hasHydrated, restorePubData])

      // 实时保存数据
      useEffect(() => {
        if (!open)
          return
        if (
          !expandedPubItem?.params.des
          && expandedPubItem?.params.images?.length === 0
          && !expandedPubItem?.params.video
        ) {
          return
        }
        if (isClear.current) {
          isClear.current = false
          return
        }
        setPubData(pubListChoosed)
      }, [pubListChoosed, open, expandedPubItem, setPubData])

      useEffect(() => {
        if (!expandedPubItem || pubList.length === 0)
          return
        if (isInit.current) {
          isInit.current = false
          return
        }
        setPubListData(pubList)
      }, [pubList, expandedPubItem, setPubListData])

      // 弹窗打开/关闭逻辑
      useEffect(() => {
        if (open) {
          if (hasInitRef.current)
            return // 已初始化，跳过重复 init
          hasInitRef.current = true
          isInit.current = true
          init(accounts, defaultAccountIds)

          // 获取聊天模型列表（使用 sessionStorage 缓存）
          const cachedModels = sessionStorage.getItem('ai_chat_models')
          if (cachedModels) {
            try {
              setChatModels(JSON.parse(cachedModels))
            }
            catch (error) {
              console.error(t('messages.parseCachedChatModelsFailed'), error)
            }
          }
          else {
            getChatModels()
              .then((res: any) => {
                if (res?.code === 0 && res.data && Array.isArray(res.data)) {
                  setChatModels(res.data)
                  sessionStorage.setItem('ai_chat_models', JSON.stringify(res.data))
                }
              })
              .catch((error) => {
                console.error(t('messages.getChatModelsFailed'), error)
              })
          }
        }
        else {
          hasInitRef.current = false // 关闭时重置，下次打开可重新 init
          isClear.current = true
          setPubListChoosed([])
          setStep(0)
          setExpandedPubItem(undefined)
          clear()
        }
      }, [
        open,
        accounts,
        defaultAccountIds,
        init,
        clear,
        setPubListChoosed,
        setStep,
        setExpandedPubItem,
        t,
      ])

      // 离线账号不可参与发布
      useEffect(() => {
        const filtered = pubListChoosed.filter(item => item.account.status !== 0)
        if (filtered.length !== pubListChoosed.length) {
          setPubListChoosed(filtered)
        }
      }, [pubListChoosed, setPubListChoosed])

      // ============ Callbacks ============

      // 关闭弹窗确认
      const { closeDialog } = useCloseDialog({ onClose, t })

      // Facebook 页面选择成功
      const handleFacebookPagesSuccess = useCallback(() => {
        modalState.setShowFacebookPagesModal(false)
      }, [modalState])

      // PC 不支持平台点击
      const handlePcNotSupportedClick = useCallback(
        (platformName: string) => {
          modalState.setCurrentPlatform(platformName)
          modalState.setDownloadModalVisible(true)
        },
        [modalState],
      )

      // Facebook 授权成功
      const handleFacebookAuthSuccess = useCallback(() => {
        modalState.setShowFacebookPagesModal(true)
      }, [modalState])

      // 处理下一步
      const handleNextStep = useCallback(() => {
        setExpandedPubItem(undefined)
        setStep(1)
      }, [setExpandedPubItem, setStep])

      // ============ Imperative Handle ============

      useImperativeHandle(ref, () => ({
        setPubTime,
      }))

      // ============ Render ============

      // 移动端渲染
      if (isMobile) {
        return (
          <>
            <Modal
              className="!w-full !h-full !max-w-none !max-h-none !m-0 !rounded-none !p-0 !bg-transparent !border-none !shadow-none [&>div]:!p-0 [&>div]:!rounded-none"
              bodyClassName="!p-4 !h-full"
              closable={false}
              open={open}
              onCancel={closeDialog}
              footer={null}
              width="auto"
            >
              <div className="relative h-full">
                <MobilePublishContent
                  accounts={accounts}
                  onClose={onClose}
                  onPubSuccess={onPubSuccess}
                  defaultAccountIds={defaultAccountIds}
                  suppressAutoPublish={suppressAutoPublish}
                  taskIdForPublish={taskIdForPublish}
                  onPublishConfirmed={onPublishConfirmed}
                  onPublishStart={onPublishStart}
                />
                {prefillLoading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </Modal>

            <PublishModals
              downloadModalVisible={modalState.downloadModalVisible}
              setDownloadModalVisible={modalState.setDownloadModalVisible}
              currentPlatform={modalState.currentPlatform}
              showFacebookPagesModal={modalState.showFacebookPagesModal}
              setShowFacebookPagesModal={modalState.setShowFacebookPagesModal}
              onFacebookPagesSuccess={handleFacebookPagesSuccess}
              douyinQRCodeVisible={modalState.douyinQRCodeVisible}
              setDouyinQRCodeVisible={modalState.setDouyinQRCodeVisible}
              douyinPermalink={modalState.douyinPermalink}
              publishDetailVisible={modalState.publishDetailVisible}
              onPublishDetailClose={closePublishDetailModal}
              currentPublishTaskId={modalState.currentPublishTaskId}
            />
          </>
        )
      }

      // PC端渲染
      return (
        <>
          <Modal
            className="!w-auto !max-w-none !max-h-none !p-0 !bg-transparent !border-none !shadow-none flex justify-center gap-0 !overflow-visible [&>div]:!p-0 [&>div]:!overflow-visible"
            bodyClassName="!p-0 !overflow-visible"
            closable={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
            width="auto"
          >
            <div className="relative">
              <DesktopPublishContent
                onClose={closeDialog}
                chatModels={chatModels}
                aiAssistantRef={aiAssistantRef}
                onSyncToEditor={handleSyncToEditor}
                onTextSelection={handleTextSelection}
                onImageToImage={handleImageToImage}
                createLoading={modalState.createLoading}
                hasDescription={contentModeration.hasDescription}
                needsContentModeration={contentModeration.needsContentModeration}
                moderationLoading={contentModeration.moderationLoading}
                moderationResult={contentModeration.moderationResult}
                moderationDesc={contentModeration.moderationDesc}
                moderationLevel={contentModeration.moderationLevel}
                onContentModeration={contentModeration.handleContentModeration}
                onPublish={pubClick}
                onPcNotSupportedClick={handlePcNotSupportedClick}
                onFacebookAuthSuccess={handleFacebookAuthSuccess}
              />
              {prefillLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </Modal>

          <PublishModals
            downloadModalVisible={modalState.downloadModalVisible}
            setDownloadModalVisible={modalState.setDownloadModalVisible}
            currentPlatform={modalState.currentPlatform}
            showFacebookPagesModal={modalState.showFacebookPagesModal}
            setShowFacebookPagesModal={modalState.setShowFacebookPagesModal}
            onFacebookPagesSuccess={handleFacebookPagesSuccess}
            douyinQRCodeVisible={modalState.douyinQRCodeVisible}
            setDouyinQRCodeVisible={modalState.setDouyinQRCodeVisible}
            douyinPermalink={modalState.douyinPermalink}
            publishDetailVisible={modalState.publishDetailVisible}
            onPublishDetailClose={closePublishDetailModal}
            currentPublishTaskId={modalState.currentPublishTaskId}
          />
        </>
      )
    },
  ),
)

PublishDialog.displayName = 'PublishDialog'

export default PublishDialog
