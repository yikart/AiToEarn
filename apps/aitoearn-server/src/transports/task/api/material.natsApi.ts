import { Injectable } from '@nestjs/common'
import { MaterialDetail } from '../../../task/material.interface'
import { TaskBaseApi } from '../../taskBase.api'

@Injectable()
export class TaskMaterialNatsApi extends TaskBaseApi {
  async getMaterial(materialId: string): Promise<MaterialDetail> {
    const res = await this.sendMessage<MaterialDetail>(
      `task/material/get`,
      {
        id: materialId,
      },
    )
    return res
  }

  async getMaterialsByTaskId(taskId: string): Promise<MaterialDetail[]> {
    const res = await this.sendMessage<MaterialDetail[]>(
      `task/material/listByTaskId`,
      {
        taskId,
      },
    )
    return res
  }
}
