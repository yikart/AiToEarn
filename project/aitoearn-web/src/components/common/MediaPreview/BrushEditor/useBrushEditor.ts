/**
 * useBrushEditor - 画笔编辑器核心逻辑 Hook
 * 处理画笔绑制、颜色、大小、撤销等功能
 */

import { useCallback, useRef, useState } from 'react'

import { getOssUrl } from '@/utils/oss'

/** 预设颜色 */
export const PRESET_COLORS = [
  '#EF4444', // 红色
  '#F97316', // 橙色
  '#EAB308', // 黄色
  '#22C55E', // 绿色
  '#3B82F6', // 蓝色
  '#000000', // 黑色
  '#FFFFFF', // 白色
] as const

/** 笔刷大小配置 */
export const BRUSH_SIZE = {
  min: 2,
  max: 20,
  default: 5,
} as const

/** 绘制工具类型 */
export type DrawToolType = 'brush' | 'rectangle' | 'ellipse' | 'crop'

/** 最大历史记录数 */
const MAX_HISTORY = 30

export interface UseBrushEditorOptions {
  /** 图片加载完成回调 */
  onImageLoad?: (width: number, height: number) => void
}

export function useBrushEditor(imageUrl: string, options?: UseBrushEditorOptions) {
  // Canvas refs
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)

  // 画笔状态
  const [brushColor, setBrushColor] = useState<string>(PRESET_COLORS[0])
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZE.default)
  const [toolType, setToolType] = useState<DrawToolType>('brush')

  // 绘制状态
  const [isDrawing, setIsDrawing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 历史记录（用于撤销）
  const historyRef = useRef<ImageData[]>([])
  const [canUndo, setCanUndo] = useState(false)

  // 图片原始尺寸
  const imageSizeRef = useRef({ width: 0, height: 0 })

  // 形状绘制起始点和预览状态
  const startPointRef = useRef<{ x: number, y: number } | null>(null)
  const previewImageDataRef = useRef<ImageData | null>(null)

  /** 保存当前状态到历史 */
  const saveToHistory = useCallback(() => {
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx)
      return

    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

    historyRef.current.push(imageData)

    // 限制历史记录数量
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    }

    setCanUndo(true)
  }, [])

  /** 加载图片到底层 Canvas */
  const loadImage = useCallback(() => {
    const imageCanvas = imageCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!imageCanvas || !drawCanvas)
      return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // 保存原始尺寸
      imageSizeRef.current = { width: img.width, height: img.height }

      // 设置 Canvas 尺寸
      imageCanvas.width = img.width
      imageCanvas.height = img.height
      drawCanvas.width = img.width
      drawCanvas.height = img.height

      // 绘制图片到底层 Canvas
      const ctx = imageCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
      }

      setImageLoaded(true)
      options?.onImageLoad?.(img.width, img.height)
    }

    img.onerror = () => {
      console.error('Failed to load image:', imageUrl)
    }

    // 使用代理路径避免跨域问题
    img.src = getOssUrl(imageUrl) || imageUrl
  }, [imageUrl, options])

  /** 获取指针位置（相对于 Canvas） */
  const getPointerPosition = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas)
      return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  /** 绘制形状（矩形或椭圆） */
  const drawShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      start: { x: number, y: number },
      end: { x: number, y: number },
      type: 'rectangle' | 'ellipse',
    ) => {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (type === 'rectangle') {
        const width = end.x - start.x
        const height = end.y - start.y
        ctx.strokeRect(start.x, start.y, width, height)
      }
      else {
        // 椭圆：以起点和终点为对角线的矩形内切椭圆
        const centerX = (start.x + end.x) / 2
        const centerY = (start.y + end.y) / 2
        const radiusX = Math.abs(end.x - start.x) / 2
        const radiusY = Math.abs(end.y - start.y) / 2

        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [brushColor, brushSize],
  )

  /** 裁剪后更新 Canvas */
  const updateCanvasAfterCrop = useCallback((cropRect: { x: number, y: number, width: number, height: number }) => {
    const imageCanvas = imageCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!imageCanvas || !drawCanvas)
      return

    const { x, y, width, height } = cropRect
    const w = Math.round(width)
    const h = Math.round(height)
    const sx = Math.round(x)
    const sy = Math.round(y)

    // 裁剪 imageCanvas
    const imgCtx = imageCanvas.getContext('2d')
    if (imgCtx) {
      const imgData = imgCtx.getImageData(sx, sy, w, h)
      imageCanvas.width = w
      imageCanvas.height = h
      imgCtx.putImageData(imgData, 0, 0)
    }

    // 裁剪 drawCanvas
    const drawCtx = drawCanvas.getContext('2d')
    if (drawCtx) {
      const drawData = drawCtx.getImageData(sx, sy, w, h)
      drawCanvas.width = w
      drawCanvas.height = h
      drawCtx.putImageData(drawData, 0, 0)
    }

    // 更新尺寸
    imageSizeRef.current = { width: w, height: h }

    // 清空历史（裁剪不可撤销）
    historyRef.current = []
    setCanUndo(false)
  }, [])

  /** 开始绘制 */
  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // 裁剪模式下禁用绘制
      if (toolType === 'crop')
        return

      const ctx = drawCanvasRef.current?.getContext('2d')
      if (!ctx)
        return

      // 保存当前状态到历史
      saveToHistory()

      setIsDrawing(true)
      const { x, y } = getPointerPosition(e)

      if (toolType === 'brush') {
        // 画笔：现有逻辑
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.strokeStyle = brushColor
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
      else {
        // 形状：保存起始点和当前 Canvas 状态（用于预览时恢复）
        startPointRef.current = { x, y }
        previewImageDataRef.current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      }
    },
    [toolType, brushColor, brushSize, getPointerPosition, saveToHistory],
  )

  /** 绘制中 */
  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || toolType === 'crop')
        return

      const ctx = drawCanvasRef.current?.getContext('2d')
      if (!ctx)
        return

      const { x, y } = getPointerPosition(e)

      if (toolType === 'brush') {
        // 画笔：现有逻辑
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      else if (startPointRef.current && previewImageDataRef.current) {
        // 形状：恢复状态 + 绘制预览
        ctx.putImageData(previewImageDataRef.current, 0, 0)
        drawShape(ctx, startPointRef.current, { x, y }, toolType)
      }
    },
    [isDrawing, toolType, getPointerPosition, drawShape],
  )

  /** 结束绘制 */
  const stopDrawing = useCallback(() => {
    if (!isDrawing)
      return

    // 清除临时状态
    startPointRef.current = null
    previewImageDataRef.current = null
    setIsDrawing(false)
  }, [isDrawing])

  /** 撤销 */
  const undo = useCallback(() => {
    if (historyRef.current.length === 0)
      return

    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx)
      return

    const prevState = historyRef.current.pop()
    if (prevState) {
      ctx.putImageData(prevState, 0, 0)
    }

    setCanUndo(historyRef.current.length > 0)
  }, [])

  /** 清除所有绘制 */
  const clearAll = useCallback(() => {
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx)
      return

    // 先保存当前状态
    saveToHistory()

    // 清除绘制层
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }, [saveToHistory])

  /** 合并两层 Canvas 并导出为 Blob */
  const exportImage = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const imageCanvas = imageCanvasRef.current
      const drawCanvas = drawCanvasRef.current
      if (!imageCanvas || !drawCanvas) {
        reject(new Error('Canvas not ready'))
        return
      }

      // 创建合成 Canvas
      const mergeCanvas = document.createElement('canvas')
      mergeCanvas.width = imageCanvas.width
      mergeCanvas.height = imageCanvas.height

      const ctx = mergeCanvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 先绘制原图
      ctx.drawImage(imageCanvas, 0, 0)
      // 再绘制标注层
      ctx.drawImage(drawCanvas, 0, 0)

      // 导出为 Blob
      mergeCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          }
          else {
            reject(new Error('Failed to export image'))
          }
        },
        'image/png',
        1,
      )
    })
  }, [])

  return {
    // Refs
    imageCanvasRef,
    drawCanvasRef,

    // 状态
    brushColor,
    brushSize,
    toolType,
    isDrawing,
    imageLoaded,
    canUndo,
    imageSize: imageSizeRef.current,

    // 设置方法
    setBrushColor,
    setBrushSize,
    setToolType,

    // 操作方法
    loadImage,
    undo,
    clearAll,
    exportImage,
    updateCanvasAfterCrop,

    // 绑制事件处理
    drawHandlers: {
      onPointerDown: startDrawing,
      onPointerMove: draw,
      onPointerUp: stopDrawing,
      onPointerLeave: stopDrawing,
    },
  }
}

export type UseBrushEditorReturn = ReturnType<typeof useBrushEditor>
