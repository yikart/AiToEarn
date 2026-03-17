/**
 * PlatformLimitsInfo - 平台参数限制信息展示
 * 展示选中平台组合的有效参数限制（取最小值）
 */

'use client'

import type { EffectiveLimitsDetailed } from '../platformLimits'
import type { PlatType } from '@/app/config/platConfig'
import { Info } from 'lucide-react'
import Image from 'next/image'
import { memo, useMemo, useState } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface PlatformLimitsInfoProps {
  selectedPlatforms: PlatType[]
  limitsDetailed: EffectiveLimitsDetailed
}

/** 限制行配置 */
const LIMIT_ROWS = [
  { key: 'titleMax' as const, labelKey: 'detail.titleLimit', unit: 'detail.characters' },
  { key: 'desMax' as const, labelKey: 'detail.descriptionLimit', unit: 'detail.characters' },
  { key: 'topicMax' as const, labelKey: 'detail.topicLimit', unit: 'detail.items' },
  { key: 'imagesMax' as const, labelKey: 'detail.imageLimit', unit: 'detail.items' },
]

const PlatformLimitsInfo = memo(({ selectedPlatforms, limitsDetailed }: PlatformLimitsInfoProps) => {
  const { t } = useTransClient('brandPromotion')
  const [open, setOpen] = useState(false)

  const hasLimits = selectedPlatforms.length > 0

  const rows = useMemo(() => {
    return LIMIT_ROWS.map(({ key, labelKey, unit }) => {
      const detail = limitsDetailed[key]
      const platInfo = detail ? AccountPlatInfoMap.get(detail.limitedBy) : null
      return {
        label: t(labelKey),
        value: detail?.value ?? null,
        unit: t(unit),
        platIcon: platInfo?.icon,
        platName: platInfo?.name,
      }
    })
  }, [limitsDetailed, t])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center w-7 h-7 rounded-r-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer',
            hasLimits && 'text-primary',
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        side="top"
        align="start"
      >
        <span className="text-xs font-medium text-foreground block mb-2">
          {t('detail.parameterLimits')}
        </span>

        {!hasLimits
          ? (
              <p className="text-xs text-muted-foreground">
                {t('detail.noPlatformSelected')}
              </p>
            )
          : (
              <>
                <div className="space-y-1.5">
                  {rows.map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="flex items-center gap-1.5 text-foreground">
                        {row.value !== null
                          ? (
                              <>
                                <span className="font-medium">{row.value}</span>
                                <span className="text-muted-foreground">{row.unit}</span>
                                {row.platIcon && (
                                  <Image
                                    src={row.platIcon}
                                    alt={row.platName || ''}
                                    width={14}
                                    height={14}
                                    className="rounded-sm"
                                    title={row.platName}
                                  />
                                )}
                              </>
                            )
                          : (
                              <span className="text-muted-foreground">{t('detail.noLimit')}</span>
                            )}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {t('detail.limitsMinTip')}
                </p>
              </>
            )}
      </PopoverContent>
    </Popover>
  )
})

PlatformLimitsInfo.displayName = 'PlatformLimitsInfo'

export default PlatformLimitsInfo
