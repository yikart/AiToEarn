import type { CSSProperties } from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'antd'
import { 
  CompressOutlined, 
  ExpandOutlined, 
  EditOutlined, 
  TranslationOutlined,
  TagsOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useTransClient } from '@/app/i18n/client'
import type { AIAction } from './PublishDialogAi'
import styles from './TextSelectionToolbar.module.scss'

export interface TextSelectionToolbarProps {
  // Container ref to limit selection range
  containerRef: React.RefObject<HTMLElement>
  // Callback after text selection
  onAction: (action: AIAction, selectedText: string) => void
}

const TextSelectionToolbar = memo(({ containerRef, onAction }: TextSelectionToolbarProps) => {
  const { t } = useTransClient('publish')
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
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
    if (containerRef.current && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = containerRef.current
      
      if (!container.contains(range.commonAncestorContainer)) {
        setVisible(false)
        return
      }

      // Get selection position
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Calculate toolbar position (relative to viewport)
      const top = rect.top - 50 // Show toolbar above selected text
      const left = rect.left + rect.width / 2 // Center align

      setPosition({ top, left })
      setSelectedText(text)
      setVisible(true)
    }
  }, [containerRef])

  const handleAction = useCallback((action: AIAction) => {
    if (selectedText) {
      onAction(action, selectedText)
      setVisible(false)
      // Clear selection
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, onAction])

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleSelection, 10)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current 
        && !toolbarRef.current.contains(e.target as Node)
        && visible
      ) {
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

  if (!visible) return null

  const toolbarStyle: CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    transform: 'translateX(-50%)',
    zIndex: 10000,
  }

  return (
    <div ref={toolbarRef} className={styles.textSelectionToolbar} style={toolbarStyle}>
      <Button.Group size="small">
        <Button
          icon={<CompressOutlined />}
          onClick={() => handleAction('shorten')}
          title={t('aiFeatures.shorten' as any)}
        >
          {t('aiFeatures.shorten' as any)}
        </Button>
        <Button
          icon={<ExpandOutlined />}
          onClick={() => handleAction('expand')}
          title={t('aiFeatures.expand' as any)}
        >
          {t('aiFeatures.expand' as any)}
        </Button>
        <Button
          icon={<EditOutlined />}
          onClick={() => handleAction('polish')}
          title={t('aiFeatures.polish' as any)}
        >
          {t('aiFeatures.polish' as any)}
        </Button>
        <Button
          icon={<TranslationOutlined />}
          onClick={() => handleAction('translate')}
          title={t('aiFeatures.translate' as any)}
        >
          {t('aiFeatures.translate' as any)}
        </Button>
        <Button
          icon={<TagsOutlined />}
          onClick={() => handleAction('generateHashtags')}
          title={t('aiFeatures.generateHashtags' as any)}
        >
          {t('aiFeatures.generateHashtags' as any)}
        </Button>
        <Button
          icon={<PictureOutlined />}
          onClick={() => handleAction('generateImage')}
          title={t('aiFeatures.generateImage' as any)}
        >
          {t('aiFeatures.generateImage' as any)}
        </Button>
        <Button
          icon={<VideoCameraOutlined />}
          onClick={() => handleAction('generateVideo')}
          title={t('aiFeatures.generateVideo' as any)}
        >
          {t('aiFeatures.generateVideo' as any)}
        </Button>
      </Button.Group>
    </div>
  )
})

export default TextSelectionToolbar

