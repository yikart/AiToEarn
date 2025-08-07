/*
 * @Author: nevin
 * @Date: 2024-06-28 11:00:39
 * @LastEditTime: 2025-02-26 09:37:18
 * @LastEditors: nevin
 * @Description:
 */

import { getRandomString } from '@common/utils'
import { User } from '@libs/database/schema'

export class NewUserByMail extends User {
  constructor(mail: string, password: string, salt: string) {
    super()
    this.mail = mail
    this.name = `用户_${getRandomString(8)}`
    this.password = password
    this.salt = salt
  }
}

export class NewUserByGoogle extends User {
  constructor(mail: string, googleAccount: User['googleAccount']) {
    super()
    this.mail = mail
    this.name = `用户_${getRandomString(8)}`
    this.googleAccount = googleAccount
  }
}
