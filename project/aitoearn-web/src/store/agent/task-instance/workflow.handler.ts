/**
 * TaskInstance - 工作流处理模块
 * 处理工作流步骤、工具调用等
 */

import type { IMessageStep, IWorkflowStep } from '../agent.types'
import type { IWorkflowHandlerContext } from './task-instance.types'

// ============ 步骤管理 ============

/**
 * 开始新步骤
 */
export function startNewStep(ctx: IWorkflowHandlerContext): void {
  // 保存当前步骤（如果有文本内容或工作流步骤）
  const streamingText = ctx.getStreamingText()
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()

  if (streamingText.trim() || currentStepWorkflow.length > 0) {
    saveCurrentStepToMessage(ctx)
  }

  // 重置当前步骤状态
  ctx.setStreamingText('')
  ctx.setCurrentStepWorkflow([])
  ctx.incrementCurrentStepIndex()

  console.log(
    `[WorkflowHandler] Started new step: ${ctx.getCurrentStepIndex()} for task: ${ctx.getTaskId()}`,
  )
}

/**
 * 保存当前步骤到消息中
 */
export function saveCurrentStepToMessage(ctx: IWorkflowHandlerContext): void {
  const streamingText = ctx.getStreamingText()
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()
  const currentStepIndex = ctx.getCurrentStepIndex()
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()

  const hasContent = streamingText.trim()
  const hasWorkflow = currentStepWorkflow.length > 0

  if (currentStepIndex < 0 || (!hasContent && !hasWorkflow)) {
    return
  }

  const stepData: IMessageStep = {
    id: `step-${currentStepIndex}-saved`,
    content: streamingText,
    workflowSteps: [...currentStepWorkflow],
    isActive: false,
    timestamp: Date.now(),
  }

  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentAssistantMessageId) {
        const steps = m.steps ? [...m.steps] : []
        // 查找匹配的步骤
        const liveStepId = `step-${currentStepIndex}-live`
        const existingIndex = steps.findIndex(
          (s: IMessageStep) => s.id === liveStepId || s.id.startsWith(`step-${currentStepIndex}-`),
        )
        if (existingIndex >= 0) {
          const existingStep = steps[existingIndex]
          steps[existingIndex] = {
            ...stepData,
            workflowSteps:
              stepData.workflowSteps && stepData.workflowSteps.length > 0
                ? stepData.workflowSteps
                : existingStep.workflowSteps || [],
          }
        }
        else {
          steps.push(stepData)
        }
        return { ...m, steps }
      }
      return m
    }),
  }))
}

// ============ 工作流步骤管理 ============

/**
 * 添加工作流步骤
 * 根据 currentStepIndex 找到或创建对应的步骤，避免工具调用被错误地添加到旧步骤中
 */
export function addWorkflowStep(ctx: IWorkflowHandlerContext, step: IWorkflowStep): void {
  ctx.pushToCurrentStepWorkflow(step)
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()
  const currentStepIndex = ctx.getCurrentStepIndex()

  // 更新当前任务的工作流步骤（用于UI显示）
  ctx.updateData(data => ({
    workflowSteps: [
      ...data.workflowSteps.map((s: IWorkflowStep) => ({ ...s, isActive: false })),
      step,
    ],
  }))

  // 实时更新消息中的当前步骤的工作流
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentAssistantMessageId) {
        const steps = m.steps ? [...m.steps] : []

        // 根据 currentStepIndex 找到对应的步骤
        const currentStepId = `step-${currentStepIndex}-live`
        const savedStepId = `step-${currentStepIndex}-saved`
        const existingIndex = steps.findIndex(
          (s: IMessageStep) => s.id === currentStepId || s.id === savedStepId,
        )

        if (existingIndex >= 0) {
          // 更新已存在的步骤
          const existingStep = steps[existingIndex]
          steps[existingIndex] = {
            ...existingStep,
            workflowSteps: [...(existingStep.workflowSteps || []), step],
          }
        }
        else {
          // 创建新步骤
          steps.push({
            id: currentStepId,
            content: '',
            workflowSteps: [step],
            isActive: true,
            timestamp: Date.now(),
          })
        }

        return { ...m, steps }
      }
      return m
    }),
  }))
}

