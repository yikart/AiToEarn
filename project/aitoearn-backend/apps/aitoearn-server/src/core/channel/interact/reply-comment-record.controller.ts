import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { AddReplyCommentRecordDto, ReplyCommentRecordListDto } from './reply-comment-record.dto'
import { ReplyCommentRecordService } from './reply-comment-record.service'

@ApiTags('Engage/ReplyCommentRecord')
@Controller('channel/replyCommentRecord')
export class ReplyCommentRecordController {
  constructor(
    readonly replyCommentRecordService: ReplyCommentRecordService,
  ) {}

  @ApiDoc({
    summary: 'Add Reply Comment Record',
    body: AddReplyCommentRecordDto.schema,
  })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddReplyCommentRecordDto,
  ) {
    return await this.replyCommentRecordService.create({
      ...data,
      userId: token.id,
    })
  }

  @ApiDoc({
    summary: 'List Reply Comment Records',
  })
  @Get('/list/:pageNo/:pageSize')
  async list(
    @GetToken() token: TokenInfo,
    @Query() query: ReplyCommentRecordListDto,
    @Param() param: TableDto,
  ) {
    return await this.replyCommentRecordService.getList({ ...query.filters, userId: token.id }, param)
  }

  @ApiDoc({
    summary: 'Delete Reply Comment Record',
  })
  @Delete('/:id')
  async del(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    return await this.replyCommentRecordService.delete(id)
  }
}
