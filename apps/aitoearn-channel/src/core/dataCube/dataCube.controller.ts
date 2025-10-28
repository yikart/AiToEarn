/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 平台数据
 */
import { Body, Controller, Post } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { AppException } from '@yikart/common'
import { AccountService } from '../account/account.service'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeBase } from './data.base'
import { AccountDto, ArcDto } from './dto/dataCube.dto'
import { WxGzhDataService } from './wxGzhData.service'
import { YoutubeDataService } from './youtubeData.service'

@Controller()
export class DataCubeController {
  private readonly dataCubeMap = new Map<AccountType, DataCubeBase>()

  constructor(
    readonly accountService: AccountService,
    readonly bilibiliDataService: BilibiliDataService,
    readonly youtubeDataService: YoutubeDataService,
    readonly wxGzhDataService: WxGzhDataService,
  ) {
    this.dataCubeMap.set(AccountType.BILIBILI, bilibiliDataService)
    this.dataCubeMap.set(AccountType.YOUTUBE, youtubeDataService)
    this.dataCubeMap.set(AccountType.WxGzh, wxGzhDataService)
  }

  private async getDataCube(accountId: string) {
    const account = await this.accountService.getAccountInfo(accountId)
    if (!account)
      throw new AppException(1, '账户不存在')
    const dataCube = this.dataCubeMap.get(account.type)
    if (!dataCube)
      throw new AppException(1, '暂不支持该账户类型')
    return dataCube
  }

  // @NatsMessagePattern('channel.dataCube.getAccountDataCube')
  @Post('channel/dataCube/getAccountDataCube')
  async getAccountDataCube(@Body() data: AccountDto) {
    const dataCube = await this.getDataCube(data.accountId)
    const res = await dataCube.getAccountDataCube(data.accountId)
    return res
  }

  // @NatsMessagePattern('channel.dataCube.getAccountDataBulk')
  @Post('channel/dataCube/getAccountDataBulk')
  async getAccountDataBulk(@Body() data: AccountDto) {
    const dataCube = await this.getDataCube(data.accountId)
    const res = await dataCube.getAccountDataBulk(data.accountId)
    return res
  }

  // @NatsMessagePattern('channel.dataCube.getArcDataCube')
  @Post('channel/dataCube/getArcDataCube')
  async getArcDataCube(@Body() data: ArcDto) {
    const dataCube = await this.getDataCube(data.accountId)
    const res = await dataCube.getArcDataCube(data.accountId, data.dataId)
    return res
  }

  // @NatsMessagePattern('channel.dataCube.getArcDataBulk')
  @Post('channel/dataCube/getArcDataBulk')
  async getArcDataBulk(@Body() data: ArcDto) {
    const dataCube = await this.getDataCube(data.accountId)
    const res = await dataCube.getArcDataBulk(data.accountId, data.dataId)
    return res
  }
}
