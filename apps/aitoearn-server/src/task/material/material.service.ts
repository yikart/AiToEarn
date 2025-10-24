import { Injectable } from '@nestjs/common'
import { TaskMaterialNatsApi } from '../../transports/task/api/material.natsApi'

@Injectable()
export class MaterialService {
  constructor(private readonly taskMaterialNatsApi: TaskMaterialNatsApi) {}

  async getMaterial(materialId: string) {
    return await this.taskMaterialNatsApi.getMaterial(materialId)
  }

  async getMaterialsByTaskId(taskId: string) {
    return await this.taskMaterialNatsApi.getMaterialsByTaskId(taskId)
  }
}
