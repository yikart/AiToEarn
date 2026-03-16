import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import { join } from 'node:path'
import {
  AbortError,
  createSdkMcpServer,
  McpServerConfig,
  Options,
  OutputFormat,
  query,
  SDKMessage,
  SpawnedProcess,
  SpawnOptions,
} from '@anthropic-ai/claude-agent-sdk'
import { ContentBlockParam } from '@anthropic-ai/sdk/resources'
import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AitoearnServerClientService } from '@yikart/aitoearn-server-client'
import { StorageProvider } from '@yikart/assets'
import {
  AppException,
  CreditsType,
  getExceptionPayload,
  NotificationMessageKey,
  NotificationType,
  ResponseCode,
  UserType,
  WithLoggerContext,
} from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import {
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  ContentGenerationTask,
  ContentGenerationTaskRepository,
  ContentGenerationTaskStatus,
} from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { Request, Response } from 'express'
import { firstValueFrom, from, interval, merge, Observable, of, throwError } from 'rxjs'
import { catchError, concatMap, filter, finalize, first, map, mergeMap, share, skip, takeUntil, tap, timeout } from 'rxjs/operators'
import { z } from 'zod'
import { RedlockKey } from '../../../common/enums'
import { config } from '../../../config'
import { McpServerName, POLLING_TASK_AGENT_PROMPT, SKILL_ANALYZER_AGENT_PROMPT, SYSTEM_PROMPT } from '../agent.constants'
import { CreateContentGenerationTaskDto } from '../agent.dto'
import { enhancePrompt, filterHeaders, normalizePrompt, sanitizeMessage, shouldFilterSyntheticMessage } from '../agent.utils'
import {
  AgentMessageType,
  AgentMessageVoHelper,
  ContentGenerationTaskAgentChunkVo,
  ContentGenerationTaskChunkVo,
  ContentGenerationTaskErrorChunkVo,
  ContentGenerationTaskInitChunkVo,
  ContentGenerationTaskKeepAliveChunkVo,
  ContentGenerationTaskResultSchema,
  ContentGenerationTaskResultUnionSchema,
} from '../agent.vo'
import { ImageEditMcp, ImageEditToolName } from '../mcp/image-edit.mcp'
import { successResult, wrapTool } from '../mcp/mcp.utils'
import { MediaMcp, MediaToolName } from '../mcp/media.mcp'
import { SubtitleMcp, SubtitleToolName } from '../mcp/subtitle.mcp'
import { UtilMcp, UtilToolName } from '../mcp/util.mcp'
import { VideoUtilsMcp, VideoUtilsToolName } from '../mcp/video-utils.mcp'
import { AideoMcp, AideoToolName } from '../mcp/volcengine/aideo.mcp'
import { DramaRecapMcp, DramaRecapToolName } from '../mcp/volcengine/drama-recap.mcp'
import { StyleTransferMcp, StyleTransferToolName } from '../mcp/volcengine/style-transfer.mcp'
import { VideoEditMcp, VideoEditToolName } from '../mcp/volcengine/video-edit.mcp'

export interface ClaudeQueryOptions {
  includePartialMessages?: boolean
  sessionId?: string
  model?: string
  taskId?: string
  maxBudgetUsd?: number
  outputFormat?: OutputFormat
  persistSession?: boolean
  availabilityOperation?: string
}

type TaskResult = z.infer<typeof ContentGenerationTaskResultUnionSchema>

export interface RuntimeRunningTaskInfo {
  taskId: string
  userId: string
  abortController: AbortController
  claudeCodeProcess?: ReturnType<typeof spawn>
  completionPromise: Promise<void>
  sessionId?: string
}

