import { Injectable } from '@nestjs/common'
import { Template } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class TemplatesService extends BaseService {
  async retrieveAllTemplates(): Promise<Template[]> {
    return this.request<Template[]>('/api/templates', {
      method: 'GET',
    })
  }
}
