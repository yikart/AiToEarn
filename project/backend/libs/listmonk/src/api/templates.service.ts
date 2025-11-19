import { Injectable } from '@nestjs/common'
import { BaseService } from './base.service'

@Injectable()
export class TemplatesService extends BaseService {
  async retrieveAllTemplates(): Promise<any> {
    const res = await this.request<any>(
      '/api/templates',
      {
        method: 'GET',
      },
    )
    return res
  }
}
