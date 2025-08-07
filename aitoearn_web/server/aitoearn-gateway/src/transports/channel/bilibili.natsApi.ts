import { Injectable } from '@nestjs/common'
import { TableDto } from 'src/common/dto/table.dto'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { AccessToken, AddArchiveData, ArchiveStatus } from './bilibili.common'

@Injectable()
export class PlatBilibiliNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取账号的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const res = await this.natsService.sendMessage<AccessToken | null>(
      NatsApi.plat.bilibili.getAccountAuthInfo,
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
  async getAuth(userId: string, type: 'pc' | 'h5') {
    const res = await this.natsService.sendMessage<{
      url: string
      taskId: string
    }>(NatsApi.plat.bilibili.auth, {
      userId,
      type,
    })

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
    const res = await this.natsService.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      NatsApi.plat.bilibili.createAccountAndSetAccessToken,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.videoInit,
      {
        accountId,
        name,
        utype,
      },
    )

    return res
  }

  /**
   * 上传视频分片
   * @param accountId
   * @param file base64
   * @param uploadToken 上传Token
   * @param partNumber 分片索引
   * @returns
   */
  async uploadVideoPart(
    accountId: string,
    file: string,
    uploadToken: string,
    partNumber: number,
  ) {
    const res = await this.natsService.sendMessage<{
      code: number
      message: string
    }>(NatsApi.plat.bilibili.uploadVideoPart, {
      accountId,
      file,
      uploadToken,
      partNumber,
    })

    return res
  }

  /**
   * 视频分片合并
   * @param accountId
   * @param uploadToken 上传Token
   * @returns
   */
  async videoComplete(accountId: string, uploadToken: string) {
    const res = await this.natsService.sendMessage<{
      code: number
      message: string
    }>(NatsApi.plat.bilibili.videoComplete, {
      accountId,
      uploadToken,
    })

    return res
  }

  /**
   * 上传封面
   * @param accountId
   * @param file base64
   * @returns
   */
  async coverUpload(accountId: string, file: string) {
    const res = await this.natsService.sendMessage<{
      code: number
      message: string
    }>(NatsApi.plat.bilibili.coverUpload, {
      accountId,
      file,
    })

    return res
  }

  /**
   * 上传小视频
   * @param accountId
   * @param file base64
   * @param uploadToken 上传Token
   * @returns
   */
  async uploadLitVideo(accountId: string, file: string, uploadToken: string) {
    const res = await this.natsService.sendMessage<{
      code: number
      message: string
    }>(NatsApi.plat.bilibili.uploadLitVideo, {
      accountId,
      file,
      uploadToken,
    })

    return res
  }

  /**
   * 稿件发布
   * @param userId
   * @returns
   */
  async archiveAddByUtoken(
    accountId: string,
    uploadToken: string,
    data: AddArchiveData,
  ) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.archiveAddByUtoken,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.archiveTypeList,
      {
        accountId,
      },
    )

    return res
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @param data 授权数据
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.bilibili.getAuthInfo,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.archiveList,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.userStat,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.arcStat,
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
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.bilibili.arcIncStat,
      {
        accountId,
      },
    )

    return res
  }
}
