/**
 * VideoCreateDraftAction - 视频素材生成草稿操作
 * 在视频素材卡片上提供从视频内容一键生成草稿的入口
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import type { PlatType } from '@/app/config/platConfig'
import { Loader2, Sparkles } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import InlinePlatformSelector from '@/app/[lng]/draft-box/components/CreateMaterialModal/InlinePlatformSelector'
import { TaskPlatInfoArr } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'

interface VideoCreateDraftActionProps {
  media: MediaItem
  groupId: string
}

export const VideoCreateDraftAction = memo(({ media, groupId }: VideoCreateDraftActionProps) => {
  const { t } = useTransClient('material')
  const { t: tCommon } = useTransClient('common')
  const [dialogOpen, setDialogOpen] = useState(false)

  const availablePlatforms = useMemo(() => {
    return TaskPlatInfoArr
      .filter(([_, info]) => info.pubTypes.has(PubType.VIDEO))
      .map(([plat]) => plat)
  }, [])

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatType[]>(availablePlatforms)

  const { createDraftFromVideo, isCreating } = useMediaTabStore(
    useShallow(state => ({
      createDraftFromVideo: state.createDraftFromVideo,
      isCreating: !!state.creatingDraftMap[media._id],
    })),
  )

  const handleOpenDialog = useCallback(() => {
    if (media.type !== 'video' || isCreating) {
      return
    }

    setSelectedPlatforms(availablePlatforms)
    setDialogOpen(true)
  }, [availablePlatforms, isCreating, media.type])

  const handleCreateDraft = useCallback(async () => {
    if (media.type !== 'video' || isCreating) {
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.warning(t('mediaManagement.createDraftPlatformRequired'))
      return
    }

    setDialogOpen(false)
    toast.info(t('mediaManagement.createDraftTaskStartedToast'))

    const result = await createDraftFromVideo({
      mediaId: media._id,
      mediaTitle: media.title || media.desc || '',
      videoUrl: media.url,
      groupId,
      platforms: selectedPlatforms,
    })

    if (result.success) {
      toast.success(t('mediaManagement.createDraftSuccess'))
      return
    }

    toast.error(result.message || t('mediaManagement.createDraftFailed'))
  }, [createDraftFromVideo, groupId, isCreating, media._id, media.desc, media.title, media.type, media.url, selectedPlatforms, t])

  if (media.type !== 'video') {
    return null
  }

  return (
    <>
      <Button
        type="button"
        disabled={isCreating}
        onClick={handleOpenDialog}
        className={cn(
          'h-9 rounded-full border border-primary/25 bg-background/95 px-3 text-xs font-semibold text-foreground shadow-lg shadow-primary/15 backdrop-blur-md',
          'cursor-pointer gap-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-background hover:shadow-xl hover:shadow-primary/20',
        )}
      >
        {isCreating
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Sparkles className="h-4 w-4 text-primary" />}
        <span>{t('mediaManagement.createDraft')}</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{t('mediaManagement.createDraftConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('mediaManagement.createDraftConfirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <InlinePlatformSelector
              selectedPlatforms={selectedPlatforms}
              onPlatformsChange={setSelectedPlatforms}
              availablePlatforms={availablePlatforms}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t('mediaManagement.createDraftPlatformHint')}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={isCreating}
              className="cursor-pointer"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCreateDraft}
              disabled={isCreating}
              className="cursor-pointer gap-1.5"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('mediaManagement.createDraft')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

VideoCreateDraftAction.displayName = 'VideoCreateDraftAction'
