import { ChannelAccountDataBulk, ChannelAccountDataCube, ChannelArcDataBulk, ChannelArcDataCube } from './common'

export abstract class DataCubeBase {
  // 获取账号的统计数据
  abstract getAccountDataCube(
    accountId: string,
    pageId?: string, // 可选参数，适用于Facebook等平台
  ): Promise<ChannelAccountDataCube>

  // 获取账号的增量数据
  abstract getAccountDataBulk(
    accountId: string,
    pageId?: string, // 可选参数，适用于Facebook等平台
  ): Promise<ChannelAccountDataBulk>

  // 获取作品的统计数据
  abstract getArcDataCube(
    accountId: string,
    dataId: string,
    pageId?: string, // 可选参数，适用于Facebook等平台
  ): Promise<ChannelArcDataCube>

  // 获取作品的增量数据
  abstract getArcDataBulk(
    accountId: string,
    dataId: string,
    pageId?: string, // 可选参数，适用于Facebook等平台
  ): Promise<ChannelArcDataBulk>
}
