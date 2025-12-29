'use client'

import type { IWorkflowStep } from '@/store/agent'
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import styles from './ChatMessage.module.scss'

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
}

function WorkflowStepItem({ step }: IWorkflowStepItemProps) {
  const { t } = useTransClient('chat')
  const isCompleted = !step.isActive

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs',
        step.isActive ? 'bg-primary/10' : 'bg-muted/80',
      )}
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
        <div className={cn(
          'font-medium truncate',
          step.isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground',
        )}
        >
          {step.type === 'tool_call'
            ? `${formatToolName(step.toolName || 'Tool')}${isCompleted ? '' : '...'}`
            : step.type === 'tool_result'
              ? `${formatToolName(step.toolName || 'Tool')} ${t('workflow.toolResult' as any)}`
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
  const initialExpanded = defaultExpanded !== undefined ? defaultExpanded : (isActive !== undefined ? isActive : true)
  const [expanded, setExpanded] = useState(initialExpanded)

  useEffect(() => {
    if (isActive !== undefined) {
      setExpanded(isActive)
    }
  }, [isActive])

  const totalToolCalls = workflowSteps.filter(s => s.type === 'tool_call').length
  const toolResultCount = workflowSteps.filter(s => s.type === 'tool_result').length
  const completedSteps = Math.min(toolResultCount, totalToolCalls)
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
        <div className={cn(
          'pl-2 border-l-2 space-y-1 mt-1.5 ml-1 overflow-y-auto',
          isActive ? 'border-primary/30' : 'border-border',
          styles.workflowDetailList,
        )}
        >
          {workflowSteps.map((step, index) => (
            <WorkflowStepItem key={step.id || index} step={step} />
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkflowSection
