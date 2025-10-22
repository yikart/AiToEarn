import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { TransportsService } from '../transports.service'
import { NewNotification } from './common'

@Injectable()
export class NotificationNatsApi extends TransportsService {
  /**
   * 创建用户通知
   */
  async createToUser(newData: NewNotification) {
    const res = await this.aitoearnServerRequest<NewNotification>(
      'post',
      NatsApi.other.notification.createForUser,
      newData,
    )
    return res
  }
}
