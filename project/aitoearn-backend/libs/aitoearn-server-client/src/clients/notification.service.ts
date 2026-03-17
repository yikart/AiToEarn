import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { NewNotification } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class NotificationService extends BaseService {
  async createForUser(payload: NewNotification) {
    const url = `/internal/notification/createForUser`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: payload,
    }
    return this.request<NewNotification>(url, config)
  }
}
