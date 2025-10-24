/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: TODO: 素材草稿
 */
import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import {
  Material,
  MaterialGroup,
} from './common'

@Injectable()
export class MaterialNatsApi extends ServerBaseApi {
  /**
   * 获取id列表查询素材
   * @returns
   */
  async listByIds(ids: string[]) {
    try {
      const res = await this.sendMessage<Material[]>(
        'materialInternal/list/ids',
        {
          ids,
        },
      )

      return res
    }
    catch (error) {
      this.logger.error(error)
      return []
    }
  }

  /**
   * 获取id列表查询最优素材
   * @returns
   */
  async optimalByIds(ids: string[]) {
    try {
      const res = await this.sendMessage<Material>(
        'materialInternal/optimalByIds',
        {
          ids,
        },
      )

      return res
    }
    catch (error) {
      this.logger.error(error)
      return null
    }
  }

  /**
   * 获取组信息
   * @param id
   * @returns
   */
  async getGroupInfo(id: string) {
    const res = await this.sendMessage<MaterialGroup>(
      'materialInternal/group/info',
      { id },
    )

    return res
  }

  /**
   * 获取组内最优素材
   * @returns
   */
  async optimalInGroup(groupId: string) {
    try {
      const res = await this.sendMessage<Material>(
        'materialInternal/group/info',
        {
          groupId,
        },
      )

      return res
    }
    catch (error) {
      this.logger.error(error)
      return []
    }
  }
}
