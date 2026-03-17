import { randomBytes } from 'node:crypto'
import {
  McpServerConfig,
  SpawnedProcess,
  SpawnOptions,
} from '@anthropic-ai/claude-agent-sdk'
import { ContentBlockParam } from '@anthropic-ai/sdk/resources'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AitoearnServerClientService } from '@yikart/aitoearn-server-client'
import {
  AppException,
  getCodeMessage,
  NotificationMessageKey,
  NotificationType,
  ResponseCode,
  UserType,
} from '@yikart/common'
import {
  ContentGenerationTaskRepository,
  ContentGenerationTaskStatus,
  Transactional,
} from '@yikart/mongodb'
import { RedisPubSubService } from '@yikart/redis'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { AGENT_TASK_ABORT_CHANNEL } from './agent.constants'
import {
  CreateContentGenerationTaskDto,
  CreateContentGenerationTaskRatingDto,
  ListContentGenerationTaskDto,
  UpdateContentGenerationTaskTitleDto,
} from './agent.dto'
import {
  AgentMessageType,
  AgentMessageVo,
  ContentGenerationTaskChunkVo,
} from './agent.vo'
import { AgentRuntimeService } from './services/agent-runtime.service'

@Injectable()
export class AgentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentService.name)

  constructor(
    private readonly contentGenerateRepository: ContentGenerationTaskRepository,
    private readonly serverClient: AitoearnServerClientService,
    private readonly agentRuntimeService: AgentRuntimeService,
    private readonly redisPubSubService: RedisPubSubService,
  ) { }

  /**
   * 执行 Claude 查询
   * @param systemPromptContent
   * @param enhancedContent
   * @param abortController
   * @param options
   * @param options.includePartialMessages
   * @param options.sessionId
   * @param options.model
   * @param options.taskId
   * @param options.availabilityOperation
   * @param mcpServers
   * @param spawnClaudeCodeProcess
   * @returns
   */
  public claudeQuery(
    systemPromptContent: ContentBlockParam[],
    enhancedContent: ContentBlockParam[],
    abortController: AbortController,
    options: Parameters<AgentRuntimeService['claudeQuery']>[3],
    mcpServers?: Record<string, McpServerConfig>,
    spawnClaudeCodeProcess?: (options: SpawnOptions) => SpawnedProcess,
  ) {
    return this.agentRuntimeService.claudeQuery(
      systemPromptContent,
      enhancedContent,
      abortController,
      options,
      mcpServers,
      spawnClaudeCodeProcess,
    )
  }

  /**
   * 创建内容生成任务
   * @param userId
   * @param userType
   * @param dto
   * @param abortController
   * @param req
   * @param res
   * @returns
   */
  createContentGenerationTask(
    userId: string,
    userType: UserType,
    dto: CreateContentGenerationTaskDto,
    abortController: AbortController,
    req: Request,
    res: Response,
  ): Observable<ContentGenerationTaskChunkVo> {
    return this.agentRuntimeService.createContentGenerationTask({
      userId,
      userType,
      dto,
      abortController,
      req,
      res,
    })
  }

  async getTask(userId: string, taskId: string) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
    return {
      ...task,
      messages: task.messages as Array<AgentMessageVo>,
    }
  }

  async getTaskMessages(userId: string, taskId: string, lastMessageId?: string) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    const allMessages = (task.messages || []) as Array<AgentMessageVo>
    let messages = allMessages

    if (lastMessageId) {
      const index = allMessages.findIndex(msg => 'uuid' in msg && msg.uuid === lastMessageId)
      messages = index === -1 ? [] : allMessages.slice(index + 1)
    }

    return {
      messages,
      status: task.status,
    }
  }

  async getTaskList(userId: string, params: ListContentGenerationTaskDto) {
    return await this.contentGenerateRepository.getUserTasksWithPagination(userId, params)
  }

  async favoriteTask(userId: string, taskId: string) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
    await this.contentGenerateRepository.updateFavoriteById(taskId, new Date())
  }

  async unfavoriteTask(userId: string, taskId: string) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
    await this.contentGenerateRepository.updateFavoriteById(taskId, null)
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
    const success = await this.contentGenerateRepository.softDeleteTask(userId, taskId)
    if (!success) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
  }

  async updateTask(userId: string, taskId: string, dto: UpdateContentGenerationTaskTitleDto) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }
    await this.contentGenerateRepository.updateById(taskId, dto)
  }

  async createRating(userId: string, taskId: string, dto: CreateContentGenerationTaskRatingDto) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    if (task.status !== ContentGenerationTaskStatus.Completed && task.status !== ContentGenerationTaskStatus.RequiresAction) {
      throw new AppException(ResponseCode.AgentTaskStatusInvalid)
    }

    await this.contentGenerateRepository.updateById(taskId, {
      rating: dto.rating,
      ratingComment: dto.comment,
    })
  }

  /**
   * Create a public share token for a task. Only owner can create a share.
   * ttlSeconds optional - default 7 days.
   * Returns { token: string, expiresAt: Date, urlPath: string }
   */
  async createPublicShare(userId: string, taskId: string, ttlSeconds?: number) {
    const task = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    const ttl = typeof ttlSeconds === 'number' ? ttlSeconds : 7 * 24 * 3600
    const expiresAt = new Date(Date.now() + ttl * 1000)

    const token = randomBytes(16).toString('hex')

    await this.contentGenerateRepository.updateById(taskId, {
      publicShareToken: token,
      publicShareExpiresAt: expiresAt,
    })

    return {
      token,
      expiresAt,
    }
  }

  /**
   * Retrieve a task by public share token. Token must exist and not be expired.
   * Returns sanitized task object (no sessionId).
   */
  async getTaskByShareToken(token: string) {
    if (!token) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    const task = await this.contentGenerateRepository.findByPublicShareToken(token)
    if (!task) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    if (task.publicShareExpiresAt && task.publicShareExpiresAt.getTime() < Date.now()) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    return {
      ...task,
      messages: task.messages as Array<AgentMessageVo>,
    }
  }

  /**
   * Forward a task to another user by copying its messages and metadata.
   * Only the owner of the task can forward it.
   * Returns the new task id object: { id: string }
   */
  async forwardTask(userId: string, taskId: string, targetUserId: string) {
    const originalTask = await this.contentGenerateRepository.getUserTask(userId, taskId)
    if (!originalTask) {
      throw new AppException(ResponseCode.AgentTaskNotFound)
    }

    const newTask = await this.contentGenerateRepository.create({
      userId: targetUserId,
      title: originalTask.title ? `Fwd: ${originalTask.title}` : undefined,
      messages: originalTask.messages || [],
      status: originalTask.status || ContentGenerationTaskStatus.Completed,
    })

    await this.serverClient.notification.createForUser({
      userId: targetUserId,
      userType: UserType.User,
      messageKey: NotificationMessageKey.AgentForwarded,
      vars: { taskId: newTask.id },
      type: NotificationType.AgentResult,
      relatedId: newTask.id,
    })

    return { id: newTask.id }
  }

  /**
   * 兜底机制：将超时的 running 任务更新为 error 状态
   * @param timeoutMs 超时时间（毫秒），默认 30 分钟
   */
  @Transactional()
  async recoverTimeoutRunningTasks(timeoutMs: number = 30 * 60 * 1000) {
    const timeoutTasks = await this.contentGenerateRepository.listTimeoutRunningTasks(timeoutMs)

    if (timeoutTasks.length === 0) {
      this.logger.debug('No timeout running tasks found')
      return { updatedCount: 0 }
    }

    const taskIds = timeoutTasks.map(task => task.id)
    this.logger.warn(`Found ${taskIds.length} timeout running tasks: ${taskIds.join(', ')}`)

    const result = await this.contentGenerateRepository.batchUpdateStatus(taskIds, ContentGenerationTaskStatus.Error)

    for (const task of timeoutTasks) {
      const errorMessage = {
        type: AgentMessageType.Error,
        code: ResponseCode.AgentTaskTimeout,
        message: getCodeMessage(ResponseCode.AgentTaskTimeout),
        timestamp: Date.now(),
      }
      await this.contentGenerateRepository.updateMessage(task.id, errorMessage)
    }

    this.logger.debug(`Updated ${result.modifiedCount} timeout running tasks to error status`)

    return { updatedCount: result.modifiedCount }
  }

  async onModuleInit() {
    this.redisPubSubService.on(AGENT_TASK_ABORT_CHANNEL, (taskId: string) => {
      this.agentRuntimeService.abortTask(taskId)
    })
  }

  async onModuleDestroy() {
    this.logger.debug('Agent service is shutting down, wait running tasks')
    await this.agentRuntimeService.waitForRunningTasks()
  }
}
