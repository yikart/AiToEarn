import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountType } from '../../db/schema/account.schema';
import { IdService } from 'src/db/id.service';

import { AccountGroupService } from './accountGroup/accountGroup.service';

@Injectable()
export class AccountService {

  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,

    private readonly idService: IdService,
    @Inject(forwardRef(() => AccountGroupService))
    private readonly accountGroupService: AccountGroupService,
  ) {
  }

  private async getId() {
    return this.idService.createId('accountId', 100000000, 1);
  }

  /**
   * 将用户组下的账户切换到默认组
   * @param userId
   * @param groupId
   * @param defaultGroupId
   */
  async switchToDefaultGroup(
    userId: string,
    groupId: number,
    defaultGroupId: number,
  ) {
    return this.accountModel.updateMany(
      { userId, groupId: { $ne: groupId } },
      { groupId: defaultGroupId },
    );
  }

  /**
   * 添加或更新账号
   * @param account
   * @returns
   */
  async addOrUpdateAccount(account: Partial<Account>): Promise<Account> {
    const existingAccount = await this.accountModel.findOne(
      account.id
        ? {
            id: account.id,
          }
        : {
            userId: account.userId,
            uid: account.uid,
            type: account.type,
          },
    );

    if (existingAccount) {
      return this.accountModel.findOneAndUpdate(
        { id: existingAccount.id },
        account,
        {
          new: true,
        },
      );
    }

    // 获取默认用户组
    let defaultGrpoupId: number;
    const defaultGroup = await this.accountGroupService.getDefaultGroup(
      account.userId,
    );
    if (defaultGroup) {
      defaultGrpoupId = defaultGroup.id;
    } else {
      // 如果没有默认用户组，则创建一个默认用户组
      const newGroup = await this.accountGroupService.createDefaultGroup(
        account.userId,
      );
      defaultGrpoupId = newGroup.id;
    }

    account.id = await this.getId();
    account.groupId = defaultGrpoupId;
    return this.accountModel.create(account);
  }

  /**
   * 根据用户id获取账号
   */
  async getAccountById(id: number) {
    return this.accountModel.findOne({ id });
  }

  /**
   * 获取所有账户
   * @param userId
   * @returns
   */
  async getAccounts(userId: string) {
    return await this.accountModel.find({
      userId,
    });
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIds(userId: string, ids: number[]) {
    return await this.accountModel.find({
      userId,
      id: { $in: ids },
    });
  }

  /**
   * 获取账户的统计信息
   * @param userId
   * @param type
   * @returns
   */
  async getAccountStatistics(
    userId: string,
    type?: AccountType,
  ): Promise<{
    accountTotal: number;
    list: Account[];
    fansCount?: number;
    readCount?: number;
    likeCount?: number;
    collectCount?: number;
    commentCount?: number;
    income?: number;
  }> {
    const accountList = await this.accountModel.find({
      userId,
      ...(type && { type }),
    });

    const res = {
      accountTotal: accountList.length,
      list: accountList,
      fansCount: 0,
    };

    for (const element of accountList) {
      // TODO: 获取统计信息
      // const ret = await platController.getStatistics(element).catch((err) => {
      //   console.error(err);
      // });
      // res.fansCount += ret?.fansCount || 0;
    }

    return res;
  }

  /**
   * 获取用户的账户总数
   * @param userId
   * @returns
   */
  async getAccountCount(userId: string) {
    return await this.accountModel.countDocuments({ userId });
  }

  /**
   * 根据多个账户id查询账户信息
   * @param ids
   * @returns
   */
  async getAccountsByIds(ids: number[]) {
    return await this.accountModel.find({
      id: { $in: ids },
    });
  }

  /**
   * 更新粉丝数量
   * @param userId
   * @param account
   * @param fansCount
   * @returns
   */
  async updateFansCount(userId: string, account: string, fansCount: number) {
    return await this.accountModel.updateOne(
      { userId, account },
      { fansCount: fansCount },
    );
  }

  // 获取用户的所有账户的总粉丝量
  async getUserFansCount(userId: string) {
    const accounts = await this.accountModel.find({ userId });
    return accounts.reduce((acc, cur) => acc + (cur.fansCount || 0), 0);
  }

  /**
   * 删除
   * @param id
   * @param userId
   * @returns
   */
  async deleteAccount(id: number, userId: string): Promise<boolean> {
    const res = await this.accountModel.deleteOne({
      id,
      userId: userId,
    });

    return res.deletedCount > 0;
  }

  // 删除多个账户
  async deleteAccounts(ids: string[], userId: string) {
    const res = await this.accountModel.deleteMany({
      _id: { $in: ids },
      userId,
    });
    return res.deletedCount > 0;
  }

  /**
   * 更新用户状态
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: number, status: number) {
    return await this.accountModel.updateOne({ id }, { status });
  }

  // 更新账户的统计信息
  async updateAccountStatistics(
    id: number,
    fansCount: number,
    readCount: number,
    likeCount: number,
    collectCount: number,
    commentCount: number,
    income: number,
    workCount: number,
  ) {
    return await this.accountModel.updateOne(
      { id },
      {
        fansCount,
        readCount,
        likeCount,
        collectCount,
        commentCount,
        income,
        workCount,
      },
    );
  }

  // /**
  //  * Google登录
  //  * @param clientId Google客户端ID
  //  * @param credential Google认证凭证
  //  * @returns Account
  //  */
  // async googleLogin(clientId: string, credential: string): Promise<any> {
  //   try {
  //     console.log('Verifying Google token with:');

  //     // 验证Google token
  //     const ticket = await this.googleClient.verifyIdToken({
  //       idToken: credential,
  //       audience: clientId,
  //     });
  //     console.log('ticket',ticket)
  //     const payload = ticket.getPayload();
  //     console.log('payload',payload)
  //     if (!payload) {
  //       throw new Error('Invalid Google token');
  //     }

  //     console.log('Google login success, payload:', payload);
  //     return payload;
  //   } catch (error) {
  //     console.error('Google login error:', error);
  //     throw new Error(`Google login failed: ${error.message}`);
  //   }
  // }
}
