/**
 * AgentGroupCard - Agent 素材分组卡片
 * 用于素材选择器中展示的虚拟 Agent 分组
 * 特点：渐变背景 + Bot 图标
 */

'use client'

import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AgentGroupCardProps {
  /** 点击回调 */
  onClick: () => void
  /** 资源数量（可选） */
  count?: number
}

export function AgentGroupCard({ onClick, count }: AgentGroupCardProps) {
  const { t } = useTransClient('material')

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border border-border bg-card overflow-hidden cursor-pointer group',
        'hover:border-primary hover:shadow-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      )}
    >
      {/* 封面区域 - 渐变背景 */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500" />

        {/* 装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 光晕效果 */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* 中心图标 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-300">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {/* 闪光图标 */}
            <Sparkles className="absolute -top-0.5 -right-0.5 w-4 h-4 text-yellow-300" />
          </div>
        </div>

        {/* AI 标签 */}
        <Badge className="absolute top-2 left-2 bg-white/20 hover:bg-white/20 text-white text-xs border-0 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          AI
        </Badge>

        {/* 资源数量 */}
        {count !== undefined && count > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 backdrop-blur-sm bg-black/30 hover:bg-black/30 text-white border-0 text-xs"
          >
            {count}
            {' '}
            {t('mediaManagement.resources')}
          </Badge>
        )}

        {/* Hover 遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
      </div>

      {/* 标题区域 */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground truncate">{t('agentAssets.title')}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {t('agentAssets.shortDescription')}
        </p>
      </div>
    </motion.button>
  )
}
