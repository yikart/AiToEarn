/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: TODO: 素材草稿
 */
import { Injectable, Logger } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { NatsApi } from '../api'
import { TransportsService } from '../transports.service'
import {
  Material,
  MaterialGroup,
  NewMaterial,
  UpMaterial,
} from './common'

@Injectable()
export class MaterialNatsApi extends TransportsService {
  logger = new Logger(MaterialNatsApi.name)
  /**
   * 创建素材
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.aitoearnServerRequest<Material>(
      'post',
      NatsApi.content.material.create,
      newData,
    )

    return res
  }

  /**
   * 删除草稿
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.aitoearnServerRequest<boolean>(
      'post',
      NatsApi.content.material.del,
      { id },
    )

    return res
  }

  /**
   * 修改草稿
   * @param id
   * @param newData
   * @returns
   */
  async updateInfo(id: string, newData: UpMaterial) {
    const res = await this.aitoearnServerRequest<boolean>(
      'post',
      NatsApi.content.material.updateInfo,
      { id, ...newData },
    )

    return res
  }

  /**
   * 获取草稿信息
   * @param id
   * @returns
   */
  async getInfo(id: string) {
    const res = await this.aitoearnServerRequest<Material>(
      'post',
      NatsApi.content.material.info,
      { id },
    )

    return res
  }

  /**
   * 获取id列表查询素材
   * @returns
   */
  async listByIds(ids: string[]) {
    try {
      const res = await this.aitoearnServerRequest<Material[]>(
        'post',
        NatsApi.content.material.listByIds,
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
      const res = await this.aitoearnServerRequest<Material>(
        'post',
        NatsApi.content.material.optimalByIds,
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
    const res = await this.aitoearnServerRequest<MaterialGroup>(
      'post',
      NatsApi.content.materialGroup.info,
      { id },
    )

    return res
  }

  /**
   * 获取素材组列表
   * @param page
   * @param filter
   * @returns
   */
  async getGroupList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
    },
  ) {
    const res = await this.aitoearnServerRequest<{
      list: MaterialGroup[]
      total: number
    }>(
      'post',
      NatsApi.content.materialGroup.list,
      {
        filter,
        page,
      },
    )

    return res
  }

  /**
   * 获取组内最优素材
   * @returns
   */
  async optimalInGroup(groupId: string) {
    try {
      const res = await this.aitoearnServerRequest<Material>(
        'post',
        NatsApi.content.material.optimalInGroup,
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
