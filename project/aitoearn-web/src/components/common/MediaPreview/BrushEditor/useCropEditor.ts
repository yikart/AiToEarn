/**
 * useCropEditor - 裁剪编辑器核心逻辑 Hook
 * 处理裁剪框状态、比例锁定、确认/取消裁剪等功能
 */

import { useCallback, useRef, useState } from 'react'

/** 裁剪比例预设 */
export const CROP_RATIOS = [
  { label: 'free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '1.91:1', value: 1.91 },
  { label: '4:5', value: 0.8 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
] as const

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface UseCropEditorOptions {
  /** 获取当前 canvas 像素尺寸 */
  getCanvasSize: () => { width: number, height: number }
  /** 裁剪确认回调 */
  onCropConfirm: (cropRect: CropRect) => void
}

export function useCropEditor({ getCanvasSize, onCropConfirm }: UseCropEditorOptions) {
  const [isCropping, setIsCropping] = useState(false)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 })
  const [aspectRatio, setAspectRatio] = useState(0) // 0 = free
  const aspectRatioRef = useRef(0)

  /** 开始裁剪 */
  const startCrop = useCallback(() => {
    const { width, height } = getCanvasSize()
    if (width <= 0 || height <= 0)
      return

    // 初始裁剪框为图片 80% 居中
    const margin = 0.1
    let cw = width * (1 - margin * 2)
    let ch = height * (1 - margin * 2)

    if (aspectRatioRef.current > 0) {
      const ratio = aspectRatioRef.current
      if (cw / ch > ratio) {
        cw = ch * ratio
      }
      else {
        ch = cw / ratio
      }
    }

    setCropRect({
      x: (width - cw) / 2,
      y: (height - ch) / 2,
      width: cw,
      height: ch,
    })
    setIsCropping(true)
  }, [getCanvasSize])

  /** 确认裁剪 */
  const confirmCrop = useCallback(() => {
    if (!isCropping)
      return

    // 确保裁剪区域有效
    if (cropRect.width < 10 || cropRect.height < 10)
      return

    onCropConfirm(cropRect)
    setIsCropping(false)
  }, [isCropping, cropRect, onCropConfirm])

  /** 取消裁剪 */
  const cancelCrop = useCallback(() => {
    setIsCropping(false)
  }, [])

  /** 设置比例并调整裁剪框 */
  const changeAspectRatio = useCallback((ratio: number) => {
    setAspectRatio(ratio)
    aspectRatioRef.current = ratio

    if (!isCropping)
      return

    const { width: canvasW, height: canvasH } = getCanvasSize()
    if (canvasW <= 0 || canvasH <= 0)
      return

    setCropRect((prev) => {
      if (ratio === 0)
        return prev

      // 以当前裁剪框中心为基点，按新比例调整
      const cx = prev.x + prev.width / 2
      const cy = prev.y + prev.height / 2

      let newW = prev.width
      let newH = newW / ratio

      if (newH > canvasH) {
        newH = canvasH
        newW = newH * ratio
      }
      if (newW > canvasW) {
        newW = canvasW
        newH = newW / ratio
      }

      let newX = cx - newW / 2
      let newY = cy - newH / 2

      // 边界约束
      newX = Math.max(0, Math.min(newX, canvasW - newW))
      newY = Math.max(0, Math.min(newY, canvasH - newH))

      return { x: newX, y: newY, width: newW, height: newH }
    })
  }, [isCropping, getCanvasSize])

  return {
    isCropping,
    cropRect,
    setCropRect,
    aspectRatio,
    startCrop,
    confirmCrop,
    cancelCrop,
    changeAspectRatio,
  }
}

export type UseCropEditorReturn = ReturnType<typeof useCropEditor>
