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
import ReactMarkdown from 'react-markdown'
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
      const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({
        expand: t('aiFeatures.defaultPrompts.expand' as any),
        polish: t('aiFeatures.defaultPrompts.polish' as any),
        translate: t('aiFeatures.defaultPrompts.translate' as any),
        generateImage: t('aiFeatures.defaultPrompts.generateImage' as any),
        generateVideo: t('aiFeatures.defaultPrompts.generateVideo' as any),
      })
      const [isProcessing, setIsProcessing] = useState(false)
      const [settingsVisible, setSettingsVisible] = useState(false)
      const [showRawContent, setShowRawContent] = useState<number | null>(null)
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
        setActiveAction(action)
      }, [])

      // 发送消息
      const sendMessage = useCallback(async (content?: string, forceAction?: AIAction) => {
        const messageContent = content || inputValue
        if (!messageContent.trim()) {
          message.warning(t('aiFeatures.selectText' as any))
          return
        }

        // 使用传入的 action 或当前状态的 action
        const currentAction = forceAction || activeAction
        if (!currentAction) {
          message.warning('请先选择一个AI功能')
          return
        }

        let systemPrompt = ''

        // 根据不同功能生成提示词
        switch (currentAction) {
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
            systemPrompt = customPrompts.translate || t('aiFeatures.defaultPrompts.translate' as any)
            break
          case 'generateImage':
            systemPrompt = customPrompts.generateImage || t('aiFeatures.defaultPrompts.generateImage' as any)
            break
          case 'generateVideo':
            systemPrompt = customPrompts.generateVideo || t('aiFeatures.defaultPrompts.generateVideo' as any)
            break
        }

        // 添加用户消息
        const userMessage: Message = { role: 'user', content: messageContent, action: currentAction }
        setMessages(prev => [...prev, userMessage])

        // 准备API消息
        const apiMessages: Array<{ role: string, content: string }> = []
        
        // 如果是图片生成功能，添加特殊的系统提示词
        if (currentAction === 'generateImage') {
          apiMessages.push({
            role: 'system',
            content: '当需要提供图片时，你可以使用以下两种格式之一：\n1. 使用 pollinations.ai 生成图片（推荐）：![描述](https://image.pollinations.ai/prompt/你的图片描述?nologo=true&width=1024&height=1024)，URL中的空格等符号需要用%20等编码替换。\n2. 如果生成base64图片，必须输出完整的base64数据：![image](data:image/png;base64,完整的base64数据)。\n\n重要：不要用代码块包围markdown图片语法，直接输出markdown格式即可。',
          })
        }
        
        apiMessages.push(
          { role: 'user', content: systemPrompt },
          { role: 'user', content: messageContent },
        )

        // 调用AI接口
        await handleAIResponse(currentAction, apiMessages)

        // 清空输入
        setInputValue('')
      }, [activeAction, inputValue, customPrompts, handleAIResponse, t])

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
          // 立即自动发送，直接传入 action 参数避免状态异步问题
          setTimeout(() => {
            sendMessage(text, action) // 传入 action 参数
          }, 50)
        },
      }), [sendMessage])

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
          <div className="publishDialogAi-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 12px', marginTop: '12px' }}>
            {/* 显示可编辑的默认提示词（缩写和扩写不可编辑） */}
            {activeAction && activeAction !== 'shorten' && activeAction !== 'expand' && (
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
                maxHeight: '644px',
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
                      }}
                      className="ai-message-content"
                    >
                      {msg.content ? (
                        msg.role === 'assistant' ? (
                          <>
                            {/* 调试：显示图片信息 */}
                            {msg.content.includes('![') && (() => {
                              const allImageMatches = msg.content.match(/!\[.*?\]\([^)]+\)/g) || []
                              const base64Images = msg.content.match(/!\[.*?\]\((data:image\/[^)]+)\)/g) || []
                              const urlImages = allImageMatches.length - base64Images.length
                              
                              const base64Lengths = base64Images.map(match => {
                                const base64Match = match.match(/base64,([^)]+)/)
                                return base64Match ? base64Match[1].length : 0
                              })
                              
                              return (
                                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px', padding: '4px', background: '#fff3cd', borderRadius: '3px' }}>
                                  📸 检测到 {allImageMatches.length} 张图片
                                  {urlImages > 0 && <span style={{ marginLeft: '8px', color: 'green' }}>🌐 URL图片: {urlImages}张</span>}
                                  {base64Images.length > 0 && base64Lengths.map((len, idx) => (
                                    <div key={idx} style={{ marginLeft: '8px' }}>
                                      Base64图片{idx + 1}: {len} 字符 
                                      {len < 100 && <span style={{ color: 'red' }}> ⚠️ 数据太短，可能不完整</span>}
                                      {len >= 100 && len < 1000 && <span style={{ color: 'orange' }}> ⚠️ 数据偏短</span>}
                                      {len >= 1000 && <span style={{ color: 'green' }}> ✓ 长度正常</span>}
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                            <ReactMarkdown
                            components={{
                              img: ({ node, ...props }) => {
                                const src = props.src || ''
                                const isBase64 = src.startsWith('data:image/')
                                const isPollinationsUrl = src.includes('pollinations.ai')
                                const base64Length = isBase64 && src.includes('base64,') 
                                  ? src.split('base64,')[1]?.length || 0 
                                  : 0
                                
                                console.log('🖼️ Image detected:', {
                                  alt: props.alt,
                                  srcType: isBase64 ? 'Base64' : (isPollinationsUrl ? 'Pollinations URL' : 'Other URL'),
                                  srcLength: src.length,
                                  base64DataLength: base64Length,
                                  srcPreview: src.substring(0, 100) + '...'
                                })

                                return (
                                  <div style={{ margin: '8px 0' }}>
                                    <img
                                      {...props}
                                      style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: '4px',
                                        display: 'block',
                                      }}
                                      alt={props.alt || 'AI生成的图片'}
                                      crossOrigin={isPollinationsUrl ? 'anonymous' : undefined}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        console.error('❌ Image load failed:', {
                                          src: src.substring(0, 100) + '...',
                                          srcType: isBase64 ? 'Base64' : 'URL',
                                          base64Length,
                                        })
                                        // 显示错误提示而不是隐藏
                                        target.style.display = 'none'
                                        const errorDiv = document.createElement('div')
                                        errorDiv.style.cssText = 'padding: 8px; background: #fee; border: 1px solid #fcc; border-radius: 4px; font-size: 12px; color: #c00;'
                                        if (isBase64) {
                                          errorDiv.innerHTML = `⚠️ Base64图片加载失败<br/>数据长度: ${base64Length} 字符${base64Length < 1000 ? ' (数据不完整，可能被截断)' : ''}`
                                        } else {
                                          errorDiv.innerHTML = `⚠️ 图片加载失败<br/>URL: ${src.substring(0, 50)}...`
                                        }
                                        target.parentElement?.appendChild(errorDiv)
                                      }}
                                      onLoad={() => {
                                        console.log('✅ Image loaded successfully:', isBase64 ? `Base64 (${base64Length} chars)` : 'URL')
                                      }}
                                    />
                                  </div>
                                )
                              },
                              p: ({ node, ...props }) => <p style={{ margin: '4px 0', lineHeight: '1.6' }} {...props} />,
                              code: ({ node, inline, className, children, ...props }: any) => {
                                return inline
                                  ? <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '0.9em' }} {...props}>{children}</code>
                                  : <code style={{ display: 'block', background: '#f0f0f0', padding: '12px', borderRadius: '4px', overflowX: 'auto', fontSize: '0.9em', lineHeight: '1.5' }} {...props}>{children}</code>
                              },
                              a: ({ node, ...props }) => (
                                <a {...props} style={{ color: '#1890ff', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />
                              ),
                              ul: ({ node, ...props }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                              ol: ({ node, ...props }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                              li: ({ node, ...props }) => <li style={{ margin: '4px 0' }} {...props} />,
                              h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '12px 0 8px' }} {...props} />,
                              h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '12px 0 8px' }} {...props} />,
                              h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '8px 0 6px' }} {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote style={{ borderLeft: '3px solid #e0e0e0', paddingLeft: '12px', margin: '8px 0', color: '#666' }} {...props} />
                              ),
                            }}
                          >
                            {/* 清理内容：移除多余的反引号，确保图片正确渲染 */}
                            {msg.content
                              .replace(/^`+|`+$/g, '') // 移除开头和结尾的反引号
                              .replace(/`(!\[.*?\]\(data:image\/.*?\))`/g, '$1') // 移除图片周围的反引号
                            }
                          </ReactMarkdown>
                          </>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        )
                      ) : (
                        <Spin size="small" />
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.content && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
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
                          <Button
                            size="small"
                            onClick={() => setShowRawContent(showRawContent === index ? null : index)}
                          >
                            {showRawContent === index ? '隐藏原始' : '查看原始'}
                          </Button>
                        </div>
                        {showRawContent === index && (
                          <div style={{ 
                            background: '#f0f0f0', 
                            padding: '8px', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            wordBreak: 'break-all',
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</pre>
                          </div>
                        )}
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
                rows={1}
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
