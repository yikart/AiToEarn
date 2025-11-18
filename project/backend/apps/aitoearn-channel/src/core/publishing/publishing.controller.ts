import { Body, Controller, Logger, Post } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { PublishStatus } from '../../libs/database/schema/publishTask.schema'
import {
  CreatePublishDto,
  DeletePublishTaskDto,
  NowPubTaskDto,
  PublishRecordListFilterDto,
  UpdatePublishTaskDto,
  UpPublishTaskTimeDto,
} from './dto/publish.dto'
import { TiktokWebhookDto, TiktokWebhookSchema } from './dto/tiktok-webhook.dto'
import { PublishingService } from './publishing.service'

@Controller()
export class PublishingController {
  private readonly logger = new Logger(PublishingController.name)
  constructor(
    private readonly publishingService: PublishingService,
  ) {}

  @Post('plat/publish/create')
  async createPublishingTask(@Body() data: CreatePublishDto) {
    return await this.publishingService.createPublishingTask(data)
  }

  @Post('plat/publish/update')
  async updatePublishingTask(@Body() data: UpdatePublishTaskDto) {
    return await this.publishingService.updatePublishingTask(data)
  }

  @Post('plat/publish/changeTime')
  async changeTaskTime(@Body() data: UpPublishTaskTimeDto) {
    data.publishTime = new Date(data.publishTime)
    const res = await this.publishingService.updatePublishTaskTime(
      data.id,
      data.publishTime,
      data.userId,
    )
    return res
  }

  @Post('publish/task/delete')
  async deletePublishTask(@Body() data: DeletePublishTaskDto) {
    return await this.publishingService.deletePublishTaskById(
      data.id,
      data.userId,
    )
  }

  @Post('publish/task/run')
  async nowPubTask(@Body() data: NowPubTaskDto) {
    const info = await this.publishingService.getPublishTaskInfo(data.id)
    if (!info)
      throw new AppException(ResponseCode.PublishTaskNotFound)
    if (info.status === PublishStatus.PUBLISHING) {
      throw new AppException(ResponseCode.PublishTaskAlreadyPublishing)
    }
    if (info.status === PublishStatus.PUBLISHED) {
      throw new AppException(ResponseCode.PublishTaskAlreadyCompleted)
    }
    await this.publishingService.enqueuePublishingTask(info)

    return PublishStatus.PUBLISHING
  }

  @Post('publish/tiktok/post/webhook')
  async handleTiktokWebhook(@Body() data: any) {
    this.logger.log(`Received TikTok webhook: ${JSON.stringify(data)}`)
    try {
      const dto: TiktokWebhookDto = TiktokWebhookSchema.parse(data)
      await this.publishingService.handleTiktokPostWebhook(dto)
    }
    catch (error) {
      this.logger.error(`Error handling TikTok webhook: ${error.message}`, error.stack)
      throw new AppException(ResponseCode.ChannelWebhookFailed)
    }
    return { status: 'success', message: 'Webhook processed' }
  }

  @Post('channel/publishTask/list')
  async getPublishTaskList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishingService.getPublishTasks(data)
    return res
  }

  @Post('channel/status/queued/tasks')
  async getQueuedPublishTaskList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishingService.getQueuedPublishTasks(data)
    return res
  }

  @Post('channel/status/published/tasks')
  async getPublishedPublishTaskList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishingService.getPublishedPublishTasks(data)
    return res
  }

  @Post('channel/publishTask/detail')
  async getPublishingTaskDetail(@Body() data: { flowId: string, userId: string }) {
    const res = await this.publishingService.getPublishTaskInfoWithFlowId(data.flowId, data.userId)
    return res
  }

  @Post('channel/publishing/task/detail')
  async getPublishTaskInfoWithUserId(@Body() data: { taskId: string, userId: string }) {
    const res = await this.publishingService.getPublishTaskInfoWithUserId(data.taskId, data.userId)
    return res
  }
}
