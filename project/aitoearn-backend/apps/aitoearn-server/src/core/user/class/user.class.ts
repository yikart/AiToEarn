import { User } from '@yikart/mongodb'
import { getRandomString } from '../../../common/utils'

export enum UserCreateType {
  mail = 'mail',
  google = 'google',
  phone = 'phone',
  douyinMiniApp = 'douyinMiniApp',
}
export class NewUser extends User {
  static createType: UserCreateType

  constructor(type: UserCreateType.douyinMiniApp, identity: { douyinMiniAppOpenid?: string, douyinUnionid?: string }) // 抖音小程序渠道创建用户
  constructor(type: UserCreateType.phone, phone: string)
  constructor(type: UserCreateType.mail, mail: string)
  constructor(type: UserCreateType.mail, mail: string, option: { password: string, salt: string })
  constructor(type: UserCreateType.google, mail: string, googleAccount: User['googleAccount'])
  constructor(type: UserCreateType, identifier: string | { douyinMiniAppOpenid?: string, douyinUnionid?: string }, params?: { password: string, salt: string } | User['googleAccount']) {
    super()
    this.name = `user_${getRandomString(8)}`

    switch (type) {
      case UserCreateType.douyinMiniApp: {
        const identity = identifier as { douyinMiniAppOpenid?: string, douyinUnionid?: string }
        this.douyinUnionid = identity.douyinUnionid
        this.douyinMiniAppOpenid = identity.douyinMiniAppOpenid
        break
      }
      case UserCreateType.phone:
        this.phone = identifier as string
        break
      default:
        this.mail = identifier as string
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
