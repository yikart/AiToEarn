/**
 * 发布弹框内容管理左栏
 * 复用草稿箱计划 Tab 与内容管理模块，作为发布工作台的素材来源区域
 */

import { Loader2, Plus, Sparkles } from 'lucide-react'
import { memo, useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import CreatePlanModal from '@/components/draft-box/components/CreatePlanModal'
import DraftContentModule from '@/components/draft-box/components/DraftContentModule'
import PlanTabBar from '@/components/draft-box/components/PlanTabBar'
import { Button } from '@/components/ui/button'
import { useBrandPromotionStore } from '@/store/draft-box/brandPromotionStore'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
import { usePlanTabStore } from '@/store/draft-box/planTabStore'

const PublishDialogDraftPanel = memo(() => {
  const { t } = useTransClient('brandPromotion')

  const {
    tabPlans,
    selectedPlanId,
    initialized,
    planTabHydrated,
  } = usePlanTabStore(
    useShallow(state => ({
      tabPlans: state.tabPlans,
      selectedPlanId: state.selectedPlanId,
      initialized: state.initialized,
      planTabHydrated: state._hasHydrated,
    })),
  )

  const initTabs = usePlanTabStore(state => state.initTabs)
  const openCreatePlanModal = useBrandPromotionStore(state => state.openCreatePlanModal)
  const initContentData = usePlanDetailStore(state => state.initContentData)

  useEffect(() => {
    if (!planTabHydrated) {
      return
    }

    void initTabs()
  }, [initTabs, planTabHydrated])

  useEffect(() => {
    if (selectedPlanId) {
      void initContentData(selectedPlanId, false, { skipMaterials: true })
    }
  }, [initContentData, selectedPlanId])

  const handlePlanChange = useCallback((planId: string) => {
    void initContentData(planId, true, { skipMaterials: true })
  }, [initContentData])

  const loading = !planTabHydrated || !initialized

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tabPlans.length === 0) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-back/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {t('empty.title')}
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
            <Button className="cursor-pointer gap-2" onClick={openCreatePlanModal}>
              <Plus className="h-4 w-4" />
              {t('empty.createButton')}
            </Button>
          </div>
        </div>
        <CreatePlanModal />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0" data-testid="publish-draft-plan-tabs">
        <PlanTabBar onPlanChange={handlePlanChange} />
      </div>
      <div id="publish-draft-scroll-content" className="min-h-0 flex-1 overflow-auto">
        <DraftContentModule
          embedded
          enablePublishDrag
          contentClassName="space-y-4 p-4"
          showVideoCreateDraftTaskWidget={false}
        />
      </div>
      <CreatePlanModal />
    </div>
  )
})

PublishDialogDraftPanel.displayName = 'PublishDialogDraftPanel'

export default PublishDialogDraftPanel
