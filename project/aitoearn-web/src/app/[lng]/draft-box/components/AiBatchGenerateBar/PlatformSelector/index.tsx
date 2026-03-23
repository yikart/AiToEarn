/**
 * PlatformSelector - 目标平台选择器
 * Popover 形式的平台多选组件，用于 AI 批量生成工具栏
 */

'use client'

import type { EffectiveLimitsDetailed } from '../platformLimits'
import type { PlatType } from '@/app/config/platConfig'
import { Globe, TriangleAlert } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { AccountPlatInfoMap, RegionTaskPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import PlatformLimitsInfo from '../PlatformLimitsInfo'

interface PlatformSelectorProps {
  selectedPlatforms: PlatType[]
  onPlatformsChange: (platforms: PlatType[]) => void
  pillClass: string
  /** 不兼容平台 Map：key 为平台类型，value 为不兼容原因列表 */
  disabledPlatforms?: Map<PlatType, string[]>
  /** 参数限制详情，传入后在 pill 内显示 ⓘ 按钮 */
  effectiveLimitsDetailed?: EffectiveLimitsDetailed
}

/** 获取可用的平台列表（已在 AccountPlatInfoMap 中且区域可用） */
function getAvailablePlatforms(): [PlatType, { icon: string, name: string }][] {
  return RegionTaskPlatInfoArr
    .map(([plat, info]) => [plat, { icon: info.icon, name: info.name }])
}

const PlatformSelector = memo(({ selectedPlatforms, onPlatformsChange, pillClass, disabledPlatforms, effectiveLimitsDetailed }: PlatformSelectorProps) => {
  const { t } = useTransClient('brandPromotion')
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const availablePlatforms = useMemo(() => getAvailablePlatforms(), [])

  const handleToggle = useCallback((plat: PlatType) => {
    // 禁用平台不可点击
    if (disabledPlatforms?.has(plat))
      return

    if (selectedPlatforms.includes(plat)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== plat))
    }
    else {
      onPlatformsChange([...selectedPlatforms, plat])
    }
  }, [selectedPlatforms, onPlatformsChange, disabledPlatforms])

  const handleSelectAll = useCallback(() => {
    // 全选时只选兼容平台
    const compatiblePlatforms = availablePlatforms
      .filter(([plat]) => !disabledPlatforms?.has(plat))
      .map(([plat]) => plat)
    onPlatformsChange(compatiblePlatforms)
  }, [availablePlatforms, onPlatformsChange, disabledPlatforms])

  const handleDeselectAll = useCallback(() => {
    onPlatformsChange([])
  }, [onPlatformsChange])

  const compatibleCount = useMemo(() =>
    availablePlatforms.filter(([plat]) => !disabledPlatforms?.has(plat)).length, [availablePlatforms, disabledPlatforms])

  const isAllSelected = selectedPlatforms.length === compatibleCount && compatibleCount > 0

  // 选中平台中不兼容的数量
  const disabledSelectedCount = useMemo(() =>
    selectedPlatforms.filter(p => disabledPlatforms?.has(p)).length, [selectedPlatforms, disabledPlatforms])

  // 不兼容平台名称列表（用于 Tooltip）
  const disabledSelectedNames = useMemo(() => {
    if (!disabledSelectedCount)
      return []
    return selectedPlatforms
      .filter(p => disabledPlatforms?.has(p))
      .map(p => AccountPlatInfoMap.get(p)?.name)
      .filter(Boolean) as string[]
  }, [selectedPlatforms, disabledPlatforms, disabledSelectedCount])

  // pill 展示内容
  const pillContent = useMemo(() => {
    if (selectedPlatforms.length === 0) {
      return (
        <>
          <Globe className="h-3.5 w-3.5" />
          {t('detail.selectPlatforms')}
        </>
      )
    }

    // 展示所有选中平台图标 + 数量
    return (
      <>
        <span className="flex items-center -space-x-1">
          {selectedPlatforms.map((plat) => {
            const info = AccountPlatInfoMap.get(plat)
            if (!info)
              return null
            return (
              <Image
                key={plat}
                src={info.icon}
                alt={info.name}
                width={14}
                height={14}
                className={cn(
                  'rounded-full ring-1 ring-background',
                  disabledPlatforms?.has(plat) && 'opacity-40 grayscale',
                )}
              />
            )
          })}
        </span>
        {t('detail.platformsSelected', { count: selectedPlatforms.length })}
        {disabledSelectedCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-amber-500">
            <TriangleAlert className="h-3 w-3" />
            <span className="text-[10px]">{disabledSelectedCount}</span>
          </span>
        )}
      </>
    )
  }, [selectedPlatforms, t, disabledPlatforms, disabledSelectedCount])

  return (
    <div className={cn(pillClass, 'gap-0 p-0')}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn('flex items-center gap-1.5 pl-3 py-1.5 cursor-pointer', effectiveLimitsDetailed ? 'pr-1.5' : 'pr-3')}
                >
                  {pillContent}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            {disabledSelectedCount > 0 && (
              <TooltipContent side="top" className="max-w-60 text-xs">
                <div>{t('detail.platformIncompatibleCount', { count: disabledSelectedCount })}</div>
                <div className="text-muted-foreground">{disabledSelectedNames.join(', ')}</div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <PopoverContent
          className="w-64 p-3"
          side="top"
          align="start"
        >
          {/* 不兼容警告 banner */}
          {disabledSelectedCount > 0 && (
            <div className="flex items-start gap-1.5 mb-2 p-2 rounded-md bg-amber-50 text-amber-700 text-xs dark:bg-amber-950/30 dark:text-amber-400">
              <TriangleAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <div>{t('detail.platformIncompatibleCount', { count: disabledSelectedCount })}</div>
                <div className="text-amber-600/70 dark:text-amber-400/70">{disabledSelectedNames.join(', ')}</div>
              </div>
            </div>
          )}

          {/* 标题 + 全选/取消 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">{t('detail.targetPlatforms')}</span>
            <button
              type="button"
              className="text-xs text-primary hover:underline cursor-pointer"
              onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
            >
              {isAllSelected ? t('detail.deselectAll') : t('detail.selectAll')}
            </button>
          </div>

          {/* 平台网格 */}
          <div className="grid grid-cols-2 gap-1">
            <TooltipProvider delayDuration={200}>
              {availablePlatforms.map(([plat, info]) => {
                const isSelected = selectedPlatforms.includes(plat)
                const disabledReasons = disabledPlatforms?.get(plat)
                const isDisabled = !!disabledReasons

                const button = (
                  <div
                    key={plat}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors select-none',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                      !isDisabled && isSelected
                        ? 'bg-primary/10 text-foreground'
                        : !isDisabled
                            ? 'hover:bg-muted text-muted-foreground'
                            : 'text-muted-foreground',
                    )}
                    onClick={() => handleToggle(plat)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(plat) } }}
                  >
                    {isDisabled
                      ? <TriangleAlert className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      : (
                          <Checkbox
                            checked={isSelected}
                            className="h-3.5 w-3.5 pointer-events-none"
                            tabIndex={-1}
                          />
                        )}
                    <Image
                      src={info.icon}
                      alt={info.name}
                      width={16}
                      height={16}
                      className={cn('rounded-sm flex-shrink-0', isDisabled && 'grayscale')}
                    />
                    <span className={cn(isDisabled && 'line-through')}>{info.name}</span>
                  </div>
                )

                if (isDisabled) {
                  if (isMobile) {
                    return (
                      <div key={plat} className="col-span-2">
                        {button}
                        <div className="px-2 pb-1 text-[10px] text-amber-600/80 dark:text-amber-400/70 leading-tight">
                          {disabledReasons.map((reason, i) => (
                            <div key={i}>{reason}</div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <Tooltip key={plat}>
                      <TooltipTrigger asChild>
                        {button}
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-60 text-xs">
                        {disabledReasons.map((reason, i) => (
                          <div key={i}>{reason}</div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return button
              })}
            </TooltipProvider>
          </div>
        </PopoverContent>
      </Popover>
      {/* ⓘ 参数限制按钮 */}
      {effectiveLimitsDetailed && (
        <div className="border-l border-border flex items-center" onClick={e => e.stopPropagation()}>
          <PlatformLimitsInfo
            selectedPlatforms={selectedPlatforms}
            limitsDetailed={effectiveLimitsDetailed}
          />
        </div>
      )}
    </div>
  )
})

PlatformSelector.displayName = 'PlatformSelector'

export default PlatformSelector
