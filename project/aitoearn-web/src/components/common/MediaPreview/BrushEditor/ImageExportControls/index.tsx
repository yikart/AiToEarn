/**
 * ImageExportControls - 图片导出操作组件
 * 通过按钮触发图片压缩与 JPG/PNG 格式转换
 */

'use client'

import type { ImageExportFormat } from '../imageExport'
import { Check, ImageDown, Images, SlidersHorizontal } from 'lucide-react'
import { memo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  getImageExportLabel,
  IMAGE_EXPORT_FORMATS,
  IMAGE_EXPORT_QUALITY,
} from '../imageExport'

type ExportPanelType = 'compress' | 'convert' | null

export interface ImageExportControlsProps {
  /** 当前输出格式 */
  format: ImageExportFormat
  /** 设置输出格式 */
  onFormatChange: (format: ImageExportFormat) => void
  /** JPEG 输出质量 */
  quality: number
  /** 设置 JPEG 输出质量 */
  onQualityChange: (quality: number) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

const panelButtonClassName = 'h-8 rounded-full px-3 text-xs font-medium cursor-pointer'

export const ImageExportControls = memo(
  ({ format, onFormatChange, quality, onQualityChange, disabled, className }: ImageExportControlsProps) => {
    const { t } = useTransClient('common')
    const [activePanel, setActivePanel] = useState<ExportPanelType>(null)
    const isCompressOpen = activePanel === 'compress'
    const isConvertOpen = activePanel === 'convert'

    const handleTogglePanel = (panelType: Exclude<ExportPanelType, null>) => {
      setActivePanel(current => (current === panelType ? null : panelType))
    }

    const handleFormatChange = (nextFormat: ImageExportFormat) => {
      onFormatChange(nextFormat)
      setActivePanel(null)
    }

    const handleQualityChange = (nextQuality: number) => {
      onQualityChange(nextQuality)
      if (format !== 'image/jpeg')
        onFormatChange('image/jpeg')
    }

    return (
      <div className={cn('relative flex items-center gap-2', className)}>
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-background/95 p-1 shadow-lg shadow-background/20 backdrop-blur-md">
          <Button
            type="button"
            variant={isCompressOpen ? 'default' : 'ghost'}
            size="sm"
            disabled={disabled}
            onClick={() => handleTogglePanel('compress')}
            className={cn(
              panelButtonClassName,
              isCompressOpen
                ? 'bg-gradient-back text-gradient-foreground shadow-sm shadow-primary/25'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t('brushEditor.compressImage')}</span>
            <span className="sm:hidden">{t('brushEditor.compressShort')}</span>
          </Button>

          <Button
            type="button"
            variant={isConvertOpen ? 'default' : 'ghost'}
            size="sm"
            disabled={disabled}
            onClick={() => handleTogglePanel('convert')}
            className={cn(
              panelButtonClassName,
              isConvertOpen
                ? 'bg-gradient-back text-gradient-foreground shadow-sm shadow-primary/25'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Images className="w-4 h-4" />
            <span className="hidden sm:inline">{t('brushEditor.convertFormat')}</span>
            <span className="sm:hidden">{t('brushEditor.convertShort')}</span>
          </Button>
        </div>

        <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-background/95 px-2.5 py-1 text-xs text-foreground shadow-lg shadow-background/20 backdrop-blur-md sm:flex">
          <ImageDown className="w-3.5 h-3.5 text-primary" />
          <span>{getImageExportLabel(format)}</span>
          <span className="text-muted-foreground">·</span>
          <span>{format === 'image/jpeg' ? `${quality}%` : t('brushEditor.pngLosslessShort')}</span>
        </div>

        {activePanel && (
          <div className="absolute left-1/2 top-full z-[10002] mt-2 w-[calc(100vw-32px)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl shadow-background/30 sm:left-0 sm:translate-x-0">
            {isCompressOpen && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('brushEditor.compressImage')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('brushEditor.compressHint')}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {quality}
                    %
                  </span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => handleQualityChange(value)}
                  min={IMAGE_EXPORT_QUALITY.min}
                  max={IMAGE_EXPORT_QUALITY.max}
                  step={IMAGE_EXPORT_QUALITY.step}
                  disabled={disabled}
                  className="w-full"
                />
                {format !== 'image/jpeg' && (
                  <p className="text-xs text-muted-foreground">{t('brushEditor.compressJpgTip')}</p>
                )}
              </div>
            )}

            {isConvertOpen && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('brushEditor.convertFormat')}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t('brushEditor.convertHint')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_EXPORT_FORMATS.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleFormatChange(item.value)}
                      className={cn(
                        'flex h-12 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                        format === item.value
                          ? 'border-primary bg-primary/12 text-primary shadow-sm shadow-primary/10'
                          : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent',
                      )}
                      aria-label={t('brushEditor.convertToFormat', { format: item.label })}
                    >
                      <span>{item.label}</span>
                      {format === item.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
)

export default ImageExportControls
