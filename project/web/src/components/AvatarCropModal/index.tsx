/**
 * AvatarCropModal - 头像裁剪弹窗组件
 * 基于 react-easy-crop 实现圆形头像裁剪功能
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import styles from './avatarCropModal.module.scss'

export interface AvatarCropModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭弹窗回调 */
  onClose: () => void
  /** 图片文件 */
  imageFile: File | null
  /** 裁剪完成回调，返回裁剪后的 Blob */
  onCropComplete: (blob: Blob) => void
  /** 是否正在上传 */
  isUploading?: boolean
}

/**
 * 根据裁剪区域从图片中提取裁剪后的图像（支持旋转）
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // 计算旋转后的边界框
  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBoundingBox(
    image.width,
    image.height,
    rotation,
  )

  // 设置 canvas 大小以容纳旋转后的图像
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // 将旋转中心移动到 canvas 中心
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // 绘制旋转后的图像
  ctx.drawImage(image, 0, 0)

  // 从旋转后的 canvas 中提取裁剪区域
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    throw new Error('No 2d context')
  }

  // 设置输出尺寸为 400x400
  const outputSize = 400
  croppedCanvas.width = outputSize
  croppedCanvas.height = outputSize

  // 绘制裁剪后的图像
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas is empty'))
        }
      },
      'image/png',
      1,
    )
  })
}

/**
 * 计算旋转后的边界框尺寸
 */
function getRotatedBoundingBox(
  width: number,
  height: number,
  rotation: number,
): { width: number, height: number } {
  const rotRad = (rotation * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * 创建 Image 对象
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

/**
 * AvatarCropModal 头像裁剪弹窗组件
 */
export const AvatarCropModal = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  isUploading = false,
}: AvatarCropModalProps) => {
  const { t } = useTransClient('settings')

  // 图片 URL
  const [imageUrl, setImageUrl] = useState<string>('')
  // 图片加载状态
  const [isImageLoading, setIsImageLoading] = useState(false)
  // 裁剪区域状态
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  // 确认处理状态
  const [isProcessing, setIsProcessing] = useState(false)

  // 当图片文件变化时，创建预览 URL
  useEffect(() => {
    if (imageFile) {
      setIsImageLoading(true)
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      // 重置裁剪状态
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setImageUrl('')
      setIsImageLoading(false)
    }
  }, [imageFile])

  // 裁剪完成回调
  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // 图片加载完成
  const handleMediaLoaded = useCallback(() => {
    setIsImageLoading(false)
  }, [])

  // 旋转图片
  const handleRotate = (degree: number) => {
    setRotation((prev) => (prev + degree) % 360)
  }

  // 缩放图片
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)))
  }

  // 确认裁剪
  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageUrl) return

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation)
      onCropComplete(croppedBlob)
    } catch (error) {
      console.error('裁剪失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 是否禁用操作
  const isDisabled = isUploading || isProcessing

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        {/* 无障碍标题 */}
        <DialogTitle className="sr-only">{t('profile.cropAvatar')}</DialogTitle>

        {/* 顶部标题栏 */}
        <div className="flex items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">{t('profile.cropAvatar')}</h2>
        </div>

        {/* 裁剪区域 */}
        <div className={cn(styles.cropContainer, 'relative bg-gray-900')}>
          {/* 图片加载中状态 */}
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-white/60" />
                <span className="text-sm text-white/60">{t('profile.imageLoading')}</span>
              </div>
            </div>
          )}

          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteCallback}
              onMediaLoaded={handleMediaLoaded}
              classes={{
                containerClassName: styles.cropperContainer,
                mediaClassName: styles.cropperMedia,
              }}
            />
          )}
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRotate(-90)}
            disabled={isDisabled || isImageLoading}
            className="h-9 w-9 p-0"
            title={t('profile.rotateLeft')}
          >
            <RotateCcw size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRotate(90)}
            disabled={isDisabled || isImageLoading}
            className="h-9 w-9 p-0"
            title={t('profile.rotateRight')}
          >
            <RotateCw size={18} />
          </Button>
          <div className="w-px h-5 bg-gray-200 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(-0.2)}
            disabled={isDisabled || isImageLoading || zoom <= 1}
            className="h-9 w-9 p-0"
            title={t('profile.zoomOut')}
          >
            <ZoomOut size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(0.2)}
            disabled={isDisabled || isImageLoading || zoom >= 3}
            className="h-9 w-9 p-0"
            title={t('profile.zoomIn')}
          >
            <ZoomIn size={18} />
          </Button>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isDisabled}>
            {t('profile.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isDisabled || isImageLoading}>
            {isDisabled ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {isProcessing ? t('profile.processing') : t('profile.uploading')}
              </>
            ) : (
              t('profile.confirm')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AvatarCropModal
