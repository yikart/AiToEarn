/**
 * 首页 - AI Agent 内容生成
 * 功能：AI 驱动的内容创作、提示词画廊
 */
'use client'

import { useState } from 'react'

// components
import LoginModal from '@/components/LoginModal'
import PromptGallery from '@/components/Home/PromptGallery'
import AgentGenerator from '@/components/Home/AgentGenerator'

// styles
import styles from './styles/home.module.scss'

export default function Home() {
  // 状态提升：用于从 PromptGallery 应用提示词到 AgentGenerator
  const [promptToApply, setPromptToApply] = useState<{ prompt: string; image?: string } | null>(null)

  // 登录弹窗状态
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  return (
    <div className={styles.homePage}>
      {/* AI Agent 生成器 */}
      <div className={styles.generatorSection}>
        <AgentGenerator
          onLoginRequired={() => setLoginModalOpen(true)}
          promptToApply={promptToApply}
        />
      </div>

      {/* 提示词画廊 */}
      <div className={styles.gallerySection}>
        <PromptGallery
          onApplyPrompt={(data) => {
            // 根据 mode 决定如何处理
            if (data.mode === 'edit' && data.image) {
              // edit 模式：设置提示词和图片
              setPromptToApply({ prompt: data.prompt, image: data.image })
            } else {
              // generate 模式：只设置提示词
              setPromptToApply({ prompt: data.prompt })
            }
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  )
}
