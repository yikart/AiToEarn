import { Injectable } from '@nestjs/common'
import * as OneSignal from '@onesignal/node-onesignal'
import { OneSignalConfig } from './one-signal.config'
import { BaseNotification, LangMap } from './one-signal.interface'

@Injectable()
export class OneSignalService {
  constructor(
    private readonly config: OneSignalConfig,
    private readonly client: OneSignal.DefaultApi,
  ) {}

  async pushNotificationToUser<T extends LangMap>(userIds: string[], params: Omit<BaseNotification<T>, 'app_id'>) {
    const notification = new OneSignal.Notification()
    notification.app_id = this.config.appId
    notification.include_aliases = {
      external_id: userIds,
    }
    notification.target_channel = 'push'
    Object.assign(notification, params)
    return await this.client.createNotification(notification)
  }
}
