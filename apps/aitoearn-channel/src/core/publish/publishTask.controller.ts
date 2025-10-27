/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Body, Controller, Logger, Post } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { ExceptionCode } from '../../common/enums/exception-code.enum'
import { AccountService } from '../account/account.service'
import {
  CreatePublishDto,
  DeletePublishTaskDto,
  NowPubTaskDto,
  PublishRecordListFilterDto,
  UpPublishTaskTimeDto,
} from './dto/publish.dto'
import { TiktokWebhookDto, TiktokWebhookSchema } from './dto/tiktok.webhook.dto'
import { PublishTaskService } from './publishTask.service'

@Controller()
export class PublishTaskController {
  private readonly logger = new Logger(PublishTaskController.name)
  constructor(
    private readonly publishTaskService: PublishTaskService,
    private readonly accountService: AccountService,
  ) {}

  // 创建发布任务
  // @NatsMessagePattern('plat.publish.create')
  @Post('plat/publish/create')
  async createPub(@Body() data: CreatePublishDto) {
    return await this.publishTaskService.createPublishingTask(data)
  }

  // 更新任务时间
  // @NatsMessagePattern('publish.task.changeTime')
  @Post('publish/task/changeTime')
  async changeTaskTime(@Body() data: UpPublishTaskTimeDto) {
    data.publishTime = new Date(data.publishTime)
    const res = await this.publishTaskService.updatePublishTaskTime(
      data.id,
      data.publishTime,
      data.userId,
    )
    return res
  }

  // 删除任务
  // @NatsMessagePattern('publish.task.delete')
  @Post('publish/task/delete')
  async deletePublishTask(@Body() data: DeletePublishTaskDto) {
    return await this.publishTaskService.deletePublishTaskById(
      data.id,
      data.userId,
    )
  }

  // 立即发布任务
  // @NatsMessagePattern('publish.task.run')
  @Post('publish/task/run')
  async nowPubTask(@Body() data: NowPubTaskDto) {
    const info = await this.publishTaskService.getPublishTaskInfo(data.id)
    if (!info)
      throw new AppException(ExceptionCode.Failed, '未发现任务')

    const { status, message, noRetry }
      = await this.publishTaskService.doPub(info)
    this.logger.log(`立即发布任务${info.id}执行结果：${status} ${message} ${noRetry}`)
    this.logger.log(`发布任务${info.id}执行结果：${status} ${message} ${noRetry}`)

    return status
  }

  // @NatsMessagePattern('publish.tiktok.post.webhook')
  @Post('publish/tiktok/post/webhook')
  async handleTiktokWebhook(@Body() data: any) {
    this.logger.log(`Received TikTok webhook: ${JSON.stringify(data)}`)
    try {
      const dto: TiktokWebhookDto = TiktokWebhookSchema.parse(data)
      await this.publishTaskService.handleTiktokPostWebhook(dto)
    }
    catch (error) {
      this.logger.error(`Error handling TikTok webhook: ${error.message}`, error.stack)
      throw new AppException(ExceptionCode.Failed, '处理 TikTok webhook 失败')
    }
    return { status: 'success', message: 'Webhook processed' }
  }

  // @NatsMessagePattern('channel.publishTask.list')
  @Post('channel/publishTask/list')
  async getPublishTaskList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishTaskService.getPublishRecordList(data)
    return res
  }

  // @NatsMessagePattern('channel.publishTask.detail')
  @Post('channel/publishTask/detail')
  async getPublishingTaskDetail(@Body() data: { flowId: string, userId: string }) {
    const res = await this.publishTaskService.getPublishTaskInfoWithFlowId(data.flowId, data.userId)
    return res
  }

  // @NatsMessagePattern('channel.publishing.task.detail')
  @Post('channel/publishing/task/detail')
  async getPublishTaskInfoWithUserId(@Body() data: { taskId: string, userId: string }) {
    const res = await this.publishTaskService.getPublishTaskInfoWithUserId(data.taskId, data.userId)
    return res
  }
}
