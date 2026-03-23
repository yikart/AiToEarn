/**
 * PubParmasTextarea - 发布参数文本输入区域
 * 包含描述输入、图片/视频上传、草稿选择等功能
 */
import type { CSSProperties, ForwardedRef } from 'react'
import type { PlatType } from '@/app/config/platConfig'
import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import { Play, X } from 'lucide-react'
import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import MediaPreview from '@/components/common/MediaPreview'
import BrushEditor from '@/components/common/MediaPreview/BrushEditor'
import PublishUploadProgress from '@/components/PublishDialog/compoents/PublishManageUpload/PublishUploadProgress'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import PubParmasMentionInput from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput'
import PubParmasTextareaUpload from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextareaUpload'
import PubParmasTextuploadImage from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextuploadImage'
import VideoCoverSeting from '@/components/PublishDialog/compoents/PubParmasTextarea/VideoCoverSeting'
import { formatImg } from '@/components/PublishDialog/PublishDialog.util'
import Aibrush from '@/components/PublishDialog/svgs/aibrush.svg'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import './uploadItemTransition.css'

export interface IPubParmasTextareaRef {}

export interface IChangeParams {
  imgs?: IImgFile[]
  video?: IVideoFile
  value: string
}

export interface IPubParmasTextareaProps {
  onChange?: (values: IChangeParams) => void
  rows?: number
  // 视频数量限制
  videoMax?: number
  // 扩展内容
  extend?: React.ReactNode
  // 在前面的扩展元素
  beforeExtend?: React.ReactNode
  // 在中间的扩展元素
  centerExtend?: React.ReactNode
  // 平台类型
  platType: PlatType
  style?: CSSProperties
  imageFileListValue?: IImgFile[]
  videoFileValue?: IVideoFile
  desValue?: string
  // 图生图回调
  onImageToImage?: (imageFile: IImgFile) => void
  // 是否为移动端
  isMobile?: boolean
  // 隐藏写作助手按钮
  hideWritingAssistant?: boolean
  // toolbar 额外内容（写作助手按钮后面）
  toolbarExtra?: React.ReactNode
  // 覆盖图片最大数量（优先于平台配置）
  imagesMaxOverride?: number
  // 覆盖描述最大长度（优先于平台配置）
  desMaxOverride?: number
}

