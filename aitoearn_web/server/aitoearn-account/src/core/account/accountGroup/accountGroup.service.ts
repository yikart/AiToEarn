import { FingerprintService } from '@core/fingerprint/fingerprint.service'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AccountGroup } from '@/libs'
import { AccountService } from '../account.service'

@Injectable()
export class AccountGroupService {
  constructor(
    @InjectModel(AccountGroup.name)
    private readonly accountGroupModel: Model<AccountGroup>,

    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    private readonly fingerprintService: FingerprintService,
  ) {}

  // 获取默认用户组, 没有则创建
  async getDefaultGroup(userId: string): Promise<AccountGroup> {
    const data = await this.accountGroupModel
      .findOne({
        userId,
        isDefault: true,
      })
      .exec()

    if (data)
      return data

    // 创建
    return await this.createAccountGroup({
      isDefault: true,
      name: 'default',
      rank: 1,
      userId,
    })
  }

  /**
   * 添加组
   * @param accountGroup
   */
  async createAccountGroup(
    accountGroup: Partial<AccountGroup>,
  ): Promise<AccountGroup> {
    if (!accountGroup.browserConfig) {
      accountGroup.browserConfig = await this.fingerprintService.generateFingerprint()
    }
    return this.accountGroupModel.create(accountGroup)
  }

  /**
   * 更新组
   * @param accountGroup
   */
  async updateAccountGroup(
    id: string,
    accountGroup: Partial<AccountGroup>,
  ): Promise<boolean> {
    const res = await this.accountGroupModel.updateOne(
      { _id: id },
      accountGroup,
    )
    return res.modifiedCount > 0
  }

  /**
   * 删除多个组
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: string[], userId: string): Promise<boolean> {
    const accountGorupList = await this.accountGroupModel
      .find({ userId, _id: { $in: ids } })
      .exec()
    // 默认用户组
    const defaultGroup = await this.getDefaultGroup(userId)

    // 将删除的组下面的账户切换为默认组
    for (const gorup of accountGorupList) {
      await this.accountService.switchToDefaultGroup(
        userId,
        gorup.id,
        defaultGroup.id,
      )
    }

    // 删除
    const res = await this.accountGroupModel.deleteMany({
      _id: { $in: ids },
      userId,
    })
    return res.deletedCount > 0
  }

  /**
   * 获取所有组
   * @param userId
   * @returns
   */
  async getAccountGroup(userId: string): Promise<AccountGroup[]> {
    Logger.log(userId)
    const accountGroupList: AccountGroup[] = await this.accountGroupModel.find({
      userId,
    })

    // 创建默认用户组
    if (accountGroupList.length === 0) {
      const accountGroup = await this.getDefaultGroup(userId)
      accountGroupList.push(accountGroup)
    }

    return accountGroupList
  }
}
