import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType } from '@yikart/aitoearn-server-client'
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { PublishRecordService } from '../../publish-record/publish-record.service'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { ChannelAccountService } from '../platforms/channel-account.service'
import { InteracteBase } from './interact.base'
import {
  AddArcCommentDto,
  DelCommentDto,
  ReplyCommentDto,
} from './interact.dto'
import { WxGzhInteractService } from './wx-gzh-interact.service'

@ApiTags('Engage/Interact')
@Controller('channel/interact')
export class InteracteController {
  private readonly interactMap = new Map<AccountType, InteracteBase>()

  constructor(
    readonly channelAccountService: ChannelAccountService,
    readonly publishRecordService: PublishRecordService,
    readonly wxGzhInteractService: WxGzhInteractService,
  ) {
    this.interactMap.set(AccountType.BILIBILI, wxGzhInteractService)
  }

  private async getInteract(accountId: string) {
    const account = await this.channelAccountService.getAccountInfo(accountId)
    if (!account)
      throw new AppException(ResponseCode.ChannelAccountNotFound)
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    const interact = this.interactMap.get(account.type)
    if (!interact)
      throw new AppException(ResponseCode.InteractAccountTypeNotSupported)
    return { interact, account }
  }

  @ApiDoc({
    summary: 'Add Comment to Post',
    body: AddArcCommentDto.schema,
  })
  @Post('/addArcComment')
  async addArcComment(
    @GetToken() token: TokenInfo,
    @Body() data: AddArcCommentDto,
  ) {
    const { interact, account } = await this.getInteract(data.accountId)
    return interact.addArcComment(account, data.dataId, data.content)
  }

  @ApiDoc({
    summary: 'Get Comment List',
  })
  @Get('/getArcCommentList/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query('recordId') recordId: string,
    @Param() query: TableDto,
  ) {
    const record = await this.publishRecordService.getPublishRecordInfo(recordId)
    if (!record || !record.accountId) {
      throw new AppException(ResponseCode.InteractRecordNotFound)
    }
    const { interact } = await this.getInteract(record.accountId)
    return interact.getArcCommentList(record, query)
  }

  @ApiDoc({
    summary: 'Reply to Comment',
    body: ReplyCommentDto.schema,
  })
  @Post('/replyComment')
  async replyComment(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyCommentDto,
  ) {
    const { interact } = await this.getInteract(data.accountId)
    return interact.replyComment(data.accountId, data.commentId, data.content)
  }

  @ApiDoc({
    summary: 'Delete Comment',
    body: DelCommentDto.schema,
  })
  @Delete('/delComment')
  async delComment(
    @GetToken() token: TokenInfo,
    @Body() data: DelCommentDto,
  ) {
    const { interact } = await this.getInteract(data.accountId)
    return interact.delComment(data.accountId, data.commentId)
  }
}
