import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { CreateBoardBodyDto, CreatePinBodyDto, ListBodyDto, WebhookDto } from '../pinterest/dto/pinterest.dto'

@Injectable()
export class PlatPinterestNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   *  创建board
   * @param data
   */
  async createBoard(data: CreateBoardBodyDto) {
    const res = await this.httpService.axiosRef.post<CreateBoardBodyDto | null>(
      `${config.channel.baseUrl}/plat/pinterest/createBoard`,
      data,
    )
    return res.data
  }

  /**
   * 获取boardList
   */
  async getBoardList(body: ListBodyDto) {
    const res = await this.httpService.axiosRef.post<CreateBoardBodyDto | null>(
      `${config.channel.baseUrl}/plat/pinterest/getBoardList`,
      body,
    )
    return res.data
  }

  /**
   * 获取单个board
   */
  async getBoardById(id: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<CreateBoardBodyDto | null>(
      `${config.channel.baseUrl}/plat/pinterest/getBoardById`,
      { id, accountId },
    )
    return res.data
  }

  /**
   * 删除单个board
   */
  async delBoardById(id: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/delBoardById`,
      { id, accountId },
    )
    return res.data
  }

  /**
   * 创建pin
   *
   */
  async createPin(data: CreatePinBodyDto) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/createPin`,
      data,
    )
    return res.data
  }

  /**
   * 创建pin
   *
   */
  async getPinById(id: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/getPinById`,
      { id, accountId },
    )
    return res.data
  }

  /**
   * 获取pin List
   */
  async getPinList(body: ListBodyDto) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/getPinList`,
      body,
    )
    return res.data
  }

  /**
   * 删除pin
   */
  async delPinById(id: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/delPinById`,
      { id, accountId },
    )
    return res.data
  }

  /**
   * 获取用户授权地址
   */
  async getAuth(userId: string, spaceId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/getAuth`,
      { userId, spaceId },
    )
    return res.data
  }

  /**
   * 查询授权结果
   */
  async checkAuth(taskId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/checkAuth`,
      { taskId },
    )
    return res.data
  }

  /**
   * 回调地址
   */
  async authWebhook(data: WebhookDto) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/pinterest/authWebhook`,
      data,
    )
    return res.data
  }
}
