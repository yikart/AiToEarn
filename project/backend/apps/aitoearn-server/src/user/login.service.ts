import { Injectable, Logger } from '@nestjs/common'
import { SubscribersService, SubscriberStatus, TransactionalService } from '@yikart/listmonk'
import { getRandomString } from '../common/utils'

@Injectable()
export class LoginService {
  logger = new Logger(LoginService.name)

  constructor(
    private readonly transactionalService: TransactionalService,
    private readonly subscribersService: SubscribersService,
  ) { }

  async sendRegisterMail(mail: string, name?: string): Promise<boolean> {
    const code = getRandomString(6, true)

    let subscriber = await this.subscribersService.findByEmail(mail)
    if (!subscriber) {
      subscriber = await this.subscribersService.create({
        email: mail,
        status: SubscriberStatus.ENABLED,
        name: name || mail,
      })
    }

    const res = await this.transactionalService.sendTransactionalMessage({
      subscriber_id: subscriber.id,
      template_id: 5,
      data:
      {
        code,
      },
      subject: 'AiToEarn Verification Code',
    })
    return res.data
  }
}
