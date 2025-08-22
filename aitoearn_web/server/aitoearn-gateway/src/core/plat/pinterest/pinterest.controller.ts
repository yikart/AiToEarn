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
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { GetToken, Public } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { OrgGuard } from '@/common/interceptor/transform.interceptor'
import { config } from '@/config'
import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
} from './dto/pinterest.dto'
import { PinterestService } from './pinterest.service'

@ApiTags('plat/pinterest - PIN平台')
@Controller('plat/pinterest')
export class PinterestController {
  private redirect_url = ''
  private mailBackHost = ''
  constructor(private readonly pinterestService: PinterestService) {
    this.redirect_url = config.pinterest.redirect_url
    this.mailBackHost = config.mailBackHost
  }

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
  delBoardById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return this.pinterestService.delBoardById(id, accountId)
  }

  @ApiOperation({ summary: '创建pin' })
  @Post('pin/')
  createPin(@Body() body: CreatePinBodyDto) {
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
  delPinById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return this.pinterestService.delPinById(id, accountId)
  }

  @ApiOperation({ summary: '获取授权登录页面' })
  @Get('getAuth/')
  getAuth(@GetToken() token: TokenInfo) {
    const userId = token.id
    return this.pinterestService.getAuth(userId)
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
  authWebhook(@Query() query: any, @Res() res: Response) {
    return this.pinterestService.authWebhook(query)
  }
}
