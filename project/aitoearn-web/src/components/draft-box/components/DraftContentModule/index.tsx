/**
 * DraftContentModule - 内容管理核心模块
 * 可复用的草稿管理区域，包含 AI生成栏、草稿列表、相关弹框
 */

'use client'

import type { DraftListSectionTab } from '../DraftListSection'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PubType } from '@/app/config/publishConfig'
import PublishDialog from '@/components/PublishDialog'
import { buildPublishParamsFromDraft } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { isPlatformAvailable } from '@/store/platformMetadata/utils'
import { useUserStore } from '@/store/user'
import { useGenerationPolling } from '../../hooks/useGenerationPolling'
import AiBatchGenerateBar from '../AiBatchGenerateBar'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'
import { CreateMaterialModal } from '../CreateMaterialModal'
import { DraftDetailDialog } from '../DraftDetailDialog'
import { DraftListSection } from '../DraftListSection'
import { GenerationDetailDialog } from '../GenerationDetailDialog'
import { TransferDraftDialog } from '../TransferDraftDialog'
import { VideoCreateDraftTaskWidget } from '../VideoCreateDraftTaskWidget'

interface DraftContentModuleProps {
  /** 外部指定草稿箱 ID，不依赖当前草稿箱 */
  groupId?: string
  /** 草稿列表可见 Tab */
  draftListTabs?: DraftListSectionTab[]
  /** 草稿列表默认 Tab */
  draftListDefaultTab?: DraftListSectionTab
  /** 是否强制使用草稿生成模式 */
  forceDraftMode?: boolean
  /** 是否允许转移草稿 */
  allowTransfer?: boolean
  /** 是否显示视频生成草稿长任务悬浮窗 */
  showVideoCreateDraftTaskWidget?: boolean
  /** 内容区域外层样式 */
  contentClassName?: string
  /** 是否嵌入到其他弹框/面板中 */
  embedded?: boolean
  /** 是否允许拖拽草稿/素材到发布弹框 */
  enablePublishDrag?: boolean
}

