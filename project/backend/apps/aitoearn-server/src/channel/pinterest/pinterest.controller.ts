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
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import * as _ from 'lodash'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
} from './dto/pinterest.dto'
import { PinterestService } from './pinterest.service'

@ApiTags('OpenSource/Platform/Pinterest')
@Controller('plat/pinterest')
export class PinterestController {
  constructor(private readonly pinterestService: PinterestService) {}

  @ApiDoc({
    summary: 'Create Board',
    body: CreateBoardBodyDto.schema,
  })
  @Post('board/')
  async createBoard(@Body() body: CreateBoardBodyDto) {
    return await this.pinterestService.createBoard(body)
  }

  @ApiDoc({
    summary: 'List Boards',
    query: ListBodyDto.schema,
  })
  @Get('board/')
  async getBoardList(
    @Query() query: ListBodyDto,
  ) {
    return await this.pinterestService.getBoardList(query)
  }

  @ApiDoc({
    summary: 'Get Board Detail',
  })
  @Get('board/:id')
  async getBoardById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return await this.pinterestService.getBoardById(id, accountId)
  }

  @ApiDoc({
    summary: 'Delete Board',
  })
  @Delete('board/:id')
  delBoardById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return this.pinterestService.delBoardById(id, accountId)
  }

  @ApiDoc({
    summary: 'Create Pin',
    body: CreatePinBodyDto.schema,
  })
  @Post('pin/')
  async createPin(@Body() body: CreatePinBodyDto) {
    if (_.has(body, 'desc') && _.isString(body.decs))
      body.description = body.decs
    return await this.pinterestService.createPin(body)
  }

  @ApiDoc({
    summary: 'List Pins',
    query: ListBodyDto.schema,
  })
  @Get('pin/')
  async getPinList(
    @Query() query: ListBodyDto,
  ) {
    return await this.pinterestService.getPinList(query)
  }

  @ApiDoc({
    summary: 'Get Pin Detail',
  })
  @Get('pin/:id')
  async getPinById(@Param('id') id: string, @Query('accountId') accountId: string) {
    return await this.pinterestService.getPinById(id, accountId)
  }

  @ApiDoc({
    summary: 'Delete Pin',
  })
  @Delete('pin/:id')
  async delPinById(@Param('id') id: string, @Body('accountId') accountId: string) {
    return await this.pinterestService.delPinById(id, accountId)
  }

  @ApiDoc({
    summary: 'Get Authorization URL',
  })
  @Get('getAuth/')
  async getAuth(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
  ) {
    const userId = token.id
    return await this.pinterestService.getAuth(userId, spaceId || '')
  }

  @ApiDoc({
    summary: 'Check Authorization Result',
  })
  @Get('checkAuth/')
  async checkAuth(@Query('taskId') taskId: string) {
    return await this.pinterestService.checkAuth(taskId)
  }

  @Public()
  @UseGuards(OrgGuard)
  @ApiDoc({
    summary: 'Handle Authorization Webhook',
  })
  @Get('authWebhook')
  async authWebhook(@Query() query: any, @Res() res: Response) {
    const result = await this.pinterestService.authWebhook(query)
    return res.render('auth/back', result)
  }
}
