import { Injectable } from '@nestjs/common'
import { DataCubeApi } from './dataCube.api'
import { DataCubeBase } from './dataCube.base'

@Injectable()
export class YouTubeDataService extends DataCubeBase {
  constructor(private readonly dataCubeApi: DataCubeApi) {
    super()
  }

  async getAccountDataCube(accountId: string) {
    const res = await this.dataCubeApi.getAccountDataCube(accountId)
    return res
  }

  async getAccountDataBulk(accountId: string) {
    const res = await this.dataCubeApi.getAccountDataBulk(accountId)
    return res
  }

  async getArcDataCube(accountId: string, dataId: string) {
    const res = await this.dataCubeApi.getArcDataCube(accountId, dataId)
    return res
  }

  async getArcDataBulk(accountId: string, dataId: string) {
    const res = await this.dataCubeApi.getArcDataBulk(accountId, dataId)
    return res
  }
}
