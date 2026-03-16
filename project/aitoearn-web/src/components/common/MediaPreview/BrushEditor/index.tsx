/**
 * BrushEditor - 画笔编辑器主组件
 * 提供图片画笔标注功能，支持颜色、大小、撤销、保存等操作
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'
import { BrushCanvas } from './BrushCanvas'
import { BrushToolbar } from './BrushToolbar'
import { useBrushEditor } from './useBrushEditor'
import { useCropEditor } from './useCropEditor'

export interface BrushEditorProps {
  /** 是否打开 */
  open: boolean
  /** 图片 URL */
  imageUrl: string
  /** 关闭编辑器 */
  onClose: () => void
  /** 保存完成回调，返回新的图片 URL 和 Blob */
  onSave: (newUrl: string, blob: Blob) => void
}

/** 内部组件：编辑器内容 */
const BrushEditorContent = memo(({ imageUrl, onClose, onSave }: Omit<BrushEditorProps, 'open'>) => {
  const { t } = useTransClient('common')
  const [isSaving, setIsSaving] = useState(false)

  const editor = useBrushEditor(imageUrl)

  const {
    toolType,
    setToolType,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    canUndo,
    undo,
    clearAll,
    exportImage,
    updateCanvasAfterCrop,
    imageSize,
  } = editor

  const cropEditor = useCropEditor({
    getCanvasSize: () => imageSize,
    onCropConfirm: updateCanvasAfterCrop,
  })

  /** 切换工具类型，裁剪工具需要启动裁剪模式 */
  const handleSetToolType = useCallback((type: typeof toolType) => {
    if (cropEditor.isCropping)
      return

    setToolType(type)
    if (type === 'crop') {
      cropEditor.startCrop()
    }
  }, [setToolType, cropEditor])

  /** 保存图片 */
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)

      // 导出合成后的图片
      const blob = await exportImage()

      // 创建 File 对象用于上传
      const file = new File([blob], `edited_${Date.now()}.png`, {
        type: 'image/png',
      })

      // 上传到 OSS
      const ossUrl = await uploadToOss(file)

      // 获取完整 URL
      const fullUrl = getOssUrl(ossUrl as string)

      toast.success({ content: t('brushEditor.saveSuccess') })
      onSave(fullUrl, blob)
      onClose()
    }
    catch (error) {
      console.error('Failed to save edited image:', error)
      toast.error({ content: t('brushEditor.saveFailed') })
    }
    finally {
      setIsSaving(false)
    }
  }, [exportImage, onSave, onClose, t])

  /** 键盘快捷键：Ctrl+Z / Cmd+Z 撤销 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z (Windows/Linux) 或 Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  /** 阻止背景点击关闭 */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose()
    }
  }

  // SSR 检查
  if (typeof window === 'undefined')
    return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={handleBackdropClick}
    >
      {/* 顶部栏 */}
      <div
        className="absolute top-0 left-0 right-0 h-10 sm:h-14 flex items-center justify-between px-3 sm:px-4 z-10"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <h2 className="text-white font-medium text-sm sm:text-base">{t('brushEditor.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          aria-label={t('brushEditor.cancel')}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Canvas 区域 */}
      <div className="flex-1 flex items-center justify-center w-full pt-10 pb-24 px-2 sm:pt-14 sm:pb-32 sm:px-4 overflow-hidden">
        <BrushCanvas
          editor={editor}
          cropEditor={cropEditor}
          maxWidth={Math.min(window.innerWidth - 16, 900)}
          maxHeight={Math.min(window.innerHeight - 160, 600)}
        />
      </div>

      {/* 工具栏 */}
      <div className="absolute bottom-10 sm:bottom-16 left-2 right-2 sm:left-4 sm:right-4 flex justify-center">
        <BrushToolbar
          toolType={toolType}
          setToolType={handleSetToolType}
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          canUndo={canUndo}
          onUndo={undo}
          onClearAll={clearAll}
          cropEditor={cropEditor}
        />
      </div>

      {/* 底部按钮 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 sm:h-14 flex items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 z-10"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
          className="min-w-[80px] sm:min-w-[100px] h-8 sm:h-9 text-sm cursor-pointer"
        >
          {t('brushEditor.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[80px] sm:min-w-[100px] h-8 sm:h-9 text-sm cursor-pointer">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('brushEditor.saving')}
            </>
          ) : (
            t('brushEditor.save')
          )}
        </Button>
      </div>
    </motion.div>,
    document.body,
  )
})

/**
 * BrushEditor - 画笔编辑器组件
 * 使用两层组件结构避免 i18n namespace 动态加载导致的闪烁
 */
export function BrushEditor({ open, ...props }: BrushEditorProps) {
  // 只在打开时渲染内部组件
  if (!open)
    return null

  return (
    <AnimatePresence>
      <BrushEditorContent {...props} />
    </AnimatePresence>
  )
}

export default BrushEditor
