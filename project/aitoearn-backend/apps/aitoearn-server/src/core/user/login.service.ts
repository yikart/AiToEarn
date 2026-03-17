import { Injectable, Logger } from '@nestjs/common'
import { AliSmsService } from '@yikart/ali-sms'
import { MailService } from '@yikart/mail'

@Injectable()
export class LoginService {
  logger = new Logger(LoginService.name)

  constructor(
    // private readonly transactionalService: TransactionalService,
    // private readonly subscribersService: SubscribersService,
    private readonly mailService: MailService,
    private readonly aliSmsService: AliSmsService,
  ) { }

  async sendLoginSms(phone: string, code: string): Promise<boolean> {
    try {
      return this.aliSmsService.sendSms(phone, { code })
    }
    catch (error) {
      this.logger.error({
        path: 'sendLoginSms',
        phone,
        error,
      })
      return false
    }
  }

  async sendLoginMail(mail: string, code: string): Promise<boolean> {
    try {
      return this.mailService.sendEmail({
        to: mail,
        subject: 'AiToEarn: Your Verification Code',
        template: 'mail/login',
        context: {
          mail,
          code,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: 'sendLoginMail',
        mail,
        code,
        error,
      })
      return false
    }
  }

  async sendRepasswordMail(mail: string, code: string): Promise<boolean> {
    try {
      // const subscriber = await this.subscribersService.findByEmail(mail)
      // if (!subscriber) {
      //   throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')
      // }
      // const res = await this.transactionalService.sendTransactionalMessage({
      //   subscriber_id: subscriber.id,
      //   template_id: 6,
      //   data:
      //   {
      //     code,
      //   },
      //   subject: 'AiToEarn Verification Code',
      //   from_email: 'noreply@tx.aitoearn.ai',
      // })
      // return res

      return this.mailService.sendEmail({
        to: mail,
        subject: 'AiToEarn: Password Reset Verification Code',
        template: 'mail/repassword',
        context: {
          code,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: 'sendRepasswordMail',
        mail,
        code,
        error,
      })
      return false
    }
  }

  async sendCancelMail(mail: string, code: string): Promise<boolean> {
    try {
      // const subscriber = await this.subscribersService.findByEmail(mail)
      // if (!subscriber) {
      //   throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')
      // }
      // const res = await this.transactionalService.sendTransactionalMessage({
      //   subscriber_id: subscriber.id,
      //   template_id: 7,
      //   data:
      //   {
      //     code,
      //   },
      //   subject: 'AiToEarn Verification Code',
      //   from_email: 'noreply@tx.aitoearn.ai',
      // })
      // return res

      return this.mailService.sendEmail({
        to: mail,
        subject: 'AiToEarn: Account Cancellation Confirmation',
        template: 'mail/cancel',
        context: {
          code,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: 'sendCancelMail',
        mail,
        code,
        error,
      })
      return false
    }
  }
}
