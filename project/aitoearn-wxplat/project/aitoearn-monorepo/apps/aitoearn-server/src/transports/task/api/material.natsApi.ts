import { Injectable } from '@nestjs/common'
import { MaterialDetail } from '../../../task/material/material.interface'
import { TaskBaseApi } from '../../taskBase.api'

@Injectable()
export class TaskMaterialNatsApi extends TaskBaseApi {
  async getMaterial(materialId: string): Promise<MaterialDetail> {
    return await this.sendMessage<MaterialDetail>(
      'task/material/get',
      {
        id: materialId,
      },
    )
  }

  async getMaterialsByTaskId(taskId: string): Promise<MaterialDetail[]> {
    return await this.sendMessage<MaterialDetail[]>(
      'task.material.listByTaskId',
      { taskId },
    )
  }
}
