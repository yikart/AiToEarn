import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatWxGzhNatsApi } from '../../transports/channel/api/wxGzh.natsApi'
import { CallbackMsgData } from './common'
import { AuthBackQueryDto } from './dto/wxGzh.dto'

@ApiTags('OpenSource/Platform/WeChat')
@Controller('plat/wx')
export class WxPlatController {
  constructor(
    private readonly platWxGzhNatsApi: PlatWxGzhNatsApi,
  ) {}

  /**
   * 接收授权回调
   * @param query
   * @returns
   */
  @Public()
  @UseGuards(OrgGuard)
  @ApiDoc({
    summary: 'Handle Authorization Callback',
    body: AuthBackQueryDto.schema,
  })
  @Post('auth/back')
  async authBackGet(
    @Body() body: AuthBackQueryDto,
  ) {
    await this.platWxGzhNatsApi.createAccountAndSetAccessToken({
      taskId: body.stat,
      auth_code: body.auth_code,
      expires_in: body.expires_in,
    })
    return 'success'
  }

  /**
   * 接收消息回调
   * @param body
   * @returns
   */
  @Public()
  @UseGuards(OrgGuard)
  @ApiDoc({
    summary: 'Handle WeChat Message Callback',
  })
  @Post('callback/msg')
  async callbackMsg(
    @Body() body: CallbackMsgData,
  ) {
    if (body.MsgType === 'event' && body.Event === 'PUBLISHJOBFINISH') {
      this.platWxGzhNatsApi.updatePublishRecord(
        body,
      )
    }

    return 'success'
  }
}
