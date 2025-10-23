import { Manager } from '@yikart/mongodb'
import { encryptPassword, getRandomString } from '../../../common'

export class NewManagerByAccount extends Manager {
  constructor(account: string, inPassword: string) {
    super()
    this.account = account
    this.name = `管理员_${getRandomString(8)}`
    const { password, salt } = encryptPassword(inPassword)
    this.password = password
    this.salt = salt
  }
}
