/**
 * CreateMaterialModal - 创建/编辑素材弹窗
 * 简化版本：只需要标题、描述、上传资源三个字段
 * 桌面端使用 PubParmasTextarea 组件，移动端使用独立全屏布局
 */
'use client'

import type { PromotionMaterial } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import { Bot, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatType } from '@/app/config/platConfig'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import InlinePlatformSelector from './InlinePlatformSelector'
import MobileContent from './MobileContent'
import { useCreateMaterialForm } from './useCreateMaterialForm'
import { useMaterialValidation } from './useMaterialValidation'

export interface CreateMaterialModalProps {
  open: boolean
  /** 素材组 ID（推广计划关联的素材组） */
  groupId: string | null
  /** 编辑模式下的素材数据 */
  editingMaterial?: PromotionMaterial | null
  /** 是否正在提交 */
  isSubmitting?: boolean
  /** 关闭弹窗 */
  onClose: () => void
  /** 创建/更新成功回调 */
  onSuccess?: () => void
}

/**
 * 创建/编辑素材弹窗内容（桌面端）
 */
const CreateMaterialModalContent = memo(
  ({
    groupId,
    editingMaterial,
    isSubmitting: externalSubmitting,
    onClose,
    onSuccess,
  }: Omit<CreateMaterialModalProps, 'open'>) => {
    const { t } = useTranslation('brandPromotion')
    const router = useRouter()

    const {
      params,
      updateParams,
      isSubmitting: submitting,
      handleSubmit,
    } = useCreateMaterialForm({
      groupId,
      editingMaterial,
      isSubmitting: externalSubmitting,
      onClose,
      onSuccess,
    })

    const { warnings, effectiveLimits } = useMaterialValidation(params, params.selectedPlatforms)

    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {t('createMaterial.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 max-h-[70vh]">
          {/* 平台选择器 */}
          <div className="px-1">
            <InlinePlatformSelector
              selectedPlatforms={params.selectedPlatforms}
              onPlatformsChange={platforms => updateParams({ selectedPlatforms: platforms })}
            />
          </div>

          {/* 警告区域 */}
          {warnings.length > 0 && (
            <div className="px-1">
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {t('createMaterial.validationWarnings')}
                </div>
                <ul className="text-xs text-amber-600 dark:text-amber-400/80 space-y-0.5">
                  {warnings.map((w, i) => (
                    <li key={i}>
                      •
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 使用 PubParmasTextarea 组件 */}
          <div className="px-1 overflow-y-auto">
            <PubParmasTextarea
              platType={PlatType.Tiktok}
              hideWritingAssistant
              desValue={params.des}
              imageFileListValue={params.images}
              videoFileValue={params.video}
              imagesMaxOverride={effectiveLimits.imagesMax?.value}
              desMaxOverride={effectiveLimits.desMax?.value}
              onChange={({ value, imgs, video }) => {
                updateParams({ des: value, images: imgs || [], video })
              }}
              toolbarExtra={(
                <div className="px-1.5 border-l border-border first:border-l-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer transition-all hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/ai-social?agentExternalPrompt=${encodeURIComponent(t('detail.agentGeneratePrompt'))}`)
                    }}
                  >
                    <Bot className="mr-1 h-4 w-4" />
                    {t('detail.agentGenerate')}
                  </Button>
                </div>
              )}
              extend={(
                <div className="flex items-center h-10">
                  <label className="shrink-0 w-[60px] text-sm">{t('createMaterial.titleLabel')}</label>
                  <Input
                    data-testid="draftbox-material-title-input"
                    value={params.title}
                    placeholder={t('createMaterial.titlePlaceholder')}
                    onChange={e => updateParams({ title: e.target.value })}
                    maxLength={effectiveLimits.titleMax?.value}
                  />
                  {effectiveLimits.titleMax && (
                    <span className={cn(
                      'shrink-0 ml-2 text-xs tabular-nums',
                      params.title.length > effectiveLimits.titleMax.value
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                    >
                      {params.title.length}
                      /
                      {effectiveLimits.titleMax.value}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
            {t('common.cancel')}
          </Button>
          <Button data-testid="draftbox-material-save-btn" onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
            {submitting ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </>
    )
  },
)

CreateMaterialModalContent.displayName = 'CreateMaterialModalContent'

/**
 * 创建素材弹窗
 */
export const CreateMaterialModal = memo(
  ({ open, ...props }: CreateMaterialModalProps) => {
    const isMobile = useIsMobile()

    if (!open)
      return null

    return (
      <Dialog open={open} onOpenChange={isOpen => !isOpen && props.onClose()}>
        <DialogContent
          data-testid="draftbox-create-material-modal"
          className={cn(
            isMobile
              ? '!left-0 !top-0 !translate-x-0 !translate-y-0 !w-full !h-[100dvh] !max-w-none !rounded-none !p-0 !border-none !gap-0 flex flex-col'
              : 'sm:max-w-[700px]',
          )}
          hideCloseButton={isMobile}
        >
          {isMobile
            ? <MobileContent {...props} />
            : <CreateMaterialModalContent {...props} />}
        </DialogContent>
      </Dialog>
    )
  },
)

CreateMaterialModal.displayName = 'CreateMaterialModal'

export default CreateMaterialModal
