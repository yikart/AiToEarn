'use client'

import { useState, useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from '../styles/promptGallery.module.scss'
import promptsData from './prompt.json'

interface PromptItem {
  title: string
  preview: string
  prompt: string
  author: string
  link?: string
  mode: 'edit' | 'generate'
  category: string
  sub_category?: string
}

interface PromptGallerySectionProps {
  onApplyPrompt?: (prompt: string, imageUrl?: string) => void
}

// 使用导入的提示词数据
const SAMPLE_PROMPTS: PromptItem[] = promptsData as PromptItem[]

export default function PromptGallerySection({ onApplyPrompt }: PromptGallerySectionProps) {
  const { t } = useTransClient('promptGallery')
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null)
  const [applied, setApplied] = useState(false)
  const [itemsToShow, setItemsToShow] = useState(8) // 默认显示8个（假设每行4个，显示2行）
  const gridRef = useRef<HTMLDivElement>(null)

  // 根据屏幕宽度计算每行显示的卡片数量，然后显示2行
  useEffect(() => {
    const calculateItemsToShow = () => {
      if (!gridRef.current) return
      
      const gridWidth = gridRef.current.offsetWidth
      const cardMinWidth = 280 // 卡片最小宽度（参考 CSS）
      const gap = 24 // 网格间距
      
      // 计算每行可以放几个卡片
      const itemsPerRow = Math.floor((gridWidth + gap) / (cardMinWidth + gap))
      
      // 显示2行
      const newItemsToShow = itemsPerRow * 2
      setItemsToShow(Math.max(newItemsToShow, 4)) // 至少显示4个
    }

    calculateItemsToShow()
    window.addEventListener('resize', calculateItemsToShow)
    
    return () => window.removeEventListener('resize', calculateItemsToShow)
  }, [])

  // 根据展开状态决定显示的提示词
  const displayedPrompts = isExpanded ? SAMPLE_PROMPTS : SAMPLE_PROMPTS.slice(0, itemsToShow)

  const handleApplyPrompt = (item: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApplyPrompt) {
      onApplyPrompt(item.prompt, item.preview)
      setApplied(true)
      setTimeout(() => setApplied(false), 2000)
      
      // 滚动到页面顶部输入框
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <section className={styles.promptGallery}>
      <div className={styles.container}>
        {/* 标题区域 */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <div className={styles.badgeIcon}></div>
            <span>{t('badge')}</span>
          </div>
          <h2 className={styles.title}>
            {t('title')}
            <span className={styles.titleHighlight}>{t('titleHighlight')}</span>
          </h2>
          <p className={styles.subtitle}>
            {t('subtitle')}
          </p>
        </div>

        {/* 提示词网格 */}
        <div className={styles.grid} ref={gridRef}>
          {displayedPrompts.map((item, index) => (
            <div 
              key={index} 
              className={styles.card}
              onClick={() => setSelectedPrompt(item)}
            >
              <div className={styles.cardImage}>
                <img src={item.preview} alt={item.title} loading="lazy" />
                <div className={styles.cardOverlay}>
                  <button 
                    className={styles.actionBtn}
                    onClick={(e) => handleApplyPrompt(item, e)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    {t('applyButton')}
                  </button>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardMeta}>
                  <div className={styles.badges}>
                    {item.sub_category && (
                      <span className={styles.badge}>{item.sub_category}</span>
                    )}
                    <span className={`${styles.badge} ${item.mode === 'edit' ? styles.badgeEdit : styles.badgeGenerate}`}>
                      {t(`badges.${item.mode === 'edit' ? 'edit' : 'generate'}` as any)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 展开/收起按钮 */}
        {SAMPLE_PROMPTS.length > itemsToShow && (
          <div className={styles.expandSection}>
            <button 
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  {t('collapseButton')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </>
              ) : (
                <>
                  {t('expandButton')} ({SAMPLE_PROMPTS.length - itemsToShow} {t('expandCount')})
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* 应用成功提示 */}
        {applied && (
          <div className={styles.toast}>
            {t('appliedToast')}
          </div>
        )}

        {/* 提示词详情弹窗 */}
        {selectedPrompt && (
          <div className={styles.modal} onClick={() => setSelectedPrompt(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.modalClose}
                onClick={() => setSelectedPrompt(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <img src={selectedPrompt.preview} alt={selectedPrompt.title} className={styles.modalImage} />
              <h3 className={styles.modalTitle}>{selectedPrompt.title}</h3>
              <div className={styles.modalMeta}>
                {selectedPrompt.sub_category && (
                  <span className={styles.modalBadge}>{selectedPrompt.sub_category}</span>
                )}
                <span className={styles.modalBadge}>{selectedPrompt.category}</span>
              </div>
              <div className={styles.modalPrompt}>
                <label>{t('modal.promptLabel')}</label>
                <p>{selectedPrompt.prompt}</p>
              </div>
              <button 
                className={styles.modalCopyBtn}
                onClick={() => {
                  if (onApplyPrompt) {
                    onApplyPrompt(selectedPrompt.prompt, selectedPrompt.preview)
                    setSelectedPrompt(null)
                    setApplied(true)
                    setTimeout(() => setApplied(false), 2000)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                {t('modal.applyButton')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

