/**
 * DraftContentModule - 内容管理核心模块
 * 可复用的草稿管理区域，包含 AI生成栏、草稿列表、相关弹框
 */

'use client'

import type { IPubParams } from '@/components/PublishDialog/publishDialog.type'
import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import PublishDialog from '@/components/PublishDialog'
import { VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'

import { generateUUID } from '@/utils'
import { useDraftBoxStore } from '../../draftBoxStore'
import { useGenerationPolling } from '../../hooks/useGenerationPolling'
import AiBatchGenerateBar from '../AiBatchGenerateBar'
import { CreateMaterialModal } from '../CreateMaterialModal'
import { DraftDetailDialog } from '../DraftDetailDialog'
import { DraftListSection } from '../DraftListSection'
import { GenerationDetailDialog } from '../GenerationDetailDialog'

function DraftContentModule() {
  const {
    currentPlan,
    createMaterialModalOpen,
    editingMaterial,
    generatingCount,
    publishDialogOpen,
    publishingDraft,
  } = useDraftBoxStore(
    useShallow(state => ({
      currentPlan: state.currentPlan,
      createMaterialModalOpen: state.createMaterialModalOpen,
      editingMaterial: state.editingMaterial,
      generatingCount: state.generatingCount,
      publishDialogOpen: state.publishDialogOpen,
      publishingDraft: state.publishingDraft,
    })),
  )

  const selectedPlanId = currentPlan?._id || null
  const closeMaterialModal = useDraftBoxStore(state => state.closeMaterialModal)
  const fetchMaterials = useDraftBoxStore(state => state.fetchMaterials)
  const closePublishDialog = useDraftBoxStore(state => state.closePublishDialog)
  const silentRefreshMaterials = useDraftBoxStore(state => state.silentRefreshMaterials)
  const updateGeneratingCount = useDraftBoxStore(state => state.updateGeneratingCount)

  const accountList = useAccountStore(state => state.accountList)

  // AI 批量生成轮询
  useGenerationPolling({
    enabled: generatingCount > 0,
    interval: 5000,
    onTaskCompleted: () => {
      if (selectedPlanId) {
        silentRefreshMaterials(selectedPlanId)
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
    if (currentPlan) {
      fetchMaterials(currentPlan._id, 1)
    }
  }, [currentPlan, fetchMaterials])

  return (
    <>
      <div className="space-y-6 p-4 md:p-6">
        {/* AI 批量生成输入栏 */}
        <AiBatchGenerateBar groupId={selectedPlanId || undefined} />
        {/* 草稿列表 */}
        <DraftListSection />
      </div>

      {/* 创建草稿弹窗 */}
      <CreateMaterialModal
        open={createMaterialModalOpen}
        groupId={currentPlan?._id || null}
        editingMaterial={editingMaterial}
        onClose={closeMaterialModal}
        onSuccess={handleMaterialSuccess}
      />

      {/* 草稿详情弹窗 */}
      <DraftDetailDialog />

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
    </>
  )
}

export default DraftContentModule
