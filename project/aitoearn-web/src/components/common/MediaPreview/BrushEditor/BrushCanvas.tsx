/**
 * BrushCanvas - 画笔画布组件
 * 双 Canvas 架构：底层显示原图，顶层用于绘制
 */

'use client'

import type { UseBrushEditorReturn } from './useBrushEditor'
import type { UseCropEditorReturn } from './useCropEditor'
import { Loader2 } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CropOverlay } from './CropOverlay'

export interface BrushCanvasProps {
  /** useBrushEditor 返回的状态和方法 */
  editor: UseBrushEditorReturn
  /** 裁剪编辑器 */
  cropEditor?: UseCropEditorReturn
  /** 容器最大宽度 */
  maxWidth?: number
  /** 容器最大高度 */
  maxHeight?: number
  /** 自定义类名 */
  className?: string
}

export const BrushCanvas = memo(
  ({ editor, cropEditor, maxWidth = 800, maxHeight = 600, className }: BrushCanvasProps) => {
    const { imageCanvasRef, drawCanvasRef, imageLoaded, loadImage, drawHandlers, imageSize }
      = editor

    // 计算显示尺寸（保持宽高比）
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

    useEffect(() => {
      loadImage()
    }, [loadImage])

    useEffect(() => {
      if (imageLoaded && imageSize.width > 0 && imageSize.height > 0) {
        const aspectRatio = imageSize.width / imageSize.height

        let width = imageSize.width
        let height = imageSize.height

        // 按最大宽度缩放
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }

        // 按最大高度缩放
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }

        setDisplaySize({ width, height })
      }
    }, [imageLoaded, imageSize, maxWidth, maxHeight])

    const isCropping = cropEditor?.isCropping

    return (
      <div
        className={cn(
          'relative flex items-center justify-center bg-black/20 rounded-lg overflow-hidden',
          className,
        )}
        style={{
          minHeight: 200,
          width: displaySize.width || '100%',
          height: displaySize.height || 'auto',
        }}
      >
        {/* 加载中 */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
          </div>
        )}

        {/* 底层 Canvas：显示原图 */}
        <canvas
          ref={imageCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: imageLoaded ? 1 : 0,
            pointerEvents: 'none',
          }}
        />

        {/* 顶层 Canvas：绘制层 */}
        <canvas
          ref={drawCanvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{
            opacity: imageLoaded ? 1 : 0,
            touchAction: 'none',
            pointerEvents: isCropping ? 'none' : 'auto',
          }}
          {...drawHandlers}
        />

        {/* 裁剪覆盖层 */}
        {isCropping && cropEditor && displaySize.width > 0 && (
          <CropOverlay
            cropRect={cropEditor.cropRect}
            onCropRectChange={cropEditor.setCropRect}
            canvasSize={imageSize}
            displaySize={displaySize}
            aspectRatio={cropEditor.aspectRatio}
          />
        )}
      </div>
    )
  },
)

export default BrushCanvas
