/**
 * AgentGenerator - AI Agent 内容生成组件
 * 功能：AI 驱动的内容创作、多平台发布、草稿管理
 */
'use client'

import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useShallow } from 'zustand/react/shallow'
import {
  BulbOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

// Store
import { useAgentStore } from './agentStore'
import type { IAgentGeneratorProps, IAgentGeneratorRef, IActionContext } from './agentStore.types'

// i18n
import { useTransClient } from '@/app/i18n/client'

// Assets
import logo from '@/assets/images/logo.png'

// Styles
import styles from './agentGenerator.module.scss'

// ============ 子组件 ============

/** 加载动画组件（...动画） */
function LoadingDots() {
  return (
    <span className={styles.loadingDots}>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
    </span>
  )
}

/** 获取状态图标 */
function getStatusIcon(status: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'THINKING': <BulbOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />,
    'WAITING': <ClockCircleOutlined style={{ marginRight: '8px', color: '#b78ae9' }} />,
    'GENERATING_CONTENT': <FileTextOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />,
    'GENERATING_IMAGE': <PictureOutlined style={{ marginRight: '8px', color: '#8b4fd9' }} />,
    'GENERATING_VIDEO': <VideoCameraOutlined style={{ marginRight: '8px', color: '#9558de' }} />,
    'GENERATING_TEXT': <EditOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />,
    'COMPLETED': <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />,
    'FAILED': <CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />,
    'CANCELLED': <StopOutlined style={{ marginRight: '8px', color: '#8c8c8c' }} />,
  }
  return iconMap[status] || null
}

// ============ 主组件 ============

