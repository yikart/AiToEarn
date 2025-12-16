/**
 * 首页 - AI Agent 内容生成
 * 功能：AI 驱动的内容创作、任务预览
 */
'use client'

import { useState } from 'react'

// components
import LoginModal from '@/components/LoginModal'
import { HomeChat } from '@/components/Home/HomeChat'
import { TaskPreview } from '@/components/Home/TaskPreview'

// store
import { useUserStore } from '@/store/user'

export default function Home() {
  // 登录弹窗状态
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  // 获取登录状态
  const token = useUserStore((state) => state.token)

  /** 检查登录状态 */
  const handleLoginRequired = () => {
    if (!token) {
      setLoginModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-white">
      {/* 首屏 Chat 区域 */}
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <HomeChat
          onLoginRequired={token ? undefined : handleLoginRequired}
        />
      </section>

      {/* 任务预览区域 */}
      <section className="px-4 py-8 bg-white border-t border-gray-100">
        <TaskPreview limit={4} />
      </section>

      {/* 登录弹窗 */}
      <LoginModal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  )
}
