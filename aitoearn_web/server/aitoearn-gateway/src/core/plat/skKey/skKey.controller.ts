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
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { TableDto } from '@/common/dto/table.dto'
import { ChannelSkKeyNatsApi } from '@/transports/plat/skKeyNatsApi.natsApi'
import {
  CreateSkKeyDto,
  GetRefAccountListDto,
  SkKeyAddRefAccountDto,
  SkKeyUpInfoDto,
} from './dto/skKey.dto'

@ApiTags('频道MCP的SkKey')
@Controller('channel/skKey')
export class SkKeyController {
  constructor(private readonly platSkKeyatsApi: ChannelSkKeyNatsApi) {}

  @ApiOperation({
    summary: '创建skKey',
    description: '创建skKey',
  })
  @Post()
  create(@GetToken() token: TokenInfo, @Body() body: CreateSkKeyDto) {
    return this.platSkKeyatsApi.create(token.id, body.desc)
  }

  @ApiOperation({
    summary: '删除关联',
    description: '删除关联',
  })
  @Delete('ref')
  delRefAccount(
    @GetToken() token: TokenInfo,
    @Body() body: any,
  ) {
    return this.platSkKeyatsApi.delRefAccount(body.key, body.accountId)
  }

  @ApiOperation({
    summary: '删除skKey',
    description: '删除skKey',
  })
  @Delete(':key')
  del(@GetToken() token: TokenInfo, @Param('key') key: string) {
    return this.platSkKeyatsApi.del(key)
  }

  @ApiOperation({
    summary: '更新skKey',
    description: '更新skKey',
  })
  @Put()
  upInfo(@GetToken() token: TokenInfo, @Body() body: SkKeyUpInfoDto) {
    return this.platSkKeyatsApi.upInfo(body.key, body.desc)
  }

  @ApiOperation({
    summary: '获取skKey',
    description: '获取skKey',
  })
  @Get('info/:key')
  getInfo(@GetToken() token: TokenInfo, @Param('key') key: string) {
    return this.platSkKeyatsApi.getInfo(key)
  }

  @ApiOperation({
    summary: '获取skKey列表',
    description: '获取skKey列表',
  })
  @Get('list/:pageNo/:pageSize')
  list(@GetToken() token: TokenInfo, @Param() page: TableDto) {
    return this.platSkKeyatsApi.list(page, { userId: token.id })
  }

  @ApiOperation({
    summary: '创建关联',
    description: '创建关联',
  })
  @Post('ref')
  addRefAccount(
    @GetToken() token: TokenInfo,
    @Body() body: SkKeyAddRefAccountDto,
  ) {
    return this.platSkKeyatsApi.addRefAccount(body.key, body.accountId)
  }

  @ApiOperation({
    summary: '获取关联列表',
    description: '获取关联列表',
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
