/**
 * Tooltip 组件
 *
 * 功能描述: 提示气泡组件，PC 端 hover 触发，移动端点击触发
 * 基于 Radix UI Tooltip 封装，自动适配移动端交互
 */
'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

// PC 端原始 Tooltip（hover 触发）
const TooltipDesktop = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * 移动端 Tooltip：点击触发，点击外部关闭
 */
function TooltipMobile({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen,
  ...props
}: TooltipPrimitive.TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onOpenChange?.(!open)
    },
    [open, onOpenChange],
  )

  // 点击外部关闭（排除 Trigger 和 Content 区域）
  useEffect(() => {
    if (!open)
      return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target)
        && (!contentRef.current || !contentRef.current.contains(target))
      ) {
        onOpenChange?.(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [open, onOpenChange])

  return (
    <TooltipPrimitive.Root {...props} open={open} onOpenChange={onOpenChange}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child))
          return child
        // 给 Trigger 注入点击事件
        if (child.type === TooltipTrigger) {
          return (
            <div ref={containerRef} className="inline-flex" onClick={handleToggle}>
              {React.cloneElement(child as React.ReactElement<any>, {
                // 阻止 Radix 默认的 pointer 行为
                onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
              })}
            </div>
          )
        }
        // 给 Content 注入 ref，用于点击外部关闭时排除内容区域
        if (child.type === TooltipContent) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ref: contentRef,
          })
        }
        return child
      })}
    </TooltipPrimitive.Root>
  )
}

/**
 * 自适应 Tooltip：自动根据设备类型选择交互方式
 * - PC 端：hover 触发（Radix 默认行为）
 * - 移动端：点击触发，点击外部关闭
 */
function Tooltip(props: TooltipPrimitive.TooltipProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <TooltipMobile {...props} />
  }

  return <TooltipDesktop {...props} />
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-50 max-w-[calc(100vw-1rem)] break-words overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin] sm:max-w-80',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
