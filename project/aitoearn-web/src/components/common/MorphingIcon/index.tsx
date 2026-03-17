/**
 * MorphingIcon - 循环切换图标动画组件
 * 图标切换时有描边绘制动画（pathLength），整体带呼吸闪烁效果
 */

'use client'

import type { Variants } from 'framer-motion'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// 图标 SVG 路径数据（从 Lucide 提取）
const ICONS = [
  {
    name: 'sparkles',
    paths: [
      'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      'M20 2v4',
      'M22 4h-4',
    ],
    circles: [{ cx: 4, cy: 20, r: 2, isSmall: true }],
  },
  {
    name: 'brain',
    paths: [
      'M12 5v13',
      'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4',
      'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5',
      'M17.997 5.125a4 4 0 0 1 2.526 5.77',
      'M18 18a4 4 0 0 0 2-7.464',
      'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517',
      'M6 18a4 4 0 0 1-2-7.464',
      'M6.003 5.125a4 4 0 0 0-2.526 5.77',
    ],
  },
  {
    name: 'rocket',
    paths: [
      'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
      'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
      'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0',
      'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
    ],
    circles: [{ cx: 10, cy: 14, r: 2, isSmall: true }],
  },
  {
    name: 'target',
    circles: [
      { cx: 12, cy: 12, r: 10 },
      { cx: 12, cy: 12, r: 6 },
      { cx: 12, cy: 12, r: 2 },
    ],
  },
]

// 描边绘制动画变体（带交错延迟）
function createDrawVariants(index: number): Variants {
  return {
    hidden: {
      pathLength: 0,
      opacity: 1, // 立即可见，避免闪烁
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.25, ease: 'easeOut', delay: index * 0.03 },
      },
    },
    exit: {
      opacity: 0,
      transition: { delay: 0.1, duration: 0.1 }, // 延迟淡出，避免白色闪烁
    },
  }
}

// 小圆点 scale 动画变体
const smallCircleVariants: Variants = {
  hidden: { scale: 0, opacity: 1 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20, delay: 0.05 },
  },
  exit: { opacity: 0, transition: { delay: 0.1, duration: 0.1 } }, // 延迟淡出
}

// 大圆（如 target 图标）使用 pathLength 动画
function createCircleDrawVariants(index: number): Variants {
  return {
    hidden: {
      pathLength: 0,
      opacity: 1,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.25, ease: 'easeOut', delay: index * 0.05 },
      },
    },
    exit: {
      opacity: 0,
      transition: { delay: 0.1, duration: 0.1 }, // 延迟淡出
    },
  }
}

interface MorphingIconProps {
  size?: number
  color?: string
  className?: string
}

// 切换间隔：1.5 秒
const SWITCH_INTERVAL = 1500

export const MorphingIcon = memo(({ size = 16, color = '#c565ef', className }: MorphingIconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ICONS.length)
    }, SWITCH_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const currentIcon = ICONS[currentIndex]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* 呼吸闪烁动画容器 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          opacity: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* 不使用 mode="wait"，新旧图标重叠过渡避免闪烁 */}
        <AnimatePresence>
          <motion.svg
            key={currentIcon.name}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute inset-0"
            style={{ width: size, height: size }}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 路径元素 - 描边绘制动画 */}
            {currentIcon.paths?.map((d, i) => (
              <motion.path
                key={`path-${i}`}
                d={d}
                fill="none"
                variants={createDrawVariants(i)}
              />
            ))}

            {/* 圆形元素 */}
            {currentIcon.circles?.map((c, i) => {
              const isSmall = 'isSmall' in c && c.isSmall
              return isSmall ? (
                // 小圆点使用 scale 动画
                <motion.circle
                  key={`circle-${i}`}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill={color}
                  stroke="none"
                  variants={smallCircleVariants}
                />
              ) : (
                // 大圆使用 pathLength 描边动画
                <motion.circle
                  key={`circle-${i}`}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill="none"
                  variants={createCircleDrawVariants(i)}
                />
              )
            })}
          </motion.svg>
        </AnimatePresence>
      </motion.div>
    </div>
  )
})

MorphingIcon.displayName = 'MorphingIcon'