/**
 * 更新最后一个工作流步骤
 */
export function updateLastWorkflowStep(
  ctx: IWorkflowHandlerContext,
  updater: (step: IWorkflowStep) => IWorkflowStep,
): void {
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()

  // 更新当前步骤的工作流
  if (currentStepWorkflow.length > 0) {
    const updatedWorkflow = [...currentStepWorkflow]
    const lastIndex = updatedWorkflow.length - 1
    updatedWorkflow[lastIndex] = updater(updatedWorkflow[lastIndex])
    ctx.setCurrentStepWorkflow(updatedWorkflow)
  }

  // 更新当前任务的工作流步骤
  ctx.updateData((data) => {
    const steps = [...data.workflowSteps]
    if (steps.length > 0) {
      steps[steps.length - 1] = updater(steps[steps.length - 1])
    }
    return { workflowSteps: steps }
  })

  // 更新消息中的工作流步骤
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentAssistantMessageId) {
        const steps = m.steps ? [...m.steps] : []
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1]
          if (lastStep.workflowSteps && lastStep.workflowSteps.length > 0) {
            const workflowSteps = [...lastStep.workflowSteps]
            workflowSteps[workflowSteps.length - 1] = updater(
              workflowSteps[workflowSteps.length - 1],
            )
            steps[steps.length - 1] = { ...lastStep, workflowSteps }
            return { ...m, steps }
          }
        }
      }
      return m
    }),
  }))
}

// ============ 工具调用处理 ============

/**
 * 处理工具调用完成
 */
export function handleToolCallComplete(
  ctx: IWorkflowHandlerContext,
  toolName: string,
  toolInput: string,
): void {
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()

  // 更新当前步骤的工作流
  const stepIndex = currentStepWorkflow.findIndex(
    s => s.type === 'tool_call' && s.toolName === toolName && s.isActive,
  )
  if (stepIndex >= 0) {
    const updatedWorkflow = [...currentStepWorkflow]
    updatedWorkflow[stepIndex] = {
      ...updatedWorkflow[stepIndex],
      content: toolInput,
      isActive: false,
    }
    ctx.setCurrentStepWorkflow(updatedWorkflow)
  }

  // 更新当前任务的工作流步骤
  ctx.updateData((data) => {
    const steps = [...data.workflowSteps]
    const globalStepIndex = steps.findIndex(
      s => s.type === 'tool_call' && s.toolName === toolName && s.isActive,
    )
    if (globalStepIndex >= 0) {
      steps[globalStepIndex] = {
        ...steps[globalStepIndex],
        content: toolInput,
        isActive: false,
      }
    }
    return { workflowSteps: steps }
  })

  // 记录到 markdown 消息
  const displayName = toolName.replace(/^mcp__\w+__/, '')
  ctx.addMarkdownMessage(`🔧 **Tool Call**: \`${displayName}\`\n\`\`\`json\n${toolInput}\n\`\`\``)
}

/**
 * 处理工具结果
 * 找到最近的没有 result 的 tool_call 步骤，更新其 result 字段
 */
