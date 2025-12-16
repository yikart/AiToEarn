/**
 * ChatMessage - 聊天消息气泡组件
 * 功能：显示用户消息或AI回复，支持媒体附件、Markdown渲染、多步骤工作流展示
 * 每个步骤都有独立的工作流展示区域，支持自动展开/收起当前活跃步骤
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Loader2, AlertCircle, User, ChevronDown, ChevronRight, Wrench, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import type { IUploadedMedia } from '../MediaUpload'
import type { IMessageStep, IWorkflowStep } from '@/store/agent'
import logo from '@/assets/images/logo.png'
import styles from './ChatMessage.module.scss'

export type { IWorkflowStep }

export interface IChatMessageProps {
  /** 消息角色 */
  role: 'user' | 'assistant'
  /** 消息内容 */
  content: string
  /** 媒体附件 */
  medias?: IUploadedMedia[]
  /** 消息状态 */
  status?: 'pending' | 'streaming' | 'done' | 'error'
  /** 错误信息 */
  errorMessage?: string
  /** 创建时间 */
  createdAt?: number
  /** 消息步骤列表（仅 assistant 消息使用） */
  steps?: IMessageStep[]
  /** 工作流步骤列表（兼容旧接口，用于无steps时的显示） */
  workflowSteps?: IWorkflowStep[]
  /** 自定义类名 */
  className?: string
}

/** 格式化工具名称（移除 mcp__ 前缀） */
const formatToolName = (name: string) => {
  return name.replace(/^mcp__\w+__/, '')
}

/**
 * WorkflowStepItem - 单个工作流步骤项
 */
interface IWorkflowStepItemProps {
  step: IWorkflowStep
}

function WorkflowStepItem({ step }: IWorkflowStepItemProps) {
  // 判断步骤是否完成：不活跃状态即为完成
  const isCompleted = !step.isActive

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs',
        step.isActive ? 'bg-purple-50' : 'bg-gray-50/80',
      )}
    >
      {/* 步骤图标 */}
      <div className="shrink-0 mt-0.5">
        {step.isActive ? (
          <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        ) : (
          <Wrench className="w-3 h-3 text-gray-400" />
        )}
      </div>
      {/* 步骤内容 */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium truncate',
          step.isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-600',
        )}>
          {step.type === 'tool_call'
            ? `${formatToolName(step.toolName || 'Tool')}${isCompleted ? '' : '...'}`
            : step.type === 'tool_result'
              ? `${formatToolName(step.toolName || 'Tool')} 返回结果`
              : formatToolName(step.toolName || 'Processing')}
        </div>
        {step.content && (
          <pre className="text-[10px] text-gray-400 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {step.content.substring(0, 80)}{step.content.length > 80 ? '...' : ''}
          </pre>
        )}
      </div>
    </div>
  )
}

/**
 * WorkflowSection - 工作流展示区域
 * 支持自动展开当前活跃步骤，收起非活跃步骤
 * 工作流详情区域有高度限制，超出显示滚动条
 */
interface IWorkflowSectionProps {
  /** 工作流步骤列表 */
  workflowSteps: IWorkflowStep[]
  /** 是否为当前活跃的步骤 */
  isActive?: boolean
  /** 默认是否展开（如果不传，则根据 isActive 自动判断） */
  defaultExpanded?: boolean
}

