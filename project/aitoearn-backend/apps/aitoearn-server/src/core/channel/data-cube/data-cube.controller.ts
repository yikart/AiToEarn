import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType } from '@yikart/aitoearn-server-client'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { ChannelAccountService } from '../platforms/channel-account.service'
import { BilibiliDataService } from './bilibili-data.service'
import { DataCubeBase } from './data.base'
import { WxGzhDataService } from './wx-gzh-data.service'
import { YoutubeDataService } from './youtube-data.service'

@ApiTags('Data/DataCube')
@Controller('channel/dataCube')
export class DataCubeController {
  private readonly dataCubeMap = new Map<AccountType, DataCubeBase>()

  constructor(
    readonly channelAccountService: ChannelAccountService,
    readonly bilibiliDataService: BilibiliDataService,
    readonly youtubeDataService: YoutubeDataService,
    readonly wxGzhDataService: WxGzhDataService,
  ) {
    this.dataCubeMap.set(AccountType.BILIBILI, bilibiliDataService)
    this.dataCubeMap.set(AccountType.YOUTUBE, youtubeDataService)
    this.dataCubeMap.set(AccountType.WxGzh, wxGzhDataService)
  }

  private async getDataCube(accountId: string) {
    const account = await this.channelAccountService.getAccountInfo(accountId)
    if (!account)
      throw new AppException(ResponseCode.ChannelAccountNotFound)
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    const dataCube = this.dataCubeMap.get(account.type)
    if (!dataCube)
      throw new AppException(ResponseCode.DataCubeAccountTypeNotSupported)
    return dataCube
  }

  @ApiDoc({
    summary: 'Get Account Data Cube',
  })
  @Get('/accountDataCube/:accountId')
  async getAccountDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return await dataCube.getAccountDataCube(accountId)
  }

  @ApiDoc({
    summary: 'Get Account Data Bulk',
  })
  @Get('/getAccountDataBulk/:accountId')
  async getAccountDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return await dataCube.getAccountDataBulk(accountId)
  }

  @ApiDoc({
    summary: 'Get Post Data Cube',
  })
  @Get('/getArcDataCube/:accountId/:dataId')
  async getArcDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return await dataCube.getArcDataCube(accountId, dataId)
  }

  @ApiDoc({
    summary: 'Get Post Data Bulk',
  })
  @Get('/getArcDataBulk/:accountId/:dataId')
  async getArcDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    const dataCube = await this.getDataCube(accountId)
    return await dataCube.getArcDataBulk(accountId, dataId)
  }
}
