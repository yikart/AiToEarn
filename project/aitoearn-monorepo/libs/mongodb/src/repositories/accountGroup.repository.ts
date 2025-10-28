import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AccountGroup } from '../schemas/accountGroup.schema'
import { BaseRepository } from './base.repository'

export class AccountGroupRepository extends BaseRepository<AccountGroup> {
  constructor(
    @InjectModel(AccountGroup.name)
    private readonly accountGroupModel: Model<AccountGroup>,
  ) { super(accountGroupModel) }

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
   * 更新组
   * @param accountGroup
   */
  async getAccountGorupListByIds(
    ids: string[],
    userId: string,
  ) {
    const accountGorupList = await this.accountGroupModel
      .find({ userId, _id: { $in: ids } })
      .exec()
    return accountGorupList
  }

  /**
   * 删除多个组
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: string[], userId: string): Promise<boolean> {
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

  // 排序
  async sortRank(userId: string, list: { id: string, rank: number }[]) {
    const promises = list.map(element =>
      this.accountGroupModel.updateOne(
        { userId, _id: element.id },
        { $set: { rank: element.rank } },
      ),
    )

    await Promise.all(promises)
    return true
  }
}
