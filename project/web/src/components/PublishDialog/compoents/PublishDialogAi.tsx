import type { ForwardedRef } from 'react'
import { 
  CloseCircleFilled, 
  CopyOutlined, 
  SendOutlined, 
  SyncOutlined,
  CompressOutlined,
  ExpandOutlined,
  EditOutlined,
  TranslationOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Input, message, Modal, Spin, Tooltip } from 'antd'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { aiChatStream } from '@/api/ai'
import styles from '../publishDialog.module.scss'

export interface IPublishDialogAiRef {
  // AI处理文本
  processText: (text: string, action: AIAction) => void
}

export interface IPublishDialogAiProps {
  onClose: () => void
  // 同步内容到编辑器的回调
  onSyncToEditor?: (content: string) => void
}

export type AIAction = 'shorten' | 'expand' | 'polish' | 'translate' | 'generateImage' | 'generateVideo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: AIAction
}

interface ChatSession {
  id: string
  messages: Message[]
  currentResponse?: string
  isStreaming?: boolean
}

// AI功能助手
const PublishDialogAi = memo(
  forwardRef(
    (
      { onClose, onSyncToEditor }: IPublishDialogAiProps,
      ref: ForwardedRef<IPublishDialogAiRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [activeAction, setActiveAction] = useState<AIAction | null>(null)
      const [messages, setMessages] = useState<Message[]>([])
      const [inputValue, setInputValue] = useState('')
      const [targetLanguage, setTargetLanguage] = useState('')
      const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({
        expand: t('aiFeatures.defaultPrompts.expand' as any),
        polish: t('aiFeatures.defaultPrompts.polish' as any),
      })
      const [isProcessing, setIsProcessing] = useState(false)
      const [settingsVisible, setSettingsVisible] = useState(false)
      const chatContainerRef = useRef<HTMLDivElement>(null)

      // 自动滚动到底部
      useEffect(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, [messages])

      // 处理AI响应
      const handleAIResponse = useCallback(async (
        action: AIAction,
        apiMessages: Array<{ role: string, content: string }>,
      ) => {
        try {
          setIsProcessing(true)
          
          // 添加助手消息占位
          const placeholderMsg: Message = { role: 'assistant', content: '', action }
          setMessages(prev => [...prev, placeholderMsg])

          const response = await aiChatStream({ messages: apiMessages })
          
          // 检查响应状态
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // 尝试读取JSON响应
          const result = await response.json()
          
          if (result.code === 0 && result.data?.content) {
            // 更新最后一条消息
            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: result.data.content,
                action,
              }
              return newMessages
            })
          } else {
            throw new Error(result.message || 'AI响应失败')
          }

          setIsProcessing(false)
        } catch (error: any) {
          console.error('AI Response Error:', error)
          // 移除占位消息
          setMessages(prev => prev.slice(0, -1))
          message.error(error.message || 'AI处理失败，请重试')
          setIsProcessing(false)
        }
      }, [])

      // 处理功能按钮点击
      const handleActionClick = useCallback((action: AIAction) => {
        if (action === 'translate' && !targetLanguage) {
          message.warning(t('aiFeatures.targetLanguagePlaceholder' as any))
          return
        }
        setActiveAction(action)
      }, [targetLanguage, t])

      // 发送消息
      const sendMessage = useCallback(async (content?: string) => {
        const messageContent = content || inputValue
        if (!messageContent.trim()) {
          message.warning(t('aiFeatures.selectText' as any))
          return
        }

        if (!activeAction) {
          message.warning('请先选择一个AI功能')
          return
        }

        let systemPrompt = ''

        // 根据不同功能生成提示词
        switch (activeAction) {
          case 'shorten':
            systemPrompt = t('aiFeatures.defaultPrompts.shorten' as any)
            break
          case 'expand':
            systemPrompt = customPrompts.expand || t('aiFeatures.defaultPrompts.expand' as any)
            break
          case 'polish':
            systemPrompt = customPrompts.polish || t('aiFeatures.defaultPrompts.polish' as any)
            break
          case 'translate':
            systemPrompt = `请将以下文本翻译成${targetLanguage}：`
            break
          case 'generateImage':
            systemPrompt = '根据以下描述生成图片提示词：'
            break
          case 'generateVideo':
            systemPrompt = '根据以下描述生成视频创作提示词：'
            break
        }

        // 添加用户消息
        const userMessage: Message = { role: 'user', content: messageContent, action: activeAction }
        setMessages(prev => [...prev, userMessage])

        // 准备API消息
        const apiMessages = [
          { role: 'user', content: systemPrompt },
          { role: 'user', content: messageContent },
        ]

        // 调用AI接口
        await handleAIResponse(activeAction, apiMessages)

        // 清空输入
        setInputValue('')
      }, [activeAction, inputValue, targetLanguage, customPrompts, handleAIResponse, t])

      // 同步到编辑器
      const syncToEditor = useCallback((content: string) => {
        if (onSyncToEditor) {
          onSyncToEditor(content)
          message.success(t('aiFeatures.syncSuccess' as any))
        }
      }, [onSyncToEditor, t])

      // 暴露给父组件的方法
      useImperativeHandle(ref, () => ({
        processText: (text: string, action: AIAction) => {
          setActiveAction(action)
          setInputValue(text)
          // 如果是翻译且没有目标语言，不自动发送
          if (action === 'translate' && !targetLanguage) {
            message.info('请先输入目标语言')
            return
          }
          // 自动发送
          setTimeout(() => {
            sendMessage(text)
          }, 100)
        },
      }))

      const actionButtons = [
        { action: 'shorten', icon: <CompressOutlined />, label: t('aiFeatures.shorten' as any) },
        { action: 'expand', icon: <ExpandOutlined />, label: t('aiFeatures.expand' as any) },
        { action: 'polish', icon: <EditOutlined />, label: t('aiFeatures.polish' as any) },
        { action: 'translate', icon: <TranslationOutlined />, label: t('aiFeatures.translate' as any) },
        { action: 'generateImage', icon: <PictureOutlined />, label: t('aiFeatures.generateImage' as any) },
        { action: 'generateVideo', icon: <VideoCameraOutlined />, label: t('aiFeatures.generateVideo' as any) },
      ]

      return (
        <div className={styles.publishDialogAi} id="publishDialogAi">
          <h1>
            <span>{t('aiAssistant' as any)}</span>
            <CloseCircleFilled onClick={onClose} />
          </h1>
          <div className="publishDialogAi-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 翻译需要输入目标语言 */}
            {activeAction === 'translate' && (
              <Input
                placeholder={t('aiFeatures.targetLanguagePlaceholder' as any)}
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                style={{ marginBottom: 12 }}
                size="small"
              />
            )}

            {/* 扩写和润色显示可编辑的默认提示词 */}
            {(activeAction === 'expand' || activeAction === 'polish') && (
              <Collapse
                size="small"
                items={[
                  {
                    key: '1',
                    label: '默认提示词',
                    children: (
                      <Input.TextArea
                        value={customPrompts[activeAction]}
                        onChange={e =>
                          setCustomPrompts(prev => ({
                            ...prev,
                            [activeAction]: e.target.value,
                          }))}
                        rows={2}
                        placeholder={t('aiFeatures.inputPrompt' as any)}
                      />
                    ),
                  },
                ]}
                style={{ marginBottom: 12 }}
              />
            )}

            {/* 聊天消息区域 */}
            <div 
              ref={chatContainerRef}
              className="publishDialogAi-chat" 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                marginBottom: 12,
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
                minHeight: '300px',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '40px 20px',
                }}>
                  请选择功能并输入内容开始对话
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: msg.role === 'user' ? '#1890ff' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#000',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content || <Spin size="small" />}
                    </div>
                    {msg.role === 'assistant' && msg.content && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          icon={<SyncOutlined />}
                          onClick={() => syncToEditor(msg.content)}
                        >
                          {t('aiFeatures.syncToEditor' as any)}
                        </Button>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content)
                            message.success('已复制到剪贴板')
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 功能按钮区域 */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 8,
              padding: '8px',
              background: '#fafafa',
              borderRadius: '8px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                {actionButtons.map(({ action, icon, label }) => (
                  <Tooltip key={action} title={label}>
                    <Button
                      type={activeAction === action ? 'primary' : 'default'}
                      icon={icon}
                      onClick={() => handleActionClick(action as AIAction)}
                      size="small"
                    />
                  </Tooltip>
                ))}
              </div>
              <Tooltip title="设置">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                  size="small"
                />
              </Tooltip>
            </div>

            {/* 输入区域 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={activeAction ? t('aiFeatures.inputPrompt' as any) : '请先选择一个AI功能'}
                rows={3}
                disabled={isProcessing || !activeAction}
                onPressEnter={(e) => {
                  if (e.shiftKey) return // Shift+Enter换行
                  e.preventDefault()
                  sendMessage()
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage()}
                loading={isProcessing}
                disabled={isProcessing || !activeAction}
              >
                {t('aiFeatures.send' as any)}
              </Button>
            </div>
          </div>

          {/* 设置弹窗 */}
          <Modal
            title="AI设置"
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={[
              <Button key="close" onClick={() => setSettingsVisible(false)}>
                关闭
              </Button>,
            ]}
          >
            <p>模型设置功能开发中...</p>
          </Modal>
        </div>
      )
    },
  ),
)

export default PublishDialogAi
