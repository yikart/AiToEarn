/**
 * PlatformSelectStep - 平台选择步骤组件
 * 用于用户选择发布内容的目标平台
 */

'use client'

import Image from 'next/image'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlatformSelectStepProps {
  selectedPlatform: PlatType | null
  onSelect: (platform: PlatType) => void
  onConfirm: () => void
}

// 支持的平台
const supportedPlatforms = [PlatType.Tiktok, PlatType.Douyin]

const accountTypeToPlatType: Record<string, PlatType> = {
  [PlatType.Tiktok]: PlatType.Tiktok,
  [PlatType.Douyin]: PlatType.Douyin,
}

export function PlatformSelectStep({
  selectedPlatform,
  onSelect,
  onConfirm,
}: PlatformSelectStepProps) {
  const { t } = useTransClient('promo')

  return (
    <Card className="border-primary/10 p-0 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl md:text-2xl">
          {t('platformSelect.title')}
        </CardTitle>
        <CardDescription>
          {t('platformSelect.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 平台选择网格 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {supportedPlatforms.map((platform) => {
            const platType = accountTypeToPlatType[platform]
            const platInfo = AccountPlatInfoMap.get(platType)
            if (!platInfo)
              return null

            const isSelected = selectedPlatform === platform

            return (
              <button
                key={platform}
                type="button"
                onClick={() => onSelect(platform)}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all md:gap-3 md:p-6',
                  isSelected
                    ? 'scale-105 border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
                )}
              >
                {/* 平台图标 */}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl transition-all md:h-16 md:w-16',
                    isSelected ? 'scale-110' : 'group-hover:scale-105',
                  )}
                >
                  <Image
                    src={platInfo.icon}
                    alt={platInfo.name}
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain md:h-12 md:w-12"
                  />
                </div>

                {/* 平台名称 */}
                <span
                  className={cn(
                    'text-sm font-medium transition-colors md:text-base',
                    isSelected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {platInfo.name}
                </span>

                {/* 选中指示器 */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground md:h-6 md:w-6 md:text-xs">
                    ✓
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 确认按钮 */}
        <Button
          onClick={onConfirm}
          disabled={!selectedPlatform}
          className="w-full"
          size="lg"
        >
          {t('platformSelect.confirm')}
        </Button>
      </CardContent>
    </Card>
  )
}