const AgentGenerator = memo(
  forwardRef(
    (
      { onLoginRequired, promptToApply }: IAgentGeneratorProps,
      ref: ForwardedRef<IAgentGeneratorRef>,
    ) => {
      const { t } = useTransClient('home')
      const router = useRouter()
      const { lng } = useParams()

      // Refs
      const fileInputRef = useRef<HTMLInputElement>(null)
      const textareaRef = useRef<HTMLTextAreaElement>(null)
      const mainInputContainerRef = useRef<HTMLDivElement>(null)
      const markdownContainerRef = useRef<HTMLDivElement>(null)

      // Store
      const {
        taskId,
        sessionId,
        prompt,
        isGenerating,
        progress,
        uploadedImages,
        isUploading,
        completedMessages,
        currentTypingMsg,
        displayedText,
        pendingMessages,
        markdownMessages,
        selectedMode,
        currentCost,
        showFixedInput,
      } = useAgentStore(
        useShallow(state => ({
          taskId: state.taskId,
          sessionId: state.sessionId,
          prompt: state.prompt,
          isGenerating: state.isGenerating,
          progress: state.progress,
          uploadedImages: state.uploadedImages,
          isUploading: state.isUploading,
          completedMessages: state.completedMessages,
          currentTypingMsg: state.currentTypingMsg,
          displayedText: state.displayedText,
          pendingMessages: state.pendingMessages,
          markdownMessages: state.markdownMessages,
          selectedMode: state.selectedMode,
          currentCost: state.currentCost,
          showFixedInput: state.showFixedInput,
        })),
      )

      const {
        setPrompt,
        setSelectedMode,
        setShowFixedInput,
        removeUploadedMedia,
        addMessageToQueue,
        processMessageQueue,
        updateTypingEffect,
        restoreSession,
        newConversation,
        stopTask,
        reset,
        createTask,
        uploadMedia,
        applyPrompt,
      } = useAgentStore()

      // 构建 Action 上下文
      const actionContext: IActionContext = {
        router,
        lng: lng as string,
        t: t as any,
      }

      // ============ 暴露给父组件的方法 ============
      useImperativeHandle(ref, () => ({
        reset,
        newConversation: () => newConversation(t as any),
      }))

      // ============ 生命周期 ============

      // 恢复会话
      useEffect(() => {
        restoreSession()
      }, [restoreSession])

      // 应用外部提示词
      useEffect(() => {
        if (promptToApply) {
          applyPrompt(promptToApply)
        }
      }, [promptToApply, applyPrompt])

      // 监听主输入框是否在视口内
      useEffect(() => {
        if (!mainInputContainerRef.current) return

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              setShowFixedInput(!entry.isIntersecting)
            })
          },
          { threshold: 0, rootMargin: '0px' }
        )

        observer.observe(mainInputContainerRef.current)

        return () => observer.disconnect()
      }, [setShowFixedInput])

      // 消息队列处理
      useEffect(() => {
        processMessageQueue()
      }, [currentTypingMsg, pendingMessages, processMessageQueue])

      // 打字机效果
      useEffect(() => {
        if (currentTypingMsg && displayedText.length < currentTypingMsg.content.length) {
          const timer = setTimeout(() => {
            updateTypingEffect()
          }, 80)
          return () => clearTimeout(timer)
        } else if (currentTypingMsg && displayedText.length >= currentTypingMsg.content.length) {
          const timer = setTimeout(() => {
            updateTypingEffect()
          }, 200)
          return () => clearTimeout(timer)
        }
      }, [currentTypingMsg, displayedText, updateTypingEffect])

      // 自动滚动到底部 - markdown 容器
      useEffect(() => {
        if (markdownContainerRef.current && markdownMessages.length > 0) {
          markdownContainerRef.current.scrollTop = markdownContainerRef.current.scrollHeight
        }
      }, [markdownMessages])

      // ============ 事件处理 ============

      const handleCreateTask = async () => {
        await createTask(t as any, actionContext, onLoginRequired)
      }

      const handleStopTask = () => {
        stopTask(t as any)
      }

      const handleNewConversation = () => {
        newConversation(t as any)
      }

      const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
          await uploadMedia(files, t as any)
        }
        // 重置 input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }

      const handleRemoveImage = (index: number) => {
        removeUploadedMedia(index)
      }

      // ============ 渲染 ============

      return (
        <div className={styles.agentGenerator}>
          {/* 模式选择导航栏 */}
          <div className={styles.modeNavigation}>
            <div
              className={`${styles.modeItem} ${selectedMode === 'agent' ? styles.modeItemActive : ''}`}
              onClick={() => setSelectedMode('agent')}
              style={{
                background: selectedMode === 'agent'
                  ? 'linear-gradient(135deg, #a66ae4 0%, #8b5ad6 100%)'
                  : 'linear-gradient(135deg, rgba(166, 106, 228, 0.8) 0%, rgba(139, 90, 214, 0.8) 100%)',
              }}
            >
              <div className={styles.modeContent}>
                <div className={styles.modeTitle}>{t('aiGeneration.agentMode' as any)}</div>
                {selectedMode === 'agent' && (
                  <div className={styles.modeDescription}>{t('aiGeneration.inspirationPrompt' as any)}</div>
                )}
                {selectedMode !== 'agent' && (
                  <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                    <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor" />
                  </svg>
                )}
              </div>
            </div>

            {/* 对话信息和新对话按钮 */}
            {selectedMode === 'agent' && (taskId || sessionId) && (
              <div className={styles.conversationInfo}>
                <span className={styles.conversationId}>
                  {t('aiGeneration.conversationId' as any)}: {(taskId || sessionId).slice(-6)}
                </span>
                <button
                  className={styles.newConversationBtn}
                  onClick={handleNewConversation}
                  title={t('aiGeneration.startNewConversation' as any)}
                  disabled={isGenerating}
                >
                  <ReloadOutlined />
                </button>
              </div>
            )}
          </div>

          {/* SSE 消息展示区域 */}
          {(isGenerating || markdownMessages.length > 0) && (
            <div className={styles.markdownMessagesWrapper}>
              <div
                ref={markdownContainerRef}
                className={styles.markdownMessagesContainer}
              >
                <h3 className={styles.markdownTitle}>
                  <Image src={logo} alt="Logo" className={styles.logoAi} />
                  {t('aiGeneration.aiGenerationProcess' as any)} {isGenerating && <LoadingDots />}
                </h3>
                <div className={styles.markdownContent}>
                  <ReactMarkdown>
                    {markdownMessages.length > 0
                      ? markdownMessages.join('\n\n')
                      : (t('aiGeneration.waitingAiResponse' as any) as string)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* AI 输入区域 */}
          <div ref={mainInputContainerRef} className={styles.aiGenerationWrapper}>
            <div className={styles.aiInputContainer}>
              {/* 已上传的媒体预览 */}
              <div className={styles.uploadedImagesPreview}>
                <div className={styles.imagesRow}>
                  {uploadedImages.length > 0 && uploadedImages.map((file, index) => (
                    <div key={index} className={styles.imageItem}>
                      {file.type === 'video' ? (
                        <video
                          src={file.url}
                          className={styles.imageThumb}
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={file.url}
                          alt={`pic ${index + 1}`}
                          className={styles.imageThumb}
                        />
                      )}
                      {!isGenerating && (
                        <span
                          className={styles.removeImageBtn}
                          onClick={() => handleRemoveImage(index)}
                          title="remove file"
                        >
                          <CloseCircleOutlined />
                        </span>
                      )}
                    </div>
                  ))}

                  {/* 上传按钮 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating || isUploading}
                    className={styles.aiUploadBtn}
                    title="上传图片/视频"
                  >
                    {isUploading ? (
                      <span>⏳</span>
                    ) : (
                      <span className={styles.plusIcon}>+</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 输入框 */}
              <div className={styles.aiInputContainer1}>
                <textarea
                  ref={textareaRef}
                  id="ai-input-textarea"
                  data-driver-target="ai-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !isUploading) {
                      e.preventDefault()
                      handleCreateTask()
                    }
                  }}
                  placeholder={t('aiGeneration.inputPlaceholder' as any)}
                  disabled={isGenerating || isUploading}
                  className={styles.aiInput}
                  rows={4}
                />
              </div>

              {/* 底部控制栏 */}
              <div className={styles.aiInputBottomBar}>
                <div className={styles.bottomLeft}>
                  <button className={styles.modeSelectBtn}>
                    <span>
                      {selectedMode === 'agent' && t('aiGeneration.agentMode' as any)}
                      {selectedMode === 'image' && t('aiGeneration.imageGeneration' as any)}
                      {selectedMode === 'video' && t('aiGeneration.videoGeneration' as any)}
                      {selectedMode === 'draft' && t('aiGeneration.draftBox' as any)}
                      {selectedMode === 'publishbatch' && t('aiGeneration.batchPublish' as any)}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* 显示本次消费 */}
                  {currentCost > 0 && (
                    <span style={{
                      fontSize: '12px',
                      color: '#666',
                      marginLeft: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      {t('aiGeneration.currentCost' as any)}: ${currentCost.toFixed(4)}
                    </span>
                  )}
                </div>

                {/* 发送/停止按钮 */}
                <button
                  className={styles.scrollTopBtn}
                  onClick={isGenerating ? handleStopTask : handleCreateTask}
                  disabled={!isGenerating && (!prompt.trim() || isUploading)}
                  title={isGenerating ? (t('status.stopGenerating' as any) as string) : (t('status.sendMessage' as any) as string)}
                >
                  {isGenerating ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 固定在底部的简化输入框 */}
          {showFixedInput && (
            <div className={styles.fixedInputWrapper}>
              <div className={styles.fixedInputContainer}>
                {/* 已上传图片/视频预览 */}
                {uploadedImages.length > 0 && (
                  <div className={styles.fixedUploadedImages}>
                    {uploadedImages.map((file, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        {file.type === 'video' ? (
                          <video
                            src={file.url}
                            className={styles.fixedImageThumb}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={file.url}
                            alt={`pic ${index + 1}`}
                            className={styles.fixedImageThumb}
                          />
                        )}
                        {!isGenerating && (
                          <span
                            className={styles.fixedRemoveImageBtn}
                            onClick={() => handleRemoveImage(index)}
                            title="移除文件"
                          >
                            ×
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 图片上传按钮 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || isUploading}
                  className={styles.fixedUploadBtn}
                  title="上传图片/视频"
                >
                  {isUploading ? '⏳' : '+'}
                </button>

                {/* 输入框 */}
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !isUploading) {
                      e.preventDefault()
                      handleCreateTask().then(() => {
                        mainInputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      })
                    }
                  }}
                  placeholder={t('aiGeneration.inputPlaceholder' as any)}
                  disabled={isGenerating || isUploading}
                  className={styles.fixedInput}
                />

                {/* 发送按钮 */}
                <button
                  className={styles.fixedSendBtn}
                  onClick={() => {
                    handleCreateTask().then(() => {
                      mainInputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    })
                  }}
                  disabled={!prompt.trim() || isGenerating || isUploading}
                >
                  {isGenerating ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )
    },
  ),
)

AgentGenerator.displayName = 'AgentGenerator'

export default AgentGenerator

