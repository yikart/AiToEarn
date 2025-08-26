import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
  WebhookDto,
} from '@core/plat/pinterest/dto/pinterest.dto'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class PlatPinterestNatsApi extends BaseNatsApi {
  /**
   *  创建board
   * @param data
   */
  async createBoard(data: CreateBoardBodyDto) {
    return this.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.createBoard,
      data,
    )
  }

  /**
   * 获取boardList
   */
  async getBoardList(body: ListBodyDto) {
    return this.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.getBoardList,
      body,
    )
  }

  /**
   * 获取单个board
   */
  async getBoardById(id: string, accountId: string) {
    return this.sendMessage<CreateBoardBodyDto | null>(
      NatsApi.plat.pinterest.getBoardById,
      { id, accountId },
    )
  }

  /**
   * 删除单个board
   */
  async delBoardById(id: string, accountId: string) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.delBoardById,
      { id, accountId },
    )
  }

  /**
   * 创建pin
   *
   */
  async createPin(data: CreatePinBodyDto) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.createPin,
      data,
    )
  }

  /**
   * 创建pin
   *
   */
  async getPinById(id: string, accountId: string) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.getPinById,
      { id, accountId },
    )
  }

  /**
   * 获取pin List
   */
  async getPinList(body: ListBodyDto) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.getPinList,
      body,
    )
  }

  /**
   * 删除pin
   */
  async delPinById(id: string, accountId: string) {
    const result: any = await this.sendMessage<any>(
      NatsApi.plat.pinterest.delPinById,
      { id, accountId },
    )
    return result?.data || result
  }

  /**
   * 获取用户授权地址
   */
  async getAuth(userId: string) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.getAuth,
      { userId },
    )
  }

  /**
   * 查询授权结果
   */
  async checkAuth(taskId: string) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.checkAuth,
      { taskId },
    )
  }

  /**
   * 回调地址
   */
  async authWebhook(data: WebhookDto) {
    return this.sendMessage<any>(
      NatsApi.plat.pinterest.authWebhook,
      data,
    )
  }
}
