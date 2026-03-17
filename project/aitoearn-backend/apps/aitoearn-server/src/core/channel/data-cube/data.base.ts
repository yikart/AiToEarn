import {
  ChannelAccountDataBulk,
  ChannelAccountDataCube,
  ChannelArcDataBulk,
  ChannelArcDataCube,
} from '../platforms/common'

export abstract class DataCubeBase {
  /**
   * 上报用户数据
   * @param accountId
   */
  abstract accountPortraitReport(
    accountId: string,
  ): Promise<void>

  // 获取账号的统计数据
  abstract getAccountDataCube(
    accountId: string,
  ): Promise<ChannelAccountDataCube>

  // 获取账号的增量数据
  abstract getAccountDataBulk(
    accountId: string,
  ): Promise<ChannelAccountDataBulk>

  // 获取作品的统计数据
  abstract getArcDataCube(
    accountId: string,
    dataId: string,
  ): Promise<ChannelArcDataCube>

  // 获取作品的增量数据
  abstract getArcDataBulk(
    accountId: string,
    dataId: string,
  ): Promise<ChannelArcDataBulk>
}
