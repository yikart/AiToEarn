/**
 * BrushToolbar - 画笔工具栏组件
 * 包含工具选择、颜色选择、笔刷大小、撤销、清除等操作
 */

'use client'

import type { DrawToolType } from './useBrushEditor'
import type { UseCropEditorReturn } from './useCropEditor'
import { Check, Circle, Crop, Eraser, Pencil, Square, Undo2, X } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BRUSH_SIZE, PRESET_COLORS } from './useBrushEditor'
import { CROP_RATIOS } from './useCropEditor'

/** 比例示意形状：纯 div + border 实现 */
const RatioShape = memo(({ ratio, isActive }: { ratio: number, isActive: boolean }) => {
  const { width, height } = useMemo(() => {
    const maxH = 14
    const maxW = 22
    if (ratio === 0) {
      // free 模式用正方形
      return { width: maxH, height: maxH }
    }
    if (ratio >= 1) {
      // 横向：以宽度为基准
      const w = Math.min(maxW, maxH * ratio)
      return { width: w, height: w / ratio }
    }
    // 纵向：以高度为基准
    const h = maxH
    return { width: h * ratio, height: h }
  }, [ratio])

  return (
    <div
      className={cn(
        'rounded-[1px] flex-shrink-0 transition-colors',
        isActive ? 'bg-primary/20 border-primary' : 'border-muted-foreground/50',
        ratio === 0 ? 'border border-dashed' : 'border-[1.5px] border-solid',
      )}
      style={{ width, height }}
    />
  )
})

/** 工具配置 */
const TOOLS: { type: DrawToolType, icon: typeof Pencil, labelKey: string }[] = [
  { type: 'brush', icon: Pencil, labelKey: 'brushEditor.brush' },
  { type: 'rectangle', icon: Square, labelKey: 'brushEditor.rectangle' },
  { type: 'ellipse', icon: Circle, labelKey: 'brushEditor.ellipse' },
  { type: 'crop', icon: Crop, labelKey: 'brushEditor.crop' },
]

export interface BrushToolbarProps {
  /** 当前工具类型 */
  toolType: DrawToolType
  /** 设置工具类型 */
  setToolType: (type: DrawToolType) => void
  /** 当前画笔颜色 */
  brushColor: string
  /** 设置画笔颜色 */
  setBrushColor: (color: string) => void
  /** 当前画笔大小 */
  brushSize: number
  /** 设置画笔大小 */
  setBrushSize: (size: number) => void
  /** 是否可以撤销 */
  canUndo: boolean
  /** 撤销操作 */
  onUndo: () => void
  /** 清除所有操作 */
  onClearAll: () => void
  /** 裁剪编辑器 */
  cropEditor?: UseCropEditorReturn
  /** 自定义类名 */
  className?: string
}

