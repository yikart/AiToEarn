import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { ChannelBaseApi } from '../../channelBase.api'
import { AccessToken, AddArchiveData, ArchiveStatus } from './bilibili.common'

@Injectable()
export class PlatBilibiliNatsApi extends ChannelBaseApi {
  /**
   * 获取账号的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const res = await this.sendMessage<AccessToken | null>(
      `plat/bilibili/getAccountAuthInfo`,
      {
        accountId,
      },
    )
    return res
  }

  /**
   * 获取授权页面URL
   * @param userId
   * @param type
   * @returns
   */
  async getAuth(userId: string, type: 'pc' | 'h5', spaceId: string) {
    const res = await this.sendMessage<{
      url: string
      taskId: string
    }>(
      `plat/bilibili/auth`,
      {
        userId,
        type,
        spaceId,
      },
    )
    return res
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
    const res = await this.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      `plat/bilibili/createAccountAndSetAccessToken`,
      data,
    )
    return res
  }

  /**
   * 视频初始化
   * @param accountId
   * @param name
   * @param utype 上传类型：0，1。0-多分片，1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(accountId: string, name: string, utype = 0) {
    const res = await this.sendMessage<string>(
      `plat/bilibili/videoInit`,
      {
        accountId,
        name,
        utype,
      },
    )
    return res
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
    const res = await this.sendMessage<string>(
      `plat/bilibili/archiveAddByUtoken`,
      {
        accountId,
        uploadToken,
        data,
      },
    )
    return res
  }

  /**
   * 获取区域列表
   * @param accountId
   * @returns
   */
  async archiveTypeList(accountId: string) {
    const res = await this.sendMessage<string>(
      `plat/bilibili/archiveTypeList`,
      {
        accountId,
      },
    )
    return res
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/bilibili/getAuthInfo`,
      {
        taskId,
      },
    )
    return res
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
    const res = await this.sendMessage<string>(
      `plat/bilibili/archiveList`,
      {
        accountId,
        page,
        filter,
      },
    )
    return res
  }

  /**
   * 获取用户数据
   * @param accountId
   * @returns
   */
  async getUserStat(accountId: string) {
    const res = await this.sendMessage<string>(
      `plat/bilibili/userStat`,
      {
        accountId,
      },
    )
    return res
  }

  /**
   * 获取稿件数据
   * @param accountId
   * @param resourceId
   * @returns
   */
  async getArcStat(accountId: string, resourceId: string) {
    const res = await this.sendMessage<string>(
      `plat/bilibili/arcStat`,
      {
        accountId,
        resourceId,
      },
    )
    return res
  }

  /**
   * 获取稿件增量数据数据
   * @param accountId
   * @returns
   */
  async getArcIncStat(accountId: string) {
    const res = await this.sendMessage<string>(
      `plat/bilibili/arcIncStat`,
      {
        accountId,
      },
    )
    return res
  }
}
