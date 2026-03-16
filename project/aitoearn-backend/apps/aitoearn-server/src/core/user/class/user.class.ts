import { User } from '@yikart/mongodb'
import { getRandomString } from '../../../common/utils'

export enum UserCreateType {
  mail = 'mail',
  google = 'google',
  phone = 'phone',
}
export class NewUser extends User {
  static createType: UserCreateType
  constructor(type: UserCreateType.phone, phone: string)
  constructor(type: UserCreateType.mail, mail: string)
  constructor(type: UserCreateType.mail, mail: string, option: { password: string, salt: string })
  constructor(type: UserCreateType.google, mail: string, googleAccount: User['googleAccount'])
  constructor(type: UserCreateType, identifier: string, params?: { password: string, salt: string } | User['googleAccount']) {
    super()
    this.name = `user_${getRandomString(8)}`

    if (type === UserCreateType.phone) {
      this.phone = identifier
    }
    else {
      this.mail = identifier
      if (type === UserCreateType.mail && params) {
        const mailParams = params as { password: string, salt: string }
        this.password = mailParams.password
        this.salt = mailParams.salt
      }
      if (type === UserCreateType.google)
        this.googleAccount = params as User['googleAccount']
    }
  }
}
