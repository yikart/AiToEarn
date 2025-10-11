/*
 * @Author: nevin
 * @Date: 2024-06-28 11:00:39
 * @LastEditTime: 2025-02-26 09:37:18
 * @LastEditors: nevin
 * @Description:
 */
import { User } from '../../db/schema/user.schema';
import { getRandomString } from '../../util';
import { encryptPassword } from '../../util/password.util';
import { WxInfo } from '../interfaces/wx-info.interface';

export class NewUserByPassword extends User {
  constructor(phone: string, inPassword: string) {
    super();

    this.name = `用户_${Date.now()}`;
    this.phone = phone;
    const { password, salt } = encryptPassword(inPassword);
    this.password = password;
    this.salt = salt;
  }
}

export class NewUserByPhone extends User {
  constructor(phone: string) {
    super();
    this.phone = phone;
    this.name = `用户_${getRandomString(8)}`;
  }
}

export class NewUserByMail extends User {
  constructor(mail: string, inPassword: string) {
    super();
    this.mail = mail;
    this.name = `用户_${getRandomString(8)}`;
    const { password, salt } = encryptPassword(inPassword);
    this.password = password;
    this.salt = salt;
  }
}

export class NewUserByWx extends User {
  constructor(wxInfo: WxInfo) {
    super();
    this.wxOpenid = wxInfo.openid;
    this.wxUnionid = wxInfo.unionid;
    this.name = `用户_${getRandomString(8)}`;
  }
}
