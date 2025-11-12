import { Injectable } from '@nestjs/common'
import { CreateBoardBodyDto, CreatePinBodyDto, ListBodyDto, WebhookDto } from '../../../channel/pinterest/dto/pinterest.dto'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PlatPinterestNatsApi extends ChannelBaseApi {
  /**
   *  创建board
   * @param data
   */
  async createBoard(data: CreateBoardBodyDto) {
    const res = await this.sendMessage<CreateBoardBodyDto | null>(
      `plat/pinterest/createBoard`,
      data,
    )
    return res
  }

  /**
   * 获取boardList
   */
  async getBoardList(body: ListBodyDto) {
    const res = await this.sendMessage<CreateBoardBodyDto | null>(
      `plat/pinterest/getBoardList`,
      body,
    )
    return res
  }

  /**
   * 获取单个board
   */
  async getBoardById(id: string, accountId: string) {
    const res = await this.sendMessage<CreateBoardBodyDto | null>(
      `plat/pinterest/getBoardById`,
      { id, accountId },
    )
    return res
  }

  /**
   * 删除单个board
   */
  async delBoardById(id: string, accountId: string) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/delBoardById`,
      { id, accountId },
    )
    return res
  }

  /**
   * 创建pin
   *
   */
  async createPin(data: CreatePinBodyDto) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/createPin`,
      data,
    )
    return res
  }

  /**
   * 创建pin
   *
   */
  async getPinById(id: string, accountId: string) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/getPinById`,
      { id, accountId },
    )
    return res
  }

  /**
   * 获取pin List
   */
  async getPinList(body: ListBodyDto) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/getPinList`,
      body,
    )
    return res
  }

  /**
   * 删除pin
   */
  async delPinById(id: string, accountId: string) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/delPinById`,
      { id, accountId },
    )
    return res
  }

  /**
   * 获取用户授权地址
   */
  async getAuth(userId: string, spaceId: string) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/getAuth`,
      { userId, spaceId },
    )
    return res
  }

  /**
   * 查询授权结果
   */
  async checkAuth(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/checkAuth`,
      { taskId },
    )
    return res
  }

  /**
   * 回调地址
   */
  async authWebhook(data: WebhookDto) {
    const res = await this.sendMessage<any>(
      `plat/pinterest/authWebhook`,
      data,
    )
    return res
  }
}
