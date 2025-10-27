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
  Render,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import * as _ from 'lodash'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
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
  createBoard(@Body() body: CreateBoardBodyDto) {
    return this.pinterestService.createBoard(body)
  }

  @ApiOperation({ summary: '获取board列表信息' })
  @Get('board/')
  getBoardList(
    @Query() query: ListBodyDto,
  ) {
    return this.pinterestService.getBoardList(query)
  }

  @ApiOperation({ summary: '获取单个board' })
  @Get('board/:id')
  getBoardById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return this.pinterestService.getBoardById(id, accountId)
  }

  @ApiOperation({ summary: '删除单个board' })
  @Delete('board/:id')
  delBoardById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return this.pinterestService.delBoardById(id, accountId)
  }

  @ApiOperation({ summary: '创建pin' })
  @Post('pin/')
  createPin(@Body() body: CreatePinBodyDto) {
    if (_.has(body, 'desc') && _.isString(body.decs))
      body.description = body.decs
    return this.pinterestService.createPin(body)
  }

  @ApiOperation({ summary: '获取pin列表' })
  @Get('pin/')
  getPinList(
    @Query() query: ListBodyDto,
  ) {
    return this.pinterestService.getPinList(query)
  }

  @ApiOperation({ summary: '获取pin' })
  @Get('pin/:id')
  getPinById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return this.pinterestService.getPinById(id, accountId)
  }

  @ApiOperation({ summary: '删除单个pin' })
  @Delete('pin/:id')
  delPinById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return this.pinterestService.delPinById(id, accountId)
  }

  @ApiOperation({ summary: '获取授权登录页面' })
  @Get('getAuth/')
  getAuth(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
  ) {
    const userId = token.id
    return this.pinterestService.getAuth(userId, spaceId || '')
  }

  @ApiOperation({ summary: '查询授权结果' })
  @Get('checkAuth/')
  checkAuth(@Query('taskId') taskId: string) {
    return this.pinterestService.checkAuth(taskId)
  }

  @Public()
  @UseGuards(OrgGuard)
  @Get('authWebhook')
  @Render('auth/back')
  authWebhook(@Query() query: any) {
    return this.pinterestService.authWebhook(query)
  }
}
