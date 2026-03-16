import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc, SkipResponseInterceptor } from '@yikart/common'
import { PublishRecordService } from '../../../publish-record/publish-record.service'
import { CallbackMsgData } from '../../libs/my-wx-plat/comment'
import { AuthBackBodyDto } from './wx-plat.dto'
import { WxPlatService } from './wx-plat.service'

@ApiTags('Platform/WeChat')
@Controller('plat/wx')
export class WxPlatController {
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly publishRecordService: PublishRecordService,
  ) {}

  @Public()
  @SkipResponseInterceptor()
  @ApiDoc({
    summary: 'Handle Authorization Callback',
    body: AuthBackBodyDto.schema,
  })
  @Post('/auth/back')
  async authBackGet(
    @Body() body: AuthBackBodyDto,
  ) {
    await this.wxPlatService.createAccountAndSetAccessToken(
      body.stat,
      {
        authCode: body.auth_code,
        expiresIn: body.expires_in,
      },
    )
    return 'success'
  }

  @Public()
  @SkipResponseInterceptor()
  @ApiDoc({
    summary: 'Handle WeChat Message Callback',
  })
  @Post('/callback/msg')
  async callbackMsg(
    @Body() body: CallbackMsgData,
  ) {
    if (body.MsgType === 'event' && body.Event === 'PUBLISHJOBFINISH') {
      void this.publishRecordService.donePublishRecord(
        { dataId: body.publish_id, uid: body.appId },
        {
          workLink: body.article_url
            || `https://mp.weixin.qq.com/s/${body.article_id}`,
          dataOption: {
            $set: {
              article_id: body.article_id,
            },
          },
        },
      )
    }

    return 'success'
  }
}
