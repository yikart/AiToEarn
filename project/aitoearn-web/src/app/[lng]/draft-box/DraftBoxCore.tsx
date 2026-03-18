/**
 * 草稿箱核心组件
 * 自动获取/创建默认草稿箱并展示内容
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import DraftContentModule from './components/DraftContentModule'
import { useDraftBoxStore } from './draftBoxStore'

export default function DraftBoxCore() {
  const { planLoading, currentPlan } = useDraftBoxStore(
    useShallow(state => ({
      planLoading: state.planLoading,
      currentPlan: state.currentPlan,
    })),
  )
  const autoInit = useDraftBoxStore(state => state.autoInit)

  useEffect(() => {
    autoInit()
  }, [autoInit])

  if (planLoading && !currentPlan) {
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
