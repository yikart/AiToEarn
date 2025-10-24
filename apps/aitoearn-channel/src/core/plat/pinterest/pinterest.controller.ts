import { Body, Controller, Post } from '@nestjs/common'
import { CreateBoardBodyDto, CreatePinBodyDto, WebhookDto } from './dto/pinterest.dto'
import { PinterestService } from './pinterest.service'

@Controller()
export class PinterestController {
  constructor(
    private readonly pinterestService: PinterestService,
  ) {
  }

  // 创建board
  // @NatsMessagePattern('plat.pinterest.createBoard')
  @Post('plat/pinterest/createBoard')
  createBoard(@Body() data: CreateBoardBodyDto) {
    return this.pinterestService.createBoard(data)
  }

  // board list
  // @NatsMessagePattern('plat.pinterest.getBoardList')
  @Post('plat/pinterest/getBoardList')
  getBoardList(@Body() data: { accountId: string }) {
    return this.pinterestService.getBoardList(data.accountId)
  }

  // 获取单个board
  // @NatsMessagePattern('plat.pinterest.getBoardById')
  @Post('plat/pinterest/getBoardById')
  getBoardById(@Body() data: { id: string, accountId: string }) {
    return this.pinterestService.getBoardById(data.id, data.accountId)
  }

  // 删除单个board
  // @NatsMessagePattern('plat.pinterest.delBoardById')
  @Post('plat/pinterest/delBoardById')
  delBoardById(@Body() data: { id: string, accountId: string }) {
    return this.pinterestService.delBoardById(data.id, data.accountId)
  }

  // 创建pin

  // @NatsMessagePattern('plat.pinterest.createPin')
  @Post('plat/pinterest/createPin')
  createPin(@Body() data: CreatePinBodyDto) {
    return this.pinterestService.createPin(data)
  }

  // 获取pin
  // @NatsMessagePattern('plat.pinterest.getPinById')
  @Post('plat/pinterest/getPinById')
  getPinById(@Body() data: { id: string, accountId: string }) {
    return this.pinterestService.getPinById(data.id, data.accountId)
  }

  // 获取pin
  // @NatsMessagePattern('plat.pinterest.getPinList')
  @Post('plat/pinterest/getPinList')
  getPinList(@Body() data: { accountId: string }) {
    return this.pinterestService.getPinList(data.accountId)
  }

  // 删除pin
  // @NatsMessagePattern('plat.pinterest.delPinById')
  @Post('plat/pinterest/delPinById')
  delPinById(@Body() data: { id: string, accountId: string }) {
    return this.pinterestService.delPinById(data.id, data.accountId)
  }

  // 上传视频获取视频id
  // @NatsMessagePattern('plat.pinterest.uploadVideo')
  @Post('plat/pinterest/uploadVideo')
  uploadVideo(@Body() data: { videoUrl: string, accountId: string }) {
    return this.pinterestService.uploadVideo(data.videoUrl, data.accountId)
  }

  // 获取授权地址
  // @NatsMessagePattern('plat.pinterest.getAuth')
  @Post('plat/pinterest/getAuth')
  getAuth(@Body() data: { userId: string, spaceId: string }) {
    return this.pinterestService.getAuth(data.userId, data.spaceId)
  }

  // 授权地址回调
  // @NatsMessagePattern('plat.pinterest.authWebhook')
  @Post('plat/pinterest/authWebhook')
  authWebhook(@Body() data: WebhookDto) {
    return this.pinterestService.authWebhook(data)
  }

  // 查询授权结果
  // 获取授权地址
  // @NatsMessagePattern('plat.pinterest.checkAuth')
  @Post('plat/pinterest/checkAuth')
  checkAuth(@Body() data: { taskId: string }) {
    return this.pinterestService.checkAuth(data.taskId)
  }

  // 获取用户信息
  // @NatsMessagePattern('plat.pinterest.getUserInfo')
  @Post('plat/pinterest/getUserInfo')
  getUserInfo(@Body() data: { accountId: string }) {
    return this.pinterestService.getUserInfo(data.accountId)
  }

  // @NatsMessagePattern('plat.pinterest.accessTokenStatus')
  @Post('plat/pinterest/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: { accountId: string }) {
    return await this.pinterestService.getAccessTokenStatus(data.accountId)
  }
}
