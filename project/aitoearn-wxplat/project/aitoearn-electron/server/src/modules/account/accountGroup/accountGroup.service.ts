import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccountGroup,
  AccountGroupDefaultType,
} from '../../../db/schema/accountGroup.schema';
import { AccountService } from '../account.service';
import { IdService } from '../../../db/id.service';

@Injectable()
export class AccountGroupService {
  constructor(
    @InjectModel(AccountGroup.name)
    private readonly accountGroupModel: Model<AccountGroup>,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    private readonly idService: IdService,
  ) {}

  private async getId() {
    return this.idService.createId('accountGroupId', 100000000, 1);
  }

  /**
   * 添加或者更新组
   * @param accountGroup
   */
  async addOrUpdateAccountGroup(
    accountGroup: Partial<AccountGroup>,
  ): Promise<AccountGroup> {
    // 更新数据
    if (accountGroup.id) {
      return this.accountGroupModel.findOneAndUpdate(
        { id: accountGroup.id },
        accountGroup,
        {
          new: true,
        },
      );
    }

    accountGroup.id = await this.getId();
    // 添加数据
    return this.accountGroupModel.create(accountGroup);
  }

  /**
   * 删除多个组
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: number[], userId: string): Promise<boolean> {
    const accountGorupList = await this.accountGroupModel
      .find({ userId, id: { $in: ids } })
      .exec();
    // 默认用户组
    const defaultGroup = await this.getDefaultGroup(userId);

    // 将删除的组下面的账户切换为默认组
    for (const gorup of accountGorupList) {
      await this.accountService.switchToDefaultGroup(
        userId,
        gorup.id,
        defaultGroup.id,
      );
    }

    // 删除
    const res = await this.accountGroupModel.deleteMany({
      id: { $in: ids },
      userId,
    });
    return res.deletedCount > 0;
  }

  // 获取默认用户组
  async getDefaultGroup(userId: string) {
    return this.accountGroupModel
      .findOne({
        userId,
        isDefault: AccountGroupDefaultType.Default,
      })
      .exec();
  }

  // 创建默认用户组
  async createDefaultGroup(userId: string): Promise<AccountGroup> {
    return this.addOrUpdateAccountGroup({
      name: '默认列表',
      rank: 0,
      createTime: new Date(),
      updateTime: new Date(),
      userId,
      isDefault: AccountGroupDefaultType.Default,
    });
  }

  // 获取所有组
  async getAccountGroup(userId: string): Promise<AccountGroup[]> {
    const accountGroupList = await this.accountGroupModel
      .find({ userId })
      .exec();

    // 创建默认用户组
    if (accountGroupList.length === 0) {
      const accountGroup = await this.createDefaultGroup(userId);
      return [accountGroup];
    }

    return accountGroupList;
  }
}
