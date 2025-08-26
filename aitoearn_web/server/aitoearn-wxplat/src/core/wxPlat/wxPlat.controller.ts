import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  Render,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { OrgGuard } from '@/common';
import { XmlParseInterceptor } from '@/common/interceptors/xml.interceptor';
import { strUtil } from '@/common/utils/str.util';
import { config } from '@/config';
import {
  CallbackMsgData,
  ComponentVerifyTicketData,
  TicketData,
} from '@/libs/wxPlat/comment';
import {
  AuthBackQueryDto,
  GetAuthUrlDto,
} from './dto/wxPlat.dto';
import { ServerService } from './server.service';
import { WxPlatService } from './wxPlat.service';

@Controller('wxPlat')
export class WxPlatController {
  logger = new Logger(WxPlatController.name);
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly serverService: ServerService,
  ) {
  }

  // -------- 接收回调 STR --------

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
   * 微信定期给予的票据（测试，补充数据）
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(OrgGuard)
  @Post('callback/add/ticket')
  async addCallbackTicket(
    @Body() body: ComponentVerifyTicketData,
  ) {
    const setRes = await this.wxPlatService.setComponentVerifyTicket(
      body.ComponentVerifyTicket,
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
    const { msgUrlList } = config;
    for (const url of msgUrlList) {
      this.serverService.sendCallbackMsg(url, appId, body);
    }
    return 'success';
  }

  // https://apitest.aiearn.ai/platcallback/wxPlat/auth/back/a5d89e84-4b97-49f9-8fa6-b574ccedd1dd?auth_code=queryauthcode@@@Y46nzFPANZB_tDCOwOOzhmZkvTB9mvkX4TQm0dkQuBx5CbW0FPdPeOgnRYsdRtOvwlatyqQ9Aks_zFwquLfk3w&expires_in=3600
  /**
   * 接收授权回调
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(OrgGuard)
  @Render('back/res')
  @Get('auth/back/:key/:stat')
  async authBackGet(
    @Param('key') key: string,
    @Param('stat') stat: string,
    @Query() query: AuthBackQueryDto,
  ) {
    const { authUrlMap } = config;
    const url = authUrlMap[key];

    if (!url) {
      return {
        success: false,
        message: 'Authorization failed',
      }
    }
    const res = await this.serverService.sendAuthBack(url, {
      ...query,
      stat,
    });

    if (!res) {
      return {
        success: false,
        message: 'Authorization failed',
      }
    }

    return {
      success: true,
      message: 'Authorization successful',
    }
  }
  // -------- 接收回调 END --------

  /**
   * 获取授权URL
   */
  @Get('auth/url')
  async getAuthUrl(
    @Query() query: GetAuthUrlDto,
  ) {
    return `${config.wxPlat.authBackHost}/wxPlat/auth/page?stat=${query.stat}&key=${query.key}&type=${query.type}`;
  }

  /**
   * 获取授权页面
   */
  @Get('auth/page')
  async getAuthPage(
    @Query() query: GetAuthUrlDto,
    @Res() res: Response,
  ) {
    const redirectUri = `${config.wxPlat.authBackHost}/wxPlat/auth/back/${query.key}/${query.stat}`;
    const authUrl = await this.wxPlatService.getAuthPageUrl(redirectUri, query.type);

    return res.render(
      `auth/${query.type}`,
      { url: authUrl },
    );
  }

  /**
   * 获取授权方的账号信息
   */
  @Get('queryAuth/:authorizationCode')
  async getQueryAuth(
    @Param('authorizationCode') authorizationCode: string,
  ) {
    const res = await this.wxPlatService.getQueryAuth(authorizationCode);
    return res;
  }

  /**
   * 获取授权方的账号信息
   */
  @Get('authorizer/info/:authorizerAppid')
  async getAuthorizerInfo(
    @Param('authorizerAppid') authorizerAppid: string,
  ) {
    const res = await this.wxPlatService.getAuthorizerInfo(authorizerAppid);
    return res;
  }

  /**
   * 获取授权方接口调用凭据
   */
  @Get('authorizerAccessToken')
  async getAuthorizerAccessToken(
    @Query() query: {
      authorizerAppId: string;
      authorizerRefreshToken: string;
    },
  ) {
    const res = await this.wxPlatService.getAuthorizerAccessToken(query.authorizerAppId, query.authorizerRefreshToken);
    return res;
  }
}
