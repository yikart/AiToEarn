/**
 * DraftContentModule - 内容管理核心模块
 * 可复用的草稿管理区域，包含 AI生成栏、草稿列表、相关弹框
 * 在 brand-promotion 页面和独立 draft-box 页面中复用
 */

'use client'

import type { DraftListSectionTab } from '../DraftListSection'
import type { IPubParams } from '@/components/PublishDialog/publishDialog.type'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import PublishDialog from '@/components/PublishDialog'
import { VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { generateUUID } from '@/utils'
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
  /** 外部指定草稿箱 ID，不依赖当前推广计划 */
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
}

function DraftContentModule({
  groupId,
  draftListTabs,
  draftListDefaultTab,
  forceDraftMode = false,
  allowTransfer = true,
  showVideoCreateDraftTaskWidget = true,
  contentClassName = 'space-y-6 p-4 md:p-6',
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
  const pollingTaskIds = useMemo(
    () => generationTasks.filter(task => task.status === 'generating').map(task => task.id),
    [generationTasks],
  )

  const accountList = useAccountStore(state => state.accountList)

  // Plan 切换时重置媒体 Tab 数据
  useEffect(() => {
    useMediaTabStore.getState().reset()
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
    },
    onCountUpdate: updateGeneratingCount,
  })

  // 根据草稿类型计算默认选中的账户
  const defaultAccountIds = useMemo(() => {
    if (!publishingDraft)
      return undefined
    const isVideo = publishingDraft.mediaList?.some(m => m.type === 'video')
    const targetPubType = isVideo ? PubType.VIDEO : PubType.ImageText

    return accountList
      .filter((acc) => {
        const platConfig = AccountPlatInfoMap.get(acc.type)
        return platConfig?.pubTypes.has(targetPubType) && acc.status !== 0
      })
      .map(acc => acc.id)
  }, [publishingDraft, accountList])

  // 发布弹框打开后预填草稿数据
  useEffect(() => {
    if (!publishDialogOpen || !publishingDraft)
      return

    const timer = setTimeout(async () => {
      const store = usePublishDialog.getState()
      if (!store.pubListChoosed?.length)
        return

      store.setPrefillLoading(true)

      const params: Partial<IPubParams> = {
        des: publishingDraft.desc || '',
        title: publishingDraft.title || '',
        topics: publishingDraft.topics,
      }

      // 将话题拼接到描述末尾，以便 Lexical 编辑器渲染为 mention 节点
      if (publishingDraft.topics?.length) {
        const topicStr = publishingDraft.topics.map(t => `#${t}`).join(' ')
        params.des = `${params.des || ''}\n${topicStr}`.trim()
      }

      const videoMedia = publishingDraft.mediaList?.find(m => m.type === 'video')
      if (videoMedia) {
        try {
          const videoInfo = await VideoGrabFrame(videoMedia.url, 0)
          const cover = publishingDraft.coverUrl
            ? {
                id: generateUUID(),
                size: 0,
                file: new File([], ''),
                imgUrl: publishingDraft.coverUrl,
                ossUrl: publishingDraft.coverUrl,
                filename: '',
                imgPath: '',
                width: videoInfo.width,
                height: videoInfo.height,
              }
            : videoInfo.cover
          params.video = {
            size: 0,
            file: new Blob(),
            videoUrl: videoMedia.url,
            ossUrl: videoMedia.url,
            filename: '',
            width: videoInfo.width,
            height: videoInfo.height,
            duration: videoInfo.duration,
            cover,
          }
        }
        catch {
          params.video = {
            size: 0,
            file: new Blob(),
            videoUrl: videoMedia.url,
            ossUrl: videoMedia.url,
            filename: '',
            width: 0,
            height: 0,
            duration: 0,
            cover: {
              id: generateUUID(),
              size: 0,
              file: new File([], ''),
              imgUrl: publishingDraft.coverUrl || '',
              ossUrl: publishingDraft.coverUrl,
              filename: '',
              imgPath: '',
              width: 0,
              height: 0,
            },
          }
        }
        params.images = []
      }
      else {
        params.images = publishingDraft.mediaList
          ?.filter(m => m.type === 'img')
          .map((m, i) => ({
            id: `draft-img-${i}`,
            size: 0,
            file: new File([], ''),
            imgUrl: m.url,
            filename: '',
            imgPath: '',
            width: 0,
            height: 0,
            ossUrl: m.url,
          })) || []
      }

      store.setAccountAllParams(params)
      store.setPrefillLoading(false)
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
  }, [fetchMaterials, selectedPlanId])

  return (
    <>
      <div className={contentClassName}>
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
              />
            )
          : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
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
      <PublishDialog
        open={publishDialogOpen}
        onClose={closePublishDialog}
        accounts={accountList}
        defaultAccountIds={defaultAccountIds}
        onPubSuccess={closePublishDialog}
      />

      {/* 视频生成草稿长任务悬浮窗 */}
      {showVideoCreateDraftTaskWidget && <VideoCreateDraftTaskWidget />}
    </>
  )
}

export default DraftContentModule
