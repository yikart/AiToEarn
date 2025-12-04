'use client'

import { useState } from 'react'
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

// 使用导入的提示词数据
const SAMPLE_PROMPTS: PromptItem[] = promptsData as PromptItem[]

export default function PromptGallerySection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null)
  const [copied, setCopied] = useState(false)

  // 默认显示3个，展开后显示所有
  const displayedPrompts = isExpanded ? SAMPLE_PROMPTS : SAMPLE_PROMPTS.slice(0, 3)

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className={styles.promptGallery}>
      <div className={styles.container}>
        {/* 标题区域 */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <div className={styles.badgeIcon}></div>
            <span>🎨 提示词灵感库</span>
          </div>
          <h2 className={styles.title}>
            探索精选提示词
            <span className={styles.titleHighlight}>快速开始创作</span>
          </h2>
          <p className={styles.subtitle}>
            精选优质提示词模板，一键复制即可使用
          </p>
        </div>

        {/* 提示词网格 */}
        <div className={styles.grid}>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyPrompt(item.prompt)
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    复制提示词
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
                      {item.mode === 'edit' ? '编辑' : '文生图'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 展开/收起按钮 */}
        {SAMPLE_PROMPTS.length > 3 && (
          <div className={styles.expandSection}>
            <button 
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  收起
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </>
              ) : (
                <>
                  查看更多 ({SAMPLE_PROMPTS.length - 3} 个)
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* 复制成功提示 */}
        {copied && (
          <div className={styles.toast}>
            ✓ 已复制到剪贴板
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
                <label>提示词：</label>
                <p>{selectedPrompt.prompt}</p>
              </div>
              <button 
                className={styles.modalCopyBtn}
                onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                复制提示词
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

