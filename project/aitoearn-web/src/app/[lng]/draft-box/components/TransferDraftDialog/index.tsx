/**
 * TransferDraftDialog - 将草稿或媒体资源移动到其它草稿箱
 * 复用草稿箱列表接口和 SearchableSelect 完成目标草稿箱选择
 */

'use client'

import type { PromotionPlan } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { apiGetMaterialGroupList, apiTransferMaterials } from '@/api/material'
import { transferMedia } from '@/api/media'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from '@/lib/toast'
import { useTransferDraftDialogStore } from '../../transferDraftDialogStore'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'

const PAGE_SIZE = 100

function isApiSuccessResponse(value: unknown): value is { code: number } {
  return typeof value === 'object' && value !== null && 'code' in value && typeof value.code === 'number'
}

async function fetchAllDraftPlans() {
  const plans: PromotionPlan[] = []
  let page = 1
  let total = 0

  do {
    const res = await apiGetMaterialGroupList(page, PAGE_SIZE)
    const list = res?.data?.list || []
    total = res?.data?.total || 0
    plans.push(...list)

    if (list.length < PAGE_SIZE) {
      break
    }

    page += 1
  } while (plans.length < total)

  return plans
}

export const TransferDraftDialog = memo(() => {
  const { t } = useTransClient('brandPromotion')
  const { t: tCommon } = useTransClient('common')

  const {
    open,
    currentPlanId,
    draftIds,
    mediaIds,
    closeDialog,
  } = useTransferDraftDialogStore(
    useShallow(state => ({
      open: state.open,
      currentPlanId: state.currentPlanId,
      draftIds: state.draftIds,
      mediaIds: state.mediaIds,
      closeDialog: state.closeDialog,
    })),
  )

  const [plans, setPlans] = useState<PromotionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [targetPlanId, setTargetPlanId] = useState('')

  const selectedCount = draftIds.length + mediaIds.length

  const targetOptions = useMemo(() => {
    return plans
      .filter(plan => plan.id !== currentPlanId)
      .map(plan => ({
        value: plan.id,
        label: plan.name || plan.title || '',
      }))
  }, [plans, currentPlanId])

  const selectedTarget = useMemo(() => {
    return targetOptions.find(option => option.value === targetPlanId)
  }, [targetOptions, targetPlanId])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchAllDraftPlans()
      setPlans(list)
    }
    catch {
      setPlans([])
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setTargetPlanId('')
      return
    }

    setTargetPlanId('')
    loadPlans()
  }, [open, loadPlans])

  useEffect(() => {
    if (targetOptions.length === 1) {
      setTargetPlanId(targetOptions[0].value)
    }
  }, [targetOptions])

  const handleConfirm = useCallback(async () => {
    if (!currentPlanId || !targetPlanId || submitting) {
      return
    }

    setSubmitting(true)

    try {
      const transferTasks: Promise<unknown>[] = []

      if (draftIds.length > 0) {
        transferTasks.push(
          apiTransferMaterials({
            ids: draftIds,
            targetGroupId: targetPlanId,
            mode: 'move',
          }),
        )
      }

      if (mediaIds.length > 0) {
        transferTasks.push(
          transferMedia({
            ids: mediaIds,
            targetGroupId: targetPlanId,
            mode: 'move',
          }),
        )
      }

      const settledResults = await Promise.allSettled(transferTasks)
      const allSucceeded = settledResults.every((result) => {
        return result.status === 'fulfilled' && isApiSuccessResponse(result.value) && result.value.code === 0
      })

      const planStore = usePlanDetailStore.getState()
      const mediaStore = useMediaTabStore.getState()

      planStore.exitBatchMode()
      mediaStore.exitBatchMode()
      closeDialog()

      const refreshTasks: Promise<unknown>[] = []

      if (draftIds.length > 0 && planStore.currentPlan?.id === currentPlanId) {
        refreshTasks.push(planStore.fetchMaterials(currentPlanId, 1))
      }

      if (mediaIds.length > 0) {
        if (mediaStore.video.initialized) {
          refreshTasks.push(mediaStore.fetchMediaList(currentPlanId, 'video'))
        }
        if (mediaStore.img.initialized) {
          refreshTasks.push(mediaStore.fetchMediaList(currentPlanId, 'img'))
        }
      }

      if (mediaStore.all.initialized) {
        refreshTasks.push(mediaStore.fetchAllList(currentPlanId, currentPlanId))
      }

      await Promise.all(refreshTasks)

      if (allSucceeded) {
        toast.success(
          selectedTarget
            ? t('draftManage.transferSuccessWithTarget', { name: selectedTarget.label })
            : t('draftManage.transferSuccess'),
        )
      }
      else {
        toast.error(t('draftManage.transferFailed'))
      }
    }
    catch {
      usePlanDetailStore.getState().exitBatchMode()
      useMediaTabStore.getState().exitBatchMode()
      closeDialog()
      toast.error(t('draftManage.transferFailed'))
    }
    finally {
      setSubmitting(false)
    }
  }, [closeDialog, currentPlanId, draftIds, mediaIds, selectedTarget, submitting, t, targetPlanId])

  if (!open) {
    return null
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) {
          closeDialog()
        }
      }}
    >
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {t('draftManage.transferTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('draftManage.transferDescription', { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('draftManage.targetPlanLabel')}</Label>

            {loading
              ? (
                  <div className="flex h-10 items-center justify-center rounded-md border border-border bg-muted/20">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )
              : targetOptions.length > 0
                ? (
                    <SearchableSelect
                      options={targetOptions}
                      value={targetPlanId}
                      onValueChange={setTargetPlanId}
                      placeholder={t('draftManage.targetPlanPlaceholder')}
                      searchPlaceholder={t('draftManage.targetPlanPlaceholder')}
                      emptyText={t('draftManage.targetPlanEmpty')}
                      triggerClassName="h-10"
                    />
                  )
                : (
                    <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                      {t('draftManage.transferNoAvailableTarget')}
                    </div>
                  )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={closeDialog}
            disabled={submitting}
            className="cursor-pointer"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!targetPlanId || targetOptions.length === 0 || submitting}
            className="cursor-pointer gap-1.5"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('draftManage.transferConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

TransferDraftDialog.displayName = 'TransferDraftDialog'
