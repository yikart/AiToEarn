/**
 * TextSelectionToolbar - 划词工具栏
 * 在用户选中文本时显示AI操作工具栏
 */
import type { CSSProperties } from 'react'
import type { AIAction } from './PublishDialogAi'
import { Hash, Image, Languages, Maximize2, Minimize2, Pencil, Video } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'

export interface TextSelectionToolbarProps {
  // Callback after text selection
  onAction: (action: AIAction, selectedText: string) => void
}

const TextSelectionToolbar = memo(({ onAction }: TextSelectionToolbarProps) => {
  const { t } = useTransClient('publish')
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState('')
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleSelection = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (!text || text.length === 0) {
      setVisible(false)
      return
    }

    // Check if selected text is within specified container
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const ancestor = range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
      if (!ancestor?.closest('[data-desc-editor]')) {
        setVisible(false)
        return
      }

      // Get selection position
      const rect = range.getBoundingClientRect()

      // Calculate toolbar position (relative to viewport)
      const top = rect.top - 50 // Show toolbar above selected text
      const left = rect.left + rect.width / 2 // Center align

      setPosition({ top, left })
      setSelectedText(text)
      setVisible(true)
    }
  }, [])

  const handleAction = useCallback(
    (action: AIAction) => {
      if (selectedText) {
        onAction(action, selectedText)
        setVisible(false)
        // Clear selection
        window.getSelection()?.removeAllRanges()
      }
    },
    [selectedText, onAction],
  )

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleSelection, 10)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node) && visible) {
        setVisible(false)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleSelection, visible])

  if (!visible)
    return null

  const toolbarStyle: CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    transform: 'translateX(-50%)',
    zIndex: 10000,
  }

  return (
    <div
      ref={toolbarRef}
      className="bg-background rounded-lg shadow-lg p-1 animate-in fade-in-0 slide-in-from-top-1 duration-200 border"
      style={toolbarStyle}
    >
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('shorten')
          }}
          title={t('aiFeatures.shorten' as any)}
        >
          <Minimize2 className="h-3.5 w-3.5" />
          {t('aiFeatures.shorten' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('expand')
          }}
          title={t('aiFeatures.expand' as any)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          {t('aiFeatures.expand' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('polish')
          }}
          title={t('aiFeatures.polish' as any)}
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('aiFeatures.polish' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('translate')
          }}
          title={t('aiFeatures.translate' as any)}
        >
          <Languages className="h-3.5 w-3.5" />
          {t('aiFeatures.translate' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('generateHashtags')
          }}
          title={t('aiFeatures.generateHashtags' as any)}
        >
          <Hash className="h-3.5 w-3.5" />
          {t('aiFeatures.generateHashtags' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('generateImage')
          }}
          title={t('aiFeatures.generateImage' as any)}
        >
          <Image className="h-3.5 w-3.5" />
          {t('aiFeatures.generateImage' as any)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleAction('generateVideo')
          }}
          title={t('aiFeatures.generateVideo' as any)}
        >
          <Video className="h-3.5 w-3.5" />
          {t('aiFeatures.generateVideo' as any)}
        </Button>
      </div>
    </div>
  )
})

export default TextSelectionToolbar
