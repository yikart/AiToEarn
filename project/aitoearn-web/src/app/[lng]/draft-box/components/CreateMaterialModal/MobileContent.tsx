/**
 * MobileContent - 创建/编辑素材弹窗的移动端布局组件
 * 全屏弹窗，布局：平台选择 → 媒体上传区 → 标题输入 → 描述输入
 */
'use client'

import type { CreateMaterialModalProps } from './index'
import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import { Bot, Play, TriangleAlert, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactSortable } from 'react-sortablejs'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import MediaPreview from '@/components/common/MediaPreview'
import BrushEditor from '@/components/common/MediaPreview/BrushEditor'
import PublishUploadProgress from '@/components/PublishDialog/compoents/PublishManageUpload/PublishUploadProgress'
import PubParmasTextareaUpload from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextareaUpload'
import PubParmasTextuploadImage from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextuploadImage'
import VideoCoverSeting from '@/components/PublishDialog/compoents/PubParmasTextarea/VideoCoverSeting'
import { formatImg } from '@/components/PublishDialog/PublishDialog.util'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import InlinePlatformSelector from './InlinePlatformSelector'
import { useCreateMaterialForm } from './useCreateMaterialForm'
import { useMaterialValidation } from './useMaterialValidation'
import './uploadItemTransition.css'

