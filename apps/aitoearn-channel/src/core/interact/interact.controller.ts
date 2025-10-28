/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 渠道互动
 */
import { Body, Controller, Post } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { AppException } from '@yikart/common'
import { AccountService } from '../account/account.service'
import { PublishRecordService } from '../account/publishRecord.service'
import {
  AddArcCommentDto,
  DelCommentDto,
  GetArcCommentListDto,
  ReplyCommentDto,
} from './dto/interact.dto'
import { InteracteBase } from './interact.base'
import { WxGzhInteractService } from './wxGzhInteract.service'

@Controller()
export class InteracteController {
  private readonly interactMap = new Map<AccountType, InteracteBase>()

  constructor(
    readonly accountService: AccountService,
    readonly publishRecordService: PublishRecordService,
    readonly wxGzhInteractService: WxGzhInteractService,
  ) {
    this.interactMap.set(AccountType.BILIBILI, wxGzhInteractService)
  }

  private async getInteract(accountId: string) {
    const account = await this.accountService.getAccountInfo(accountId)
    if (!account)
      throw new AppException(1, '账户不存在')
    const interact = this.interactMap.get(account.type)
    if (!interact)
      throw new AppException(1, '暂不支持该账户类型')
    return { interact, account }
  }

  // @NatsMessagePattern('channel.interact.addArcComment')
  @Post('channel/interact/addArcComment')
  async getAccountDataCube(@Body() data: AddArcCommentDto) {
    const interact = await this.getInteract(data.accountId)
    const res = await interact.interact.addArcComment(
      interact.account,
      data.dataId,
      data.content,
    )
    return res
  }

  // @NatsMessagePattern('channel.interact.getArcCommentList')
  @Post('channel/interact/getArcCommentList')
  async getAccountDataBulk(@Body() data: GetArcCommentListDto) {
    const record = await this.publishRecordService.getPublishRecordInfo(
      data.recordId,
    )
    if (!record) {
      throw new AppException(1, '未找到发布记录')
    }
    const interact = await this.getInteract(record.accountId)
    const res = await interact.interact.getArcCommentList(record, data)
    return res
  }

  // @NatsMessagePattern('channel.interact.replyComment')
  @Post('channel/interact/replyComment')
  async replyComment(@Body() data: ReplyCommentDto) {
    const interact = await this.getInteract(data.accountId)
    const res = await interact.interact.replyComment(
      data.accountId,
      data.commentId,
      data.content,
    )
    return res
  }

  // @NatsMessagePattern('channel.interact.delComment')
  @Post('channel/interact/delComment')
  async getArcDataBulk(@Body() data: DelCommentDto) {
    const interact = await this.getInteract(data.accountId)
    const res = await interact.interact.delComment(
      data.accountId,
      data.commentId,
    )
    return res
  }
}
