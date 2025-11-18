import type { ForwardedRef } from 'react'
import { CloseCircleFilled, CopyOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Collapse, Input, message, Spin, Tabs } from 'antd'
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react'
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
      const [activeTab, setActiveTab] = useState<AIAction>('expand')
      const [chatSessions, setChatSessions] = useState<Record<AIAction, ChatSession>>({
        shorten: { id: 'shorten', messages: [] },
        expand: { id: 'expand', messages: [] },
        polish: { id: 'polish', messages: [] },
        translate: { id: 'translate', messages: [] },
        generateImage: { id: 'generateImage', messages: [] },
        generateVideo: { id: 'generateVideo', messages: [] },
      })
      const [inputValue, setInputValue] = useState('')
      const [targetLanguage, setTargetLanguage] = useState('')
      const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({
        expand: t('aiFeatures.defaultPrompts.expand' as any),
        polish: t('aiFeatures.defaultPrompts.polish' as any),
      })
      const [isProcessing, setIsProcessing] = useState(false)

      // 获取当前会话
      const currentSession = chatSessions[activeTab]

      // 处理AI响应流
      const handleAIStream = useCallback(async (
        action: AIAction,
        messages: Array<{ role: string, content: string }>,
      ) => {
        try {
          setIsProcessing(true)
          const response = await aiChatStream({ messages })
          
          if (!response.body) {
            throw new Error('No response body')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let accumulatedResponse = ''

          // 添加助手消息占位
          setChatSessions(prev => ({
            ...prev,
            [action]: {
              ...prev[action],
              messages: [...prev[action].messages, { role: 'assistant', content: '', action }],
              isStreaming: true,
              currentResponse: '',
            },
          }))

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim())

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    accumulatedResponse += content
                    // 更新流式响应
                    setChatSessions(prev => {
                      const newMessages = [...prev[action].messages]
                      newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: accumulatedResponse,
                        action,
                      }
                      return {
                        ...prev,
                        [action]: {
                          ...prev[action],
                          messages: newMessages,
                          currentResponse: accumulatedResponse,
                        },
                      }
                    })
                  }
                } catch (e) {
                  console.error('Parse error:', e)
                }
              }
            }
          }

          // 完成流式传输
          setChatSessions(prev => ({
            ...prev,
            [action]: {
              ...prev[action],
              isStreaming: false,
            },
          }))

          setIsProcessing(false)
        } catch (error) {
          console.error('AI Stream Error:', error)
          message.error('AI处理失败，请重试')
          setIsProcessing(false)
        }
      }, [])

      // 发送消息
      const sendMessage = useCallback(async (content?: string, targetLang?: string) => {
        const messageContent = content || inputValue
        if (!messageContent.trim()) {
          message.warning(t('aiFeatures.selectText' as any))
          return
        }

        let systemPrompt = ''
        const action = activeTab

        // 根据不同功能生成提示词
        switch (action) {
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
            if (!targetLang && !targetLanguage) {
              message.warning(t('aiFeatures.targetLanguagePlaceholder' as any))
              return
            }
            systemPrompt = `请将以下文本翻译成${targetLang || targetLanguage}：`
            break
          case 'generateImage':
            // 制图功能暂时使用提示词
            systemPrompt = '根据以下描述生成图片提示词：'
            break
          case 'generateVideo':
            // 视频生成功能暂时使用提示词
            systemPrompt = '根据以下描述生成视频创作提示词：'
            break
        }

        // 添加用户消息
        const userMessage: Message = { role: 'user', content: messageContent, action }
        setChatSessions(prev => ({
          ...prev,
          [action]: {
            ...prev[action],
            messages: [...prev[action].messages, userMessage],
          },
        }))

        // 准备API消息
        const apiMessages = [
          { role: 'user', content: systemPrompt },
          { role: 'user', content: messageContent },
        ]

        // 调用AI接口
        await handleAIStream(action, apiMessages)

        // 清空输入
        setInputValue('')
      }, [activeTab, inputValue, targetLanguage, customPrompts, handleAIStream, t])

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
          setActiveTab(action)
          // 如果是翻译，先切换tab再发送
          setTimeout(() => {
            sendMessage(text)
          }, 100)
        },
      }))

      const tabItems = [
        {
          key: 'shorten',
          label: t('aiFeatures.shorten' as any),
          children: null,
        },
        {
          key: 'expand',
          label: t('aiFeatures.expand' as any),
          children: null,
        },
        {
          key: 'polish',
          label: t('aiFeatures.polish' as any),
          children: null,
        },
        {
          key: 'translate',
          label: t('aiFeatures.translate' as any),
          children: null,
        },
        {
          key: 'generateImage',
          label: t('aiFeatures.generateImage' as any),
          children: null,
        },
        {
          key: 'generateVideo',
          label: t('aiFeatures.generateVideo' as any),
          children: null,
        },
      ]

      return (
        <div className={styles.publishDialogAi} id="publishDialogAi">
          <h1>
            <span>{t('aiAssistant' as any)}</span>
            <CloseCircleFilled onClick={onClose} />
          </h1>
          <div className="publishDialogAi-wrapper">
            <Tabs
              activeKey={activeTab}
              onChange={key => setActiveTab(key as AIAction)}
              items={tabItems}
              size="small"
            />

            {/* 扩写和润色显示可编辑的默认提示词 */}
            {(activeTab === 'expand' || activeTab === 'polish') && (
              <Collapse
                size="small"
                items={[
                  {
                    key: '1',
                    label: '默认提示词',
                    children: (
                      <Input.TextArea
                        value={customPrompts[activeTab]}
                        onChange={e =>
                          setCustomPrompts(prev => ({
                            ...prev,
                            [activeTab]: e.target.value,
                          }))}
                        rows={3}
                        placeholder={t('aiFeatures.inputPrompt' as any)}
                      />
                    ),
                  },
                ]}
                style={{ marginBottom: 12 }}
              />
            )}

            {/* 翻译需要输入目标语言 */}
            {activeTab === 'translate' && (
              <Input
                placeholder={t('aiFeatures.targetLanguagePlaceholder' as any)}
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                style={{ marginBottom: 12 }}
              />
            )}

            {/* 聊天消息区域 */}
            <div className="publishDialogAi-chat" style={{ 
              flex: 1, 
              overflowY: 'auto', 
              marginBottom: 12,
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '8px',
              minHeight: '300px',
              maxHeight: '500px',
            }}>
              {currentSession.messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '40px 20px',
                }}>
                  请输入内容开始对话
                </div>
              ) : (
                currentSession.messages.map((msg, index) => (
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
                      }}
                    >
                      {msg.content}
                      {currentSession.isStreaming && index === currentSession.messages.length - 1 && (
                        <Spin size="small" style={{ marginLeft: 8 }} />
                      )}
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

            {/* 输入区域 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={t('aiFeatures.inputPrompt' as any)}
                rows={3}
                disabled={isProcessing}
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
                disabled={isProcessing}
              >
                {t('aiFeatures.send' as any)}
              </Button>
            </div>
          </div>
        </div>
      )
    },
  ),
)

export default PublishDialogAi
