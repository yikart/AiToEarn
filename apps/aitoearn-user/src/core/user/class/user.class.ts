import { User } from '@yikart/mongodb'

// Simple random string generator
function getRandomString(length: number): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export enum UserCreateType {
  mail = 'mail',
  google = 'google',
}
export class NewUser extends User {
  static createType: UserCreateType
  constructor(type: UserCreateType, mail: string, option: { password: string, salt: string })
  constructor(type: UserCreateType, mail: string, googleAccount: User['googleAccount'])
  constructor(type: UserCreateType, mail: string, params: { password: string, salt: string } | User['googleAccount']) {
    super()
    this.mail = mail
    this.name = `user_${getRandomString(8)}`

    if (type === UserCreateType.mail) {
      const mailParams = params as { password: string, salt: string }
      this.password = mailParams.password
      this.salt = mailParams.salt
    }
    if (type === UserCreateType.google)
      this.googleAccount = params as User['googleAccount']
  }
}
