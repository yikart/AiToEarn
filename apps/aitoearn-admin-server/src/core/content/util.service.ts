import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, AdminAccountRepository } from '@yikart/mongodb'
import { ChannelApi } from '../../transports/channel/channel.api'

@Injectable()
export class ContentUtilService {
  logger = new Logger(ContentUtilService.name)

  constructor(
    private readonly channelApi: ChannelApi,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) { }

  /**
   * 获取youtobe的视频分类
   * @param regionCode
   * @returns
   */
  async getYouTuBeVideoCategories(regionCode: string) {
    // 获取账号列表
    const accountList = await this.adminAccountRepository.getAccountList({
      status: AccountStatus.NORMAL,
      types: [AccountType.YOUTUBE],
    }, { pageNo: 1, pageSize: 100 })
    for (const account of accountList.list) {
      try {
        const res = await this.channelApi.getYouTuBeVideoCategories(account.account, regionCode)
        if (!res)
          continue
        return res
      }
      catch (_) {
        this.logger.error(`获取youtobe频道列表失败: ${_}`)
        continue
      }
    }
  }

  /**
   * 获取B站的分区列表
   * @returns
   */
  async getBilibiliArchiveTypeList() {
    // 获取账号列表
    const accountList = await this.adminAccountRepository.getAccountList({
      status: AccountStatus.NORMAL,
      types: [AccountType.YOUTUBE],
    }, { pageNo: 1, pageSize: 100 })
    for (const account of accountList.list) {
      try {
        const res = await this.channelApi.getBilibiliArchiveTypeList(account.account)
        if (!res)
          continue
        return res
      }
      catch (_) {
        this.logger.error(`获取B站分区列表失败: ${_}`)
        continue
      }
    }
  }
}
