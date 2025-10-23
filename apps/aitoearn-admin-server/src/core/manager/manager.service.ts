import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { ManagerRepository } from '@yikart/mongodb'
import { NewManagerByAccount } from './class/manager.class'

@Injectable()
export class ManagerService {
  constructor(private readonly managerRepository: ManagerRepository) { }

  /**
   * 获取用户信息
   * @param account
   * @returns
   */
  async getInfoByAccount(account: string) {
    const info = await this.managerRepository.getInfoByAccount(account)
    return info
  }

  /**
   * 初始化管理员
   * @returns
   */
  async initAdmin() {
    const account = 'admin'
    const password = 'd65015a144fc2f3517f2f382b888a3a5'

    const adminInfo = await this.getInfoByAccount(account)
    if (adminInfo)
      throw new AppException(1, '管理员已存在')

    const newData = new NewManagerByAccount(account, password)

    const info = await this.managerRepository.createByAccount(newData)
    if (info)
      throw new AppException(1, '创建管理员失败')

    return info
  }
}
