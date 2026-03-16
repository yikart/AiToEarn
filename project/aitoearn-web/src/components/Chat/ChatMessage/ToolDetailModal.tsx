/**
 * ToolDetailModal - 工具调用详情弹框
 * 展示工具的输入参数和执行结果
 */

'use client'

import type { IWorkflowStep } from '@/store/agent'
import { Wrench } from 'lucide-react'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Modal } from '@/components/ui/modal'

export interface IToolDetailModalProps {
  /** 是否打开弹框 */
  open: boolean
  /** 关闭弹框回调 */
  onOpenChange: (open: boolean) => void
  /** 工具调用步骤数据 */
  step: IWorkflowStep | null
}

/**
 * 格式化工具名称（移除 mcp__ 前缀）
 */
function formatToolName(name: string) {
  return name.replace(/^mcp__\w+__/, '')
}

/**
 * JSON 格式化（美化显示）
 */
function formatJSON(content?: string): string {
  if (!content)
    return ''
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  }
  catch {
    return content
  }
}

/**
 * 结果格式化（尝试 JSON，否则原样显示）
 */
function formatResult(result?: string): string {
  if (!result)
    return ''
  try {
    const parsed = JSON.parse(result)
    return JSON.stringify(parsed, null, 2)
  }
  catch {
    return result
  }
}

/**
 * 弹框内部内容组件（使用 hooks）
 */
const ToolDetailModalContent = memo(
  ({ onOpenChange, step }: { onOpenChange: (open: boolean) => void, step: IWorkflowStep }) => {
    const { t } = useTransClient('chat')

    const title = (
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4" />
        <span>{formatToolName(step.toolName || 'Tool')}</span>
      </div>
    )

    return (
      <Modal
        open
        onCancel={() => onOpenChange(false)}
        title={title}
        footer={null}
        width={600}
        destroyOnClose
        bodyClassName="!py-0"
      >
        {/* 输入参数区域 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-foreground">{t('toolDetail.input')}</h4>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48 whitespace-pre-wrap break-all text-muted-foreground">
            {formatJSON(step.content) || '-'}
          </pre>
        </div>

        {/* 执行结果区域 */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-foreground">{t('toolDetail.output')}</h4>
          {step.result ? (
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-64 whitespace-pre-wrap break-all text-muted-foreground">
              {formatResult(step.result)}
            </pre>
          ) : (
            <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground/70">
              {t('toolDetail.noResult')}
            </div>
          )}
        </div>
      </Modal>
    )
  },
)

ToolDetailModalContent.displayName = 'ToolDetailModalContent'

/**
 * 工具详情弹框（外层组件，控制渲染时机，避免 i18n 闪烁）
 */
export function ToolDetailModal({ open, onOpenChange, step }: IToolDetailModalProps) {
  // 只在打开时渲染内部组件，避免动态加载 namespace 导致闪烁
  if (!open || !step)
    return null

  return <ToolDetailModalContent onOpenChange={onOpenChange} step={step} />
}

export default ToolDetailModal
