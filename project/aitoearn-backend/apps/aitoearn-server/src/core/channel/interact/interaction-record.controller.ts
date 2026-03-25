import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { AddInteractionRecordDto, InteractionRecordListDto } from './interaction-record.dto'
import { InteractionRecordService } from './interaction-record.service'

@ApiTags('Engage/InteractionRecord')
@Controller('channel/interactionRecord')
export class InteractionRecordController {
  constructor(
    readonly interactionRecordService: InteractionRecordService,
  ) {}

  @ApiDoc({
    summary: 'Add Interaction Record',
    body: AddInteractionRecordDto.schema,
  })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddInteractionRecordDto,
  ) {
    return await this.interactionRecordService.create({
      ...data,
      userId: token.id,
    })
  }

  @ApiDoc({
    summary: 'List Interaction Records',
  })
  @Get('/list/:pageNo/:pageSize')
  async list(
    @GetToken() token: TokenInfo,
    @Query() query: InteractionRecordListDto,
    @Param() param: TableDto,
  ) {
    return await this.interactionRecordService.getList({ ...query.filters, userId: token.id }, param)
  }

  @ApiDoc({
    summary: 'Delete Interaction Record',
  })
  @Delete('/:id')
  async del(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    return await this.interactionRecordService.delete(id)
  }
}
