/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Controller, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { AppException, NatsMessagePattern } from '@/common';
import { ExceptionCode } from '@/common/enums/exception-code.enum';
import { AccountService } from '../account/account.service';
import {
  CreatePublishDto,
  DeletePublishTaskDto,
  NowPubTaskDto,
  UpPublishTaskTimeDto,
} from './dto/publish.dto';
import { TiktokWebhookDto, TiktokWebhookSchema } from './dto/tiktok.webhook.dto';
import { PublishTaskService } from './publishTask.service';

@Controller()
export class PublishTaskController {
  constructor(
    private readonly publishTaskService: PublishTaskService,
    private readonly accountService: AccountService,
  ) {}

  // 创建发布任务
  @NatsMessagePattern('plat.publish.create')
  async createPub(@Payload() data: CreatePublishDto) {
    try {
      data.publishTime = new Date(data.publishTime);

      const accountInfo = await this.accountService.getAccountInfo(
        data.accountId,
      );
      if (!accountInfo)
        throw new AppException(ExceptionCode.File, '账号信息获取失败');

      const res = await this.publishTaskService.createPub({
        uid: accountInfo.uid,
        userId: accountInfo.userId,
        inQueue: false,
        queueId: '',
        ...data,
      });
      return res;
    }
    catch (e) {
      Logger.log(e);
      return new AppException(ExceptionCode.File, e);
    }
  }

  // 更新任务时间
  @NatsMessagePattern('publish.task.changeTime')
  async changeTaskTime(@Payload() data: UpPublishTaskTimeDto) {
    data.publishTime = new Date(data.publishTime);
    const res = await this.publishTaskService.updatePublishTaskTime(
      data.id,
      data.publishTime,
      data.userId,
    );
    return res;
  }

  // 删除任务
  @NatsMessagePattern('publish.task.delete')
  async deletePublishTask(@Payload() data: DeletePublishTaskDto) {
    return await this.publishTaskService.deletePublishTaskById(
      data.id,
      data.userId,
    );
  }

  // 立即发布任务
  @NatsMessagePattern('publish.task.run')
  async nowPubTask(@Payload() data: NowPubTaskDto) {
    const info = await this.publishTaskService.getPublishTaskInfo(data.id);
    if (!info)
      throw new AppException(ExceptionCode.File, '未发现任务');

    const { status, message, noRetry }
      = await this.publishTaskService.doPub(info);
    Logger.log(`发布任务${info.id}执行结果：${status} ${message} ${noRetry}`);

    return status;
  }

  @NatsMessagePattern('publish.tiktok.post.webhook')
  async handleTiktokWebhook(@Payload() data: any) {
    Logger.log(`Received TikTok webhook: ${JSON.stringify(data)}`);
    try {
      const dto: TiktokWebhookDto = TiktokWebhookSchema.parse(data);
      await this.publishTaskService.handleTiktokPostWebhook(dto);
    }
    catch (error) {
      Logger.error(`Error handling TikTok webhook: ${error.message}`, error.stack);
      throw new AppException(ExceptionCode.File, '处理 TikTok webhook 失败');
    }
    return { status: 'success', message: 'Webhook processed' };
  }
}
