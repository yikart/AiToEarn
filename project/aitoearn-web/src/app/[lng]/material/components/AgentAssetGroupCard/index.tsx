/**
 * AgentAssetGroupCard - Agent 素材分组卡片
 * 在素材库首页显示的特殊分组卡片，点击跳转到 Agent 素材详情页
 * 特点：
 * - 渐变背景 + Bot 图标
 * - 无编辑/删除操作
 */

'use client'

import { Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AgentAssetGroupCardProps {
  /** 资源数量（可选，如果不传则不显示） */
  count?: number
}

export function AgentAssetGroupCard({ count }: AgentAssetGroupCardProps) {
  const { t } = useTransClient('material')

  return (
    <Link
      href="/material/agent-assets"
      className={cn(
        'block rounded-xl border border-border bg-card overflow-hidden cursor-pointer group',
        'hover:shadow-lg transition-shadow duration-200',
      )}
    >
      {/* 封面区域 - 渐变背景 */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* 渐变背景 - 淡雅灰色系 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400" />

        {/* 装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 光晕效果 */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

          {/* 网格装饰 */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* 中心图标 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <Bot className="w-8 h-8 text-gray-600" />
            </div>
            {/* 闪光图标 */}
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* AI 标签 */}
        <Badge className="absolute top-3 left-3 bg-white/60 hover:bg-white/60 text-gray-700 border-0 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          AI
        </Badge>

        {/* 资源数量 */}
        {count !== undefined && count > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 right-3 backdrop-blur-sm bg-gray-600/80 hover:bg-gray-600/80 text-white border-0"
          >
            {count}
            {' '}
            {t('mediaManagement.resources')}
          </Badge>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {/* 标题 */}
        <h3 className="font-medium text-foreground truncate mb-1">{t('agentAssets.title')}</h3>

        {/* 描述 */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {t('agentAssets.description')}
        </p>
      </div>
    </Link>
  )
}