export function handleToolResult(ctx: IWorkflowHandlerContext, resultText: string): void {
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()

  // 找到最近的没有 result 的 tool_call 步骤
  const lastToolCallIndex = [...currentStepWorkflow]
    .reverse()
    .findIndex(s => s.type === 'tool_call' && !s.result)

  if (lastToolCallIndex === -1) {
    console.warn('[WorkflowHandler] No pending tool_call found for tool_result')
    return
  }

  // 转换为正向索引
  const stepIndex = currentStepWorkflow.length - 1 - lastToolCallIndex
  const toolCallStep = currentStepWorkflow[stepIndex]

  // 更新当前步骤的工作流
  const updatedWorkflow = [...currentStepWorkflow]
  updatedWorkflow[stepIndex] = {
    ...updatedWorkflow[stepIndex],
    result: resultText,
    isActive: false,
  }
  ctx.setCurrentStepWorkflow(updatedWorkflow)

  // 更新全局 workflowSteps
  ctx.updateData((data) => {
    const steps = [...data.workflowSteps]
    const globalStepIndex = steps.findIndex(
      s => s.id === toolCallStep.id && s.type === 'tool_call' && !s.result,
    )
    if (globalStepIndex >= 0) {
      steps[globalStepIndex] = {
        ...steps[globalStepIndex],
        result: resultText,
        isActive: false,
      }
    }
    return { workflowSteps: steps }
  })

  // 更新消息中的工作流步骤
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentAssistantMessageId) {
        const steps = m.steps ? [...m.steps] : []
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1]
          if (lastStep.workflowSteps && lastStep.workflowSteps.length > 0) {
            const workflowSteps = [...lastStep.workflowSteps]
            const msgStepIndex = workflowSteps.findIndex(
              s => s.id === toolCallStep.id && s.type === 'tool_call' && !s.result,
            )
            if (msgStepIndex >= 0) {
              workflowSteps[msgStepIndex] = {
                ...workflowSteps[msgStepIndex],
                result: resultText,
                isActive: false,
              }
              steps[steps.length - 1] = { ...lastStep, workflowSteps }
              return { ...m, steps }
            }
          }
        }
      }
      return m
    }),
  }))

  // 记录到 markdown 消息
  const displayResult = resultText.length > 500 ? `${resultText.substring(0, 500)}...` : resultText
  ctx.addMarkdownMessage(`📋 **Tool Result**:\n\`\`\`\n${displayResult}\n\`\`\``)
}

// ============ 文本增量处理 ============

/**
 * 处理文本增量更新
 */
export function handleTextDelta(ctx: IWorkflowHandlerContext): void {
  const streamingText = ctx.getStreamingText()
  const currentStepWorkflow = ctx.getCurrentStepWorkflow()
  const currentStepIndex = ctx.getCurrentStepIndex()
  const currentAssistantMessageId = ctx.getCurrentAssistantMessageId()

  // 更新当前任务的 streamingText 和 markdownMessages
  ctx.updateData((data) => {
    const newMessages = [...data.markdownMessages]
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
      newMessages[newMessages.length - 1] = `🤖 ${streamingText}`
    }
    else {
      newMessages.push(`🤖 ${streamingText}`)
    }
    return {
      streamingText,
      markdownMessages: newMessages,
    }
  })

  // 更新消息列表中的 assistant 消息
  ctx.updateData((data) => {
    return {
      messages: data.messages.map((m) => {
        // 使用实例的 currentAssistantMessageId，或回退到最后一个 assistant 消息
        const targetAssistantId
          = currentAssistantMessageId
            || (() => {
              const msgs = data.messages || []
              for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].role === 'assistant')
                  return msgs[i].id
              }
              return ''
            })()

        if (m.id === targetAssistantId) {
          const steps = m.steps || []
          const updatedSteps = [...steps]
          const currentStepId = `step-${currentStepIndex}-live`
          const currentStepData: IMessageStep = {
            id: currentStepId,
            content: streamingText,
            workflowSteps: [...currentStepWorkflow],
            isActive: true,
            timestamp: Date.now(),
          }

          const existingStepIndex = updatedSteps.findIndex(
            (s: IMessageStep) => s.id === currentStepId || s.id === `step-${currentStepIndex}-saved`,
          )

          if (existingStepIndex >= 0) {
            updatedSteps[existingStepIndex] = currentStepData
          }
          else {
            updatedSteps.push(currentStepData)
          }

          const totalContent = updatedSteps.map((s: IMessageStep) => s.content).join('\n\n')

          return {
            ...m,
            content: totalContent,
            status: 'streaming' as const,
            steps: updatedSteps,
          }
        }
        return m
      }),
    }
  })
}
