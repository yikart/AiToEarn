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
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { Response } from 'express'
import * as _ from 'lodash'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
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
  async createBoard(@Body() body: CreateBoardBodyDto) {
    return await this.pinterestService.createBoard(body)
  }

  @ApiOperation({ summary: '获取board列表信息' })
  @Get('board/')
  async getBoardList(
    @Query() query: ListBodyDto,
  ) {
    return await this.pinterestService.getBoardList(query)
  }

  @ApiOperation({ summary: '获取单个board' })
  @Get('board/:id')
  async getBoardById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return await this.pinterestService.getBoardById(id, accountId)
  }

  @ApiOperation({ summary: '删除单个board' })
  @Delete('board/:id')
  delBoardById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return this.pinterestService.delBoardById(id, accountId)
  }

  @ApiOperation({ summary: '创建pin' })
  @Post('pin/')
  async createPin(@Body() body: CreatePinBodyDto) {
    if (_.has(body, 'desc') && _.isString(body.decs))
      body.description = body.decs
    return await this.pinterestService.createPin(body)
  }

  @ApiOperation({ summary: '获取pin列表' })
  @Get('pin/')
  async getPinList(
    @Query() query: ListBodyDto,
  ) {
    return await this.pinterestService.getPinList(query)
  }

  @ApiOperation({ summary: '获取pin' })
  @Get('pin/:id')
  async getPinById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return await this.pinterestService.getPinById(id, accountId)
  }

  @ApiOperation({ summary: '删除单个pin' })
  @Delete('pin/:id')
  async delPinById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return await this.pinterestService.delPinById(id, accountId)
  }

  @ApiOperation({ summary: '获取授权登录页面' })
  @Get('getAuth/')
  async getAuth(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
  ) {
    const userId = token.id
    return await this.pinterestService.getAuth(userId, spaceId || '')
  }

  @ApiOperation({ summary: '查询授权结果' })
  @Get('checkAuth/')
  async checkAuth(@Query('taskId') taskId: string) {
    return await this.pinterestService.checkAuth(taskId)
  }

  @Public()
  @UseGuards(OrgGuard)
  @Get('authWebhook')
  async authWebhook(@Query() query: any, @Res() res: Response) {
    const result = await this.pinterestService.authWebhook(query)
    return res.render('auth/back', result)
  }
}
