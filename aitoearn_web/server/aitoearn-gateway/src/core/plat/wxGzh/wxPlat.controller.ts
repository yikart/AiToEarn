import { Body, Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { OrgGuard } from '@/common/interceptor/transform.interceptor'
import { PlatWxGzhNatsApi } from '@/transports/channel/wxGzh.natsApi'
import { CallbackMsgData } from './common'
import { AuthBackQueryDto } from './dto/wxGzh.dto'

@Controller('plat/wx')
export class WxPlatController {
  constructor(
    private readonly platWxGzhNatsApi: PlatWxGzhNatsApi,
  ) {}

  /**
   * 接收授权回调
   * @param taskId
   * @param query
   * @returns
   */
  @UseGuards(OrgGuard)
  @Get('auth/back/:taskId')
  async authBackGet(
    @Param('taskId') taskId: string,
    @Query() query: AuthBackQueryDto,
  ) {
    await this.platWxGzhNatsApi.createAccountAndSetAccessToken(
      taskId,
      query,
    )

    return 'success'
  }

  /**
   * 接收消息回调
   * @param body
   * @returns
   */
  @UseGuards(OrgGuard)
  @Get('callback/msg')
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
