/**
 * 草稿箱核心组件
 * 通过 PlanTabBar 管理多草稿箱切换，展示内容管理模块
 */

'use client'

import { Loader2, Plus, Sparkles } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import CreatePlanModal from '@/components/draft-box/components/CreatePlanModal'
import DraftContentModule from '@/components/draft-box/components/DraftContentModule'
import PlanTabBar from '@/components/draft-box/components/PlanTabBar'
import { Button } from '@/components/ui/button'
import { useBrandPromotionStore } from '@/store/draft-box/brandPromotionStore'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
import { usePlanTabStore } from '@/store/draft-box/planTabStore'

export default function DraftBoxCore() {
  const { t } = useTransClient('brandPromotion')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const urlPlanId = searchParams.get('planId')

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

  const openCreatePlanModal = useBrandPromotionStore(
    state => state.openCreatePlanModal,
  )

  const initContentData = usePlanDetailStore(state => state.initContentData)
  const urlPlanExists = !!urlPlanId && tabPlans.some(plan => plan.id === urlPlanId)
  const selectedPlanExists = !!selectedPlanId && tabPlans.some(plan => plan.id === selectedPlanId)
  const initialUrlPlanProcessedRef = useRef(false)
  const prevSelectedPlanIdRef = useRef<string | null>(selectedPlanId)
  const prevUrlPlanIdRef = useRef<string | null>(urlPlanId)
  const selectedPlanChanged = prevSelectedPlanIdRef.current !== selectedPlanId
  const urlPlanChanged = prevUrlPlanIdRef.current !== urlPlanId
  const shouldApplyUrlPlan = !!(
    planTabHydrated
    && initialized
    && urlPlanId
    && urlPlanExists
    && selectedPlanId !== urlPlanId
    && (!initialUrlPlanProcessedRef.current || urlPlanChanged)
  )
  const shouldSyncSelectedToUrl = !!(
    planTabHydrated
    && initialized
    && selectedPlanId
    && selectedPlanExists
    && (
      !urlPlanId
      || !urlPlanExists
      || (
        selectedPlanId !== urlPlanId
        && initialUrlPlanProcessedRef.current
        && selectedPlanChanged
        && !urlPlanChanged
      )
    )
  )

  const buildPlanUrl = useCallback((planId: string) => {
    const params = new URLSearchParams(searchParamsString)
    params.set('planId', planId)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParamsString])

  // 初始化 Tab 列表
  useEffect(() => {
    if (!planTabHydrated) {
      return
    }

    void initTabs(urlPlanId).finally(() => {
      const state = usePlanTabStore.getState()
    })
  }, [initTabs, planTabHydrated, urlPlanId])

  // URL 参数激活对应 Tab
  useEffect(() => {
    if (shouldApplyUrlPlan && urlPlanId) {
      usePlanTabStore.getState().selectPlan(urlPlanId)
    }
  }, [shouldApplyUrlPlan, urlPlanId])

  // 仅在当前选中由 store 驱动变化时回写 URL；URL 驱动切换时不反向覆盖，避免互相打架
  useEffect(() => {
    if (!selectedPlanId || !shouldSyncSelectedToUrl) {
      return
    }

    const nextUrl = buildPlanUrl(selectedPlanId)
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl)
    }
  }, [buildPlanUrl, selectedPlanId, shouldSyncSelectedToUrl])

  // 仅在 URL 已经完成应用，或当前就是 store 主导的切换时初始化，避免首屏默认计划与 URL 计划双请求
  useEffect(() => {
    if (selectedPlanId && !shouldApplyUrlPlan) {
      void initContentData(selectedPlanId, false, { skipMaterials: true }).finally(() => {
      })
    }
  }, [initContentData, selectedPlanId, shouldApplyUrlPlan])

  useEffect(() => {
    if (planTabHydrated && initialized) {
      initialUrlPlanProcessedRef.current = true
    }
    prevSelectedPlanIdRef.current = selectedPlanId
    prevUrlPlanIdRef.current = urlPlanId
  }, [initialized, planTabHydrated, selectedPlanId, urlPlanId])

  // Tab 切换回调
  const handlePlanChange = useCallback((planId: string) => {
    void initContentData(planId, true, { skipMaterials: true }).finally(() => {
    })
  }, [initContentData])

  const loading = !planTabHydrated || !initialized
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
        <PlanTabBar onPlanChange={handlePlanChange} />
      </div>
      <div className="flex-1 min-h-0">
        <div className="flex flex-col h-full bg-background">
          <div id="draft-box-scroll-content" className="flex-1 overflow-auto">
            <DraftContentModule />
          </div>
        </div>
      </div>
      {/* 创建/编辑草稿箱弹窗 */}
      <CreatePlanModal />
    </div>
  )
}
