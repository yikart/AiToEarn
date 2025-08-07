import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { NatsMessagePattern, OrgGuard } from '@/common';
import { XmlParseInterceptor } from '@/common/interceptors/xml.interceptor';
import { PublishRecordService } from '@/core/publish/publishRecord.service';
import {
  CallbackMsgData,
} from '@/libs/wxPlat/comment';
import {
  DisposeAuthTaskDto,
  GetAuthUrlDto,
} from './dto/wxPlat.dto';
import { WxGzhService } from './wxGzh.service';
import { WxPlatService } from './wxPlat.service';

@Controller('wxPlat')
export class WxPlatController {
  logger = new Logger(WxPlatController.name);
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly wxGzhService: WxGzhService,
    private readonly publishRecordService: PublishRecordService,
  ) {}

  /**
   * 更新发布结果
   * @param data
   * @returns
   */
  @NatsMessagePattern('channel.wxPlat.updatePublishRecord')
  async updatePublishRecord(@Payload() data: {
    publish_id: string
    appId: string
    article_url?: string
    article_id: string
  }) {
    const res = await this.publishRecordService.updatePublishRecord({ data: data.publish_id, uid: data.appId }, {
      workLink:
          data.article_url || `https://mp.weixin.qq.com/s/${data.article_id}`,
      dataOption: {
        $set: {
          article_id: data.article_id,
        },
      },
    });

    return res;
  }

  /**
   * 创建授权任务
   * @param data
   * @returns
   */
  @NatsMessagePattern('plat.wxPlat.auth')
  createAuthTask(@Payload() data: GetAuthUrlDto) {
    const res = this.wxPlatService.createAuthTask(
      {
        userId: data.userId,
        type: data.type,
      },
      {
        transpond: data.prefix,
      },
    );

    return res;
  }

  /**
   * 获取账号授权信息
   */
  @NatsMessagePattern('plat.wxPlat.getAuthInfo')
  async getAuthInfo(@Payload() data: { taskId: string }) {
    const res = await this.wxPlatService.getAuthTaskInfo(data.taskId);
    return res;
  }

  /**
   * 处理用户的账号授权
   * @param data
   * @returns
   */
  @NatsMessagePattern('channel.wxPlat.createAccountAndSetAccessToken')
  async disposeAuthTask(@Payload() data: DisposeAuthTaskDto) {
    Logger.log('createAccountAndSetAccessToken---', data);
    const res = await this.wxPlatService.createAccountAndSetAccessToken(
      data.taskId,
      {
        authCode: data.auth_code,
        expiresIn: data.expires_in,
      },
    );
    return res;
  }

  /**
   * 获取累计用户数据
   */
  @NatsMessagePattern('plat.wxPlat.getUserCumulate')
  async getUserCumulate(@Payload() data: { accountId: string, beginDate: string, endDate: string }) {
    const res = await this.wxGzhService.getusercumulate(data.accountId, data.beginDate, data.endDate);
    return res;
  }

  /**
   * 获取图文阅读概况数据
   */
  @NatsMessagePattern('plat.wxPlat.getUserRead')
  async getUserRead(@Payload() data: { accountId: string, beginDate: string, endDate: string }) {
    const res = await this.wxGzhService.getuserread(data.accountId, data.beginDate, data.endDate);
    return res;
  }
}
