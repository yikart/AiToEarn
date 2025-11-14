/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 频道MCP的SkKey
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { ChannelSkKeyNatsApi } from '../../transports/channel/api/skKeyNatsApi.natsApi'
import {
  CreateSkKeyDto,
  GetRefAccountListDto,
  SkKeyAddRefAccountDto,
  SkKeyUpInfoDto,
} from './dto/skKey.dto'

@ApiTags('OpenSource/Home/SkKey')
@Controller('channel/skKey')
export class SkKeyController {
  constructor(private readonly platSkKeyatsApi: ChannelSkKeyNatsApi) {}

  @ApiDoc({
    summary: 'Create SkKey',
    description: 'Create a new SkKey entry.',
    body: CreateSkKeyDto.schema,
  })
  @Post()
  create(@GetToken() token: TokenInfo, @Body() body: CreateSkKeyDto) {
    return this.platSkKeyatsApi.create(token.id, body.desc)
  }

  @ApiDoc({
    summary: 'Remove SkKey Association',
    description: 'Delete an account association from a SkKey.',
  })
  @Delete('ref')
  delRefAccount(
    @GetToken() token: TokenInfo,
    @Body() body: any,
  ) {
    return this.platSkKeyatsApi.delRefAccount(body.key, body.accountId)
  }

  @ApiDoc({
    summary: 'Delete SkKey',
    description: 'Remove a SkKey entry.',
  })
  @Delete(':key')
  del(@GetToken() token: TokenInfo, @Param('key') key: string) {
    return this.platSkKeyatsApi.del(key)
  }

  @ApiDoc({
    summary: 'Update SkKey',
    description: 'Update SkKey metadata.',
    body: SkKeyUpInfoDto.schema,
  })
  @Put()
  upInfo(@GetToken() token: TokenInfo, @Body() body: SkKeyUpInfoDto) {
    return this.platSkKeyatsApi.upInfo(body.key, body.desc)
  }

  @ApiDoc({
    summary: 'Get SkKey Detail',
    description: 'Retrieve SkKey details.',
  })
  @Get('info/:key')
  getInfo(@GetToken() token: TokenInfo, @Param('key') key: string) {
    return this.platSkKeyatsApi.getInfo(key)
  }

  @ApiDoc({
    summary: 'List SkKeys',
    description: 'List SkKeys belonging to the current user.',
  })
  @Get('list/:pageNo/:pageSize')
  list(@GetToken() token: TokenInfo, @Param() page: TableDto) {
    return this.platSkKeyatsApi.list(page, { userId: token.id })
  }

  @ApiDoc({
    summary: 'Create SkKey Association',
    description: 'Associate a SkKey with an account.',
    body: SkKeyAddRefAccountDto.schema,
  })
  @Post('ref')
  addRefAccount(
    @GetToken() token: TokenInfo,
    @Body() body: SkKeyAddRefAccountDto,
  ) {
    return this.platSkKeyatsApi.addRefAccount(body.key, body.accountId)
  }

  @ApiDoc({
    summary: 'List SkKey Associations',
    description: 'Retrieve associated accounts for a SkKey.',
    query: GetRefAccountListDto.schema,
  })
  @Get('ref/list/:pageNo/:pageSize')
  getRefAccountList(
    @GetToken() token: TokenInfo,
    @Param() page: TableDto,
    @Query() query: GetRefAccountListDto,
  ) {
    return this.platSkKeyatsApi.getRefAccountList(query.key, page)
  }
}
