/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 频道数据
 */
import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { AccountService } from '../../account/account.service'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeBase } from './dataCube.base'
import { YouTubeDataService } from './youtubeData.service'

@ApiTags('OpenSource/Data/DataCube')
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
      throw new AppException(ResponseCode.AccountNotFound)
    const dataCube = this.dataCubeMap.get(account.type)
    if (!dataCube)
      throw new AppException(ResponseCode.DataCubeAccountTypeNotSupported)
    return dataCube
  }

  @ApiDoc({
    summary: 'Get Account Data Cube',
  })
  @Get('accountDataCube/:accountId')
  async getAccountDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getAccountDataCube(accountId)
  }

  @ApiDoc({
    summary: 'Get Account Data Bulk',
  })
  @Get('getAccountDataBulk/:accountId')
  async getAccountDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getAccountDataBulk(accountId)
  }

  @ApiDoc({
    summary: 'Get Post Data Cube',
  })
  @Get('getArcDataCube/:accountId/:dataId')
  async getArcDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return dataCube.getArcDataCube(accountId, dataId)
  }

  @ApiDoc({
    summary: 'Get Post Data Bulk',
  })
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
