/**
 * ChatLoadingSkeleton - 聊天页面加载骨架屏
 * 在页面初始加载时显示
 */
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部导航骨架 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-32 h-5" />
      </header>

      {/* 消息区域骨架 - 外层负责滚动，内层限宽居中 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : '')}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="w-48 h-16 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部输入区域骨架 - 限宽居中 */}
      <div className="p-4 shrink-0">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