const PubParmasTextarea = memo(
  forwardRef(
    (
      {
        style,
        onChange,
        rows = 12,
        videoMax = 1,
        extend,
        centerExtend,
        imageFileListValue = [],
        videoFileValue,
        desValue = '',
        beforeExtend,
        platType,
        onImageToImage,
        isMobile,
        hideWritingAssistant,
        toolbarExtra,
        imagesMaxOverride,
        desMaxOverride,
      }: IPubParmasTextareaProps,
      ref: ForwardedRef<IPubParmasTextareaRef>,
    ) => {
      const { setOpenLeft } = usePublishDialog(
        useShallow(state => ({
          setOpenLeft: state.setOpenLeft,
        })),
      )
      const [value, setValue] = useState(desValue)
      const [previewData, setPreviewData] = useState<IImgFile | IVideoFile | undefined>(undefined)
      // 图片
      const [imageFileList, setImageFileList] = useState<IImgFile[]>(imageFileListValue)
      // 视频
      const [videoFile, setVideoFile] = useState<IVideoFile | undefined>(videoFileValue)
      // 裁剪弹框
      const [videoCoverSetingModal, setVideoCoverSetingModal] = useState(false)
      const isFirst = useRef({
        effect: true,
        sort: true,
      })
      // 记录最近一次从 props 同步过来的值，用于在 onChange effect 中判断是否为 props 触发的变化
      const lastSyncedFromProps = useRef({
        des: desValue || '',
        images: imageFileListValue ?? [],
        video: videoFileValue,
      })
      const { t } = useTransClient('publish')
      // 编辑图片的索引
      const [editImgIndex, setEditImgIndex] = useState(-1)
      const { cancelUpload } = usePublishManageUpload(
        useShallow(state => ({
          cancelUpload: state.cancelUpload,
        })),
      )

      // 图片预览状态
      const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

      useEffect(() => {
        if (isFirst.current.effect) {
          isFirst.current.effect = false
          return
        }
        // 如果当前值和最近 props 同步的值完全一致，说明是 props 变化引起的，跳过
        const synced = lastSyncedFromProps.current
        if (
          value === synced.des
          && imageFileList === synced.images
          && videoFile === synced.video
        ) {
          return
        }
        const values = {
          imgs: imageFileList,
          video: videoFile,
          value,
        }
        if (onChange)
          onChange(values)
      }, [imageFileList, videoFile, value])
      // 合并外部 props 同步，记录同步值用于 onChange effect 中判断
      useEffect(() => {
        lastSyncedFromProps.current = {
          des: desValue || '',
          images: imageFileListValue ?? [],
          video: videoFileValue,
        }
        setImageFileList(imageFileListValue ?? [])
        setValue(desValue || '')
        setVideoFile(videoFileValue)
      }, [imageFileListValue, desValue, videoFileValue])

      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(platType)! || {}
      }, [platType])
      const imageMax = useMemo(() => {
        return imagesMaxOverride ?? platConfig.commonPubParamsConfig?.imagesMax ?? 10
      }, [platConfig, imagesMaxOverride])

      // 动态accept类型
      const uploadAccept = useMemo(() => {
        const hasImage = imageFileList.length !== 0
        const hasVideo = !!videoFile
        if (hasImage && !hasVideo && platConfig.pubTypes.has(PubType.ImageText))
          return 'image/*'
        if (!hasImage && hasVideo && platConfig.pubTypes.has(PubType.VIDEO))
          return 'video/*'

        if (platConfig.pubTypes.has(PubType.ImageText) && platConfig.pubTypes.has(PubType.VIDEO)) {
          return 'video/*,image/*'
        }
        if (platConfig.pubTypes.has(PubType.ImageText))
          return 'image/*'
        if (platConfig.pubTypes.has(PubType.VIDEO))
          return 'video/*'

        return 'video/*,image/*'
      }, [imageFileList, videoFile, platConfig])

      // 是否可见Dragger
      const canShowDragger = useMemo(() => {
        const imageCount = imageFileList.length
        const videoCount = videoFile ? 1 : 0
        const hasImage = imageCount > 0
        const hasVideo = videoCount > 0

        if (hasImage && imageCount >= imageMax)
          return false
        if (hasVideo && videoCount >= videoMax)
          return false
        // 视频和图片都没有，或者只选一种且未到上限
        return true
      }, [videoFile, imageMax, videoMax, videoFile])

      // 检查上传文件类型
      const checkFileListType = useCallback(
        (fileList: File[]) => {
          const hasImageInList = imageFileList.length !== 0
          const hasVideoInList = !!videoFile
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
            messageOpen(t('validation.uploadImage'))
            return false
          }
          if (uploadHasVideo && !platConfig.pubTypes.has(PubType.VIDEO)) {
            messageOpen(t('validation.uploadVideo'))
            return false
          }

          // 已有图片，只能传图片
          if (hasImageInList && !hasVideoInList && uploadHasVideo) {
            messageOpen(t('validation.imageOnly'))
            return false
          }
          // 已有视频，只能传视频
          if (hasVideoInList && !hasImageInList && uploadHasImage) {
            messageOpen(t('validation.videoOnly'))
            return false
          }
          // 混合上传拦截
          if (
            (uploadHasImage && uploadHasVideo)
            || (hasImageInList && uploadHasVideo)
            || (hasVideoInList && uploadHasImage)
          ) {
            messageOpen(t('validation.imageVideoMixed'))
            return false
          }
          // 非法类型
          if (invalidFile) {
            messageOpen(t('validation.onlyImageOrVideo'))
            return false
          }
          if (uploadHasVideo) {
            // 视频条数限制
            const totalVideoCount
              = (videoFile ? 1 : 0) + fileList.filter(f => f.type.startsWith('video/')).length
            if (totalVideoCount > videoMax) {
              messageOpen(t('validation.videoMaxExceeded', { maxCount: videoMax }))
              return false
            }
          }
          if (uploadHasImage) {
            // 图片条数限制
            const totalImageCount
              = imageFileList.length + fileList.filter(f => f.type.startsWith('image/')).length
            if (totalImageCount > imageMax) {
              messageOpen(t('validation.imageMaxExceeded', { maxCount: imageMax }))
              return false
            }
          }
          return true
        },
        [imageFileList, videoMax, imageMax, videoFile, platConfig],
      )

      const desMax = useMemo(() => {
        return desMaxOverride ?? platConfig.commonPubParamsConfig?.desMax ?? 2200
      }, [platConfig, desMaxOverride])

      return (
        <>
          <VideoCoverSeting
            videoCoverSetingModal={videoCoverSetingModal}
            onClose={() => setVideoCoverSetingModal(false)}
            videoFile={videoFile}
            value={videoFile?.cover}
            onChoosed={(newCover) => {
              setVideoFile((prevState) => {
                const newState = { ...(prevState as IVideoFile) }
                newState.cover = newCover
                return newState
              })
            }}
          />

          {/* 图片预览 */}
          <MediaPreview
            open={imagePreviewOpen && !!(previewData && (previewData as IImgFile).imgUrl)}
            items={[
              {
                type: 'image',
                src: (previewData as IImgFile)?.imgUrl || '',
              },
            ]}
            onClose={() => {
              setImagePreviewOpen(false)
              setPreviewData(undefined)
            }}
          />

          {/* 视频预览 */}
          <MediaPreview
            open={!!(previewData && (previewData as IVideoFile)?.videoUrl)}
            items={[
              {
                type: 'video',
                src: (previewData as IVideoFile)?.videoUrl,
              },
            ]}
            onClose={() => setPreviewData(undefined)}
          />

          <BrushEditor
            open={editImgIndex !== -1}
            imageUrl={imageFileList[editImgIndex]?.imgUrl || ''}
            onClose={() => setEditImgIndex(-1)}
            onSave={async (newUrl, blob) => {
              const image = await formatImg({
                blob,
                path: imageFileList[editImgIndex]?.filename || `edited_${Date.now()}.png`,
              })
              image.ossUrl = newUrl
              setImageFileList((prevState) => {
                const newState = [...prevState]
                newState[editImgIndex] = image
                return newState
              })
            }}
          />

          <div className="border border-border rounded-md flex-1 text-left" style={style} data-testid="publish-content-editor">
            {/* 输入区域 */}
            <div className="p-4 relative" data-testid="publish-input-area">
              {beforeExtend}
              <PubParmasMentionInput
                value={value}
                onChange={value => setValue(value)}
                placeholder={t('form.descriptionPlaceholder')}
                maxLength={desMax}
                data-testid="publish-description-input"
              />

              {/* 上传列表 */}
              <ReactSortable
                className={cn('grid gap-2.5', isMobile ? 'grid-cols-3' : 'grid-cols-5')}
                list={imageFileList}
                animation={250}
                data-testid="publish-media-list"
                setList={(newList) => {
                  if (isFirst.current.sort) {
                    isFirst.current.sort = false
                    return
                  }
                  setImageFileList(newList)
                }}
                scrollSensitivity={100}
                scrollSpeed={15}
                id="id"
              >
                <TransitionGroup component={null}>
                  {/* 图像列表 */}
                  {imageFileList.map((v, i) => (
                    <CSSTransition key={v.id || v.imgUrl} timeout={300} classNames="upload-item">
                      <PubParmasTextuploadImage
                        onEditClick={() => {
                          setEditImgIndex(i)
                        }}
                        imageFile={v}
                        onClick={() => {
                          setPreviewData(v)
                          setImagePreviewOpen(true)
                        }}
                        onClose={() => {
                          const targetImage = imageFileList[i]
                          if (targetImage?.uploadTaskId) {
                            cancelUpload(targetImage.uploadTaskId)
                          }
                          setImageFileList((prevState) => {
                            const newState = [...prevState]
                            newState.splice(i, 1)
                            return newState
                          })
                        }}
                        onImageToImageClick={
                          onImageToImage
                            ? () => {
                                onImageToImage(v)
                              }
                            : undefined
                        }
                      />
                    </CSSTransition>
                  ))}

                  {/* 视频列表 */}
                  {(videoFile ? [videoFile] : []).map((v, i) => {
                    return (
                      <CSSTransition key={`video-${i}`} timeout={300} classNames="upload-item">
                        <div
                          className="h-[110px] border border-border rounded cursor-pointer relative overflow-hidden"
                          onClick={() => {
                            setPreviewData(videoFile)
                          }}
                        >
                          {/* 关闭按钮 */}
                          <div
                            className="absolute right-1 top-1 z-20 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/90 hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              const uploadIds = videoFile?.uploadTaskIds
                              if (uploadIds?.video) {
                                cancelUpload(uploadIds.video)
                              }
                              if (uploadIds?.cover) {
                                cancelUpload(uploadIds.cover)
                              }
                              setVideoFile(undefined)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </div>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full h-full relative">
                                  <img
                                    src={v.cover?.imgUrl}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* 播放按钮 */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white/60 rounded-full flex items-center justify-center text-white">
                                    <Play className="h-4 w-4 fill-current" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('actions.preview')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* 上传进度 - 放在最后确保在最上层 */}
                          {videoFile?.uploadTaskIds?.video && (
                            <PublishUploadProgress taskId={videoFile.uploadTaskIds.video} />
                          )}
                        </div>
                      </CSSTransition>
                    )
                  })}

                  {/* 上传按钮 */}
                  {canShowDragger && (
                    <CSSTransition
                      key="dragger"
                      timeout={300}
                      classNames="upload-item"
                      unmountOnExit
                    >
                      <PubParmasTextareaUpload
                        checkFileListType={checkFileListType}
                        uploadAccept={uploadAccept}
                        enableGlobalDrag={true}
                        onVideoUpdateFinish={(video) => {
                          setVideoFile((prevState) => {
                            if (prevState) {
                              const prevIds = prevState.uploadTaskIds ?? {}
                              const nextIds = video?.uploadTaskIds ?? {}

                              if (prevIds.video && prevIds.video !== nextIds.video) {
                                cancelUpload(prevIds.video)
                              }

                              if (prevIds.cover && prevIds.cover !== nextIds.cover) {
                                cancelUpload(prevIds.cover)
                              }
                            }

                            return video
                          })
                        }}
                        onImgUpdateFinish={(imgs) => {
                          setImageFileList((prevState) => {
                            const next = [...prevState]

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

              {/* 裁剪按钮 */}
              {videoFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2.5 cursor-pointer"
                  onClick={() => setVideoCoverSetingModal(true)}
                  data-testid="publish-crop-cover-button"
                >
                  {t('actions.cropCover')}
                </Button>
              )}
            </div>

            {centerExtend}

            {/* 底部操作栏 */}
            <div className="border-t border-border">
              <div className="p-2.5 px-4 relative flex items-center justify-between">
                <div className="flex items-center">
                  {/* 写作助手 - 移动端或指定隐藏 */}
                  {!isMobile && !hideWritingAssistant && (
                    <div className="px-1.5 border-l border-border first:border-l-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'cursor-pointer transition-all',
                          'hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10',
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenLeft(true)
                        }}
                        data-testid="publish-ai-assistant-button"
                      >
                        <Aibrush className="mr-1" />
                        {t('writingAssistant')}
                      </Button>
                    </div>
                  )}
                  {toolbarExtra}
                </div>
                <div className="border border-muted-foreground rounded-md px-1.5 text-sm" data-testid="publish-char-counter">
                  {desMax - value.length}
                </div>
              </div>

              {/* 扩展内容 */}
              {extend && <div className="border-t border-border p-4">{extend}</div>}
            </div>
          </div>
        </>
      )
    },
  ),
)

export default PubParmasTextarea