function DraftContentModule({
  groupId,
  draftListTabs,
  draftListDefaultTab,
  forceDraftMode = false,
  allowTransfer = true,
  showVideoCreateDraftTaskWidget = true,
  contentClassName = 'space-y-6 p-4 md:p-6',
  embedded = false,
  enablePublishDrag = false,
}: DraftContentModuleProps) {
  const {
    currentPlan,
    createMaterialModalOpen,
    editingMaterial,
    generationTasks,
    publishDialogOpen,
    publishingDraft,
    closeMaterialModal,
    fetchMaterials,
    closePublishDialog,
    syncGenerationTasks,
    updateGeneratingCount,
  } = usePlanDetailStore(
    useShallow(state => ({
      currentPlan: state.currentPlan,
      createMaterialModalOpen: state.createMaterialModalOpen,
      editingMaterial: state.editingMaterial,
      generationTasks: state.generationTasks,
      publishDialogOpen: state.publishDialogOpen,
      publishingDraft: state.publishingDraft,
      closeMaterialModal: state.closeMaterialModal,
      fetchMaterials: state.fetchMaterials,
      closePublishDialog: state.closePublishDialog,
      syncGenerationTasks: state.syncGenerationTasks,
      updateGeneratingCount: state.updateGeneratingCount,
    })),
  )

  const selectedPlanId = groupId || currentPlan?.id || null
  const previousMediaResetPlanIdRef = useRef<string | null>(null)
  const pollingTaskIds = useMemo(
    () => generationTasks.filter(task => task.status === 'generating').map(task => task.id),
    [generationTasks],
  )

  const accountList = useAccountStore(state => state.accountList)

  // Plan 切换时重置媒体 Tab 数据
  useLayoutEffect(() => {
    const previousPlanId = previousMediaResetPlanIdRef.current

    if (!selectedPlanId) {
      return
    }

    if (previousPlanId === selectedPlanId) {
      return
    }

    previousMediaResetPlanIdRef.current = selectedPlanId
    useMediaTabStore.getState().reset(selectedPlanId)
  }, [selectedPlanId])

  // AI 批量生成轮询
  useGenerationPolling({
    enabled: pollingTaskIds.length > 0,
    taskIds: pollingTaskIds,
    interval: 2000,
    onTasksUpdate: syncGenerationTasks,
    onTaskCompleted: () => {
      if (selectedPlanId) {
        // silentRefreshAll 内部已同步草稿数据到 planDetailStore，无需单独调用 silentRefreshMaterials
        useMediaTabStore.getState().silentRefresh(selectedPlanId)
        useMediaTabStore.getState().silentRefreshAll(selectedPlanId, selectedPlanId)
      }
      useUserStore.getState().fetchCreditsBalance()
    },
    onCountUpdate: updateGeneratingCount,
  })

  // 根据草稿类型计算默认选中的账户
  const defaultAccountIds = useMemo(() => {
    if (!publishingDraft) {
      return undefined
    }
    const isVideo = publishingDraft.mediaList?.some(m => m.type === 'video')
    const targetPubType = isVideo ? PubType.VIDEO : PubType.ImageText

    const ids = accountList
      .filter((acc) => {
        const platConfig = getPlatformInfoSync(acc.type)
        return isPlatformAvailable(platConfig) && platConfig.pubTypes.has(targetPubType) && acc.status !== 0
      })
      .map(acc => acc.id)
    return ids
  }, [publishingDraft, accountList])

  // 发布弹框打开后预填草稿数据
  useEffect(() => {
    if (!publishDialogOpen || !publishingDraft)
      return

    const timer = setTimeout(async () => {
      const store = usePublishDialog.getState()
      if (!store.pubListChoosed?.length) {
        return
      }

      store.setPrefillLoading(true)
      try {
        store.setAccountAllParams(await buildPublishParamsFromDraft(publishingDraft))
      }
      finally {
        store.setPrefillLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      usePublishDialog.getState().setPrefillLoading(false)
    }
  }, [publishDialogOpen, publishingDraft])

  // 创建草稿成功回调
  const handleMaterialSuccess = useCallback(() => {
    if (selectedPlanId) {
      fetchMaterials(selectedPlanId, 1)
    }
    useUserStore.getState().fetchCreditsBalance()
  }, [fetchMaterials, selectedPlanId])

  return (
    <>
      <div className={embedded ? '@container' : undefined}>
        <div className={embedded ? 'flex flex-col gap-4 p-4' : contentClassName}>
          {/* AI 批量生成输入栏 */}
          <AiBatchGenerateBar groupId={selectedPlanId || undefined} forceDraftMode={forceDraftMode} />
          {/* 内容 Tabs：草稿箱 / 视频 / 图片 */}
          {selectedPlanId
            ? (
                <DraftListSection
                  materialGroupId={selectedPlanId}
                  tabs={draftListTabs}
                  defaultTab={draftListDefaultTab}
                  allowTransfer={allowTransfer}
                  batchActionPosition={embedded ? 'sticky' : 'fixed'}
                  useContainerResponsive={embedded}
                  enablePublishDrag={enablePublishDrag}
                />
              )
            : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
        </div>
      </div>

      {/* 创建草稿弹窗 */}
      <CreateMaterialModal
        open={createMaterialModalOpen}
        groupId={selectedPlanId}
        editingMaterial={editingMaterial}
        onClose={closeMaterialModal}
        onSuccess={handleMaterialSuccess}
      />

      {/* 草稿详情弹窗 */}
      <DraftDetailDialog allowTransfer={allowTransfer} />

      {/* 移动到草稿箱弹窗 */}
      {allowTransfer && <TransferDraftDialog />}

      {/* 生成任务详情弹框 */}
      <GenerationDetailDialog />

      {/* 发布弹框 */}
      {!embedded && (
        <PublishDialog
          open={publishDialogOpen}
          onClose={closePublishDialog}
          accounts={accountList}
          defaultAccountIds={defaultAccountIds}
          onPubSuccess={closePublishDialog}
        />
      )}

      {/* 视频生成草稿长任务悬浮窗 */}
      {showVideoCreateDraftTaskWidget && <VideoCreateDraftTaskWidget />}
    </>
  )
}

export default DraftContentModule
