/**
 * ExternalLinks - 外部链接组件（Docs 和 GitHub）
 * 支持桌面端（collapsed/expanded）和移动端样式
 */

'use client'

import { BookOpen } from 'lucide-react'
import { DOCS_URL, GITHUB_REPO } from '../constants'
import { useGitHubStars } from '../hooks/useGitHubStars'

/** GitHub SVG 图标 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

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
  const starCount = useGitHubStars()

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
        <a
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          title={`GitHub Stars: ${starCount}`}
        >
          <GitHubIcon className="w-3.5 h-3.5" />
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
        <a
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-border/60 overflow-hidden hover:border-border transition-all"
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <GitHubIcon className="w-3.5 h-3.5" />
            Star
          </span>
          <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-l border-border/60">
            {starCount}
          </span>
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
      <a
        href={`https://github.com/${GITHUB_REPO}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-full border border-border/60 overflow-hidden hover:border-border transition-all"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/80 hover:bg-accent hover:text-foreground transition-colors">
          <GitHubIcon className="w-3 h-3" />
          Star
        </span>
        <span className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground bg-accent/30 border-l border-border/60">
          {starCount}
        </span>
      </a>
    </div>
  )
}
