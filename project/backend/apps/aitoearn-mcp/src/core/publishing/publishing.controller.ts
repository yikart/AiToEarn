import { Body, Controller, Get, Headers, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { ApiKeyAuthGuard, ApiKeyInfo, GetToken } from '../../common/guards'
import { CreatePublishingTasksDto } from './dto/publishing.dto'
import { PublishingService } from './publishing.service'

@Controller('publishing')
@UseGuards(ApiKeyAuthGuard)
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) { }

  @HttpCode(200)
  @Get('ping')
  async ping() {
    return { message: 'pong' }
  }

  @HttpCode(200)
  @Get('channels/accounts')
  async listChannelAccounts(@GetToken() authToken: ApiKeyInfo) {
    return this.publishingService.listLinkedAccounts(authToken.apiKey)
  }

  @HttpCode(200)
  @Post('channels/tasks')
  async batchCreatePublishingTask(@Body() body: CreatePublishingTasksDto, @Headers('x-api-key') apiKey: string) {
    return this.publishingService.batchCreatePublishingTask(apiKey, body)
  }

  @HttpCode(200)
  @Post(':accountId/tasks')
  async createPublishingTime(@Param() accountId: string, @Body() body: CreatePublishingTasksDto) {
    return this.publishingService.createPublishingTask(accountId, body)
  }

  @HttpCode(200)
  @Get('tasks/:taskId/status')
  async getPublishingTaskStatus(
    @GetToken() authToken: ApiKeyInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.publishingService.getPublishingTaskStatus(authToken.userId, taskId)
  }
}
