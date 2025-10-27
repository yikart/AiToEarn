/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 频道数据
 */
import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import { AccountType } from '@yikart/mongodb'
import { AccountService } from '../../account/account.service'
import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeBase } from './dataCube.base'
import { YouTubeDataService } from './youtubeData.service'

@ApiTags('渠道用户数据')
@Controller('channel/dataCube')
export class DataCubeController {
  private readonly dataCubeMap = new Map<AccountType, DataCubeBase>()
  constructor(
    readonly bilibiliDataService: BilibiliDataService,
    readonly youtubeDataService: YouTubeDataService,
    private readonly accountService: AccountService,
  ) {
    this.dataCubeMap.set(AccountType.BILIBILI, bilibiliDataService)
    this.dataCubeMap.set(AccountType.YOUTUBE, youtubeDataService)
  }

  private async getDataCube(accountId: string) {
    const account = await this.accountService.getAccountById(accountId)
    if (!account)
      throw new AppException(1, '账户不存在')
    const dataCube = this.dataCubeMap.get(account.type)
    if (!dataCube)
      throw new AppException(1, '暂不支持该账户类型')
    return dataCube
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('accountDataCube/:accountId')
  async getAccountDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getAccountDataCube(accountId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getAccountDataBulk/:accountId')
  async getAccountDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getAccountDataBulk(accountId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getArcDataCube/:accountId/:dataId')
  async getArcDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getArcDataCube(accountId, dataId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getArcDataBulk/:accountId/:dataId')
  async getArcDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getArcDataBulk(accountId, dataId)
  }
}
