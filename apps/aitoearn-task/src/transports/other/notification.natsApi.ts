import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import { NewNotification } from './common'

@Injectable()
export class NotificationNatsApi extends ServerBaseApi {
  /**
   * 创建用户通知
   */
  async createToUser(newData: NewNotification) {
    const res = await this.sendMessage<NewNotification>(
      'notificationInternal.createForUser',
      newData,
    )
    return res
  }
}
