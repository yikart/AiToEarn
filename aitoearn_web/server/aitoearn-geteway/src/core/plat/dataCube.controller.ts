/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 渠道数据
 */
import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { DataCubeNatsApi } from '@/transports/channel/dataCube.natsApi'

@ApiTags('渠道用户数据')
@Controller('channel/dataCube')
export class DataCubeController {
  constructor(private readonly dataCubeNatsApi: DataCubeNatsApi) {}

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('accountDataCube/:accountId')
  async getAccountDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.dataCubeNatsApi.getAccountDataCube(accountId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getAccountDataBulk/:accountId')
  async getAccountDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.dataCubeNatsApi.getAccountDataBulk(accountId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getArcDataCube/:accountId/:dataId')
  async getArcDataCube(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    return this.dataCubeNatsApi.getArcDataCube(accountId, dataId)
  }

  @ApiOperation({ summary: '获取账号的统计数据' })
  @Get('getArcDataBulk/:accountId/:dataId')
  async getArcDataBulk(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('dataId') dataId: string,
  ) {
    return this.dataCubeNatsApi.getArcDataBulk(accountId, dataId)
  }
}
