import { Injectable } from '@nestjs/common'
import { DataCubeNatsApi } from '@/transports/channel/dataCube.natsApi'
import { DataCubeBase } from './dataCube.base'

@Injectable()
export class BilibiliDataService extends DataCubeBase {
  constructor(private readonly dataCubeNatsApi: DataCubeNatsApi) {
    super()
  }

  async getAccountDataCube(accountId: string) {
    const res = await this.dataCubeNatsApi.getAccountDataCube(accountId)
    return res
  }

  async getAccountDataBulk(accountId: string) {
    const res = await this.dataCubeNatsApi.getAccountDataBulk(accountId)
    return res
  }

  async getArcDataCube(accountId: string, dataId: string) {
    const res = await this.dataCubeNatsApi.getArcDataCube(accountId, dataId)
    return res
  }

  async getArcDataBulk(accountId: string, dataId: string) {
    const res = await this.dataCubeNatsApi.getArcDataBulk(accountId, dataId)
    return res
  }
}
