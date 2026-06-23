/**
 * InlinePlatformSelector - 内联平台图标选择器
 * 用于创建草稿弹窗顶部，一行展示所有可用平台图标
 */

'use client'

import type { CSSProperties } from 'react'
import type { PlatType } from '@/app/config/platConfig'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformIcon } from '@/components/common/PlatformIcon'
import { getPlatformAccountBorderColor } from '@/components/PublishDialog/PublishDialog.util'
import { useTaskPlatforms } from '@/hooks/usePlatformMetadata'
import { cn } from '@/utils/className'

interface InlinePlatformSelectorProps {
  selectedPlatforms: PlatType[]
  onPlatformsChange: (platforms: PlatType[]) => void
  availablePlatforms?: PlatType[]
}

type PlatformBorderStyle = CSSProperties & {
  '--publish-account-platform-border': string
}

function getPlatformBorderStyle(platType: PlatType): PlatformBorderStyle {
  return {
    '--publish-account-platform-border': getPlatformAccountBorderColor(platType),
  }
}

const InlinePlatformSelector = memo(({ selectedPlatforms, onPlatformsChange, availablePlatforms }: InlinePlatformSelectorProps) => {
  const { t } = useTranslation('brandPromotion')
  const taskPlatforms = useTaskPlatforms()

  const platformOptions = useMemo(() => {
    const visiblePlatforms = availablePlatforms ?? taskPlatforms.map(([plat]) => plat)

    return taskPlatforms
      .filter(([plat]) => visiblePlatforms.includes(plat))
      .map(([plat, info]) => ({
        plat,
        name: info.name,
      }))
  }, [availablePlatforms, taskPlatforms])

  const isAllSelected = platformOptions.length > 0 && selectedPlatforms.length === platformOptions.length

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
      onPlatformsChange(platformOptions.map(p => p.plat))
    }
  }, [isAllSelected, platformOptions, onPlatformsChange])

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{t('createMaterial.targetPlatforms')}</span>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {platformOptions.map(({ plat, name }) => {
          const isSelected = selectedPlatforms.includes(plat)
          return (
            <button
              key={plat}
              type="button"
              className={cn(
                'border-2 rounded-full p-px cursor-pointer transition-all duration-300',
                isSelected
                  ? 'border-(--publish-account-platform-border) active:border-(--publish-account-platform-border)'
                  : 'border-transparent [&>img]:grayscale hover:[&>img]:grayscale-0',
              )}
              style={getPlatformBorderStyle(plat)}
              title={name}
              onClick={() => handleToggle(plat)}
            >
              <PlatformIcon
                platform={plat}
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
