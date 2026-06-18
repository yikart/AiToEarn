import type { PromotionMaterial } from '@/api/materials/material.types'

interface MediaTabDraftSyncAdapter {
  removeDraftItems: (ids: string[]) => void
  refreshDraftItems: (materialGroupId: string, planId: string) => void
}

interface PlanDetailMaterialSyncAdapter {
  setMaterialsFromExternal: (list: PromotionMaterial[], total: number, pageSize: number) => void
  syncMaterialsFromFresh: (freshList: PromotionMaterial[], total: number) => void
  appendMaterials: (list: PromotionMaterial[], total: number) => void
  isCurrentPlan: (planId: string) => boolean
  silentRefreshMaterials: (planId: string) => Promise<void>
  refreshCurrentMaterials: () => Promise<void>
}

let mediaTabDraftSyncAdapter: MediaTabDraftSyncAdapter | null = null
let planDetailMaterialSyncAdapter: PlanDetailMaterialSyncAdapter | null = null

export function registerMediaTabDraftSyncAdapter(adapter: MediaTabDraftSyncAdapter) {
  mediaTabDraftSyncAdapter = adapter
}

export function registerPlanDetailMaterialSyncAdapter(adapter: PlanDetailMaterialSyncAdapter) {
  planDetailMaterialSyncAdapter = adapter
}

export function removeDraftItemsFromMediaTabs(ids: string[]) {
  mediaTabDraftSyncAdapter?.removeDraftItems(ids)
}

export function refreshDraftItemsInMediaTabs(materialGroupId: string, planId: string) {
  mediaTabDraftSyncAdapter?.refreshDraftItems(materialGroupId, planId)
}

export function setPlanDetailMaterialsFromExternal(
  list: PromotionMaterial[],
  total: number,
  pageSize: number,
) {
  planDetailMaterialSyncAdapter?.setMaterialsFromExternal(list, total, pageSize)
}

export function syncPlanDetailMaterialsFromFresh(freshList: PromotionMaterial[], total: number) {
  planDetailMaterialSyncAdapter?.syncMaterialsFromFresh(freshList, total)
}

export function appendPlanDetailMaterials(list: PromotionMaterial[], total: number) {
  planDetailMaterialSyncAdapter?.appendMaterials(list, total)
}

export function isCurrentPlanDetail(planId: string) {
  return planDetailMaterialSyncAdapter?.isCurrentPlan(planId) ?? false
}

export function silentRefreshPlanDetailMaterials(planId: string) {
  return planDetailMaterialSyncAdapter?.silentRefreshMaterials(planId) ?? Promise.resolve()
}

export function refreshCurrentPlanDetailMaterials() {
  return planDetailMaterialSyncAdapter?.refreshCurrentMaterials() ?? Promise.resolve()
}
