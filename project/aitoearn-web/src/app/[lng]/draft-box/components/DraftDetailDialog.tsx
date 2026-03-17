/**
 * 草稿详情弹框组件
 * 展示草稿的完整信息，支持编辑和删除操作
 * PC端左右布局：左侧媒体资源，右侧信息
 */

'use client'

import type { DraftMaterial } from '@/app/[lng]/draft-box/types'
import { Calendar, Edit, Image as ImageIcon, Loader2, Send, Trash2, Video } from 'lucide-react'
import NextImage from 'next/image'
import { memo, useCallback, useState } from 'react'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useShallow } from 'zustand/react/shallow'

import { useDraftBoxStore } from '@/app/[lng]/draft-box/draftBoxStore'
import { useTransClient } from '@/app/i18n/client'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format'
import styles from './DraftDetailDialog.module.scss'
import { LazyImage } from './LazyImage'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// 带 loading 状态的图片组件
function MediaImage({ src, alt }: { src: string, alt: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Loading 骨架 - 增强效果 */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 gap-3">
          {/* 旋转加载图标 */}
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      )}
      <NextImage
        src={src}
        alt={alt}
        width={800}
        height={600}
        className={cn(
          'max-w-full max-h-full object-contain transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        onLoad={() => setLoaded(true)}
        unoptimized
      />
    </div>
  )
}

