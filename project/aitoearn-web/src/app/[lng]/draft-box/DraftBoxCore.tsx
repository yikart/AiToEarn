/**
 * 草稿箱核心组件
 * 管理草稿组选择和内容展示
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import DraftContentModule from './components/DraftContentModule'
import { useDraftBoxStore } from './draftBoxStore'

export default function DraftBoxCore() {
  const searchParams = useSearchParams()
  const urlPlanId = searchParams.get('planId')

  const initDetailPage = useDraftBoxStore(state => state.initDetailPage)
  const planLoading = useDraftBoxStore(state => state.planLoading)
  const currentPlan = useDraftBoxStore(state => state.currentPlan)

  // 根据 URL 参数初始化数据
  useEffect(() => {
    if (urlPlanId) {
      initDetailPage(urlPlanId)
    }
  }, [urlPlanId, initDetailPage])

  if (urlPlanId && planLoading && !currentPlan) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <div className="flex flex-col h-full bg-background">
          <div className="flex-1 overflow-auto">
            <DraftContentModule />
          </div>
        </div>
      </div>
    </div>
  )
}
