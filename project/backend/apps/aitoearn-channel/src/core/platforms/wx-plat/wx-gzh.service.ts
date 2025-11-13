import { Injectable } from '@nestjs/common'
import { fileUrlToBlob } from '../../../common'
import { FileService } from '../../../core/file/file.service'
import {
  MediaType,
  WxGzhArticleNews,
  WxGzhArticleNewsPic,
} from '../../../libs/wx-gzh/common'
import { WxGzhApiService } from '../../../libs/wx-gzh/wx-gzh.service'
import { WxPlatService } from './wx-plat.service'

@Injectable()
export class WxGzhService {
  constructor(
    private readonly wxGzhApiService: WxGzhApiService,
    private readonly fileService: FileService,
    private readonly wxPlatService: WxPlatService,
  ) {}

  /**
   * 获取token
   * @param accountId
   * @returns
   */
  async getAccessToken(accountId: string) {
    const res = await this.wxPlatService.getAuthorizerAccessToken(accountId)
    return res.authorizer_access_token
  }

  async checkAuth(accountId: string) {
    const res = await this.wxPlatService.checkAuth(accountId)
    return res
  }

  /**
   * 上传临时素材
   * @param accessToken
   * @param media
   * @param type
   * @returns
   */
  async uploadTempMedia(
    accountId: string,
    type: MediaType,
    url: string,
  ) {
    const blobFile = await fileUrlToBlob(this.fileService.filePathToUrl(url))
    const res = await this.wxGzhApiService.uploadTempMedia(
      await this.getAccessToken(accountId),
      type,
      blobFile.blob,
      blobFile.fileName,
    )
    return res
  }

  /**
   * 获取临时素材
   * @param accountId
   * @param mediaId
   * @returns
   */
  async getTempMedia(accountId: string, mediaId: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.getTempMedia(accessToken, mediaId)
    return res
  }

  /**
   * 上传图文中的图片素材(不占用限制)
   * @param file
   * @returns
   */
  async uploadImg(accountId: string, imgUrl: string) {
    const accessToken = await this.getAccessToken(accountId)
    const blobFile = await fileUrlToBlob(this.fileService.filePathToUrl(imgUrl))
    const res = await this.wxGzhApiService.uploadImg(accessToken, blobFile.blob, blobFile.fileName)
    return res
  }

  /**
   * 上传永久素材
   * @param accountId
   * @param type
   * @param file
   * @returns
   */
  async addMaterial(
    accountId: string,
    type: MediaType,
    fileUrl: string,
    videoOptions?: {
      title: string
      introduction?: string
    },
  ) {
    const accessToken = await this.getAccessToken(accountId)
    const blobFile = await fileUrlToBlob(this.fileService.filePathToUrl(fileUrl))
    const res = await this.wxGzhApiService.addMaterial(
      accessToken,
      type,
      blobFile.blob,
      blobFile.fileName,
      videoOptions,
    )
    return res
  }

  /**
   * 获取永久素材
   * @param accountId
   * @param mediaId
   * @returns
   */
  async getMaterial(accountId: string, mediaId: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.getMaterial(accessToken, mediaId)
    return res
  }

  /**
   * 新建草稿
   * @param accessToken
   * @param data
   * @returns
   */
  async draftAdd(
    accountId: string,
    data: WxGzhArticleNews | WxGzhArticleNewsPic,
  ) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.draftAdd(accessToken, data)
    return res
  }

  /**
   * 发布
   * @param accountId
   * @param mediaId
   * @returns
   */
  async freePublish(accountId: string, mediaId: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.freePublish(accessToken, mediaId)
    return res
  }

  /**
   * 获取累计用户数据
   * @param accountId
   * @param beginDate yyyy-MM-dd
   * @param endDate
   * @returns
   */
  async getusercumulate(accountId: string, beginDate: string, endDate: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.getusercumulate(accessToken, beginDate, endDate)
    return res
  }

  /**
   * 获取图文阅读概况数据
   * @param accountId
   * @param beginDate yyyy-MM-dd
   * @param endDate
   * @returns
   */
  async getuserread(accountId: string, beginDate: string, endDate: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.getuserread(accessToken, beginDate, endDate)
    return res
  }

  async deleteArticle(accountId: string, mediaId: string) {
    const accessToken = await this.getAccessToken(accountId)
    const res = await this.wxGzhApiService.deleteArticle(accessToken, mediaId)
    return res
  }
}