@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name)
  private readonly sessionDir = join(process.cwd(), '.claude-session')
  private readonly projectDir = this.sessionDir.replace(/\//g, '-').replace(/\./g, '-')
  private readonly runningTasks = new Map<string, RuntimeRunningTaskInfo>()

  constructor(
    private readonly mediaMcp: MediaMcp,
    private readonly aideoMcp: AideoMcp,
    private readonly utilMcp: UtilMcp,
    private readonly videoEditMcp: VideoEditMcp,
    private readonly aiLogRepo: AiLogRepository,
    private readonly contentGenerateRepository: ContentGenerationTaskRepository,
    private readonly creditsHelper: CreditsHelperService,
    private readonly serverClient: AitoearnServerClientService,
    private readonly dramaRecapMcp: DramaRecapMcp,
    private readonly videoUtilsMcp: VideoUtilsMcp,
    private readonly styleTransferMcp: StyleTransferMcp,
    private readonly imageEditMcp: ImageEditMcp,
    private readonly subtitleMcp: SubtitleMcp,
    private readonly storageProvider: StorageProvider,
    private readonly queueService: QueueService,
  ) {}

  private getTaskCwd(taskId: string): string {
    return join(this.sessionDir, 'tasks', taskId)
  }

  private getTaskProjectDir(taskId: string): string {
    const taskCwd = this.getTaskCwd(taskId)
    return taskCwd.replace(/\//g, '-').replace(/\./g, '-')
  }

  private getMessageType(chunk: SDKMessage): AgentMessageType.Assistant | AgentMessageType.User | AgentMessageType.Result | AgentMessageType.System | AgentMessageType.StreamEvent | AgentMessageType.ToolProgress | AgentMessageType.AuthStatus {
    switch (chunk.type) {
      case 'assistant':
        return AgentMessageType.Assistant
      case 'user':
        return AgentMessageType.User
      case 'result':
        return AgentMessageType.Result
      case 'system':
        return AgentMessageType.System
      case 'stream_event':
        return AgentMessageType.StreamEvent
      case 'tool_progress':
        return AgentMessageType.ToolProgress
      case 'auth_status':
        return AgentMessageType.AuthStatus
      default:
        return AgentMessageType.System
    }
  }

  private generateAllowedTools(mcpServers: Record<string, McpServerConfig>): string[] {
    const allowedTools: string[] = []

    for (const serverName of Object.keys(mcpServers)) {
      let toolNames: string[] = []

      switch (serverName) {
        case McpServerName.MediaGeneration:
          toolNames = Object.values(MediaToolName)
          break
        case McpServerName.Util:
          toolNames = [UtilToolName.GetCurrentTime, UtilToolName.Wait]
          break
        case McpServerName.SessionTools:
          toolNames = [UtilToolName.OutputTaskResult, UtilToolName.SetTitle]
          break
        case McpServerName.Aideo:
          toolNames = Object.values(AideoToolName)
          break
        case McpServerName.VideoEdit:
          toolNames = Object.values(VideoEditToolName)
          break
        case McpServerName.DramaRecap:
          toolNames = Object.values(DramaRecapToolName)
          break
        case McpServerName.VideoUtils:
          toolNames = Object.values(VideoUtilsToolName)
          break
        case McpServerName.StyleTransfer:
          toolNames = Object.values(StyleTransferToolName)
          break
        case McpServerName.ImageEdit:
          toolNames = Object.values(ImageEditToolName)
          break
        case McpServerName.Subtitle:
          toolNames = Object.values(SubtitleToolName)
          break
        default:
          continue
      }

      for (const toolName of toolNames) {
        allowedTools.push(`mcp__${serverName}__${toolName}`)
      }
    }

    return allowedTools
  }

  public claudeQuery(
    systemPromptContent: ContentBlockParam[],
    enhancedContent: ContentBlockParam[],
    abortController: AbortController,
    options: ClaudeQueryOptions,
    mcpServers?: Record<string, McpServerConfig>,
    spawnClaudeCodeProcess?: (options: SpawnOptions) => SpawnedProcess,
  ) {
    const taskCwd = options.taskId
      ? this.getTaskCwd(options.taskId)
      : this.sessionDir

    if (options.taskId && !fs.existsSync(taskCwd)) {
      fs.mkdirSync(taskCwd, { recursive: true })
    }

    const queryOptions: Options = {
      permissionMode: 'default',
      includePartialMessages: options.includePartialMessages ?? false,
      model: options.model,
      cwd: taskCwd,
      settingSources: ['project', 'user'],
      env: {
        ...process.env,
        DEBUG_CLAUDE_AGENT_SDK: '1',
        ANTHROPIC_AUTH_TOKEN: 'ccr',
        ANTHROPIC_API_KEY: '',
        ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456',
        NO_PROXY: '127.0.0.1',
        DISABLE_TELEMETRY: 'true',
        DISABLE_COST_WARNINGS: 'true',
        HOME: this.sessionDir,
      },
      mcpServers,
      allowedTools: this.generateAllowedTools(mcpServers ?? {}),
      tools: [
        'Task',
        'TaskOutput',
        'Read',
        'WebFetch',
        'TodoWrite',
        'TaskStop',
        'Skill',
        'ListMcpResourcesTool',
        'ReadMcpResourceTool',
      ],
      agents: {
        'polling-task': {
          description: 'AI task polling specialist for monitoring asynchronous video/media generation task status. Use when polling task status, checking completion, or handling timeouts.',
          model: 'haiku',
          mcpServers: [
            {
              ...(mcpServers?.[McpServerName.MediaGeneration] && { [McpServerName.MediaGeneration]: mcpServers[McpServerName.MediaGeneration] }),
              ...(mcpServers?.[McpServerName.Util] && { [McpServerName.Util]: mcpServers[McpServerName.Util] }),
              ...(mcpServers?.[McpServerName.Aideo] && { [McpServerName.Aideo]: mcpServers[McpServerName.Aideo] }),
              ...(mcpServers?.[McpServerName.VideoEdit] && { [McpServerName.VideoEdit]: mcpServers[McpServerName.VideoEdit] }),
              ...(mcpServers?.[McpServerName.DramaRecap] && { [McpServerName.DramaRecap]: mcpServers[McpServerName.DramaRecap] }),
              ...(mcpServers?.[McpServerName.VideoUtils] && { [McpServerName.VideoUtils]: mcpServers[McpServerName.VideoUtils] }),
              ...(mcpServers?.[McpServerName.StyleTransfer] && { [McpServerName.StyleTransfer]: mcpServers[McpServerName.StyleTransfer] }),
            },
          ],
          tools: [
            'Task',
            'TaskOutput',
            'Read',
            'NotebookEdit',
            'WebFetch',
            'TodoWrite',
            'TaskStop',
            'Skill',
            'ToolSearch',
            'ListMcpResourcesTool',
            'ReadMcpResourceTool',
            `mcp__${McpServerName.MediaGeneration}__getVeoVideoStatus`,
            `mcp__${McpServerName.MediaGeneration}__getVideoStatus`,
            `mcp__${McpServerName.MediaGeneration}__getSoraCharacter`,
            `mcp__${McpServerName.Aideo}__getAideoTaskStatus`,
            `mcp__${McpServerName.VideoEdit}__getVideoEditTaskStatus`,
            `mcp__${McpServerName.StyleTransfer}__getVideoStyleTransferStatus`,
            `mcp__${McpServerName.DramaRecap}__getDramaRecapTaskStatus`,
            `mcp__${McpServerName.Util}__wait`,
            `mcp__${McpServerName.Util}__getCurrentTime`,
          ],
          prompt: POLLING_TASK_AGENT_PROMPT,
          skills: [],
        },
        'skill-analyzer': {
          description: 'Analyzes user requests to determine which skills are needed for content generation tasks. Call this agent FIRST before any generation to identify required skills.',
          model: 'haiku',
          mcpServers: [],
          tools: [],
          prompt: SKILL_ANALYZER_AGENT_PROMPT,
          skills: [],
        },
      },
      canUseTool: async (name, input, options) => {
        this.logger.debug({ options, name, input }, 'Received tool request')
        return { behavior: 'allow', updatedInput: input }
      },
      hooks: {
        PostToolUse: [
          {
            hooks: [
              async (input) => {
                if (input.hook_event_name === 'PostToolUse') {
                  this.logger.debug({ input }, 'Received PostToolUse hook')
                  const response = input.tool_response
                  if (Array.isArray(response)) {
                    const updatedResponse = response.map<ContentBlockParam>((block) => {
                      if (block.type === 'text' && typeof block.text === 'string' && block.text.startsWith('[Resource link: Image')) {
                        const url = block.text.split('] ')[1]
                        return {
                          type: 'image',
                          source: {
                            type: 'url',
                            url,
                          },
                        }
                      }
                      return block
                    })
                    return {
                      hookSpecificOutput: {
                        hookEventName: 'PostToolUse',
                        updatedMCPToolOutput: updatedResponse,
                      },
                    }
                  }
                }
                return {}
              },
            ],
          },
        ],
      },
      maxBudgetUsd: options.maxBudgetUsd,
      outputFormat: options.outputFormat,
      persistSession: options.persistSession,
      spawnClaudeCodeProcess,
      abortController,
    }

    if (options.sessionId) {
      queryOptions.resume = options.sessionId
    }

    const content = [
      ...systemPromptContent,
      ...enhancedContent,
    ]

    this.logger.debug({ content }, 'Content')

    const req = query({
      prompt: (async function* () {
        yield {
          session_id: options.sessionId || '',
          type: 'user',
          message: {
            role: 'user',
            content,
          },
          parent_tool_use_id: null,
        }
      })(),
      options: queryOptions,
    })

    return (async function* () {
      for await (const chunk of req) {
        yield chunk
      }
    })()
  }

  // @Cron(CronExpression.EVERY_HOUR)
  @Redlock(RedlockKey.AgentHealthCheck, 600, { throwOnFailure: false })
  @WithLoggerContext()
  async runHealthCheck(): Promise<void> {
    const abortController = new AbortController()
    const res = this.claudeQuery(
      [{ type: 'text', text: '' }],
      [{ type: 'text', text: 'Hello, how are you?' }],
      abortController,
      {
        includePartialMessages: true,
        availabilityOperation: 'healthCheck',
      },
    )

    const timeoutMs = 5 * 60 * 1000
    const chunks: unknown[] = []

    await firstValueFrom(
      from(res).pipe(
        timeout({
          each: timeoutMs,
          with: () => throwError(() => new Error('Timeout')),
        }),
        tap(chunk => chunks.push(chunk)),
        first(chunk => chunk.type === 'stream_event'),
        map(() => true),
        catchError((error) => {
          this.logger.error({ error, chunks }, '健康检查失败')
          return of(false)
        }),
      ),
    )
    abortController.abort()
  }

  createContentGenerationTask(params: {
    userId: string
    userType: UserType
    dto: CreateContentGenerationTaskDto
    abortController: AbortController
    req: Request
    res: Response
  }): Observable<ContentGenerationTaskChunkVo> {
    const {
      userId,
      userType,
      dto,
      abortController,
      req,
      res,
    } = params

    return from(this.initializeTask(userId, userType, dto, abortController, req)).pipe(
      mergeMap(({ taskId, sessionId: initialSessionId, abortController, mcpServers, maxBudgetUsd }) => {
        let sessionId = initialSessionId
        let completionResolver: () => void
        const completionPromise = new Promise<void>((resolve) => {
          completionResolver = resolve
        })

        const taskInfo: RuntimeRunningTaskInfo = {
          taskId,
          userId,
          abortController,
          claudeCodeProcess: undefined,
          completionPromise,
          sessionId,
        }
        this.runningTasks.set(taskId, taskInfo)

        abortController.signal.addEventListener('abort', () => {
          this.logger.warn({
            taskId,
            sessionId: taskInfo.sessionId,
            userId,
          }, `Task ${taskId} was aborted`)
          void this.contentGenerateRepository.updateStatus(taskId, ContentGenerationTaskStatus.Aborted)
        })

        const normalizedContent = normalizePrompt(dto.prompt)
        const enhancedContent = enhancePrompt(normalizedContent)

        const userMessage = {
          type: 'user',
          content: normalizedContent,
        }

        void this.contentGenerateRepository.updateMessage(taskId, userMessage)

        const systemPromptContent = this.buildSystemPromptContent(null)

        let taskResult: TaskResult | undefined

        const outputTaskResultTool = wrapTool(
          this.logger,
          UtilToolName.OutputTaskResult,
          'output task result JSON, the result will be included in the completion message.',
          ContentGenerationTaskResultSchema.shape,
          async (args) => {
            taskResult = args.result
            return successResult('Task result submitted successfully')
          },
        )

        const [setTitleTool, titleUpdate$, completeTitleUpdate] = this.utilMcp.createSetTitleTool(taskId)

        const sessionToolsMcp = createSdkMcpServer({
          name: McpServerName.SessionTools,
          version: '1.0.0',
          tools: [outputTaskResultTool, setTitleTool],
        })

        const queryGenerator = this.claudeQuery(
          systemPromptContent,
          enhancedContent,
          abortController,
          {
            includePartialMessages: dto.includePartialMessages ?? false,
            sessionId,
            model: dto.model,
            taskId,
            maxBudgetUsd,
          },
          {
            [McpServerName.SessionTools]: sessionToolsMcp,
            ...mcpServers,
          },
          (options: SpawnOptions): SpawnedProcess => {
            const childProcess = spawn(options.command, options.args, {
              cwd: options.cwd,
              env: options.env,
              signal: abortController.signal,
              stdio: ['pipe', 'pipe', 'pipe'],
              windowsHide: true,
            })
            childProcess.stderr.on('data', (data) => {
              this.logger.debug({ taskId, sessionId }, `Received Claude DEBUG Log: ${data}`)
            })
            childProcess.on('exit', (code) => {
              this.logger.debug({ taskId, sessionId, code }, `Claude Code process exited with code ${code}`)
            })

            taskInfo.claudeCodeProcess = childProcess

            return childProcess
          },
        )

        const messageStream$ = this.createMessageStream(queryGenerator).pipe(share())

        const firstMessage$ = messageStream$.pipe(
          first(),
          concatMap(async (chunk) => {
            const extractedSessionId = 'session_id' in chunk ? chunk.session_id : undefined

            this.logger.debug({ taskId, chunk }, `Task ${taskId} first message received`)

            if (extractedSessionId) {
              await this.contentGenerateRepository.updateById(taskId, {
                sessionId: extractedSessionId,
              })
              sessionId = extractedSessionId
              taskInfo.sessionId = extractedSessionId

              taskInfo.completionPromise
                .then(() => {
                  this.logger.log({ taskId: taskInfo.taskId, sessionId }, `Task ${taskInfo.taskId} completed during shutdown`)
                })
              this.logger.debug({ taskId, sessionId: extractedSessionId }, `Task ${taskId} sessionId saved: ${extractedSessionId}`)
            }

            return ContentGenerationTaskInitChunkVo.create({
              type: AgentMessageType.Init,
              taskId,
              messages: undefined,
            })
          }),
        )

        const restMessages$ = messageStream$.pipe(
          tap((chunk) => {
            if (chunk.type !== 'stream_event') {
              this.logger.debug({ taskId, sessionId, chunk: sanitizeMessage(chunk) }, `Received message for task ${taskId}`)
            }
          }),
          skip(1),
          filter(chunk => !shouldFilterSyntheticMessage(chunk)),
          concatMap(async (chunk) => {
            return this.transformMessage(chunk, taskId, userId, userType, taskResult, sessionId)
          }),
        )

        const completionSignal$ = new Observable<null>((subscriber) => {
          messageStream$.subscribe({
            complete: () => subscriber.next(null),
            error: () => subscriber.next(null),
          })
        })

        const keepAlive$ = interval(5000).pipe(
          map(() => ContentGenerationTaskKeepAliveChunkVo.create({
            type: AgentMessageType.KeepAlive,
          })),
          takeUntil(completionSignal$),
        )

        const titleUpdateStream$ = titleUpdate$.pipe(
          takeUntil(completionSignal$),
        )

        return merge(
          firstMessage$,
          restMessages$,
          keepAlive$,
          titleUpdateStream$,
        ).pipe(
          catchError((error) => {
            this.logger.error(Object.assign(error, { taskId, sessionId }), `Error in task ${taskId}, session ${sessionId}`)
            if (error instanceof AbortError) {
              this.logger.debug({ taskId, sessionId }, `Task ${taskId} aborted`)
              return of()
            }

            void this.contentGenerateRepository.updateStatus(taskId, ContentGenerationTaskStatus.Error)

            const payload = getExceptionPayload(error)
            const errorChunk = ContentGenerationTaskErrorChunkVo.create({
              type: AgentMessageType.Error,
              ...payload,
              timestamp: Date.now(),
            })

            void this.contentGenerateRepository.updateMessage(taskId, errorChunk)

            return of(errorChunk)
          }),
          finalize(async () => {
            completeTitleUpdate()

            if (!res.closed) {
              res.end()
            }

            if (taskInfo.claudeCodeProcess) {
              this.logger.debug({ taskId, sessionId }, `正在关闭任务 ${taskId} 的子进程`)
              taskInfo.claudeCodeProcess.kill()
            }

            if (sessionId) {
              await this.uploadAgentSession(sessionId, taskId)
            }

            completionResolver()
            this.runningTasks.delete(taskId)

            // void this.queueService.addAgentTaskAnalysisJob({ taskId, userId })

            this.logger.log({
              taskId,
              sessionId,
              userId,
            }, `Task ${taskId} finished`)
          }),
        )
      }),
      catchError((error) => {
        this.logger.error(error, 'Error in createContentGenerationTask')

        const payload = getExceptionPayload(error)
        const errorChunk = ContentGenerationTaskErrorChunkVo.create({
          type: AgentMessageType.Error,
          ...payload,
          timestamp: Date.now(),
        })

        return of(errorChunk)
      }),
    )
  }

  abortTask(taskId: string): void {
    const taskInfo = this.runningTasks.get(taskId)
    if (!taskInfo || taskInfo.abortController.signal.aborted) {
      return
    }

    this.logger.debug({ taskId, sessionId: taskInfo.sessionId }, `Aborting task ${taskId} via Redis broadcast`)
    taskInfo.abortController.abort()
  }

  async waitForRunningTasks(): Promise<void> {
    const memoryTasks = Array.from(this.runningTasks.values())

    if (memoryTasks.length === 0) {
      return
    }

    const waitPromises = memoryTasks.map(taskInfo =>
      taskInfo.completionPromise
        .then(() => {
          this.logger.log({ taskId: taskInfo.taskId }, `Task ${taskInfo.taskId} completed during shutdown`)
        })
        .catch((error) => {
          this.logger.error({ error, taskId: taskInfo.taskId }, `Task ${taskInfo.taskId} failed during shutdown`)
        }),
    )
    await Promise.all(waitPromises)
  }

  private async initializeTask(
    userId: string,
    userType: UserType,
    dto: CreateContentGenerationTaskDto,
    abortController: AbortController,
    req: Request,
  ): Promise<{
    taskId: string
    sessionId: string | undefined
    historicalMessages: Array<Record<string, unknown>>
    abortController: AbortController
    mcpServers: Record<string, McpServerConfig>
    maxBudgetUsd?: number
  }> {
    let maxBudgetUsd: number | undefined
    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance <= 0) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
      maxBudgetUsd = balance / 100
      this.logger.debug({ userId, balance, maxBudgetUsd }, 'User credits available')
    }

    let task
    let originalTask
    let sessionId: string | undefined
    let historicalMessages: Array<Record<string, unknown>> = []

    if (dto.taskId) {
      const originalTaskId = dto.taskId
      this.logger.debug({ taskId: originalTaskId }, `Resuming conversation for task ${originalTaskId}`)

      originalTask = await this.contentGenerateRepository.getByUserIdAndId(userId, originalTaskId)
      if (!originalTask) {
        this.logger.warn({ taskId: originalTaskId }, `Task ${originalTaskId} not found for user ${userId}`)
        throw new AppException(ResponseCode.AgentTaskNotFound)
      }

      sessionId = originalTask.sessionId
      if (!sessionId) {
        this.logger.warn({ taskId: originalTaskId }, `Task ${originalTaskId} has no sessionId, cannot resume`)
        throw new AppException(ResponseCode.AgentTaskNotFound)
      }

      this.logger.debug({ taskId: originalTaskId, sessionId }, `Task ${originalTaskId} resuming with sessionId: ${sessionId}`)
      task = originalTask
      historicalMessages = originalTask.messages || []

      await this.downloadAgentSession(originalTask)
    }
    else {
      task = await this.contentGenerateRepository.create({
        userId,
      })
      this.logger.debug({ taskId: task.id }, `Created new task ${task.id} for user ${userId}`)
    }

    await this.contentGenerateRepository.updateStatus(task.id, ContentGenerationTaskStatus.Running)

    const headers = filterHeaders(req.headers)
    this.logger.debug({ headers }, 'mcp headers')
    const mcpServers: Record<string, McpServerConfig> = {
      [McpServerName.MediaGeneration]: this.mediaMcp.createServer(userId, userType),
      [McpServerName.Util]: this.utilMcp.server,
      [McpServerName.Aideo]: this.aideoMcp.createServer(userId, userType),
      [McpServerName.VideoEdit]: this.videoEditMcp.createServer(userId, userType),
      [McpServerName.DramaRecap]: this.dramaRecapMcp.createServer(userId, userType),
      [McpServerName.VideoUtils]: this.videoUtilsMcp.createServer(userId, userType),
      [McpServerName.StyleTransfer]: this.styleTransferMcp.createServer(userId, userType),
      [McpServerName.ImageEdit]: this.imageEditMcp.createServer(userId, userType),
      // [McpServerName.Subtitle]: this.subtitleMcp.createServer(userId, userType),
      [McpServerName.Account]: {
        type: 'http',
        url: `${config.serverClient.baseUrl}/account/mcp`,
        headers,
      },
      [McpServerName.Content]: {
        type: 'http',
        url: `${config.serverClient.baseUrl}/content/mcp`,
        headers,
      },
      [McpServerName.Statistics]: {
        type: 'http',
        url: `${config.serverClient.baseUrl}/statistics/mcp`,
        headers,
      },
      [McpServerName.Publish]: {
        type: 'http',
        url: `${config.serverClient.baseUrl}/publish/mcp`,
        headers,
      },
    }

    return {
      taskId: task.id,
      sessionId,
      historicalMessages,
      abortController,
      mcpServers,
      maxBudgetUsd,
    }
  }

  private createMessageStream(req: AsyncGenerator<SDKMessage, void>): Observable<SDKMessage> {
    return from(req)
  }

  private async transformMessage(
    chunk: SDKMessage,
    taskId: string,
    userId: string,
    userType: UserType,
    taskResult?: TaskResult,
    sessionId?: string,
  ): Promise<ContentGenerationTaskAgentChunkVo | ContentGenerationTaskErrorChunkVo> {
    if (chunk.type === 'result') {
      const { session_id, modelUsage, ...restChunk } = chunk
      const currentSessionId = sessionId || session_id || undefined
      if ('total_cost_usd' in chunk) {
        const points = (chunk.total_cost_usd || 0) * 100

        if (userType === UserType.User) {
          await this.creditsHelper.deductCredits({
            userId,
            amount: points,
            type: CreditsType.AiService,
            description: 'claude',
            metadata: { taskId, modelUsage },
          })
        }

        await this.aiLogRepo.create({
          userId,
          userType,
          taskId,
          model: 'claude-agent',
          channel: AiLogChannel.ClaudeAgent,
          startedAt: new Date(),
          type: AiLogType.Agent,
          points,
          request: {},
          response: { modelUsage, taskResult },
          status: AiLogStatus.Success,
        })
      }

      this.logger.debug({
        taskId,
        sessionId: currentSessionId,
        modelUsage,
      })

      switch (chunk.subtype) {
        case 'success': {
          const messageToSave = {
            ...restChunk,
            message: chunk.result,
            result: taskResult,
          } as Omit<typeof restChunk, 'session_id'> & { message?: string, result?: TaskResult }

          await this.contentGenerateRepository.updateMessage(taskId, messageToSave as unknown as Record<string, unknown>)

          const requiresActionTypes = ['createChannel', 'updateChannel', 'loginChannel']
          const resultArray = taskResult ? (Array.isArray(taskResult) ? taskResult : [taskResult]) : []
          const hasRequiresAction = resultArray.some(item => item && 'action' in item && requiresActionTypes.includes(item.action as string))
          const finalStatus = hasRequiresAction ? ContentGenerationTaskStatus.RequiresAction : ContentGenerationTaskStatus.Completed

          void this.contentGenerateRepository.updateStatus(taskId, finalStatus)
          void this.serverClient.notification.createForUser({
            userId,
            userType: UserType.User,
            messageKey: hasRequiresAction
              ? NotificationMessageKey.AgentResultRequiresAction
              : NotificationMessageKey.AgentResult,
            vars: { taskId, status: finalStatus },
            type: NotificationType.AgentResult,
            relatedId: taskId,
          })

          return ContentGenerationTaskAgentChunkVo.create({
            type: this.getMessageType(chunk),
            message: AgentMessageVoHelper.create(messageToSave),
          })
        }

        default: {
          void this.contentGenerateRepository.updateStatus(taskId, ContentGenerationTaskStatus.Error)

          const errorCodeMap: Record<string, ResponseCode> = {
            error_max_budget_usd: ResponseCode.UserCreditsInsufficient,
            error_during_execution: ResponseCode.AgentTaskFailed,
            error_max_turns: ResponseCode.AgentTaskFailed,
            error_max_structured_output_retries: ResponseCode.AgentTaskFailed,
          }
          const responseCode = errorCodeMap[chunk.subtype] || ResponseCode.AgentTaskFailed

          const payload = getExceptionPayload(new AppException(responseCode))
          const errorResult = ContentGenerationTaskErrorChunkVo.create({
            type: AgentMessageType.Error,
            ...payload,
            timestamp: Date.now(),
          })

          await this.contentGenerateRepository.updateMessage(taskId, errorResult)
          return errorResult
        }
      }
    }

    const messageToSave = 'session_id' in chunk
      ? sanitizeMessage(chunk)
      : chunk

    if (messageToSave.type !== 'stream_event') {
      await this.contentGenerateRepository.updateMessage(taskId, messageToSave as unknown as Record<string, unknown>)
    }

    const messageVo = AgentMessageVoHelper.create(messageToSave)

    return ContentGenerationTaskAgentChunkVo.create({
      type: this.getMessageType(chunk),
      message: messageVo,
    })
  }

  private buildSystemPromptContent(_brand: unknown): ContentBlockParam[] {
    const content: ContentBlockParam[] = []

    content.push({ type: 'text', text: SYSTEM_PROMPT })

    return content
  }

  private async uploadAgentSession(sessionId: string, taskId: string): Promise<void> {
    try {
      this.logger.debug(`Uploading session ${sessionId} for task ${taskId}`)
      const taskProjectDir = this.getTaskProjectDir(taskId)
      const projectsDir = join(this.sessionDir, '.claude/projects', taskProjectDir)
      const sessionFile = join(projectsDir, `${sessionId}.jsonl`)

      if (!fs.existsSync(sessionFile)) {
        this.logger.fatal(`Session file not found locally: ${sessionFile}`)
        return
      }

      const s3Key = `claude-session/.claude/projects/${this.projectDir}/${sessionId}.jsonl`
      await this.storageProvider.putObject(s3Key, fs.readFileSync(sessionFile), 'application/jsonl')
      this.logger.debug({ taskId, sessionId }, `Uploaded session file to S3: ${s3Key}`)

      const agentIds = await this.parseAgentIds(sessionFile)
      const uploadedTodoFiles = await this.uploadAgentSessionFiles(sessionId, agentIds, projectsDir, taskId)

      await this.contentGenerateRepository.updateById(taskId, {
        subAgentIds: agentIds,
        todos: uploadedTodoFiles,
      })
    }
    catch (error) {
      this.logger.fatal({ error, sessionId, taskId }, 'Failed to upload session and agent files to S3')
    }
  }

  private async downloadAgentSession(task: ContentGenerationTask): Promise<void> {
    if (!task.sessionId) {
      return
    }
    const taskId = task.id
    const sessionId = task.sessionId

    try {
      this.logger.debug({ taskId, sessionId }, `Downloading session ${sessionId} for task ${taskId}`)
      const s3Key = `claude-session/.claude/projects/${this.projectDir}/${task.sessionId}.jsonl`
      const response = await this.storageProvider.getObject(s3Key)

      const taskProjectDir = this.getTaskProjectDir(task.id)
      const projectsDir = join(this.sessionDir, '.claude/projects', taskProjectDir)

      if (response.buffer) {
        fs.mkdirSync(projectsDir, { recursive: true })
        fs.writeFileSync(join(projectsDir, `${task.sessionId}.jsonl`), response.buffer)
      }
      else {
        this.logger.fatal({ taskId, sessionId }, `Session file not found in S3: ${s3Key}`)
      }

      if (task.subAgentIds?.length) {
        const subagentsDir = join(projectsDir, task.sessionId, 'subagents')
        fs.mkdirSync(subagentsDir, { recursive: true })

        for (const agentId of task.subAgentIds) {
          const agentS3Key = `claude-session/.claude/projects/${this.projectDir}/agent-${agentId}.jsonl`
          const agentResponse = await this.storageProvider.getObject(agentS3Key)
          if (agentResponse.buffer) {
            fs.writeFileSync(join(subagentsDir, `agent-${agentId}.jsonl`), agentResponse.buffer)
            this.logger.debug({ taskId, sessionId, agentId }, `Downloaded agent ${agentId} file from S3: ${agentS3Key}`)
          }
          else {
            this.logger.fatal({ taskId, sessionId, agentId }, `Agent file not found in S3: ${agentS3Key}`)
          }
        }
      }

      if (task.todos?.length) {
        const todosDir = join(this.sessionDir, '.claude/todos')
        fs.mkdirSync(todosDir, { recursive: true })

        for (const todoS3Key of task.todos) {
          const fileResponse = await this.storageProvider.getObject(todoS3Key)
          if (fileResponse.buffer) {
            const fileName = todoS3Key.replace('claude-session/.claude/todos/', '')
            fs.writeFileSync(join(todosDir, fileName), fileResponse.buffer)
            this.logger.debug({ taskId, sessionId }, `Downloaded todo file ${fileName} from S3: ${todoS3Key}`)
          }
          else {
            this.logger.fatal({ taskId, sessionId }, `Todo file not found in S3: ${todoS3Key}`)
          }
        }
      }
    }
    catch (error) {
      this.logger.fatal({ error, taskId, sessionId }, 'Failed to download session and agent files from S3')
      throw new AppException(ResponseCode.AgentSessionRecoveryFailed)
    }
  }

  private async parseAgentIds(filePath: string): Promise<string[]> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const agentIdPattern = /"agentId"\\s*:\\s*"([^"]+)"/g
    const agentIds = new Set<string>()

    for (const match of content.matchAll(agentIdPattern)) {
      if (match[1]) {
        agentIds.add(match[1])
      }
    }

    return Array.from(agentIds)
  }

  private async uploadAgentSessionFiles(sessionId: string, agentIds: string[], projectsDir: string, taskId: string): Promise<string[]> {
    const uploadedTodoFiles: string[] = []

    const subagentsDir = join(projectsDir, sessionId, 'subagents')
    for (const agentId of agentIds) {
      const agentProjectFile = join(subagentsDir, `agent-${agentId}.jsonl`)
      if (fs.existsSync(agentProjectFile)) {
        const s3Key = `claude-session/.claude/projects/${this.projectDir}/agent-${agentId}.jsonl`
        await this.storageProvider.putObject(s3Key, fs.readFileSync(agentProjectFile), 'application/jsonl')
        this.logger.debug({ taskId, sessionId, agentId }, `Uploaded agent ${agentId} file to S3: ${s3Key}`)
      }
    }

    const todosDir = join(this.sessionDir, '.claude/todos')
    if (fs.existsSync(todosDir)) {
      const files = fs.readdirSync(todosDir).filter(file => file.startsWith(sessionId))
      for (const file of files) {
        const todoFilePath = join(todosDir, file)
        const s3Key = `claude-session/.claude/todos/${file}`
        await this.storageProvider.putObject(s3Key, fs.readFileSync(todoFilePath), 'application/json')
        this.logger.debug({ taskId, sessionId }, `Uploaded todo file ${file} to S3: ${s3Key}`)
        uploadedTodoFiles.push(s3Key)
      }
    }

    return uploadedTodoFiles
  }
}