function WorkflowSection({ workflowSteps, isActive, defaultExpanded }: IWorkflowSectionProps) {
  // 默认展开，如果传了 defaultExpanded 则使用它，否则使用 isActive 或默认 true（历史消息默认展开）
  const initialExpanded = defaultExpanded !== undefined ? defaultExpanded : (isActive !== undefined ? isActive : true)
  const [expanded, setExpanded] = useState(initialExpanded)

  // 当 isActive 变化时，自动更新展开状态：活跃步骤展开，非活跃步骤收起
  useEffect(() => {
    if (isActive !== undefined) {
      setExpanded(isActive)
    }
  }, [isActive])

  // 统计工具调用数
  const totalToolCalls = workflowSteps.filter((s) => s.type === 'tool_call').length
  // 已完成的工具调用数 = 有对应 tool_result 的数量，或者 isActive 为 false 的 tool_call 数量
  const toolResultCount = workflowSteps.filter((s) => s.type === 'tool_result').length
  // 使用两者中的较大值，因为可能存在 tool_call 完成但还没返回结果的情况
  const completedSteps = Math.max(
    toolResultCount,
    workflowSteps.filter((s) => !s.isActive && s.type === 'tool_call').length
  )

  // 当前活跃的步骤
  const activeStep = workflowSteps.find((s) => s.isActive)

  if (workflowSteps.length === 0) {
    return null
  }

  return (
    <div className={cn(styles.workflowSection, 'mt-2')}>
      {/* 工作流摘要按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all w-full',
          isActive
            ? 'bg-purple-50/80 text-purple-600 hover:bg-purple-100 border border-purple-100'
            : 'bg-white/60 text-gray-500 hover:bg-gray-100 border border-gray-200/60',
        )}
      >
        {isActive && activeStep ? (
          <>
            <Wrench className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-medium truncate flex-1 text-left">
              {formatToolName(activeStep.toolName || 'Processing')}
            </span>
            <Loader2 className="w-3 h-3 animate-spin" />
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium flex-1 text-left">
              {completedSteps}/{totalToolCalls} 工具调用完成
            </span>
          </>
        )}
        <span className="shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* 展开的工作流详情 - 添加高度限制和滚动条 */}
      {expanded && (
        <div className={cn(
          'pl-2 border-l-2 space-y-1 mt-1.5 ml-1 overflow-y-auto',
          isActive ? 'border-purple-200' : 'border-gray-200',
          styles.workflowDetailList,
        )}>
          {workflowSteps.map((step, index) => (
            <WorkflowStepItem key={step.id || index} step={step} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * MessageStepContent - 单个消息步骤的内容
 * 每个步骤都有自己的工作流展示区域
 */
interface IMessageStepContentProps {
  /** 步骤数据 */
  step: IMessageStep
  /** 是否为最后一个步骤 */
  isLast: boolean
  /** 消息是否正在流式输出 */
  isStreaming: boolean
}

function MessageStepContent({ step, isLast, isStreaming }: IMessageStepContentProps) {
  const hasWorkflow = step.workflowSteps && step.workflowSteps.length > 0
  // 当前步骤是否活跃：是最后一个步骤且消息正在流式输出
  const isActiveStep = isLast && isStreaming

  return (
    <div className={cn(
      styles.messageStep,
      // 非最后一个步骤时，在底部添加分隔线
      !isLast && 'border-b border-gray-200/60 pb-3 mb-3',
    )}>
      {/* 步骤文本内容 */}
      {step.content && (
        <div className={cn(
          'text-sm leading-relaxed text-gray-900',
          styles.markdownContent,
        )}>
          <ReactMarkdown>{step.content}</ReactMarkdown>
        </div>
      )}

      {/* 该步骤的工作流展示 */}
      {hasWorkflow && (
        <WorkflowSection
          workflowSteps={step.workflowSteps!}
          isActive={isActiveStep}
        />
      )}
    </div>
  )
}

/**
 * ChatMessage - 聊天消息气泡组件
 */
export function ChatMessage({
  role,
  content,
  medias = [],
  status = 'done',
  errorMessage,
  steps = [],
  workflowSteps = [],
  className,
}: IChatMessageProps) {
  const isUser = role === 'user'
  const isStreaming = status === 'streaming' || status === 'pending'

  // 处理消息步骤：如果有 steps 则使用 steps，否则从 content 生成单个步骤
  const displaySteps = useMemo(() => {
    if (steps && steps.length > 0) {
      return steps
    }
    // 没有 steps 时，尝试从 content 解析多个段落作为步骤
    // 使用双换行分割内容为多个步骤
    if (content) {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
      if (paragraphs.length > 1) {
        return paragraphs.map((p, i) => ({
          id: `legacy-step-${i}`,
          content: p.trim(),
          workflowSteps: i === paragraphs.length - 1 ? workflowSteps : [],
          isActive: i === paragraphs.length - 1 && isStreaming,
          timestamp: Date.now(),
        }))
      }
    }
    // 单个步骤
    return [{
      id: 'single-step',
      content,
      workflowSteps,
      isActive: isStreaming,
      timestamp: Date.now(),
    }]
  }, [steps, content, workflowSteps, isStreaming])

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden',
          isUser ? 'bg-purple-500' : 'bg-linear-to-br from-purple-500 to-pink-500',
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Image
            src={logo}
            alt="AiToEarn"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* 媒体附件 */}
        {medias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {medias.map((media, index) => (
              <div
                key={index}
                className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {media.type === 'video' ? (
                  <video
                    src={getOssUrl(media.url)}
                    className="w-full h-full object-cover"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={getOssUrl(media.url)}
                    alt={`attachment-${index}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI 消息：多步骤渲染 - 只有有实际内容或工作流时才显示 */}
        {!isUser && displaySteps.length > 0 && displaySteps.some(s => s.content?.trim() || s.workflowSteps?.length) && (
          <div className="w-full bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            {displaySteps.map((step, index) => (
              <MessageStepContent
                key={step.id}
                step={step}
                isLast={index === displaySteps.length - 1}
                isStreaming={isStreaming}
              />
            ))}
          </div>
        )}

        {/* 用户消息：简单渲染 */}
        {isUser && content && (
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed',
              'bg-purple-500 text-white rounded-br-md whitespace-pre-wrap',
            )}
          >
            {content}
          </div>
        )}

        {/* 加载状态（无步骤内容时显示默认 loading） */}
        {!isUser && status === 'pending' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-md">
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        )}

        {/* 流式输出状态（无内容时显示） */}
        {!isUser && status === 'streaming' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 rounded-bl-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage || 'Generation failed, please retry'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
