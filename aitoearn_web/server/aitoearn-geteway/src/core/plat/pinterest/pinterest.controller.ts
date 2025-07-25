/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import * as _ from 'lodash'
import { GetToken, Public } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
} from './dto/pinterest.dto'
import { PinterestService } from './pinterest.service'

@ApiTags('plat/pinterest - PIN平台')
@Controller('plat/pinterest')
export class PinterestController {
  constructor(private readonly pinterestService: PinterestService) {}

  @ApiOperation({ summary: '创建board' })
  @Post('board/')
  createBoard(@GetToken() token: TokenInfo, @Body() body: CreateBoardBodyDto) {
    const userId = token.id
    body = _.assign(body || {}, { userId })
    return this.pinterestService.createBoard(body)
  }

  @ApiOperation({ summary: '获取board列表信息' })
  @Get('board/')
  getBoardList(
    @GetToken() token: TokenInfo,
    @Query() query: ListBodyDto,
  ) {
    const userId = token.id
    query = _.assign(query || {}, { userId })
    return this.pinterestService.getBoardList(query)
  }

  @ApiOperation({ summary: '获取单个board' })
  @Get('board/:id')
  getBoardById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const userId = token.id
    return this.pinterestService.getBoardById(id, userId)
  }

  @ApiOperation({ summary: '删除单个board' })
  @Delete('board/:id')
  delBoardById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const userId = token.id
    return this.pinterestService.delBoardById(id, userId)
  }

  @ApiOperation({ summary: '创建pin' })
  @Post('pin/')
  createPin(@GetToken() token: TokenInfo, @Body() body: CreatePinBodyDto) {
    const userId = token.id
    body = _.assign(body || {}, { userId })
    return this.pinterestService.createPin(body)
  }

  @ApiOperation({ summary: '获取pin列表' })
  @Get('pin/')
  getPinList(
    @GetToken() token: TokenInfo,
    @Query() query: ListBodyDto,
  ) {
    const userId = token.id
    query = _.assign(query || {}, { userId })
    return this.pinterestService.getPinList(query)
  }

  @ApiOperation({ summary: '获取pin' })
  @Get('pin/:id')
  getPinById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const userId = token.id
    return this.pinterestService.getPinById(id, userId)
  }

  @ApiOperation({ summary: '删除单个pin' })
  @Delete('pin/:id')
  delPinById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const userId = token.id
    return this.pinterestService.delPinById(id, userId)
  }

  @ApiOperation({ summary: '获取授权登录页面' })
  @Get('getAuth/')
  getAuth(@GetToken() token: TokenInfo) {
    const userId = token.id
    return this.pinterestService.getAuth(userId)
  }

  @ApiOperation({ summary: '查询授权结果' })
  @Get('checkAuth/')
  checkAuth(@GetToken() token: TokenInfo) {
    const userId = token.id
    return this.pinterestService.checkAuth(userId)
  }

  @Public()
  @Get('authWebhook')
  authWebhook(@Query() query: any, @Res() res: Response) {
    this.pinterestService.authWebhook(query)
    res.redirect(301, 'https://apitest.aiearn.ai/en/pinterest')
  }
}
