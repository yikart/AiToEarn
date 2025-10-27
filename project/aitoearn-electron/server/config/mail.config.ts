/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2024-07-05 15:52:13
 * @Description: 邮件服务配置文件
 */
import { MailerOptions } from '@nestjs-modules/mailer';

export const mailConfig: MailerOptions = {
  transport: {
    host: process.env.MAIL_HOST || 'smtp.feishu.cn',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_AUTH_USER || 'hello@aiearn.ai',
      pass: process.env.MAIL_AUTH_PASS || 'xxxx',
    },
    debug: true,
  },
  defaults: {
    from: `aitoearn <hello@aiearn.ai>`,
  },
};

export default () => ({
  MAIL_CONFIG: mailConfig,
});
