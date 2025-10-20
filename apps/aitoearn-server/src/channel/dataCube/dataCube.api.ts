import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ChannelAccountDataBulk, ChannelAccountDataCube, ChannelArcDataBulk, ChannelArcDataCube } from './common'

@Injectable()
export class DataCubeApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 获取账号数据
   * @param accountId
   * @returns
   */
  async getAccountDataCube(accountId: string) {
    const res = await this.httpService.axiosRef.post<ChannelAccountDataCube>(
      'http://127.0.0.1:3000/api/channel/dataCube/getAccountDataCube',
      { accountId },
    )
    return res.data
  }

  /**
   * 获取账号增量数据
   * @param accountId
   * @returns
   */
  async getAccountDataBulk(accountId: string) {
    const res = await this.httpService.axiosRef.post<ChannelAccountDataBulk>(
      'http://127.0.0.1:3000/api/channel/dataCube/getAccountDataBulk',
      { accountId },
    )
    return res.data
  }

  /**
   * 获取账号下的作品数据
   * @param accountId
   * @param dataId
   * @returns
   */
  async getArcDataCube(accountId: string, dataId: string) {
    const res = await this.httpService.axiosRef.post<ChannelArcDataCube>(
      'http://127.0.0.1:3000/api/channel/dataCube/getArcDataCube',
      {
        accountId,
        dataId,
      },
    )
    return res.data
  }

  /**
   * 获取账号下的作品增量数据
   * @param accountId
   * @param dataId
   * @returns
   */
  async getArcDataBulk(accountId: string, dataId: string) {
    const res = await this.httpService.axiosRef.post<ChannelArcDataBulk>(
      'http://127.0.0.1:3000/api/channel/dataCube/getArcDataBulk',
      {
        accountId,
        dataId,
      },
    )
    return res.data
  }
}
