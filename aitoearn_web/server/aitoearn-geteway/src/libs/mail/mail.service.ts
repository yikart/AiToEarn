/*
 * @Author: nevin
 * @Date: 2024-06-11 10:27:06
 * @LastEditTime: 2024-07-05 15:50:12
 * @LastEditors: nevin
 * @Description:
 */
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(p: ISendMailOptions): Promise<boolean> {
    try {
      const res = await this.mailerService.sendMail(p)
      return !!res
    }
    catch (error) {
      console.log('-------  sendEmail error  --------', error)
      return false
    }
  }
}
