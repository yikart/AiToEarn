import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
  WebhookDto,
} from '@core/plat/pinterest/dto/pinterest.dto'
import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class PlatPinterestNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   *  创建board
   * @param data
   */
  async createBoard(data: CreateBoardBodyDto) {
    return this.natsService.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.createBoard,
      data,
    )
  }

  /**
   * 获取boardList
   */
  async getBoardList(body: ListBodyDto) {
    return this.natsService.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.getBoardList,
      body,
    )
  }

  /**
   * 获取单个board
   */
  async getBoardById(id: string, accountId: string) {
    return this.natsService.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.getBoardById,
      { id, accountId },
    )
  }

  /**
   * 删除单个board
   */
  async delBoardById(id: string, accountId: string) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.delBoardById,
      { id, accountId },
    )
  }

  /**
   * 创建pin
   *
   */
  async createPin(data: CreatePinBodyDto) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.createPin,
      data,
    )
  }

  /**
   * 创建pin
   *
   */
  async getPinById(id: string, accountId: string) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.getPinById,
      { id, accountId },
    )
  }

  /**
   * 获取pin List
   */
  async getPinList(body: ListBodyDto) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.getPinList,
      body,
    )
  }

  /**
   * 删除pin
   */
  async delPinById(id: string, accountId: string) {
    const result: any = await this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.delPinById,
      { id, accountId },
    )
    return result?.data || result
  }

  /**
   * 获取用户授权地址
   */
  async getAuth(userId: string) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.getAuth,
      { userId },
    )
  }

  /**
   * 查询授权结果
   */
  async checkAuth(taskId: string) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.checkAuth,
      { taskId },
    )
  }

  /**
   * 回调地址
   */
  async authWebhook(data: WebhookDto) {
    return this.natsService.sendMessage<any>(
      NatsApi.plat.pinterest.authWebhook,
      data,
    )
  }
}
