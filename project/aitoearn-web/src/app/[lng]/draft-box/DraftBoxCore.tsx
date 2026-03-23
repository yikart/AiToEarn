/**
 * 草稿箱核心组件
 * 通过 PlanTabBar 管理多推广计划切换，展示内容管理模块
 */

'use client'

import { Loader2, Plus, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBrandPromotionStore } from '@/app/[lng]/brand-promotion/brandPromotionStore'
import CreatePlanModal from '@/app/[lng]/brand-promotion/components/CreatePlanModal'
import PlanTabBar from '@/app/[lng]/brand-promotion/components/PlanTabBar'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { usePlanTabStore } from '@/app/[lng]/brand-promotion/planTabStore'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import DraftContentModule from './components/DraftContentModule'

export default function DraftBoxCore() {
  const { t } = useTransClient('brandPromotion')
  const searchParams = useSearchParams()
  const urlPlanId = searchParams.get('planId')

  const {
    tabPlans,
    tabPlansLoading,
    selectedPlanId,
    initialized,
  } = usePlanTabStore(
    useShallow(state => ({
      tabPlans: state.tabPlans,
      tabPlansLoading: state.tabPlansLoading,
      selectedPlanId: state.selectedPlanId,
      initialized: state.initialized,
    })),
  )

  const initTabs = usePlanTabStore(state => state.initTabs)

  const openCreatePlanModal = useBrandPromotionStore(
    state => state.openCreatePlanModal,
  )

  const initContentData = usePlanDetailStore(state => state.initContentData)

  // 初始化 Tab 列表
  useEffect(() => {
    initTabs()
  }, [initTabs])

  // URL 参数激活对应 Tab
  useEffect(() => {
    if (initialized && urlPlanId) {
      usePlanTabStore.getState().selectPlan(urlPlanId)
    }
  }, [initialized, urlPlanId])

  // 初始化数据
  useEffect(() => {
    if (selectedPlanId) {
      initContentData(selectedPlanId)
    }
  }, [selectedPlanId, initContentData])

  // Tab 切换回调
  const handlePlanChange = useCallback((planId: string) => {
    initContentData(planId, true)
  }, [initContentData])

  const loading = !initialized
  const showEmpty = initialized && tabPlans.length === 0

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0">
          <div className="flex flex-col h-full bg-background">
            <div className="flex-1 p-4 md:p-6">
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showEmpty) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0">
          <div className="flex flex-col h-full bg-background">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#c565ef]/10 to-[#55D9ED]/10 flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-foreground/60" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t('empty.title')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t('empty.description')}
                </p>
                <Button
                  size="lg"
                  className="cursor-pointer gap-2"
                  onClick={openCreatePlanModal}
                >
                  <Plus className="h-5 w-5" />
                  {t('empty.createButton')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <CreatePlanModal />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab 栏 */}
      <div data-testid="draftbox-plan-tabs">
        <PlanTabBar onPlanChange={handlePlanChange} syncUrlQuery />
      </div>
      <div className="flex-1 min-h-0">
        <div className="flex flex-col h-full bg-background">
          <div className="flex-1 overflow-auto">
            <DraftContentModule />
          </div>
        </div>
      </div>

      {/* 创建/编辑推广计划弹窗 */}
      <CreatePlanModal />
    </div>
  )
}
