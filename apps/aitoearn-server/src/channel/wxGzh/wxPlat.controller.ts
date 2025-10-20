import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { Public } from '../../auth/auth.guard'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatWxGzhNatsApi } from '../api/wxGzh.natsApi'
import { CallbackMsgData } from './common'
import { AuthBackQueryDto } from './dto/wxGzh.dto'

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
