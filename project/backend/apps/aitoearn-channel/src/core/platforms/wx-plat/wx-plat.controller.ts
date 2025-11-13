import { Body, Controller, Delete, Logger, Param, Post } from '@nestjs/common'
import { PublishRecordService } from '../../../core/account/publish-record.service'
import {
  DisposeAuthTaskDto,
  GetAuthUrlDto,
} from './dto/wx-plat.dto'
import { WxGzhService } from './wx-gzh.service'
import { WxPlatService } from './wx-plat.service'

@Controller()
export class WxPlatController {
  logger = new Logger(WxPlatController.name)
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly wxGzhService: WxGzhService,
    private readonly publishRecordService: PublishRecordService,
  ) { }

  /**
   * 更新发布结果
   * @param data
   * @returns
   */
  // @NatsMessagePattern('channel.wxPlat.updatePublishRecord')
  @Post('channel/wxPlat/updatePublishRecord')
  async updatePublishRecord(@Body() data: {
    publish_id: string
    appId: string
    article_url?: string
    article_id: string
  }) {
    const res = await this.publishRecordService.donePublishRecord({ dataId: data.publish_id, uid: data.appId }, {
      workLink:
        data.article_url || `https://mp.weixin.qq.com/s/${data.article_id}`,
      dataOption: {
        $set: {
          article_id: data.article_id,
        },
      },
    })

    return res
  }

  /**
   * 创建授权任务
   * @param data
   * @returns
   */
  // @NatsMessagePattern('plat.wxPlat.auth')
  @Post('plat/wxPlat/auth')
  createAuthTask(@Body() data: GetAuthUrlDto) {
    const res = this.wxPlatService.createAuthTask(
      {
        userId: data.userId,
        type: data.type,
        spaceId: data.spaceId,
      },
      {
        transpond: data.prefix,
      },
    )

    return res
  }

  /**
   * 获取账号授权信息
   */
  // @NatsMessagePattern('plat.wxPlat.getAuthInfo')
  @Post('plat/wxPlat/getAuthInfo')
  async getAuthInfo(@Body() data: { taskId: string }) {
    const res = await this.wxPlatService.getAuthTaskInfo(data.taskId)
    return res
  }

  /**
   * 处理用户的账号授权
   * @param data
   * @returns
   */
  // @NatsMessagePattern('channel.wxPlat.createAccountAndSetAccessToken')
  @Post('channel/wxPlat/createAccountAndSetAccessToken')
  async disposeAuthTask(@Body() data: DisposeAuthTaskDto) {
    const res = await this.wxPlatService.createAccountAndSetAccessToken(
      data.taskId,
      {
        authCode: data.auth_code,
        expiresIn: data.expires_in,
      },
    )
    return res
  }

  /**
   * 获取累计用户数据
   */
  // @NatsMessagePattern('plat.wxPlat.getUserCumulate')
  @Post('plat/wxPlat/getUserCumulate')
  async getUserCumulate(@Body() data: { accountId: string, beginDate: string, endDate: string }) {
    const res = await this.wxGzhService.getusercumulate(data.accountId, data.beginDate, data.endDate)
    return res
  }

  /**
   * 获取图文阅读概况数据
   */
  // @NatsMessagePattern('plat.wxPlat.getUserRead')
  @Post('plat/wxPlat/getUserRead')
  async getUserRead(@Body() data: { accountId: string, beginDate: string, endDate: string }) {
    const res = await this.wxGzhService.getuserread(data.accountId, data.beginDate, data.endDate)
    return res
  }

  @Delete(':accountId/articles/:articleId')
  async deleteArticle(@Param('accountId') accountId: string, @Param('articleId') articleId: string) {
    const res = await this.wxGzhService.deleteArticle(accountId, articleId)
    return res
  }
}