export const BrushToolbar = memo(
  ({
    toolType,
    setToolType,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    canUndo,
    onUndo,
    onClearAll,
    cropEditor,
    className,
  }: BrushToolbarProps) => {
    const { t } = useTransClient('common')
    const isCropping = cropEditor?.isCropping

    return (
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-1.5 p-2 sm:gap-4 sm:p-3 bg-background/95 backdrop-blur-sm rounded-lg border border-border max-w-[calc(100vw-16px)] sm:max-w-none',
          className,
        )}
      >
        {/* 第一行（移动端）：工具选择 + 操作按钮 */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-center gap-1">
          {/* 工具图标 */}
          <div className="flex items-center gap-1">
            {TOOLS.map(({ type, icon: Icon, labelKey }) => (
              <TooltipProvider key={type} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setToolType(type)}
                      disabled={isCropping}
                      className={cn(
                        'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded cursor-pointer transition-all',
                        'hover:bg-accent focus:outline-none',
                        toolType === type && 'bg-accent outline outline-2 outline-primary',
                        isCropping && type !== 'crop' && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="z-[10001]">
                    <p>{t(labelKey)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* 移动端操作按钮（靠右） */}
          {isCropping && cropEditor
            ? (
                <div className="flex items-center gap-1 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cropEditor.cancelCrop}
                    className="h-7 px-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span className="ml-1">{t('brushEditor.cropCancel')}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={cropEditor.confirmCrop}
                    className="h-7 px-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span className="ml-1">{t('brushEditor.cropConfirm')}</span>
                  </Button>
                </div>
              )
            : (
                <div className="flex items-center gap-1 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="h-7 px-2 cursor-pointer"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-7 px-2 cursor-pointer"
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                </div>
              )}
        </div>

        {/* 裁剪模式：第二行（移动端）比例选择 + 桌面端确认/取消 */}
        {isCropping && cropEditor && (
          <>
            {/* 分隔线 - 仅桌面 */}
            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* 比例选择 - 移动端横向滚动占满整行 */}
            <div className="flex items-center gap-1 overflow-x-auto flex-nowrap w-full sm:w-auto scrollbar-none py-0.5">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:inline flex-shrink-0">
                {t('brushEditor.cropRatio')}
              </span>
              {CROP_RATIOS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => cropEditor.changeAspectRatio(value)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-1.5 sm:px-2 py-1 text-xs rounded cursor-pointer transition-colors flex-shrink-0',
                    'hover:bg-accent focus:outline-none',
                    cropEditor.aspectRatio === value && 'bg-accent outline outline-1 outline-primary',
                  )}
                >
                  <RatioShape ratio={value} isActive={cropEditor.aspectRatio === value} />
                  <span className="leading-none">{label === 'free' ? t('brushEditor.cropFree') : label}</span>
                </button>
              ))}
            </div>

            {/* 分隔线 - 仅桌面 */}
            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* 确认/取消 - 仅桌面（移动端在第一行右侧） */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={cropEditor.cancelCrop}
                className="h-8 px-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="ml-1">{t('brushEditor.cropCancel')}</span>
              </Button>
              <Button
                size="sm"
                onClick={cropEditor.confirmCrop}
                className="h-8 px-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span className="ml-1">{t('brushEditor.cropConfirm')}</span>
              </Button>
            </div>
          </>
        )}

        {/* 非裁剪模式：第二行（移动端）颜色/大小 + 桌面端操作按钮 */}
        {!isCropping && (
          <>
            {/* 分隔线 - 仅桌面 */}
            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* 颜色 + 大小：移动端占满整行 */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              {/* 颜色选择 */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
                  {t('brushEditor.color')}
                </span>
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBrushColor(color)}
                    className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6 rounded-full cursor-pointer transition-all',
                      'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50',
                      brushColor === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      color === '#FFFFFF' && 'border border-border',
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>

              {/* 分隔线 - 仅桌面 */}
              <div className="w-px h-6 bg-border hidden sm:block" />

              {/* 笔刷大小 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {t('brushEditor.size')}
                </span>
                <div className="flex items-center gap-2 min-w-[100px]">
                  <Slider
                    value={[brushSize]}
                    onValueChange={([value]) => setBrushSize(value)}
                    min={BRUSH_SIZE.min}
                    max={BRUSH_SIZE.max}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground w-6 text-center">{brushSize}</span>
                </div>
              </div>
            </div>

            {/* 分隔线 - 仅桌面 */}
            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* 操作按钮 - 仅桌面（移动端在第一行右侧） */}
            <div className="hidden sm:flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onUndo}
                      disabled={!canUndo}
                      className="h-8 px-2 cursor-pointer"
                    >
                      <Undo2 className="w-4 h-4" />
                      <span className="ml-1">{t('brushEditor.undo')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="z-[10001]">
                    <p>{t('brushEditor.undo')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearAll}
                      className="h-8 px-2 cursor-pointer"
                    >
                      <Eraser className="w-4 h-4" />
                      <span className="ml-1">{t('brushEditor.clearAll')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('brushEditor.clearAll')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>
    )
  },
)

export default BrushToolbar
