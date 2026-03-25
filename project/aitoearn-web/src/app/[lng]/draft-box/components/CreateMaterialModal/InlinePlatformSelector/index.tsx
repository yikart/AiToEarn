/**
 * InlinePlatformSelector - 内联平台图标选择器
 * 用于创建草稿弹窗顶部，一行展示所有可用平台图标
 */

'use client'

import type { PlatType } from '@/app/config/platConfig'
import Image from 'next/image'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RegionTaskPlatInfoArr } from '@/app/config/platConfig'
import { cn } from '@/lib/utils'

interface InlinePlatformSelectorProps {
  selectedPlatforms: PlatType[]
  onPlatformsChange: (platforms: PlatType[]) => void
}

const InlinePlatformSelector = memo(({ selectedPlatforms, onPlatformsChange }: InlinePlatformSelectorProps) => {
  const { t } = useTranslation('brandPromotion')

  const availablePlatforms = useMemo(() =>
    RegionTaskPlatInfoArr.map(([plat, info]) => ({
      plat,
      icon: info.icon,
      name: info.name,
      themeColor: info.themeColor,
    })), [])

  const isAllSelected = selectedPlatforms.length === availablePlatforms.length

  const handleToggle = useCallback((plat: PlatType) => {
    if (selectedPlatforms.includes(plat)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== plat))
    }
    else {
      onPlatformsChange([...selectedPlatforms, plat])
    }
  }, [selectedPlatforms, onPlatformsChange])

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      onPlatformsChange([])
    }
    else {
      onPlatformsChange(availablePlatforms.map(p => p.plat))
    }
  }, [isAllSelected, availablePlatforms, onPlatformsChange])

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{t('createMaterial.targetPlatforms')}</span>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {availablePlatforms.map(({ plat, icon, name, themeColor }) => {
          const isSelected = selectedPlatforms.includes(plat)
          return (
            <button
              key={plat}
              type="button"
              className={cn(
                'border-2 rounded-full p-px cursor-pointer transition-all duration-300',
                isSelected
                  ? ''
                  : 'border-transparent [&>img]:grayscale hover:[&>img]:grayscale-0',
              )}
              style={{
                borderColor: isSelected ? themeColor : 'transparent',
              }}
              title={name}
              onClick={() => handleToggle(plat)}
            >
              <Image
                src={icon}
                alt={name}
                width={38}
                height={38}
                className="rounded-full"
              />
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="text-xs text-primary hover:underline cursor-pointer shrink-0"
        onClick={handleToggleAll}
      >
        {isAllSelected ? t('createMaterial.deselectAll') : t('createMaterial.selectAll')}
      </button>
    </div>
  )
})

InlinePlatformSelector.displayName = 'InlinePlatformSelector'

export default InlinePlatformSelector
