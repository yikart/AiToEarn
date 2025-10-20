import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { config } from '../../config'
import { AccessToken, AddArchiveData, ArchiveStatus } from './bilibili.common'

@Injectable()
export class PlatBilibiliNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 获取账号的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const res = await this.httpService.axiosRef.post<AccessToken | null>(
      `${config.channel.baseUrl}/plat/bilibili/getAccountAuthInfo`,
      {
        accountId,
      },
    )
    return res.data
  }

  /**
   * 获取授权页面URL
   * @param userId
   * @param type
   * @returns
   */
  async getAuth(userId: string, type: 'pc' | 'h5', spaceId: string) {
    const res = await this.httpService.axiosRef.post<{
      url: string
      taskId: string
    }>(
      `${config.channel.baseUrl}/plat/bilibili/auth`,
      {
        userId,
        type,
        spaceId,
      },
    )
    return res.data
  }

  /**
   * 创建账号
   * @param data
   * @returns
   */
  async createAccountAndSetAccessToken(data: {
    taskId: string
    code: string
    state: string
  }) {
    const res = await this.httpService.axiosRef.post<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      `${config.channel.baseUrl}/plat/bilibili/createAccountAndSetAccessToken`,
      data,
    )
    return res.data
  }

  /**
   * 视频初始化
   * @param accountId
   * @param name
   * @param utype 上传类型：0，1。0-多分片，1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(accountId: string, name: string, utype = 0) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/videoInit`,
      {
        accountId,
        name,
        utype,
      },
    )
    return res.data
  }

  /**
   * 稿件发布
   * @param userId
   * @param uploadToken
   * @param data
   * @returns
   */
  async archiveAddByUtoken(
    accountId: string,
    uploadToken: string,
    data: AddArchiveData,
  ) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/archiveAddByUtoken`,
      {
        accountId,
        uploadToken,
        data,
      },
    )
    return res.data
  }

  /**
   * 获取区域列表
   * @param accountId
   * @returns
   */
  async archiveTypeList(accountId: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/archiveTypeList`,
      {
        accountId,
      },
    )
    return res.data
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/bilibili/getAuthInfo`,
      {
        taskId,
      },
    )
    return res.data
  }

  /**
   * 获取稿件列表
   * @param accountId
   * @returns
   */
  async getArchiveList(
    accountId: string,
    page: TableDto,
    filter: {
      status?: ArchiveStatus
    },
  ) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/archiveList`,
      {
        accountId,
        page,
        filter,
      },
    )
    return res.data
  }

  /**
   * 获取用户数据
   * @param accountId
   * @returns
   */
  async getUserStat(accountId: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/userStat`,
      {
        accountId,
      },
    )
    return res.data
  }

  /**
   * 获取稿件数据
   * @param accountId
   * @param resourceId
   * @returns
   */
  async getArcStat(accountId: string, resourceId: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/arcStat`,
      {
        accountId,
        resourceId,
      },
    )
    return res.data
  }

  /**
   * 获取稿件增量数据数据
   * @param accountId
   * @returns
   */
  async getArcIncStat(accountId: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/bilibili/arcIncStat`,
      {
        accountId,
      },
    )
    return res.data
  }
}
