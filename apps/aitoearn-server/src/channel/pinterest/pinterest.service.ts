import { Injectable } from '@nestjs/common'
import { PlatPinterestNatsApi } from '../api/pinterest.natsApi'
import {
  CreateBoardBodyDto,
  CreatePinBodyDto,
  ListBodyDto,
  WebhookDto,
} from './dto/pinterest.dto'

@Injectable()
export class PinterestService {
  constructor(private readonly platPinterestNatsApi: PlatPinterestNatsApi) {}

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBodyDto) {
    return this.platPinterestNatsApi.createBoard(body)
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(body: ListBodyDto) {
    return this.platPinterestNatsApi.getBoardList(body)
  }

  /**
   * 获取board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async getBoardById(id: string, accountId: string) {
    return this.platPinterestNatsApi.getBoardById(id, accountId)
  }

  /**
   * 删除board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async delBoardById(id: string, accountId: string) {
    return this.platPinterestNatsApi.delBoardById(id, accountId)
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(body: CreatePinBodyDto) {
    return this.platPinterestNatsApi.createPin(body)
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param accountId
   * @returns
   */
  async getPinById(id: string, accountId: string) {
    return this.platPinterestNatsApi.getPinById(id, accountId)
  }

  /**
   * 获取pin列表信息
   * @param body
   * @returns
   */
  async getPinList(body: ListBodyDto) {
    return this.platPinterestNatsApi.getPinList(body)
  }

  /**
   * 删除pin
   * @param id pin id
   * @param accountId
   * @returns
   */
  async delPinById(id: string, accountId: string) {
    return this.platPinterestNatsApi.delPinById(id, accountId)
  }

  /**
   * 获取用户授权地址
   * @param userId
   * @returns
   */
  async getAuth(userId: string, spaceId: string) {
    return this.platPinterestNatsApi.getAuth(userId, spaceId)
  }

  /**
   * 查询授权结果
   * @param taskId
   * @returns
   */
  async checkAuth(taskId: string) {
    return this.platPinterestNatsApi.checkAuth(taskId)
  }

  /**
   * 授权回调
   * @param data
   * @returns
   */
  async authWebhook(data: WebhookDto) {
    return this.platPinterestNatsApi.authWebhook(data)
  }
}
