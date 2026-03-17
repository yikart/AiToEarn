/**
 * VideoCoverSeting - 视频封面设置组件
 * 支持视频截帧、图片选择、比例裁剪等功能
 */

import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import Cropper from 'cropperjs'
import { Loader2, Upload } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import ImgChoose from '@/components/PublishDialog/compoents/Choose/ImgChoose'
import { formatImg, VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import 'cropperjs/dist/cropper.css'

/** 比例预设配置 */
const ASPECT_RATIOS = [
  { label: 'free', value: undefined },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
] as const

/** 格式化时间为 MM:SS 格式 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export interface IVideoCoverSetingProps {
  /** 封面选择完成回调 */
  onChoosed: (imgFile: IImgFile) => void
  /** 当前选择的封面 */
  value?: IImgFile
  /** 需要截帧的视频 */
  videoFile?: IVideoFile
  /** 保存图片的唯一值 */
  saveImgId?: string
  /** 关闭弹框回调 */
  onClose: () => void
  /** 弹框显示状态 */
  videoCoverSetingModal: boolean
}

/**
 * 视频封面设置组件
 * 提供视频截帧、本地图片上传和裁剪功能
 */
const VideoCoverSeting = memo(
  ({
    videoCoverSetingModal,
    onChoosed,
    value,
    videoFile,
    saveImgId = '',
    onClose,
  }: IVideoCoverSetingProps) => {
    const { t } = useTransClient('publish')
    const [imgFile, setImgFile] = useState<IImgFile>()
    const cropper = useRef<Cropper>()
    const cropperImg = useRef<HTMLImageElement>(null)
    const [videoCoverLoading, setVideoCoverLoading] = useState(false)
    const [sliderVal, setSliderVal] = useState(0)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)

    // 初始化：弹框打开时加载封面
    useEffect(() => {
      if (!videoCoverSetingModal)
        return
      if (value) {
        setImgFile(value)
        return
      }
      getVideoCover(0)
    }, [videoCoverSetingModal])

    // 图片变化时重新初始化裁剪器
    useEffect(() => {
      if (!imgFile)
        return
      initCropper()
    }, [imgFile, aspectRatio])

    /** 获取视频截帧封面 */
    const getVideoCover = useCallback(
      async (n: number) => {
        if (!videoFile?.videoUrl)
          return
        setVideoCoverLoading(true)
        try {
          const videoInfo = await VideoGrabFrame(videoFile.videoUrl, n)
          setImgFile(videoInfo.cover)
        }
        catch (error) {
          console.error('获取视频封面失败:', error)
          toast.error(t('videoCover.grabFrameFailed'))
        }
        finally {
          setVideoCoverLoading(false)
        }
      },
      [videoFile?.videoUrl, t],
    )

    /** 关闭弹框 */
    const handleClose = useCallback(() => {
      onClose()
    }, [onClose])

    /** 初始化裁剪工具 */
    const initCropper = useCallback(() => {
      if (!cropperImg.current)
        return

      // 销毁旧的裁剪器实例
      if (cropper.current) {
        cropper.current.destroy()
        cropper.current = undefined
      }

      cropper.current = new Cropper(cropperImg.current, {
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        aspectRatio,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
      })
    }, [aspectRatio])

    /** 切换裁剪比例 */
    const handleAspectRatioChange = useCallback((ratio: number | undefined) => {
      setAspectRatio(ratio)
      // 如果裁剪器已存在，直接更新比例
      if (cropper.current) {
        cropper.current.setAspectRatio(ratio ?? Number.NaN)
      }
    }, [])

    /** 确认选择封面 */
    const handleConfirm = useCallback(async () => {
      if (!cropper.current || !imgFile)
        return

      setUploadLoading(true)
      try {
        const canvas = cropper.current.getCroppedCanvas()
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png')
        })

        if (!blob) {
          throw new Error('Failed to create blob')
        }

        const cover = await formatImg({
          blob,
          path: `${saveImgId}.${imgFile.file.type.split('/')[1] || 'png'}`,
        })

        // 上传封面到 OSS
        const uploadCoverRes = await uploadToOss(cover.file)
        cover.ossUrl = getOssUrl(uploadCoverRes)

        onChoosed(cover)
        handleClose()
      }
      catch (error) {
        console.error('上传封面失败:', error)
        toast.error(t('videoCover.uploadFailed'))
      }
      finally {
        setUploadLoading(false)
      }
    }, [imgFile, saveImgId, onChoosed, handleClose, t])

    /** 处理本地图片选择 */
    const handleImageChoose = useCallback((selectedImgFile: IImgFile | undefined) => {
      if (!selectedImgFile)
        return
      setImgFile(selectedImgFile)
    }, [])

    /** 处理滑块值变化 */
    const handleSliderChange = useCallback((values: number[]) => {
      setSliderVal(values[0])
    }, [])

    /** 处理滑块值提交（截帧） */
    const handleSliderCommit = useCallback(
      (values: number[]) => {
        getVideoCover(values[0])
      },
      [getVideoCover],
    )

    return (
      <Modal
        width={700}
        title={t('videoCover.title')}
        maskClosable={false}
        open={videoCoverSetingModal}
        onCancel={handleClose}
        footer={(
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="cursor-pointer"
              disabled={uploadLoading}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              disabled={uploadLoading || !imgFile}
              onClick={handleConfirm}
              className="cursor-pointer"
            >
              {uploadLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {t('buttons.confirm')}
            </Button>
          </>
        )}
      >
        <div className="flex flex-col gap-4">
          {/* 裁剪区域 - 深色背景容器 */}
          <div className="relative rounded-lg overflow-hidden bg-neutral-900 dark:bg-neutral-950">
            {/* 加载遮罩 */}
            {videoCoverLoading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="text-sm text-white/80">{t('videoCover.loading')}</span>
              </div>
            )}

            {/* 裁剪器容器 */}
            <div className="h-[240px] sm:h-[340px] flex items-center justify-center p-2 sm:p-4">
              <img
                ref={cropperImg}
                src={imgFile?.imgUrl || '/'}
                alt={t('videoCover.coverPreview')}
                className={cn('max-h-full max-w-full', !imgFile?.imgUrl && 'opacity-0')}
              />
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-1">
            {/* 比例切换按钮组 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">
                {t('videoCover.aspectRatio')}
              </span>
              <div className="flex items-center gap-1 bg-muted rounded-md p-1 overflow-x-auto">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.label}
                    type="button"
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className={cn(
                      'px-2.5 sm:px-3 py-1 text-sm rounded transition-colors cursor-pointer whitespace-nowrap',
                      aspectRatio === ratio.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {ratio.label === 'free' ? t('videoCover.free') : ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 分隔符 - 仅桌面端显示 */}
            <div className="hidden sm:block w-px h-6 bg-border" />

            {/* 本地上传按钮 */}
            <ImgChoose onChoose={handleImageChoose}>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer shrink-0 gap-1.5 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {t('videoCover.localUpload')}
              </Button>
            </ImgChoose>
          </div>

          {/* 时间轴 */}
          <div className="flex flex-col gap-3 px-1">
            {/* 标签和时间显示 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('videoCover.selectFrame')}</span>
              <span className="text-sm font-mono text-muted-foreground">
                {formatTime(sliderVal)}
                {' '}
                /
                {formatTime(videoFile?.duration || 0)}
              </span>
            </div>

            {/* 滑块 */}
            <Slider
              value={[sliderVal]}
              step={1}
              min={0}
              max={videoFile?.duration || 100}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
            />
          </div>
        </div>
      </Modal>
    )
  },
)
VideoCoverSeting.displayName = 'VideoCoverSeting'

export default VideoCoverSeting
