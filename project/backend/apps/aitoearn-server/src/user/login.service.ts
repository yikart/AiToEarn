import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { SubscribersService, SubscriberStatus, TransactionalService } from '@yikart/listmonk'

@Injectable()
export class LoginService implements OnModuleInit {
  logger = new Logger(LoginService.name)

  onModuleInit() {
    // this.sendRegisterMail('861796052@qq.com', '11111')
  }

  constructor(
    private readonly transactionalService: TransactionalService,
    private readonly subscribersService: SubscribersService,
  ) { }

  async sendRegisterMail(mail: string, code: string, name?: string): Promise<boolean> {
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

  async sendRepasswordMail(mail: string, code: string): Promise<boolean> {
    const subscriber = await this.subscribersService.findByEmail(mail)
    if (!subscriber) {
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')
    }
    const res = await this.transactionalService.sendTransactionalMessage({
      subscriber_id: subscriber.id,
      template_id: 6,
      data:
      {
        code,
      },
      subject: 'AiToEarn Verification Code',
    })
    return res.data
  }

  async sendCancelMail(mail: string, code: string): Promise<boolean> {
    const subscriber = await this.subscribersService.findByEmail(mail)
    if (!subscriber) {
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')
    }
    const res = await this.transactionalService.sendTransactionalMessage({
      subscriber_id: subscriber.id,
      template_id: 7,
      data:
      {
        code,
      },
      subject: 'AiToEarn Verification Code',
    })
    return res.data
  }
}
