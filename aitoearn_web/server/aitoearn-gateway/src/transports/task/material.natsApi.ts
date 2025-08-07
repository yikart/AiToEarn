import { MaterialDetail } from '@core/task/material/material.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class TaskMaterialNatsApi extends BaseNatsApi {
  async getMaterial(materialId: string): Promise<MaterialDetail> {
    return await this.sendMessage<MaterialDetail>(
      NatsApi.task.material.get,
      {
        id: materialId,
      },
    )
  }

  async getMaterialsByTaskId(taskId: string): Promise<MaterialDetail[]> {
    return await this.sendMessage<MaterialDetail[]>(
      NatsApi.task.material.listByTaskId,
      { taskId },
    )
  }
}
