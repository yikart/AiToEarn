/**
 * EcosystemDiagram - AiToEarn 生态系统图
 * 一图解释 AiToEarn 的核心功能和生态闭环
 * 设计风格：白色背景 + 宇宙行星动画 + 环形布局 + 自动轮播详情
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

/** 功能节点类型 */
type FunctionKey = 'publish' | 'create' | 'manage' | 'analyze' | 'dashboard'

export function EcosystemDiagram() {
  const { t } = useTransClient('home')
  const [activeNode, setActiveNode] = useState<FunctionKey | null>('publish')
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 功能节点顺序
  const nodeOrder: FunctionKey[] = ['publish', 'create', 'manage', 'analyze', 'dashboard']

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlay)
      return

    autoPlayTimerRef.current = setInterval(() => {
      setActiveNode((prev) => {
        const currentIndex = prev ? nodeOrder.indexOf(prev) : -1
        const nextIndex = (currentIndex + 1) % nodeOrder.length
        return nodeOrder[nextIndex]
      })
    }, 4000) // 每 4 秒切换

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
    }
  }, [isAutoPlay])

  // 手动点击节点
  const handleNodeClick = (key: FunctionKey) => {
    setIsAutoPlay(false) // 停止自动播放
    setActiveNode(key)
    // 8 秒后恢复自动播放
    setTimeout(() => setIsAutoPlay(true), 8000)
  }

  // 获取节点详情
  const getNodeDetails = (key: FunctionKey): string[] => {
    const detailsKey = `ecosystem.${key}Details` as const
    const details = t(detailsKey as any, { returnObjects: true })
    if (Array.isArray(details)) {
      return details.map(item => String(item))
    }
    // 如果不是数组，可能是字符串，尝试解析
    if (typeof details === 'string' && details !== detailsKey) {
      return [details]
    }
    return []
  }

  return (
    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {t('ecosystem.subtitle')}
          </p>
        </div>

        {/* 生态系统图 - 白色背景容器 */}
        <div className={cn('relative rounded-3xl overflow-hidden', 'bg-white dark:bg-gray-950')}>
          {/* 内容区域 */}
          <div className="relative z-10 py-12 md:py-16 px-6 md:px-12">
            {/* 桌面端布局 */}
            <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12">
              {/* 左侧：内容创作者生态圈 - 宇宙行星风格 */}
              <div className="relative">
                <div className="relative w-[320px] h-[320px] lg:w-[380px] lg:h-[380px]">
                  {/* 宇宙背景光晕 */}
                  <div className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 blur-2xl animate-pulse" />

                  {/* 最外层轨道环 - 缓慢旋转 */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-blue-300/30 dark:border-blue-400/20 animate-[spin_60s_linear_infinite]">
                    {/* 轨道上的卫星点 */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400/60 shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400/60 shadow-[0_0_6px_2px_rgba(168,85,247,0.4)]" />
                  </div>

                  {/* 第二层轨道环 - 反向旋转 */}
                  <div className="absolute inset-6 rounded-full border border-purple-300/30 dark:border-purple-400/20 animate-[spin_45s_linear_infinite_reverse]">
                    {/* 轨道上的卫星点 */}
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400/70 shadow-[0_0_10px_3px_rgba(34,211,238,0.5)]" />
                    <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shadow-[0_0_6px_2px_rgba(129,140,248,0.4)]" />
                  </div>

                  {/* 第三层轨道环 - 正向旋转较快 */}
                  <div className="absolute inset-12 rounded-full border border-cyan-300/30 dark:border-cyan-400/20 animate-[spin_30s_linear_infinite]">
                    {/* 轨道上的卫星点 */}
                    <div className="absolute bottom-1/4 right-0 translate-x-1/2 w-2 h-2 rounded-full bg-pink-400/60 shadow-[0_0_8px_2px_rgba(244,114,182,0.4)]" />
                  </div>

                  {/* 内层发光星球核心 */}
                  <div className="absolute inset-[72px] lg:inset-20 rounded-full overflow-hidden">
                    {/* 多层渐变光晕 */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-cyan-100 dark:from-blue-900/40 dark:via-purple-900/30 dark:to-cyan-900/40" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/50 to-transparent dark:via-white/10 animate-[spin_20s_linear_infinite]" />
                    {/* 核心光芒 */}
                    <div className="absolute inset-2 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-[inset_0_0_30px_rgba(59,130,246,0.15),0_0_20px_rgba(139,92,246,0.1)]" />
                    {/* 脉动光环 */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-200/30 dark:border-blue-500/20 animate-ping opacity-30" />
                  </div>

                  {/* 中心文字 */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-foreground font-bold text-lg lg:text-xl drop-shadow-sm">
                      {t('ecosystem.creator')}
                    </span>
                  </div>

                  {/* 星星装饰粒子 */}
                  <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full bg-blue-400/80 animate-[twinkle_2s_ease-in-out_infinite]" />
                  <div className="absolute top-[20%] right-[10%] w-0.5 h-0.5 rounded-full bg-purple-400/80 animate-[twinkle_3s_ease-in-out_infinite_0.5s]" />
                  <div className="absolute bottom-[15%] left-[10%] w-1 h-1 rounded-full bg-cyan-400/80 animate-[twinkle_2.5s_ease-in-out_infinite_1s]" />
                  <div className="absolute bottom-[25%] right-[15%] w-0.5 h-0.5 rounded-full bg-pink-400/80 animate-[twinkle_2s_ease-in-out_infinite_1.5s]" />

                  {/* 功能节点 - 均匀分布在圆环周围 */}
                  {nodeOrder.map((key, index) => {
                    // 5 个节点均匀分布在圆周上
                    // 起始角度从 -90° (顶部) 开始，顺时针分布
                    const totalNodes = nodeOrder.length
                    const angleStep = 360 / totalNodes
                    // 从左上方开始，顺时针分布
                    const startAngle = -126 // 起始角度（从正上方偏左开始）
                    const angle = startAngle + index * angleStep
                    // 半径比例（相对于容器尺寸的 50%，再往外偏移一点）
                    const radius = 58 // 百分比

                    return (
                      <FunctionNode
                        key={key}
                        nodeKey={key}
                        label={t(`ecosystem.${key}` as any)}
                        angle={angle}
                        radius={radius}
                        isActive={activeNode === key}
                        onClick={() => handleNodeClick(key)}
                      />
                    )
                  })}
                </div>
              </div>

              {/* 中间：内容交易 + 双向箭头 - 能量传输效果 */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>{t('ecosystem.sell')}</span>
                  <div className="relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    {/* 能量粒子动画 */}
                    <div className="absolute top-1/2 left-0 w-1 h-1 rounded-full bg-blue-400 animate-[energyFlow_1.5s_ease-in-out_infinite]" />
                  </div>
                </div>

                <div className="relative px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/30 shadow-md">
                  <span className="text-foreground font-medium text-sm whitespace-nowrap">
                    {t('ecosystem.trade')}
                  </span>
                  {/* 光晕效果 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      />
                    </svg>
                    {/* 能量粒子动画 */}
                    <div className="absolute top-1/2 right-0 w-1 h-1 rounded-full bg-purple-400 animate-[energyFlowReverse_1.5s_ease-in-out_infinite]" />
                  </div>
                  <span>{t('ecosystem.buy')}</span>
                </div>
              </div>

              {/* 右侧：内容需求者 - 小行星风格 */}
              <div>
                <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                  {/* 外层光晕 */}
                  <div className="absolute inset-[-10px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-xl animate-pulse" />

                  {/* 外层轨道环 - 缓慢旋转 */}
                  <div className="absolute inset-[-8px] rounded-full border border-dashed border-purple-300/30 dark:border-purple-400/20 animate-[spin_40s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-400/70 shadow-[0_0_6px_2px_rgba(251,146,60,0.5)]" />
                  </div>

                  {/* 内层轨道 - 反向旋转 */}
                  <div className="absolute inset-1 rounded-full border border-pink-300/25 dark:border-pink-400/15 animate-[spin_25s_linear_infinite_reverse]">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400/60 shadow-[0_0_4px_2px_rgba(34,211,238,0.4)]" />
                  </div>

                  {/* 星球本体 */}
                  <div className="absolute inset-3 rounded-full overflow-hidden">
                    {/* 渐变背景 */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:from-purple-900/40 dark:via-pink-900/30 dark:to-orange-900/40" />
                    {/* 光泽效果 */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent dark:via-white/10 animate-[spin_15s_linear_infinite]" />
                    {/* 核心 */}
                    <div className="absolute inset-1 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-[inset_0_0_20px_rgba(168,85,247,0.15),0_0_15px_rgba(244,114,182,0.1)] flex items-center justify-center">
                      <span className="text-foreground font-bold text-base lg:text-lg text-center px-2 drop-shadow-sm">
                        {t('ecosystem.consumer')}
                      </span>
                    </div>
                    {/* 脉动效果 */}
                    <div className="absolute inset-0 rounded-full border border-purple-200/30 dark:border-purple-500/20 animate-ping opacity-20" />
                  </div>

                  {/* 星星装饰 */}
                  <div className="absolute top-[5%] right-[10%] w-0.5 h-0.5 rounded-full bg-pink-400/80 animate-[twinkle_2s_ease-in-out_infinite]" />
                  <div className="absolute bottom-[10%] left-[5%] w-0.5 h-0.5 rounded-full bg-purple-400/80 animate-[twinkle_2.5s_ease-in-out_infinite_0.5s]" />
                </div>
              </div>
            </div>

            {/* 移动端布局 */}
            <div className="md:hidden space-y-6">
              {/* 内容创作者 - 宇宙行星风格 */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  {/* 光晕 */}
                  <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 blur-xl animate-pulse" />

                  {/* 轨道环 */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-blue-300/30 animate-[spin_40s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/60 shadow-[0_0_6px_2px_rgba(59,130,246,0.4)]" />
                  </div>
                  <div className="absolute inset-4 rounded-full border border-purple-300/25 animate-[spin_30s_linear_infinite_reverse]">
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400/60 shadow-[0_0_4px_2px_rgba(34,211,238,0.4)]" />
                  </div>

                  {/* 星球核心 */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/30 dark:border-blue-700/20 shadow-md">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-[spin_20s_linear_infinite]" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-foreground font-bold text-sm">
                      {t('ecosystem.creator')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 功能节点网格 */}
              <div className="grid grid-cols-2 gap-2">
                {nodeOrder.map(key => (
                  <MobileFunctionNode
                    key={key}
                    label={t(`ecosystem.${key}` as any)}
                    isActive={activeNode === key}
                    onClick={() => handleNodeClick(key)}
                    className={key === 'dashboard' ? 'col-span-2' : ''}
                  />
                ))}
              </div>

              {/* 内容交易 */}
              <div className="flex justify-center items-center gap-4">
                <span className="text-muted-foreground text-xs">
                  {t('ecosystem.sell')}
                  {' '}
                  →
                </span>
                <div className="relative px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/30 shadow-sm">
                  <span className="text-foreground font-medium text-sm">
                    {t('ecosystem.trade')}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  ←
                  {t('ecosystem.buy')}
                </span>
              </div>

              {/* 内容需求者 - 小行星风格 */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  {/* 光晕 */}
                  <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-lg animate-pulse" />

                  {/* 轨道 */}
                  <div className="absolute inset-[-4px] rounded-full border border-dashed border-purple-300/30 animate-[spin_30s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-orange-400/60" />
                  </div>

                  {/* 星球 */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200/30 dark:border-purple-700/20 shadow-md flex items-center justify-center">
                    <span className="text-foreground font-bold text-xs text-center px-2">
                      {t('ecosystem.consumer')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部详情展示区域 - 固定高度，宽度与上方内容对齐 */}
          <div className="relative z-10 px-6 md:px-12 pb-8 max-w-4xl mx-auto">
            <DetailPanel
              activeNode={activeNode}
              details={activeNode ? getNodeDetails(activeNode) : []}
              nodeLabel={activeNode ? t(`ecosystem.${activeNode}` as any) : ''}
            />
          </div>
        </div>
      </div>

      {/* 全局样式 - 自定义动画 */}
      <style jsx>
        {`
          @keyframes twinkle {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes energyFlow {
            0% {
              transform: translateX(0) translateY(-50%);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(20px) translateY(-50%);
              opacity: 0;
            }
          }
          @keyframes energyFlowReverse {
            0% {
              transform: translateX(0) translateY(-50%);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(-20px) translateY(-50%);
              opacity: 0;
            }
          }
        `}
      </style>
    </section>
  )
}

/** 功能节点组件 - 使用角度和半径计算位置 */
interface FunctionNodeProps {
  nodeKey: FunctionKey
  label: string
  /** 角度（度数），0° 为右侧，顺时针方向 */
  angle: number
  /** 半径百分比（相对于容器尺寸） */
  radius: number
  isActive: boolean
  onClick: () => void
}

function FunctionNode({ label, angle, radius, isActive, onClick }: FunctionNodeProps) {
  // 将角度转换为弧度，计算位置
  const radian = (angle * Math.PI) / 180
  const x = 50 + radius * Math.cos(radian) // 50% 是中心点
  const y = 50 + radius * Math.sin(radian)

  return (
    <button
      type="button"
      className={cn(
        'absolute cursor-pointer z-20',
        // 居中定位节点
        '-translate-x-1/2 -translate-y-1/2',
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'px-5 py-2.5 rounded-full shadow-md border transition-all duration-300',
          isActive
            ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
            : 'bg-white dark:bg-gray-900 border-border text-foreground hover:scale-105 hover:border-primary/50 hover:shadow-lg',
        )}
      >
        <span className="font-medium text-sm whitespace-nowrap">{label}</span>
      </div>
    </button>
  )
}

/** 移动端功能节点 */
function MobileFunctionNode({
  label,
  isActive,
  onClick,
  className,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'px-4 py-2.5 rounded-full shadow-sm border text-center transition-all duration-300 cursor-pointer',
        isActive
          ? 'bg-primary border-primary text-primary-foreground shadow-primary/20'
          : 'bg-white dark:bg-gray-900 border-border text-foreground hover:border-primary/50',
        className,
      )}
      onClick={onClick}
    >
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}

/** 详情面板组件 - 固定高度避免页面抖动 */
function DetailPanel({
  activeNode,
  details,
  nodeLabel,
}: {
  activeNode: FunctionKey | null
  details: string[]
  nodeLabel: string
}) {
  const hasContent = activeNode && details.length > 0

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-500 ease-out',
        // 固定高度，避免内容切换时高度变化导致抖动
        'h-[180px] md:h-[160px]',
        hasContent
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 md:p-6'
          : 'bg-transparent',
      )}
    >
      {hasContent ? (
        <div className="h-full flex flex-col">
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-semibold text-foreground">{nodeLabel}</h3>
          </div>

          {/* 详情列表 - 固定高度区域 */}
          <div
            className={cn(
              'h-[220px] ',
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
            )}
          >
            {details.map((detail, index) => (
              <div key={`${activeNode}-${index}`} className="flex items-start gap-2 text-sm">
                <span className="text-primary shrink-0 mt-0.5">•</span>
                <span className="text-muted-foreground leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>

          {/* 进度指示器 */}
          <div className="flex justify-center gap-1.5 mt-4 shrink-0">
            {(['publish', 'create', 'manage', 'analyze', 'dashboard'] as FunctionKey[]).map(
              key => (
                <div
                  key={key}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    activeNode === key ? 'bg-primary w-6' : 'bg-muted w-2',
                  )}
                />
              ),
            )}
          </div>
        </div>
      ) : (
        // 占位内容，保持高度一致
        <div className="flex items-center justify-center h-full">
          <div className="flex justify-center gap-1.5">
            {(['publish', 'create', 'manage', 'analyze', 'dashboard'] as FunctionKey[]).map(
              key => (
                <div
                  key={key}
                  className="h-2 w-2 rounded-full bg-muted transition-all duration-300"
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EcosystemDiagram
