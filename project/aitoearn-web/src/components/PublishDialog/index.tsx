/**
 * 发布作品弹框
 * 支持多平台内容发布，包含内容管理、发布编辑等功能
 */

import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/accounts/account.types'

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'

import { useTransClient } from '@/app/i18n/client'
import DesktopPublishContent from '@/components/PublishDialog/compoents/DesktopPublishContent'
import MobilePublishContent from '@/components/PublishDialog/compoents/mobile/MobilePublishContent'
import { PublishDialogSkeleton } from '@/components/PublishDialog/compoents/PublishDialogSkeleton'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import PublishModals from '@/components/PublishDialog/compoents/PublishModals'
import { useAutoPublishOnReady } from '@/components/PublishDialog/hooks/useAutoPublishOnReady'
import { useCloseDialog } from '@/components/PublishDialog/hooks/useCloseDialog'
import { usePublishActions } from '@/components/PublishDialog/hooks/usePublishActions'
import {
  usePublishDetailModalActions,
  usePublishModalState,
} from '@/components/PublishDialog/hooks/usePublishState'
import usePubParamsVerify from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { useUploadSync } from '@/components/PublishDialog/hooks/useUploadSync'
import { useValidatedPublishTrigger } from '@/components/PublishDialog/hooks/useValidatedPublishTrigger'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { Modal } from '@/components/ui/modal'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAccountStore } from '@/store/account'

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
  // 关联的素材组 ID（如果是从任务流程打开）
  materialGroupIdForPublish?: string
  // 关联的草稿素材 ID（如果是从任务流程打开且存在推荐草稿）
  materialIdForPublish?: string
  // 发布确认回调（发布完成时触发，并携带 taskIdForPublish）
  onPublishConfirmed?: (taskId?: string, publishRecordId?: string) => void
  // 发布开始回调（pubClick 开头触发，用于提前设置外部 loading）
  onPublishStart?: () => void
  // 发布完成后是否自动关闭详情弹框（默认 false）
  autoCloseOnComplete?: boolean
  // 弹框内容就绪后自动触发一次发布
  autoPublishOnReady?: boolean
  // 账号列表首次加载中
  accountListInitialLoading?: boolean
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
        materialGroupIdForPublish,
        materialIdForPublish,
        onPublishConfirmed,
        onPublishStart,
        autoCloseOnComplete,
        autoPublishOnReady,
        accountListInitialLoading = false,
      }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const isMobile = useIsMobile()
      const { t, ready: publishI18nReady } = useTransClient('publish', {
        useSuspense: false,
      })
      const {} = useTransClient('brandPromotion', {
        useSuspense: false,
      })

      // ============ Store Hooks ============

      const {
        latestAccountMap,
        accountPluginAuthLoading,
      } = useAccountStore(
        useShallow(state => ({
          latestAccountMap: state.accountMap,
          accountPluginAuthLoading: state.accountPluginAuthLoading,
        })),
      )
      const latestAccounts = useMemo(
        () => accounts.map(account => latestAccountMap.get(account.id) ?? account),
        [accounts, latestAccountMap],
      )

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
        syncAccounts,
        clear,
        pubList,
        setStep,
        setExpandedPubItem,
        expandedPubItem,
        setErrParamsMap,
        setPubTime,
        pubTime,
        setWarningParamsMap,
        prefillLoading,
      } = usePublishDialog(
        useShallow(state => ({
          pubListChoosed: state.pubListChoosed,
          setPubListChoosed: state.setPubListChoosed,
          init: state.init,
          syncAccounts: state.syncAccounts,
          clear: state.clear,
          pubList: state.pubList,
          setStep: state.setStep,
          setExpandedPubItem: state.setExpandedPubItem,
          expandedPubItem: state.expandedPubItem,
          setErrParamsMap: state.setErrParamsMap,
          setWarningParamsMap: state.setWarningParamsMap,
          setPubTime: state.setPubTime,
          pubTime: state.pubTime,
          prefillLoading: state.prefillLoading,
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

      // 各种弹窗状态
      const modalState = usePublishModalState()
      const { closePublishDetailModal } = usePublishDetailModalActions(
        modalState.setPublishDetailVisible,
        modalState.setCurrentPublishTaskId,
      )

      // 控制标记
      const isClear = useRef(true)
      const isInit = useRef(false)
      const hasInitRef = useRef(false)
      const hasAppliedDefaultSelectionRef = useRef(false)
      const hasRequestedRestoreRef = useRef(false)
      const previousOpenRef = useRef(open)
      const publishPluginLoading = open && !accountListInitialLoading && accountPluginAuthLoading
      const dialogLoading = accountListInitialLoading || publishPluginLoading || prefillLoading || !publishI18nReady

      // ============ Custom Hooks ============

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
        setCreateLoading: modalState.setCreateLoading,
        setCurrentPublishTaskId: modalState.setCurrentPublishTaskId,
        setPublishDetailVisible: modalState.setPublishDetailVisible,
        t,
      })
      const { triggerPublish } = useValidatedPublishTrigger(pubClick)

      useAutoPublishOnReady({
        enabled: autoPublishOnReady && !isMobile,
        open,
        ready: !dialogLoading && !modalState.createLoading,
        selectedCount: pubListChoosed.length,
        triggerPublish,
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
        if (!open) {
          return
        }

        setErrParamsMap(errParamsMap)
      }, [errParamsMap, open, setErrParamsMap])

      useEffect(() => {
        if (!open) {
          return
        }

        setWarningParamsMap(warningParamsMap)
      }, [open, setWarningParamsMap, warningParamsMap])

      // 恢复持久化数据
      useEffect(() => {
        if (!open) {
          hasRequestedRestoreRef.current = false
          return
        }

        if (
          !_hasHydrated
          || accountListInitialLoading
          || pubList.length === 0
          || hasRequestedRestoreRef.current
        ) {
          return
        }

        hasRequestedRestoreRef.current = true
        isClear.current = true
        restorePubData()
      }, [accountListInitialLoading, open, pubList.length, _hasHydrated, restorePubData])

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
        const wasOpen = previousOpenRef.current

        if (open) {
          previousOpenRef.current = true
          if (hasInitRef.current) {
            const hasSelected = syncAccounts(latestAccounts, defaultAccountIds, {
              applyDefaultWhenEmpty: !hasAppliedDefaultSelectionRef.current,
            })
            if (hasSelected) {
              hasAppliedDefaultSelectionRef.current = true
            }
            return // 已初始化，跳过重复 init
          }
          hasInitRef.current = true
          isInit.current = true
          hasAppliedDefaultSelectionRef.current = init(latestAccounts, defaultAccountIds)
        }
        else {
          previousOpenRef.current = false
          if (!wasOpen) {
            return
          }
          hasInitRef.current = false // 关闭时重置，下次打开可重新 init
          hasAppliedDefaultSelectionRef.current = false
          isClear.current = true
          setPubListChoosed([])
          setStep(0)
          setExpandedPubItem(undefined)
          clear()
        }
      }, [
        open,
        latestAccounts,
        defaultAccountIds,
        init,
        syncAccounts,
        clear,
        setPubListChoosed,
        setStep,
        setExpandedPubItem,
      ])

      // ============ Callbacks ============

      // 关闭弹窗确认
      const { closeDialog } = useCloseDialog({ onClose, t })

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

      const publishModalsNode = (
        <PublishModals
          douyinQRCodeVisible={modalState.douyinQRCodeVisible}
          setDouyinQRCodeVisible={modalState.setDouyinQRCodeVisible}
          douyinPermalink={modalState.douyinPermalink}
          publishDetailVisible={modalState.publishDetailVisible}
          onPublishDetailClose={closePublishDetailModal}
          currentPublishTaskId={modalState.currentPublishTaskId}
          autoCloseOnComplete={autoCloseOnComplete}
        />
      )

      const hasOpenChildModal = modalState.douyinQRCodeVisible
        || modalState.publishDetailVisible

      if (!open && !hasOpenChildModal) {
        return null
      }

      if (!open) {
        return publishModalsNode
      }

      // 移动端渲染
      if (isMobile) {
        return (
          <>
            <Modal
              className="!inset-0 !left-0 !top-0 !h-[100dvh] !w-[100dvw] !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !p-0 !bg-background !border-none !shadow-none !duration-300 data-[state=open]:!animate-in data-[state=closed]:!animate-out data-[state=open]:!fade-in-0 data-[state=closed]:!fade-out-0 data-[state=open]:!zoom-in-95 data-[state=closed]:!zoom-out-95 [&>div]:!p-0 [&>div]:!rounded-none"
              bodyClassName="!m-0 !h-full !w-full !p-4"
              closable={false}
              maskClosable={false}
              open={open}
              onCancel={closeDialog}
              footer={null}
              width="auto"
              modal={false}
              disableFocusTrap
              overlayClassName="hidden"
            >
              <div className="relative h-full w-full">
                {publishI18nReady && (
                  <MobilePublishContent
                    open={open}
                    accounts={accounts}
                    onClose={onClose}
                    onPubSuccess={onPubSuccess}
                    defaultAccountIds={defaultAccountIds}
                    suppressAutoPublish={suppressAutoPublish}
                    taskIdForPublish={taskIdForPublish}
                    materialGroupIdForPublish={materialGroupIdForPublish}
                    materialIdForPublish={materialIdForPublish}
                    onPublishConfirmed={onPublishConfirmed}
                    onPublishStart={onPublishStart}
                    autoPublishOnReady={autoPublishOnReady}
                    createLoading={modalState.createLoading}
                    setCreateLoading={modalState.setCreateLoading}
                    setCurrentPublishTaskId={modalState.setCurrentPublishTaskId}
                    setPublishDetailVisible={modalState.setPublishDetailVisible}
                  />
                )}
                {dialogLoading && <PublishDialogSkeleton isMobile />}
              </div>
            </Modal>

            {publishModalsNode}
          </>
        )
      }

      // PC端渲染
      return (
        <>
          <Modal
            className="!inset-0 !left-0 !top-0 !h-[100dvh] !w-[100dvw] !min-h-0 !max-h-none !max-w-none !translate-x-0 !translate-y-0 !gap-0 !overflow-hidden !rounded-none !border-none !bg-background !p-0 !shadow-none !duration-300 data-[state=open]:!animate-in data-[state=closed]:!animate-out data-[state=open]:!fade-in-0 data-[state=closed]:!fade-out-0 data-[state=open]:!zoom-in-95 data-[state=closed]:!zoom-out-95 [&>div]:!m-0 [&>div]:!overflow-hidden [&>div]:!p-0"
            bodyClassName="!m-0 !h-full !min-h-0 !w-full !overflow-hidden !p-0"
            closable={false}
            maskClosable={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
            width="auto"
            contentStyle={{
              bottom: 0,
              height: '100dvh',
              left: 0,
              maxHeight: 'none',
              maxWidth: 'none',
              right: 0,
              top: 0,
              width: '100dvw',
            }}
            modal={false}
            disableFocusTrap
            overlayClassName="hidden"
          >
            <div className="relative h-full min-h-0 w-full">
              {publishI18nReady && (
                <DndProvider backend={HTML5Backend}>
                  <DesktopPublishContent
                    onClose={closeDialog}
                    createLoading={modalState.createLoading}
                    onPublish={pubClick}
                  />
                </DndProvider>
              )}
              {dialogLoading && <PublishDialogSkeleton isMobile={false} />}
            </div>
          </Modal>

          {publishModalsNode}
        </>
      )
    },
  ),
)

PublishDialog.displayName = 'PublishDialog'

export default PublishDialog
