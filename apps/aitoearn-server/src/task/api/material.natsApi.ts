import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { MaterialDetail } from '../material.interface'

@Injectable()
export class TaskMaterialNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getMaterial(materialId: string): Promise<MaterialDetail> {
    const res = await this.httpService.axiosRef.post<MaterialDetail>(
      `${config.task.baseUrl}/task/material/get`,
      {
        id: materialId,
      },
    )
    return res.data
  }

  async getMaterialsByTaskId(taskId: string): Promise<MaterialDetail[]> {
    const res = await this.httpService.axiosRef.post<MaterialDetail[]>(
      `${config.task.baseUrl}/task/material/listByTaskId`,
      {
        taskId,
      },
    )
    return res.data
  }
}
