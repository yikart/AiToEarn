/**
 * PromptGallery - 提示词画廊组件
 * 功能描述：展示提示词列表，支持筛选、搜索、应用提示词到 AI 生成器
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from './PromptGallery.module.scss'
import promptsData from './prompt.json'

/**
 * 懒加载图片组件
 */
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || imageSrc) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.01
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [src, imageSrc])

  return (
    <div 
      ref={containerRef}
      className={className} 
      style={{ 
        position: 'relative', 
        width: '100%'
      }}
    >
      {!isLoaded && !isError && imageSrc === null && (
        <div className={styles.imageLoading}>
          <div className={styles.imageSpinner} />
        </div>
      )}
      {imageSrc && (
        <>
          <img
            src={imageSrc}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsError(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              position: isLoaded ? 'relative' : 'absolute',
              top: isLoaded ? 'auto' : 0,
              left: isLoaded ? 'auto' : 0
            }}
            loading="lazy"
          />
          {!isLoaded && !isError && (
            <div className={styles.imageLoading}>
              <div className={styles.imageSpinner} />
            </div>
          )}
        </>
      )}
      {isError && (
        <div className={styles.imageError}>
          图片加载失败
        </div>
      )}
    </div>
  )
}

/** 提示词项接口定义 */
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

/** 组件属性接口定义 */
export interface IPromptGalleryProps {
  /** 应用提示词的回调函数 */
  onApplyPrompt?: (data: { prompt: string; image?: string; mode: 'edit' | 'generate' }) => void
}

// 使用导入的提示词数据
const SAMPLE_PROMPTS: PromptItem[] = promptsData as PromptItem[]

/**
 * PromptGallery - 提示词画廊组件
 */
export default function PromptGallery({ onApplyPrompt }: IPromptGalleryProps) {
  const { t } = useTransClient('promptGallery')
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null)
  const [applied, setApplied] = useState(false)
  const [itemsToShow, setItemsToShow] = useState(8) // 默认显示8个（假设每行4个，显示2行）
  const [selectedMode, setSelectedMode] = useState<'all' | 'generate' | 'edit'>('all')
  const [titleFilter, setTitleFilter] = useState('')
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // 根据屏幕宽度计算每列显示的卡片数量，然后显示5行
  useEffect(() => {
    const calculateItemsToShow = () => {
      if (!gridRef.current) return
      
      const gridWidth = gridRef.current.offsetWidth
      const cardMinWidth = 380 // 卡片最小宽度（参考 CSS）
      const gap = 16 // 网格间距
      
      // 计算可以放几列
      const columns = Math.floor((gridWidth + gap) / (cardMinWidth + gap))
      
      // 显示5行
      const newItemsToShow = columns * 5
      setItemsToShow(Math.max(newItemsToShow, 5)) // 至少显示5个
    }

    calculateItemsToShow()
    window.addEventListener('resize', calculateItemsToShow)
    
    return () => window.removeEventListener('resize', calculateItemsToShow)
  }, [])

  // 根据筛选条件过滤提示词
  const filteredPrompts = SAMPLE_PROMPTS.filter((item) => {
    // 模式筛选
    if (selectedMode !== 'all' && item.mode !== selectedMode) {
      return false
    }
    // 标题筛选
    if (titleFilter.trim() && !item.title.toLowerCase().includes(titleFilter.toLowerCase())) {
      return false
    }
    return true
  })

  // 根据展开状态决定显示的提示词
  const displayedPrompts = isExpanded ? filteredPrompts : filteredPrompts.slice(0, itemsToShow)

  /**
   * 处理应用提示词
   */
  const handleApplyPrompt = (item: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApplyPrompt) {
      // 如果是 edit 模式，传递图片；如果是 generate 模式，只传递提示词
      const applyData = {
        prompt: item.prompt,
        mode: item.mode,
        ...(item.mode === 'edit' && { image: item.preview })
      }
      onApplyPrompt(applyData)
      setApplied(true)
      setTimeout(() => setApplied(false), 2000)
      
      // 滚动到页面顶部输入框
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <section className={styles.promptGallery}>
      <div className={styles.container}>
        {/* 筛选区域 */}
        <div className={styles.filters}>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${selectedMode === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedMode('all')}
            >
              {t('filters.all' as any)}
            </button>
            <button
              className={`${styles.filterBtn} ${selectedMode === 'generate' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedMode('generate')}
            >
              {t('filters.generate' as any)}
            </button>
            <button
              className={`${styles.filterBtn} ${selectedMode === 'edit' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedMode('edit')}
            >
              {t('filters.edit' as any)}
            </button>
            <button
              className={styles.collapseBtn}
              onClick={() => setIsGalleryCollapsed(!isGalleryCollapsed)}
              title={isGalleryCollapsed ? t('expandButton') : t('collapseButton')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isGalleryCollapsed ? (
                  <polyline points="6 9 12 15 18 9"></polyline>
                ) : (
                  <polyline points="18 15 12 9 6 15"></polyline>
                )}
              </svg>
            </button>
          </div>
          <div className={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder' as any)}
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className={styles.searchInput}
            />
            {titleFilter && (
              <button
                className={styles.clearBtn}
                onClick={() => setTitleFilter('')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 提示词瀑布流 */}
        {!isGalleryCollapsed && (
          <>
            <div className={styles.masonry} ref={gridRef}>
          {displayedPrompts.map((item, index) => {
            // 获取描述（prompt的前150个字符）
            const description = item.prompt.length > 150 
              ? item.prompt.substring(0, 150) + '...' 
              : item.prompt
            
            return (
              <div 
                key={index} 
                className={styles.card}
                onClick={() => setSelectedPrompt(item)}
              >
                <div className={styles.cardImage}>
                  <LazyImage src={item.preview} alt={item.title} />
                  <div className={styles.cardOverlay}>
                    <div className={styles.cardContent}>
                      <div className={styles.cardTitle}>{item.title}</div>
                      <div className={styles.cardDescription}>{description}</div>
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
                </div>
              </div>
            )
          })}
        </div>

            {/* 展开/收起按钮 */}
            {filteredPrompts.length > itemsToShow && (
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
                      {t('expandButton')} ({filteredPrompts.length - itemsToShow} {t('expandCount')})
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
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
                    // 如果是 edit 模式，传递图片；如果是 generate 模式，只传递提示词
                    const applyData = {
                      prompt: selectedPrompt.prompt,
                      mode: selectedPrompt.mode,
                      ...(selectedPrompt.mode === 'edit' && { image: selectedPrompt.preview })
                    }
                    onApplyPrompt(applyData)
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