const MobileContent = memo(
  ({
    groupId,
    editingMaterial,
    isSubmitting: externalSubmitting,
    onClose,
    onSuccess,
  }: Omit<CreateMaterialModalProps, 'open'>) => {
    const { t } = useTranslation('brandPromotion')
    const { t: tPublish } = useTransClient('publish')
    const router = useRouter()

    const {
      params,
      updateParams,
      updateImages,
      updateVideo,
      isSubmitting: submitting,
      handleSubmit,
      cancelUpload,
    } = useCreateMaterialForm({
      groupId,
      editingMaterial,
      isSubmitting: externalSubmitting,
      onClose,
      onSuccess,
    })

    const { warnings, effectiveLimits } = useMaterialValidation(params, params.selectedPlatforms)

    // 预览状态
    const [previewData, setPreviewData] = useState<IImgFile | IVideoFile | undefined>(undefined)
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
    // 编辑图片索引
    const [editImgIndex, setEditImgIndex] = useState(-1)
    // 视频封面裁剪
    const [videoCoverSetingModal, setVideoCoverSetingModal] = useState(false)
    // 内部图片/视频状态（用于排序等操作后同步回 params）
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // 平台配置（用于上传类型判断，取 TikTok 作为基准）
    const platConfig = useMemo(() => {
      return AccountPlatInfoMap.get(PlatType.Tiktok)! || {}
    }, [])

    const imageMax = useMemo(() => {
      return effectiveLimits.imagesMax?.value ?? platConfig.commonPubParamsConfig?.imagesMax ?? 10
    }, [effectiveLimits, platConfig])

    const videoMax = 1

    // 动态 accept 类型
    const uploadAccept = useMemo(() => {
      const hasImage = params.images.length !== 0
      const hasVideo = !!params.video
      if (hasImage && !hasVideo && platConfig.pubTypes.has(PubType.ImageText))
        return 'image/*'
      if (!hasImage && hasVideo && platConfig.pubTypes.has(PubType.VIDEO))
        return 'video/*'
      if (platConfig.pubTypes.has(PubType.ImageText) && platConfig.pubTypes.has(PubType.VIDEO))
        return 'video/*,image/*'
      if (platConfig.pubTypes.has(PubType.ImageText))
        return 'image/*'
      if (platConfig.pubTypes.has(PubType.VIDEO))
        return 'video/*'
      return 'video/*,image/*'
    }, [params.images, params.video, platConfig])

    // 是否显示上传按钮
    const canShowDragger = useMemo(() => {
      const imageCount = params.images.length
      const videoCount = params.video ? 1 : 0
      const hasImage = imageCount > 0
      const hasVideo = videoCount > 0
      if (hasImage && imageCount >= imageMax)
        return false
      if (hasVideo && videoCount >= videoMax)
        return false
      return true
    }, [params.images, params.video, imageMax, videoMax])

    // 文件类型检查
    const checkFileListType = useCallback(
      (fileList: File[]) => {
        const hasImageInList = params.images.length !== 0
        const hasVideoInList = !!params.video
        let uploadHasImage = false
        let uploadHasVideo = false
        let invalidFile = false

        for (const file of fileList) {
          if (file.type.startsWith('image/')) {
            uploadHasImage = true
          }
          else if (file.type.startsWith('video/')) {
            uploadHasVideo = true
          }
          else {
            invalidFile = true
          }
        }

        const messageOpen = (content: string) => {
          toast.warning(content, { id: 'upload-warning' })
        }

        if (uploadHasImage && !platConfig.pubTypes.has(PubType.ImageText)) {
          messageOpen(tPublish('validation.uploadImage'))
          return false
        }
        if (uploadHasVideo && !platConfig.pubTypes.has(PubType.VIDEO)) {
          messageOpen(tPublish('validation.uploadVideo'))
          return false
        }
        if (hasImageInList && !hasVideoInList && uploadHasVideo) {
          messageOpen(tPublish('validation.imageOnly'))
          return false
        }
        if (hasVideoInList && !hasImageInList && uploadHasImage) {
          messageOpen(tPublish('validation.videoOnly'))
          return false
        }
        if (
          (uploadHasImage && uploadHasVideo)
          || (hasImageInList && uploadHasVideo)
          || (hasVideoInList && uploadHasImage)
        ) {
          messageOpen(tPublish('validation.imageVideoMixed'))
          return false
        }
        if (invalidFile) {
          messageOpen(tPublish('validation.onlyImageOrVideo'))
          return false
        }
        if (uploadHasVideo) {
          const totalVideoCount
            = (params.video ? 1 : 0) + fileList.filter(f => f.type.startsWith('video/')).length
          if (totalVideoCount > videoMax) {
            messageOpen(tPublish('validation.videoMaxExceeded', { maxCount: videoMax }))
            return false
          }
        }
        if (uploadHasImage) {
          const totalImageCount
            = params.images.length + fileList.filter(f => f.type.startsWith('image/')).length
          if (totalImageCount > imageMax) {
            messageOpen(tPublish('validation.imageMaxExceeded', { maxCount: imageMax }))
            return false
          }
        }
        return true
      },
      [params.images, params.video, videoMax, imageMax, platConfig, tPublish],
    )

    // 图片列表排序回调
    const handleSortList = useCallback(
      (newList: IImgFile[]) => {
        updateParams({ images: newList })
      },
      [updateParams],
    )

    // textarea 自动增高
    const handleDesChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateParams({ des: e.target.value })
        // 自动调整高度
        const el = e.target
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      },
      [updateParams],
    )

    return (
      <>
        {/* 弹窗层 */}
        <VideoCoverSeting
          videoCoverSetingModal={videoCoverSetingModal}
          onClose={() => setVideoCoverSetingModal(false)}
          videoFile={params.video}
          value={params.video?.cover}
          onChoosed={(newCover) => {
            updateParams({
              video: params.video ? { ...params.video, cover: newCover } : undefined,
            })
          }}
        />

        <MediaPreview
          open={imagePreviewOpen && !!(previewData && (previewData as IImgFile).imgUrl)}
          items={[{ type: 'image', src: (previewData as IImgFile)?.imgUrl || '' }]}
          onClose={() => {
            setImagePreviewOpen(false)
            setPreviewData(undefined)
          }}
        />

        <MediaPreview
          open={!!(previewData && (previewData as IVideoFile)?.videoUrl)}
          items={[{ type: 'video', src: (previewData as IVideoFile)?.videoUrl }]}
          onClose={() => setPreviewData(undefined)}
        />

        <BrushEditor
          open={editImgIndex !== -1}
          imageUrl={params.images[editImgIndex]?.imgUrl || ''}
          onClose={() => setEditImgIndex(-1)}
          onSave={async (newUrl, blob) => {
            const image = await formatImg({
              blob,
              path: params.images[editImgIndex]?.filename || `edited_${Date.now()}.png`,
            })
            image.ossUrl = newUrl
            const newImages = [...params.images]
            newImages[editImgIndex] = image
            updateParams({ images: newImages })
          }}
        />

        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent cursor-pointer"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="text-base font-medium">
            {t('createMaterial.title')}
          </DialogTitle>
          <div className="w-8" />
        </div>

        {/* 平台选择器 */}
        <div className="px-4 py-2 border-b border-border shrink-0">
          <InlinePlatformSelector
            selectedPlatforms={params.selectedPlatforms}
            onPlatformsChange={platforms => updateParams({ selectedPlatforms: platforms })}
          />
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* 警告区域 */}
          {warnings.length > 0 && (
            <div className="mb-4">
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

          {/* 媒体上传区 */}
          <ReactSortable
            className="grid grid-cols-3 gap-2.5"
            list={params.images}
            animation={250}
            setList={handleSortList}
            scrollSensitivity={100}
            scrollSpeed={15}
            id="id"
          >
            <TransitionGroup component={null}>
              {/* 图片列表 */}
              {params.images.map((v, i) => (
                <CSSTransition key={v.id || v.imgUrl} timeout={300} classNames="upload-item">
                  <PubParmasTextuploadImage
                    onEditClick={() => setEditImgIndex(i)}
                    imageFile={v}
                    onClick={() => {
                      setPreviewData(v)
                      setImagePreviewOpen(true)
                    }}
                    onClose={() => {
                      updateImages((prevImages) => {
                        const target = prevImages[i]
                        if (target?.uploadTaskId)
                          cancelUpload(target.uploadTaskId)
                        return prevImages.filter((_, idx) => idx !== i)
                      })
                    }}
                  />
                </CSSTransition>
              ))}

              {/* 视频列表 */}
              {(params.video ? [params.video] : []).map((v, i) => (
                <CSSTransition key={`video-${i}`} timeout={300} classNames="upload-item">
                  <div
                    className="h-[110px] border border-border rounded-lg cursor-pointer relative overflow-hidden"
                    onClick={() => setPreviewData(params.video)}
                  >
                    <div
                      className="absolute right-1 top-1 z-20 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/90 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation()
                        const uploadIds = params.video?.uploadTaskIds
                        if (uploadIds?.video)
                          cancelUpload(uploadIds.video)
                        if (uploadIds?.cover)
                          cancelUpload(uploadIds.cover)
                        updateParams({ video: undefined })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </div>
                    <div className="w-full h-full relative">
                      <Image
                        src={v.cover?.imgUrl || ''}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                        alt=""
                        unoptimized
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white/60 rounded-full flex items-center justify-center text-white">
                        <Play className="h-4 w-4 fill-current" />
                      </div>
                    </div>
                    {params.video?.uploadTaskIds?.video && (
                      <PublishUploadProgress taskId={params.video.uploadTaskIds.video} />
                    )}
                  </div>
                </CSSTransition>
              ))}

              {/* 上传按钮 */}
              {canShowDragger && (
                <CSSTransition key="dragger" timeout={300} classNames="upload-item" unmountOnExit>
                  <PubParmasTextareaUpload
                    checkFileListType={checkFileListType}
                    uploadAccept={uploadAccept}
                    enableGlobalDrag={false}
                    onVideoUpdateFinish={(video) => {
                      updateVideo((prevVideo) => {
                        if (prevVideo) {
                          const prevIds = prevVideo.uploadTaskIds ?? {}
                          const nextIds = video?.uploadTaskIds ?? {}
                          if (prevIds.video && prevIds.video !== nextIds.video)
                            cancelUpload(prevIds.video)
                          if (prevIds.cover && prevIds.cover !== nextIds.cover)
                            cancelUpload(prevIds.cover)
                        }
                        return video
                      })
                    }}
                    onImgUpdateFinish={(imgs) => {
                      updateImages((prevImages) => {
                        const next = [...prevImages]
                        imgs.forEach((img) => {
                          const index = next.findIndex(item => item.id === img.id)
                          if (index !== -1) {
                            next[index] = img
                          }
                          else {
                            next.push(img)
                          }
                        })
                        return next
                      })
                    }}
                  />
                </CSSTransition>
              )}
            </TransitionGroup>
          </ReactSortable>

          {/* 视频封面裁剪按钮 */}
          {params.video && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5 cursor-pointer"
              onClick={() => setVideoCoverSetingModal(true)}
            >
              {tPublish('actions.cropCover')}
            </Button>
          )}

          {/* 标题输入 */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={params.title}
                placeholder={t('createMaterial.titlePlaceholder')}
                onChange={e => updateParams({ title: e.target.value })}
                maxLength={effectiveLimits.titleMax?.value}
                className="flex-1 min-w-0 text-base font-medium bg-transparent border-none shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
              {effectiveLimits.titleMax && (
                <span className={`shrink-0 text-xs tabular-nums ${params.title.length > effectiveLimits.titleMax.value ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {params.title.length}
                  /
                  {effectiveLimits.titleMax.value}
                </span>
              )}
            </div>
          </div>

          {/* 描述输入 */}
          <div className="mt-3 border-t border-border pt-3">
            <textarea
              ref={textareaRef}
              value={params.des}
              placeholder={tPublish('form.descriptionPlaceholder')}
              onChange={handleDesChange}
              rows={4}
              className="w-full text-sm bg-transparent border-none shadow-none outline-none resize-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* 底部栏 */}
        <div className="flex items-center justify-between px-4 h-14 border-t border-border shrink-0">
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
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer"
          >
            {t('common.confirm')}
          </Button>
        </div>
      </>
    )
  },
)

MobileContent.displayName = 'MobileContent'

export default MobileContent
