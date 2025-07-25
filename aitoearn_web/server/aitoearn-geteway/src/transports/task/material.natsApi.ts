import { MaterialDetail } from '@core/task/material/material.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { NatsService } from '@transports/nats.service'

@Injectable()
export class TaskMaterialNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async getMaterial(materialId: string): Promise<MaterialDetail> {
    return await this.natsService.sendMessage<MaterialDetail>(
      NatsApi.task.material.get,
      {
        id: materialId,
      },
    )
  }

  async getMaterialsByTaskId(taskId: string): Promise<MaterialDetail[]> {
    return await this.natsService.sendMessage<MaterialDetail[]>(
      NatsApi.task.material.listByTaskId,
      { taskId },
    )
  }
}
