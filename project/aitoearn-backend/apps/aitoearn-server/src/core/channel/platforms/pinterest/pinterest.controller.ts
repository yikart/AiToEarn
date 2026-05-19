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
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Internal, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  GetPinByIdBodyDto,
  ListBodyDto,
} from './pinterest.dto'
import { PinterestService } from './pinterest.service'

@ApiTags('Platform/Pinterest')
@Controller('plat/pinterest')
export class PinterestController {
  constructor(private readonly pinterestService: PinterestService) {}

  @ApiDoc({
    summary: 'Create Board',
    body: CreateBoardBodyDto.schema,
  })
  @Post('/board/')
  async createBoard(@GetToken() token: TokenInfo, @Body() body: CreateBoardBodyDto) {
    return await this.pinterestService.createBoard(token.id, body)
  }

  @ApiDoc({
    summary: 'List Boards',
    query: ListBodyDto.schema,
  })
  @Get('/board/')
  async getBoardList(@GetToken() token: TokenInfo, @Query() query: ListBodyDto) {
    return await this.pinterestService.getBoardList(token.id, query.accountId || '')
  }

  @ApiDoc({
    summary: 'Get Board Detail',
  })
  @Get('/board/:id')
  async getBoardById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ) {
    return await this.pinterestService.getBoardById(token.id, id, accountId)
  }

  @ApiDoc({
    summary: 'Delete Board',
  })
  @Delete('/board/:id')
  delBoardById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body('accountId') accountId: string,
  ) {
    return this.pinterestService.delBoardById(token.id, id, accountId)
  }

  @ApiDoc({
    summary: 'Create Pin',
    body: CreatePinBodyDto.schema,
  })
  @Post('/pin/')
  async createPin(@GetToken() token: TokenInfo, @Body() body: CreatePinBodyDto) {
    return await this.pinterestService.createPin(token.id, body)
  }

  @ApiDoc({
    summary: 'List Pins',
    query: ListBodyDto.schema,
  })
  @Get('/pin/')
  async getPinList(@GetToken() token: TokenInfo, @Query() query: ListBodyDto) {
    return await this.pinterestService.getPinList(token.id, query.accountId || '')
  }

  @ApiDoc({
    summary: 'Get Pin Detail',
  })
  @Get('/pin/:id')
  async getPinById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ) {
    return await this.pinterestService.getPinById(token.id, id, accountId)
  }

  @ApiDoc({
    summary: 'Delete Pin',
  })
  @Delete('/pin/:id')
  async delPinById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body('accountId') accountId: string,
  ) {
    return await this.pinterestService.deletePostForUser(token.id, accountId, id)
  }

  @ApiDoc({
    summary: 'Get Authorization URL',
  })
  @Get('/getAuth/')
  async getAuth(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    return await this.pinterestService.getAuth(token.id, spaceId || '', callbackUrl, callbackMethod)
  }

  @ApiDoc({
    summary: 'Check Authorization Result',
  })
  @Get('/checkAuth/')
  async checkAuth(
    @GetToken() token: TokenInfo,
    @Query('taskId') taskId: string,
  ) {
    return await this.pinterestService.checkAuth(taskId)
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Authorization Webhook',
  })
  @Get('/authWebhook')
  async authWebhook(@Query() query: { code?: string, state?: string }, @Res() res: Response) {
    const result = await this.pinterestService.authWebhook(query)
    if (result.status === 1 && result.callbackUrl) {
      return res.render('auth/back', { ...result, autoPostCallback: true })
    }
    return res.render('auth/back', result)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Pin List (Crawler)',
    body: ListBodyDto.schema,
  })
  @Post('/getPinList')
  async getCrawlerPinList(@Body() data: ListBodyDto) {
    return await this.pinterestService.getPinListByAccountId(data.accountId || '')
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Pin By Id (Crawler)',
    body: GetPinByIdBodyDto.schema,
  })
  @Post('/getPinById')
  async getCrawlerPinById(@Body() data: GetPinByIdBodyDto) {
    return await this.pinterestService.getPinByIdByAccountId(data.id, data.accountId)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get User Info (Crawler)',
    body: ListBodyDto.schema,
  })
  @Post('/getUserInfo')
  async getCrawlerUserInfo(@Body() data: ListBodyDto) {
    return await this.pinterestService.getUserInfo(data.accountId || '')
  }
}
