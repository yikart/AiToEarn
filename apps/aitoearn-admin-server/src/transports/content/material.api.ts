/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: 素材草稿
 */
import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import {
  Material,
  MaterialTask,
  NewMaterialTask,
} from './common'

@Injectable()
export class MaterialApi extends ServerBaseApi {
  /**
   * 创建批量生成草稿任务
   * @param newData
   * @returns
   */
  async createTask(newData: NewMaterialTask) {
    const res = await this.sendMessage<MaterialTask>(
      'content/material/createTask',
      newData,
    )

    return res
  }

  /**
   * 预览批量草稿
   * @param taskId
   * @returns
   */
  async preview(taskId: string) {
    const res = await this.sendMessage<Material>(
      'content/material/preview',
      { id: taskId },
    )

    return res
  }

  /**
   * 开始素材任务
   * @param taskId
   * @returns
   */
  async startTask(taskId: string) {
    const res = await this.sendMessage<string>(
      'content/material/startTask',
      { id: taskId },
    )

    return res
  }
}
