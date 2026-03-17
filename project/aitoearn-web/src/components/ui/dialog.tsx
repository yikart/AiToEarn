'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  overlayStyle?: React.CSSProperties
  overlayClassName?: string
  hideCloseButton?: boolean
  /** 禁用焦点陷阱，用于解决嵌套 Dialog 的焦点冲突问题 */
  disableFocusTrap?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      overlayStyle,
      overlayClassName,
      hideCloseButton,
      disableFocusTrap,
      ...props
    },
    ref,
  ) => {
    // 嵌套 Dialog 焦点修复：当 disableFocusTrap 为 true 时，阻止所有焦点相关事件
    const preventEvent = (e: Event) => e.preventDefault()

    return (
      <DialogPortal>
        <DialogOverlay className={overlayClassName} style={overlayStyle} />
        <DialogPrimitive.Content
          ref={ref}
          // 抑制 Radix UI 的 Description 警告，允许 Dialog 没有 Description
          aria-describedby={props['aria-describedby'] ?? undefined}
          // 允许 Radix 的默认自动聚焦行为，确保 Dialog 内的 Input 等元素可以正常获取焦点
          tabIndex={-1}
          onOpenAutoFocus={disableFocusTrap ? preventEvent : props.onOpenAutoFocus}
          onPointerDownOutside={disableFocusTrap ? preventEvent : props.onPointerDownOutside}
          onInteractOutside={disableFocusTrap ? preventEvent : props.onInteractOutside}
          className={cn(
            // 改造说明：
            // - 保持移动端默认行为：使用 `w-[calc(100%-24px)]` 使弹窗左右留出 12px 边距
            // - 对于更大的视口，使用 min(maxWidth, 95vw) 策略，避免被 `sm:w-full` 强制撑满或过窄
            // - 这样可以兼顾移动端和桌面大屏的显示效果，且无需在各处强制覆盖
            'fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-24px)] sm:w-[min(1100px,95vw)] min-h-[200px] sm:min-h-0 translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-2xl duration-500 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-xl',
            className,
          )}
          {...props}
        >
          {children}
          {!hideCloseButton && (
            <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-md opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent p-2 sm:p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  },
)
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  )
}
DialogHeader.displayName = 'DialogHeader'

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}
      {...props}
    />
  )
}
DialogFooter.displayName = 'DialogFooter'

/**
 * Dialog 内容区域组件
 * 用于解决 overflow-y-auto 裁剪 focus ring 的问题
 * 原理：负 margin 扩展滚动容器边界，正 padding 恢复内容视觉边距
 */
function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // 负 margin 扩展滚动容器边界，让 focus ring 有空间显示
        '-mx-4 sm:-mx-6',
        // 正 padding 恢复内容的视觉边距
        'px-4 sm:px-6',
        // 滚动相关样式
        'flex-1 overflow-y-auto',
        className,
      )}
      {...props}
    />
  )
}
DialogBody.displayName = 'DialogBody'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
