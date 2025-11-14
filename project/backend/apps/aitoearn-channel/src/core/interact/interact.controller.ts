/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 渠道互动
 */
import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AccountType } from '@yikart/aitoearn-server-client'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { AccountService } from '../account/account.service'
import { PublishRecordService } from '../account/publish-record.service'
import {
  AddArcCommentDto,
  DelCommentDto,
  GetArcCommentListDto,
  ReplyCommentDto,
} from './dto/interact.dto'
import { InteracteBase } from './interact.base'
import { WxGzhInteractService } from './wx-gzh-interact.service'

@ApiTags('OpenSource/Core/Interact/Interact')
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
      throw new AppException(ResponseCode.SkKeyAccountNotFound)
    const interact = this.interactMap.get(account.type)
    if (!interact)
      throw new AppException(ResponseCode.InteractAccountTypeNotSupported)
    return { interact, account }
  }

  // @NatsMessagePattern('channel.interact.addArcComment')
  @ApiDoc({
    summary: 'Add Comment to Work',
  })
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
  @ApiDoc({
    summary: 'List Comments of Work',
  })
  @Post('channel/interact/getArcCommentList')
  async getAccountDataBulk(@Body() data: GetArcCommentListDto) {
    const record = await this.publishRecordService.getPublishRecordInfo(
      data.recordId,
    )
    if (!record) {
      throw new AppException(ResponseCode.InteractRecordNotFound)
    }
    const interact = await this.getInteract(record.accountId)
    const res = await interact.interact.getArcCommentList(record, data)
    return res
  }

  // @NatsMessagePattern('channel.interact.replyComment')
  @ApiDoc({
    summary: 'Reply to Comment',
  })
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
  @ApiDoc({
    summary: 'Delete Comment',
  })
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
