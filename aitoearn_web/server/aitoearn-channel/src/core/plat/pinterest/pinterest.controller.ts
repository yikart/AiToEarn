import { Controller, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { CreateBoardBodyDto, CreatePinBodyDto, WebhookDto } from './dto/pinterest.dto';
import { PinterestService } from './pinterest.service'

@Controller('pinterest')
export class PinterestController {
  constructor(
    private readonly pinterestService: PinterestService,
  ) {
  }

  // 创建board
  @Post('/board')
  @NatsMessagePattern('plat.pinterest.createBoard')
  createBoard(@Payload() data: CreateBoardBodyDto) {
    return this.pinterestService.createBoard(data)
  }

  // board list
  @NatsMessagePattern('plat.pinterest.getBoardList')
  getBoardList(@Payload() data: { accountId: string }) {
    return this.pinterestService.getBoardList(data.accountId)
  }

  // 获取单个board
  @NatsMessagePattern('plat.pinterest.getBoardById')
  getBoardById(@Payload() data: { id: string, accountId: string }) {
    return this.pinterestService.getBoardById(data.id, data.accountId)
  }

  // 删除单个board
  @NatsMessagePattern('plat.pinterest.delBoardById')
  delBoardById(@Payload() data: { id: string, accountId: string }) {
    return this.pinterestService.delBoardById(data.id, data.accountId)
  }

  // 创建pin
  @Post('/pin')
  @NatsMessagePattern('plat.pinterest.createPin')
  createPin(@Payload() data: CreatePinBodyDto) {
    return this.pinterestService.createPin(data)
  }

  // 获取pin
  @NatsMessagePattern('plat.pinterest.getPinById')
  getPinById(@Payload() data: { id: string, accountId: string }) {
    return this.pinterestService.getPinById(data.id, data.accountId)
  }

  // 获取pin
  @Post('')
  @NatsMessagePattern('plat.pinterest.getPinList')
  getPinList(@Payload() data: { accountId: string }) {
    return this.pinterestService.getPinList(data.accountId)
  }

  // 删除pin
  @NatsMessagePattern('plat.pinterest.delPinById')
  delPinById(@Payload() data: { id: string, accountId: string }) {
    return this.pinterestService.delPinById(data.id, data.accountId)
  }

  // 获取授权地址
  @NatsMessagePattern('plat.pinterest.getAuth')
  getAuth(@Payload() data: { userId: string }) {
    return this.pinterestService.getAuth(data.userId)
  }

  // 授权地址回调
  @NatsMessagePattern('plat.pinterest.authWebhook')
  authWebhook(@Payload() data: WebhookDto) {
    return this.pinterestService.authWebhook(data)
  }

  // 查询授权结果
  // 获取授权地址
  @NatsMessagePattern('plat.pinterest.checkAuth')
  checkAuth(@Payload() data: { taskId: string }) {
    return this.pinterestService.checkAuth(data.taskId)
  }
}
