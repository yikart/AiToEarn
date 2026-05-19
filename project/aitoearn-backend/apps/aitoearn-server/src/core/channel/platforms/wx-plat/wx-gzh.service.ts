import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { RelayAccountException } from '../../../relay/relay-account.exception'
import { MyWxPlatApiService } from '../../libs/my-wx-plat/my-wx-plat.service'
import {
  MediaType,
  WxGzhArticleNews,
  WxGzhArticleNewsPic,
} from '../../libs/wx-gzh/common'
import { ChannelAccountService } from '../channel-account.service'
import { WxPlatService } from './wx-plat.service'

@Injectable()
export class WxGzhService {
  constructor(
    private readonly myWxPlatApiService: MyWxPlatApiService,
    private readonly wxPlatService: WxPlatService,
    private readonly channelAccountService: ChannelAccountService,
  ) {}

  private async getLocalAccount(userId: string, accountId: string) {
    const account = await this.channelAccountService.getAccountInfo(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    return account
  }

  /**
   * 获取token
   * @param accountId
   * @returns
   */
  async getAccessToken(accountId: string) {
    const accountInfo = await this.channelAccountService.getAccountInfo(accountId)
    if (!accountInfo) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    const res = await this.wxPlatService.getAuthorizerAccessToken(accountInfo)
    if (!res) {
      throw new AppException(ResponseCode.AccountAuthRequired)
    }
    return res.authorizer_access_token
  }

  async checkAuth(accountId: string) {
    const res = await this.wxPlatService.checkAuth(accountId)
    return res
  }

  async uploadTempMedia(
    accountId: string,
    type: MediaType,
    url: string,
  ) {
    return this.myWxPlatApiService.uploadTempMedia(await this.getAccessToken(accountId), type, url)
  }

  async getTempMedia(accountId: string, mediaId: string) {
    return this.myWxPlatApiService.getTempMedia(await this.getAccessToken(accountId), mediaId)
  }

  async uploadImg(accountId: string, imgUrl: string) {
    return this.myWxPlatApiService.uploadImg(await this.getAccessToken(accountId), imgUrl)
  }

  async addMaterial(
    accountId: string,
    type: MediaType,
    fileUrl: string,
    videoOptions?: {
      title: string
      introduction?: string
    },
  ) {
    return this.myWxPlatApiService.addMaterial(await this.getAccessToken(accountId), type, fileUrl, videoOptions)
  }

  async getMaterial(accountId: string, mediaId: string) {
    return this.myWxPlatApiService.getMaterial(await this.getAccessToken(accountId), mediaId)
  }

  async draftAdd(
    accountId: string,
    data: WxGzhArticleNews | WxGzhArticleNewsPic,
  ) {
    return this.myWxPlatApiService.draftAdd(await this.getAccessToken(accountId), data)
  }

  async freePublish(accountId: string, mediaId: string) {
    const accessToken = await this.getAccessToken(accountId)
    return this.myWxPlatApiService.freePublish(accessToken, mediaId)
  }

  async getusercumulate(userId: string, accountId: string, beginDate: string, endDate: string) {
    await this.getLocalAccount(userId, accountId)
    return this.getusercumulateByAccountId(accountId, beginDate, endDate)
  }

  async getusercumulateByAccountId(accountId: string, beginDate: string, endDate: string) {
    return this.myWxPlatApiService.getusercumulate(await this.getAccessToken(accountId), beginDate, endDate)
  }

  async getuserread(userId: string, accountId: string, beginDate: string, endDate: string) {
    await this.getLocalAccount(userId, accountId)
    return this.getuserreadByAccountId(accountId, beginDate, endDate)
  }

  async getuserreadByAccountId(accountId: string, beginDate: string, endDate: string) {
    return this.myWxPlatApiService.getuserread(await this.getAccessToken(accountId), beginDate, endDate)
  }

  async deleteArticle(accountId: string, mediaId: string) {
    return this.myWxPlatApiService.deleteArticle(await this.getAccessToken(accountId), mediaId)
  }
}
