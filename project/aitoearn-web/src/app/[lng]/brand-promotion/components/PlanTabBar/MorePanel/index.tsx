/**
 * MorePanel - 更多推广计划面板
 * 移动端: Dialog 底部弹出
 * PC 端: Popover 下拉
 * 滚动到底部自动加载更多（IntersectionObserver）
 */

'use client'

import type { PromotionPlan } from '../../../brandPromotionStore/types'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useIsMobile'
import confirm from '@/lib/confirm'
import { useBrandPromotionStore } from '../../../brandPromotionStore'
import { usePlanTabStore } from '../../../planTabStore'
import PlanListItem from './PlanListItem'

interface MorePanelProps {
  trigger: React.ReactNode
  onPlanChange?: (planId: string) => void
  syncPlanIdToUrl?: (planId: string) => void
}

function MorePanel({ trigger, onPlanChange, syncPlanIdToUrl }: MorePanelProps) {
  const { t } = useTransClient('brandPromotion')
  const isMobile = useIsMobile()

  const {
    morePlans,
    morePlansLoading,
    morePlansPagination,
    morePanelOpen,
    selectedPlanId,
  } = usePlanTabStore(
    useShallow(state => ({
      morePlans: state.morePlans,
      morePlansLoading: state.morePlansLoading,
      morePlansPagination: state.morePlansPagination,
      morePanelOpen: state.morePanelOpen,
      selectedPlanId: state.selectedPlanId,
    })),
  )

  const openMorePanel = usePlanTabStore(state => state.openMorePanel)
  const closeMorePanel = usePlanTabStore(state => state.closeMorePanel)
  const selectPlan = usePlanTabStore(state => state.selectPlan)
  const loadMoreInPanel = usePlanTabStore(state => state.loadMoreInPanel)
  const onPlanDeleted = usePlanTabStore(state => state.onPlanDeleted)

  const openEditPlanModal = useBrandPromotionStore(state => state.openEditPlanModal)
  const deletePlan = useBrandPromotionStore(state => state.deletePlan)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!morePanelOpen)
      return

    const sentinel = sentinelRef.current
    if (!sentinel)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreInPanel()
        }
      },
      { threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [morePanelOpen, morePlansLoading, morePlansPagination.hasMore, loadMoreInPanel])

  const handleSelect = (planId: string) => {
    selectPlan(planId)
    syncPlanIdToUrl?.(planId)
    onPlanChange?.(planId)
  }

  const handleEdit = (plan: PromotionPlan) => {
    closeMorePanel()
    openEditPlanModal(plan)
  }

  const handleDelete = (plan: PromotionPlan) => {
    confirm({
      title: t('plan.deleteConfirmTitle'),
      content: t('plan.deleteConfirmDesc', { name: plan.name || plan.title }),
      okType: 'destructive',
      onOk: async () => {
        const success = await deletePlan(plan.id)
        if (success) {
          onPlanDeleted(plan.id)
        }
      },
    })
  }

  const panelContent = (
    <div className="flex flex-col">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{t('planTab.moreTitle')}</span>
        <span className="text-xs text-muted-foreground">
          {t('planTab.totalCount', { count: morePlansPagination.total })}
        </span>
      </div>

      {/* 列表 */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {morePlans.map(plan => (
          <PlanListItem
            key={plan.id}
            plan={plan}
            isSelected={plan.id === selectedPlanId}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {morePlansLoading && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!morePlansPagination.hasMore && morePlans.length > 0 && (
          <div className="text-center text-xs text-muted-foreground py-3">
            {t('planTab.noMore')}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div onClick={openMorePanel}>
          {trigger}
        </div>
        <Dialog
          open={morePanelOpen}
          onOpenChange={(open) => {
            if (!open)
              closeMorePanel()
          }}
        >
          <DialogContent
            className="fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 rounded-t-xl rounded-b-none w-full sm:w-full max-h-[70vh]"
            hideCloseButton
          >
            <DialogHeader>
              <DialogTitle>{t('planTab.moreTitle')}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {t('planTab.totalCount', { count: morePlansPagination.total })}
              </span>
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {morePlans.map(plan => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  isSelected={plan.id === selectedPlanId}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {morePlansLoading && (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!morePlansPagination.hasMore && morePlans.length > 0 && (
                <div className="text-center text-xs text-muted-foreground py-3">
                  {t('planTab.noMore')}
                </div>
              )}

              <div ref={sentinelRef} className="h-1" />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover
      open={morePanelOpen}
      onOpenChange={(open) => {
        if (open)
          openMorePanel(); else closeMorePanel()
      }}
    >
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" allowInnerScroll>
        {panelContent}
      </PopoverContent>
    </Popover>
  )
}

export default MorePanel
