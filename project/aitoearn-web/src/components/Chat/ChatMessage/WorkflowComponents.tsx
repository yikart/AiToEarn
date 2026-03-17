'use client'

import type { IWorkflowStep } from '@/store/agent'
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Wrench } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import styles from './ChatMessage.module.scss'
import { ToolDetailModal } from './ToolDetailModal'

export type { IWorkflowStep }

export interface IWorkflowSectionProps {
  workflowSteps: IWorkflowStep[]
  isActive?: boolean
  defaultExpanded?: boolean
}

function formatToolName(name: string) {
  return name.replace(/^mcp__\w+__/, '')
}

interface IWorkflowStepItemProps {
  step: IWorkflowStep
  /** 点击回调（仅 tool_call 类型可点击） */
  onClick?: (step: IWorkflowStep) => void
}

function WorkflowStepItem({ step, onClick }: IWorkflowStepItemProps) {
  const { t } = useTransClient('chat')
  // tool_call 类型：有 result 字段表示已完成；其他类型：!isActive 表示已完成
  const isCompleted = step.type === 'tool_call' ? !!step.result : !step.isActive
  // 只有 tool_call 类型才可点击
  const isClickable = step.type === 'tool_call' && !!onClick

  // 不渲染 tool_result 类型（已合并到 tool_call 中）
  if (step.type === 'tool_result') {
    return null
  }

  const handleClick = () => {
    if (isClickable) {
      onClick(step)
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
        step.isActive ? 'bg-primary/10' : 'bg-muted/80',
        isClickable && 'cursor-pointer hover:bg-muted',
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
    >
      <div className="shrink-0 mt-0.5">
        {step.isActive ? (
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-3 h-3 text-success" />
        ) : (
          <Wrench className="w-3 h-3 text-muted-foreground/70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-medium truncate',
            step.isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {step.type === 'tool_call'
            ? `${formatToolName(step.toolName || 'Tool')}${isCompleted ? '' : '...'}`
            : formatToolName(step.toolName || t('workflow.processing' as any))}
        </div>
        {step.content && (
          <pre className="text-[10px] text-muted-foreground/70 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {step.content.substring(0, 80)}
            {step.content.length > 80 ? '...' : ''}
          </pre>
        )}
      </div>
    </div>
  )
}

function WorkflowSection({ workflowSteps, isActive, defaultExpanded }: IWorkflowSectionProps) {
  const { t } = useTransClient('chat')
  const initialExpanded
    = defaultExpanded !== undefined ? defaultExpanded : isActive !== undefined ? isActive : true
  const [expanded, setExpanded] = useState(initialExpanded)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  // 工具详情弹框状态
  const [selectedStep, setSelectedStep] = useState<IWorkflowStep | null>(null)

  useEffect(() => {
    if (isActive !== undefined) {
      setExpanded(isActive)
    }
  }, [isActive])

  // 监听滚动位置，判断用户是否在底部附近
  const handleScroll = () => {
    if (!listRef.current)
      return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    // 距离底部小于 20px 认为在底部附近
    const nearBottom = scrollHeight - scrollTop - clientHeight < 20
    setIsNearBottom(nearBottom)
  }

  // 工作流步骤变化时，只有在底部附近才自动滚动到底部
  useEffect(() => {
    if (listRef.current && expanded && isNearBottom) {
      // 使用 setTimeout 确保 DOM 完全更新后再滚动
      const timer = setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [workflowSteps, expanded, isNearBottom])

  const totalToolCalls = workflowSteps.filter(s => s.type === 'tool_call').length
  // 统计有 result 的 tool_call 数量（已完成的工具调用）
  const completedSteps = workflowSteps.filter(s => s.type === 'tool_call' && s.result).length
  const activeStep = workflowSteps.find(s => s.isActive)

  if (workflowSteps.length === 0) {
    return null
  }

  return (
    <div className={cn(styles.workflowSection, 'mt-2')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all w-full',
          isActive
            ? 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20'
            : 'bg-background/60 text-muted-foreground hover:bg-muted border border-border/60',
        )}
      >
        {isActive && activeStep ? (
          <>
            <Wrench className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-medium truncate flex-1 text-left">
              {formatToolName(activeStep.toolName || t('workflow.processing' as any))}
            </span>
            <Loader2 className="w-3 h-3 animate-spin" />
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="font-medium flex-1 text-left">
              {completedSteps}
              /
              {totalToolCalls}
              {' '}
              {t('workflow.toolCallCompleted' as any)}
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

      {expanded && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className={cn(
            'pl-2 border-l-2 space-y-1 mt-1.5 ml-1 overflow-y-auto',
            isActive ? 'border-primary/30' : 'border-border',
            styles.workflowDetailList,
          )}
        >
          {workflowSteps.map((step, index) => (
            <WorkflowStepItem key={step.id || index} step={step} onClick={setSelectedStep} />
          ))}
        </div>
      )}

      {/* 工具详情弹框 */}
      <ToolDetailModal
        open={!!selectedStep}
        onOpenChange={(open) => {
          if (!open)
            setSelectedStep(null)
        }}
        step={selectedStep}
      />
    </div>
  )
}

export default WorkflowSection
