import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc, SkipResponseInterceptor } from '@yikart/common'
import { PublishRecordService } from '../../../publish-record/publish-record.service'
import { WxPublishStatus } from '../../libs/my-wx-plat/comment'
import { AuthBackBodyDto } from './wx-plat.dto'
import { WxPlatService } from './wx-plat.service'

@ApiTags('Platform/WeChat')
@Controller('plat/wx')
export class WxPlatController {
  logger = new Logger(WxPlatController.name)
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly publishRecordService: PublishRecordService,
  ) { }

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
    @Body() body: {
      appId: string
      data: {
        MsgType: string
        Event: string
        PublishEventInfo: {
          // 发布任务id
          publish_id: string
          // 发布状态，0:成功, 1:发布中，2:原创失败, 3: 常规失败, 4:平台审核不通过, 5:成功后用户删除所有文章, 6: 成功后系统封禁所有文章
          publish_status: WxPublishStatus
          // 当发布状态为0时（即成功）时，返回图文的 article_id，可用于“客服消息”场景
          article_id: string
          article_detail: {
            count?: number
            item?: {
              idx?: number
              article_url?: string
            }
          }
        }
      }
    },
  ) {
    if (!body.data || body.data.MsgType !== 'event' || body.data.Event !== 'PUBLISHJOBFINISH') {
      return 'success'
    }

    const publishInfo = body.data.PublishEventInfo

    const publishStatus = publishInfo.publish_status
    if (publishStatus === WxPublishStatus.Publishing) {
      return 'success'
    }

    const filter = { dataId: publishInfo.publish_id, uid: body.appId }
    if (publishStatus !== WxPublishStatus.Success) {
      void this.publishRecordService.failPublishRecordByData(
        filter,
        this.getWxPublishFailReason(publishStatus),
      )
      return 'success'
    }

    const workLink = publishInfo.article_detail.item?.article_url || undefined
    if (!workLink) {
      void this.publishRecordService.failPublishRecordByData(
        filter,
        '微信公众号发布成功回调缺少 article_url 和 article_id，无法生成作品链接',
      )
      return 'success'
    }

    void this.publishRecordService.donePublishRecord(filter, {
      workLink,
      dataOption: {
        $set: {
          article_id: publishInfo.article_id,
        },
      },
    })

    return 'success'
  }

  private getWxPublishFailReason(publishStatus: WxPublishStatus) {
    const statusText: Record<number, string> = {
      [WxPublishStatus.Publishing]: '发布中',
      [WxPublishStatus.OriginalFail]: '原创校验失败',
      [WxPublishStatus.RegularFail]: '常规发布失败',
      [WxPublishStatus.PlatformAuditFail]: '平台审核不通过',
      [WxPublishStatus.SuccessAfterUserDeleteAllArticle]: '发布成功后用户删除所有文章',
      [WxPublishStatus.SuccessAfterSystemBanAllArticle]: '发布成功后系统封禁所有文章',
    }
    const reason = statusText[publishStatus] || `未知发布状态: ${publishStatus}`
    return `微信公众号发布失败，原因: ${reason}`
  }
}
