/**
 * ExternalLinks - 外部链接组件（Docs 和 GitHub）
 * 支持桌面端（collapsed/expanded）和移动端样式
 */

'use client'

import { BookOpen } from 'lucide-react'
import { DOCS_URL } from '../constants'

interface ExternalLinksProps {
  /** 桌面端：是否为收缩状态 */
  collapsed?: boolean
  /** 是否为移动端样式 */
  isMobile?: boolean
}

/**
 * 外部链接组件
 * - 桌面端 collapsed: 图标垂直排列
 * - 桌面端 expanded: 水平排列，带标签
 * - 移动端: 水平排列，带标签
 */
export function ExternalLinks({ collapsed = false, isMobile = false }: ExternalLinksProps) {
  // 桌面端收缩状态：图标垂直排列
  if (collapsed && !isMobile) {
    return (
      <div className="flex flex-col items-center gap-1.5 pt-3 mt-2 border-t border-sidebar-border">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          title="Docs"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </a>
      </div>
    )
  }

  // 移动端样式
  if (isMobile) {
    return (
      <div className="flex items-center justify-center gap-3 border-t border-border py-3">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Docs
        </a>
      </div>
    )
  }

  // 桌面端展开状态：水平排列
  return (
    <div className="flex items-center justify-center gap-3 pt-3 mt-2 border-t border-sidebar-border">
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 text-[11px] font-medium text-muted-foreground/80 hover:bg-accent hover:text-foreground hover:border-border transition-all"
      >
        <BookOpen className="w-3 h-3" />
        Docs
      </a>
    </div>
  )
}
