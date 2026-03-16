import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  SetMetadata,
} from '@nestjs/common'
import { SSE_METADATA } from '@nestjs/common/constants'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, UserType } from '@yikart/common'
import { ContentGenerationTaskStatus } from '@yikart/mongodb'
import { RedisPubSubService } from '@yikart/redis'
import { Request, Response } from 'express'
import { AGENT_TASK_ABORT_CHANNEL } from './agent.constants'
import {
  CreateContentGenerationTaskDto,
  CreateContentGenerationTaskRatingDto,
  CreateContentGenerationTaskRatingDtoSchema,
  CreateContentGenerationTaskSchema,
  CreatePublicShareDto,
  GetTaskMessagesQueryDto,
  GetTaskMessagesQueryDtoSchema,
  ListContentGenerationTaskDto,
  ListContentGenerationTaskDtoSchema,
  UpdateContentGenerationTaskTitleDto,
  UpdateContentGenerationTaskTitleDtoSchema,
} from './agent.dto'
import { AgentService } from './agent.service'
import {
  ContentGenerationTaskChunkVoSchema,
  ContentGenerationTaskListVo,
  ContentGenerationTaskVo,
  PublicShareVo,
  TaskMessagesVo,
} from './agent.vo'

@ApiTags('Me/Agent')
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name)
  constructor(
    private readonly agentService: AgentService,
    private readonly redisPubSubService: RedisPubSubService,
  ) { }

  @ApiDoc({
    summary: 'Create Content Generation Task',
    description: 'Create a content generation task.',
    body: CreateContentGenerationTaskSchema,
    response: ContentGenerationTaskChunkVoSchema,
  })
  @SetMetadata(SSE_METADATA, true)
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  @Header('Content-Encoding', 'none')
  @Post('tasks')
  createContentGenerationTask(
    @GetToken() token: TokenInfo,
    @Body() body: CreateContentGenerationTaskDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const abortController = new AbortController()

    res.on('close', () => {
      this.logger.debug(`User ${token.id} closed connection`)
    })

    return this.agentService.createContentGenerationTask(token.id, UserType.User, body, abortController, req, res)
  }

  @ApiDoc({
    summary: 'Get Content Generation Task List',
    description: 'Get a paginated list of content generation tasks.',
    query: ListContentGenerationTaskDtoSchema,
    response: ContentGenerationTaskListVo,
  })
  @Get('tasks')
  async getContentGenerationTaskListWithPagination(
    @GetToken() token: TokenInfo,
    @Query() query: ListContentGenerationTaskDto,
  ) {
    const [tasks, total] = await this.agentService.getTaskList(token.id, query)
    return new ContentGenerationTaskListVo(tasks, total, query)
  }

  @ApiDoc({
    summary: 'Get Content Generation Task',
    description: 'Get a content generation task.',
    response: ContentGenerationTaskVo,
  })
  @Get('tasks/:taskId')
  async getContentGenerationTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const task = await this.agentService.getTask(token.id, taskId)
    return ContentGenerationTaskVo.create(task)
  }

  @ApiDoc({
    summary: 'Get Content Generation Task Messages',
    description: 'Get messages after specified message ID. Used for polling after SSE disconnection.',
    query: GetTaskMessagesQueryDtoSchema,
    response: TaskMessagesVo,
  })
  @Get('/tasks/:taskId/messages')
  async getTaskMessages(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Query() query: GetTaskMessagesQueryDto,
  ) {
    const result = await this.agentService.getTaskMessages(token.id, taskId, query.lastMessageId)
    return TaskMessagesVo.create(result)
  }

  @ApiDoc({
    summary: 'Delete Content Generation Task',
    description: 'Delete a content generation task.',
  })
  @Delete('tasks/:taskId')
  async deleteTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.agentService.deleteTask(token.id, taskId)
  }

  @ApiDoc({
    summary: 'Update Content Generation Task',
    description: 'Update content generation task.',
    body: UpdateContentGenerationTaskTitleDtoSchema,
  })
  @Patch('tasks/:taskId')
  async updateTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Body() body: UpdateContentGenerationTaskTitleDto,
  ) {
    await this.agentService.updateTask(token.id, taskId, body)
  }

  @ApiDoc({
    summary: 'Create or Update Content Generation Task Rating',
    description: 'Create or update a rating for a content generation task.',
    body: CreateContentGenerationTaskRatingDtoSchema,
  })
  @Post('tasks/:taskId/rating')
  async createRating(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Body() body: CreateContentGenerationTaskRatingDto,
  ) {
    await this.agentService.createRating(token.id, taskId, body)
  }

  @ApiDoc({
    summary: 'Create a public share link for a task',
    description: 'Generate a token so the task can be accessed publicly. Only owner can create.',
    body: CreatePublicShareDto.schema,
    response: PublicShareVo,
  })
  @Post('tasks/:taskId/share')
  async createPublicShare(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Body() body: CreatePublicShareDto,
  ) {
    const ttlSeconds = body.ttlSeconds
    const res = await this.agentService.createPublicShare(token.id, taskId, ttlSeconds)
    return PublicShareVo.create(res)
  }

  @ApiDoc({
    summary: 'Get public shared task by token',
    description: 'Retrieve a task by public share token. No authentication required.',
    response: ContentGenerationTaskVo,
  })
  @Public()
  @Get('tasks/shared/:token')
  async getTaskByShareToken(
    @Param('token') token: string,
  ) {
    const task = await this.agentService.getTaskByShareToken(token)
    return ContentGenerationTaskVo.create(task)
  }

  @ApiDoc({
    summary: 'Abort Content Generation Task',
    description: 'Abort a running content generation task.',
  })
  @Post('/tasks/:taskId/abort')
  async abortTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const task = await this.agentService.getTask(token.id, taskId)
    if (task.status !== ContentGenerationTaskStatus.Running)
      throw new AppException(ResponseCode.AgentTaskNotRunning)

    await this.redisPubSubService.emit(AGENT_TASK_ABORT_CHANNEL, taskId)
  }

  @ApiDoc({
    summary: 'Favorite Content Generation Task',
    description: 'Add a task to favorites.',
  })
  @Post('/tasks/:taskId/favorite')
  async favoriteTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.agentService.favoriteTask(token.id, taskId)
  }

  @ApiDoc({
    summary: 'Unfavorite Content Generation Task',
    description: 'Remove a task from favorites.',
  })
  @Delete('/tasks/:taskId/favorite')
  async unfavoriteTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.agentService.unfavoriteTask(token.id, taskId)
  }
}