// 媒体预览组件 - 使用 Swiper 轮播
const MediaPreview = memo(({ material }: { material: DraftMaterial }) => {
  const mediaList = material.mediaList || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // 检查是否全是图片（非视频）
  const isAllImages = mediaList.length > 0 && !mediaList.some(m => m.type === 'video')

  // 无媒体但有封面
  if (mediaList.length === 0 && material.coverUrl) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted">
        <LazyImage
          src={material.coverUrl}
          alt={material.title || '草稿封面'}
          fill
          className="object-cover"
          skeletonClassName="rounded-lg"
        />
      </div>
    )
  }

  // 无媒体无封面
  if (mediaList.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-lg bg-muted">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  // 有媒体 - 使用 Swiper
  return (
    <div
      className={cn(
        'w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-muted relative',
        styles.draftMediaSwiper,
        isHovered ? styles.swiperVisible : styles.swiperHidden,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Swiper
        data-testid="draftbox-detail-swiper"
        modules={[Navigation, Pagination]}
        navigation={mediaList.length > 1}
        pagination={{ clickable: true }}
        loop={mediaList.length > 1}
        observer={true}
        observeParents={true}
        onSlideChange={swiper => setCurrentIndex(swiper.realIndex)}
        className="h-full w-full"
      >
        {mediaList.map((media, index) => (
          <SwiperSlide key={index} className="!flex items-center justify-center">
            {media.type === 'video'
              ? (
                  <video
                    src={media.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-white"
                    poster={material.coverUrl}
                  />
                )
              : (
                  <MediaImage
                    src={media.url}
                    alt={material.title || `媒体 ${index + 1}`}
                  />
                )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 右上角页码指示器 - 仅图片且多于1张时显示 */}
      {isAllImages && mediaList.length > 1 && (
        <div className={cn(
          'absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-black/50 text-white backdrop-blur-sm',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0',
        )}
        >
          {currentIndex + 1}
          {' '}
          /
          {mediaList.length}
        </div>
      )}
    </div>
  )
})

MediaPreview.displayName = 'MediaPreview'

// 详情弹框内容组件
const DraftDetailContent = memo(({ onClose }: { onClose: () => void }) => {
  const { t } = useTransClient('brandPromotion')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { selectedDraft, isSubmitting } = useDraftBoxStore(
    useShallow(state => ({
      selectedDraft: state.selectedDraft,
      isSubmitting: state.isSubmitting,
    })),
  )

  const {
    openEditMaterialModal,
    closeDraftDetailDialog,
    deleteMaterial,
    openPublishDialog,
  } = useDraftBoxStore(
    useShallow(state => ({
      openEditMaterialModal: state.openEditMaterialModal,
      closeDraftDetailDialog: state.closeDraftDetailDialog,
      deleteMaterial: state.deleteMaterial,
      openPublishDialog: state.openPublishDialog,
    })),
  )

  // 处理编辑
  const handleEdit = useCallback(() => {
    if (selectedDraft) {
      closeDraftDetailDialog()
      openEditMaterialModal(selectedDraft)
    }
  }, [selectedDraft, closeDraftDetailDialog, openEditMaterialModal])

  // 处理发布
  const handlePublish = useCallback(() => {
    if (selectedDraft) {
      closeDraftDetailDialog()
      openPublishDialog(selectedDraft)
    }
  }, [selectedDraft, closeDraftDetailDialog, openPublishDialog])

  // 处理删除
  const handleDelete = useCallback(async () => {
    if (!selectedDraft)
      return

    const success = await deleteMaterial(selectedDraft._id)
    if (success) {
      toast.success(t('plan.deleteSuccess'))
      closeDraftDetailDialog()
    }
    else {
      toast.error(t('plan.deleteFailed'))
    }
    setDeleteConfirmOpen(false)
  }, [selectedDraft, deleteMaterial, closeDraftDetailDialog, t])

  if (!selectedDraft)
    return null

  return (
    <>
      {/* 无障碍：隐藏的标题 */}
      <DialogTitle className="sr-only">{t('draft.detailTitle')}</DialogTitle>

      {/* PC端左右布局，移动端垂直布局 */}
      <div className="flex flex-col md:flex-row md:gap-6 md:h-[80vh]">
        {/* 左侧：媒体区域 */}
        <div className="md:w-3/5 flex-shrink-0 h-[40vh] md:h-full">
          <MediaPreview material={selectedDraft} />
        </div>

        {/* 右侧：信息区域 - 移动端限制最大高度使 ScrollArea 生效 */}
        <div className="md:w-2/5 mt-4 md:mt-0 flex flex-col max-h-[35vh] md:max-h-none md:h-full">
          {/* 可滚动内容 */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 pr-2">
              {/* 标题 */}
              <div>
                <h3 className="text-lg font-medium">
                  {selectedDraft.title || '未命名草稿'}
                </h3>
              </div>

              {/* 描述 */}
              {selectedDraft.desc && (
                <div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedDraft.desc}
                  </p>
                </div>
              )}

              {/* 话题 */}
              {selectedDraft.topics && selectedDraft.topics.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {selectedDraft.topics.map((topic, index) => (
                    <span key={index} className="text-sm text-primary">
                      #
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* 统计信息 */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {t('material.useCount', { count: selectedDraft.useCount || 0 })}
                </Badge>
                {selectedDraft.mediaList && selectedDraft.mediaList.length > 0 && (
                  <Badge variant="outline">
                    {selectedDraft.mediaList.some(m => m.type === 'video')
                      ? (
                          <>
                            <Video className="h-3 w-3 mr-1" />
                            {t('planType.video')}
                          </>
                        )
                      : (
                          <>
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {t('planType.article')}
                            {selectedDraft.mediaList.length > 1 && (
                              <span className="ml-1">
                                (
                                {selectedDraft.mediaList.length}
                                )
                              </span>
                            )}
                          </>
                        )}
                  </Badge>
                )}
              </div>

              {/* 创建时间 */}
              {selectedDraft.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t('draft.createdAt')}
                    :
                    {' '}
                    {formatDate(selectedDraft.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 固定底部的操作按钮 */}
          <div className="flex items-center gap-2 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              data-testid="draftbox-detail-edit-btn"
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('draft.edit')}
            </Button>
            <Button
              data-testid="draftbox-detail-publish-btn"
              className="flex-1 cursor-pointer"
              onClick={handlePublish}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('draft.publish')}
            </Button>
            <Button
              data-testid="draftbox-detail-delete-btn"
              variant="outline"
              className="flex-1 cursor-pointer text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('draft.delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('plan.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('plan.deleteConfirmDesc', { name: selectedDraft.title || '未命名草稿' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t('common.cancel')}</AlertDialogCancel>
            <Button
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

DraftDetailContent.displayName = 'DraftDetailContent'

// 主组件
export const DraftDetailDialog = memo(() => {
  const { draftDetailDialogOpen } = useDraftBoxStore(
    useShallow(state => ({
      draftDetailDialogOpen: state.draftDetailDialogOpen,
    })),
  )

  const closeDraftDetailDialog = useDraftBoxStore(state => state.closeDraftDetailDialog)

  // 根据疑难杂症记录 #2，拆成两层组件避免闪烁
  if (!draftDetailDialogOpen)
    return null

  return (
    <Dialog open onOpenChange={closeDraftDetailDialog}>
      <DialogContent data-testid="draftbox-detail-dialog" className="sm:max-w-md md:max-w-6xl">
        <DraftDetailContent onClose={closeDraftDetailDialog} />
      </DialogContent>
    </Dialog>
  )
})

DraftDetailDialog.displayName = 'DraftDetailDialog'
