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
import { strUtil } from '@/common/utils/str.util';
import { PublishRecordService } from '@/core/publish/publishRecord.service';
import {
  CallbackMsgData,
  ComponentVerifyTicketData,
  TicketData,
} from '@/libs/wxPlat/comment';
import { ChannelNatsApi } from '@/transports/channel/channel.natsApi';
import {
  AuthBackQueryDto,
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
    private readonly channelNatsApi: ChannelNatsApi,
    private readonly publishRecordService: PublishRecordService,
  ) {}

  // <xml>
  // <AppId>wxd0801bb2fb5fa038</AppId>
  // <Encrypt>4oSeT8tUiqdyCQQRjQirntBrQD2WIa1OGfpLYyu8fPe10Ts6lZJZkPnS8Ue/hNJULXRZZGJaLiZ7o/psZotDLpf0ZrOKmeIeC/4cRt/QxCMY49jwacQHuzzPcqIcE3q0o1yRGYHe994Vvn0C2wTiFvwJW2Vs01IHQzUN7N70WdQxLzmI7+6Fy1nS5TYMQ3wyH/SR+a4QJ0OqMGJZBDSvbQOvE6HwQ2bKZarUqB2YQDPm0LKfNCMqLU503FGqNYqnYSU97GBbqD4Gq1jCOkzi4aLb25bVhAJYO7PmTo+4ibRTWqiweZyw1TKZ6oR+FEVZrSK1flUk6iybsxYRFvaZ7aP46DvPQfg7JmHRlt98CiVW+9Ks5haxmZd2Kt1gE/T0chwQ+HQfaXtmSk/F2AQbL8j5om/OGFLWOeSfcRid20lrgz6PlWoOsiIleI4MvuOZ0/zuM1khEvHOVrW5ccEIVA==</Encrypt>
  // </xml>
  /**
   * 微信定期给予的票据
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(OrgGuard)
  @UseInterceptors(XmlParseInterceptor)
  @Post('callback/ticket')
  async callbackTicket(
    @Body()
    body: TicketData,
  ) {
    const orgXml = this.wxPlatService.decryptWXData(body.Encrypt);

    const componentVerifyTicketInfo: ComponentVerifyTicketData
      = strUtil.xmlToObject(orgXml);

    this.logger.log('---- componentVerifyTicketInfo --- res ----');
    this.logger.debug(componentVerifyTicketInfo);

    // 验证有效期，只允许5分钟内的
    if (
      Math.floor(Date.now() / 1000) - componentVerifyTicketInfo.CreateTime
      > 5 * 60
    ) {
      return 'fail';
    }

    const setRes = await this.wxPlatService.setComponentVerifyTicket(
      componentVerifyTicketInfo.ComponentVerifyTicket,
    );

    return setRes ? 'success' : 'fail';
  }

  /**
   * 微信消息回调
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(OrgGuard)
  @UseInterceptors(XmlParseInterceptor)
  @Post('callback/msg/:appId')
  async callbackMsg(
    @Param('appId') appId: string,
    @Body() body: CallbackMsgData,
  ) {
    // 发布结果
    if (body.MsgType === 'event' && body.Event === 'PUBLISHJOBFINISH') {
      this.publishRecordService.updatePublishRecord({ data: body.publish_id, uid: appId }, {
        workLink:
          body.article_url || `https://mp.weixin.qq.com/s/${body.article_id}`,
        dataOption: {
          $set: {
            article_id: body.article_id,
          },
        },
      });
    }

    return 'success';
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

  // https://apitest.aiearn.ai/platcallback/wxPlat/auth/back/a5d89e84-4b97-49f9-8fa6-b574ccedd1dd?auth_code=queryauthcode@@@Y46nzFPANZB_tDCOwOOzhmZkvTB9mvkX4TQm0dkQuBx5CbW0FPdPeOgnRYsdRtOvwlatyqQ9Aks_zFwquLfk3w&expires_in=3600
  /**
   * 接收授权回调
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(OrgGuard)
  @Get('auth/back/:taskId')
  async authBackGet(
    @Param('taskId') taskId: string,
    @Query() query: AuthBackQueryDto,
  ) {
    const authTask = await this.wxPlatService.getAuthTaskInfo(taskId);
    if (!authTask)
      return 'fail';

    // 自调用处理授权回调
    void (await this.channelNatsApi.createAccountAndSetAccessToken(
      taskId,
      query,
    ));

    return 'success';
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
