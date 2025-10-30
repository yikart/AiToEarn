import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { BaseService } from './base.service'

@Injectable()
export class ContentService extends BaseService {
  async deleteMaterial(id: string) {
    const url = `/internal/publishing/materials/${id}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }
}
