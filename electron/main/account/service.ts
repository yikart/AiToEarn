/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 账户服务
 */
import { AppDataSource } from '../../db';
import { AccountModel } from '../../db/models/account';
import { Injectable } from '../core/decorators';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  AccountType,
  defaultAccountGroupId,
} from '../../../commont/AccountEnum';
import platController from '../plat/index';
import { EtEvent } from '../../global/event';
import { AccountGroupModel } from '../../db/models/accountGroup';

@Injectable()
export class AccountService {
  private accountRepository: Repository<AccountModel>;
  private accountGroupRepository: Repository<AccountGroupModel>;

  constructor() {
    this.accountRepository = AppDataSource.getRepository(AccountModel);
    this.accountGroupRepository =
      AppDataSource.getRepository(AccountGroupModel);
  }

  // 增加用户组数据
  async addAccountGroup(data: Partial<AccountGroupModel>) {
    return await this.accountGroupRepository.save({
      ...data,
    });
  }
  // 获取用户组数据
  async getAccountGroup() {
    return await this.accountGroupRepository.find();
  }
  // 删除用户组数据
  async deleteAccountGroup(id: number) {
    // 将删除的用户组下的账户账户的组id设置为默认组id
    const accounts = await this.accountRepository.find({
      where: { groupId: id },
    });
    await this.accountRepository.update(
      { id: In(accounts.map((v) => v.id)) },
      {
        groupId: defaultAccountGroupId,
      },
    );

    // 删除
    return await this.accountGroupRepository.delete({
      id: id,
    });
  }
  // 修改用户组数据
  async editAccountGroup(data: Partial<AccountGroupModel>) {
    console.log(data);
    return await this.accountGroupRepository.update({ id: data.id }, data);
  }

  // 没有就添加有就更新cookie
  async addOrUpdateAccount(
    query: {
      userId: string;
      type: AccountType;
      uid: string;
    },
    account: Partial<AccountModel>,
  ): Promise<AccountModel> {
    const filter: FindOptionsWhere<AccountModel> = {
      userId: query.userId,
      type: query.type,
      uid: query.uid,
    };
    const accountData = await this.accountRepository.findOne({ where: filter });
    account.loginTime = new Date();
    // 添加数据
    if (!accountData) {
      const newAccount = await this.accountRepository.save(account);
      // 上报账号添加事件
      EtEvent.emit('ET_TRACING_ACCOUNT_ADD', {
        id: newAccount.id,
        desc: '添加账户' + query.type,
      });

      return newAccount;
    }

    // 更新数据
    await this.accountRepository.update(filter, account);

    return {
      ...accountData,
      ...account,
    };
  }

  // 获取账户
  async getAccountById(id: number) {
    return await this.accountRepository.findOne({ where: { id } });
  }

  // 获取账户信息
  async getAccountInfo(query: {
    type: AccountType;
    userId: string;
    uid: string;
  }) {
    return await this.accountRepository.findOne({ where: query });
  }

  // 获取所有账户
  async getAccounts(userId: string) {
    return await this.accountRepository.find({ where: { userId } });
  }

  // 根据ID数组ids获取账户列表数组
  async getAccountListByIds(userId: string, ids: number[]) {
    return await this.accountRepository.find({
      where: {
        userId,
        id: In(ids),
      },
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
    list: AccountModel[];
    fansCount?: number;
    readCount?: number;
    likeCount?: number;
    collectCount?: number;
    commentCount?: number;
    income?: number;
  }> {
    const accountList = await this.accountRepository.find({
      where: { userId, ...(type && { type }) },
    });

    const res = {
      accountTotal: accountList.length,
      list: accountList,
      fansCount: 0,
    };

    for (const element of accountList) {
      const ret = await platController.getStatistics(element).catch((err) => {
        console.error(err);
      });
      res.fansCount += ret?.fansCount || 0;
    }

    return res;
  }

  // 获取账户看板数据
  async getAccountDashboard(account: AccountModel, time?: [string, string]) {
    return await platController.getDashboard(account, time);
  }

  // 获取账户总数
  async getAccountCount(userId: string) {
    return await this.accountRepository.count({ where: { userId } });
  }

  // 根据多个账户id查询账户信息
  async getAccountsByIds(ids: number[]) {
    return await this.accountRepository.find({
      where: { id: In(ids) },
    });
  }

  // 更新粉丝数量
  async updateFansCount(userId: string, account: string, fansCount: number) {
    return await this.accountRepository.update(
      { userId, account },
      { fansCount: fansCount },
    );
  }

  // 获取用户的所有账户的总粉丝量
  async getUserFansCount(userId: string) {
    const accounts = await this.accountRepository.find({ where: { userId } });
    return accounts.reduce((acc, cur) => acc + (cur.fansCount || 0), 0);
  }

  // 删除多个账户
  async deleteAccounts(ids: number[], userId: string) {
    return await this.accountRepository.delete({
      id: In(ids),
      userId: userId,
    });
  }

  // 更新用户状态
  async updateAccountStatus(id: number, status: number) {
    await this.accountRepository.update(id, { status });
    return await this.accountRepository.findOne({ where: { id } });
  }

  // 更新用户信息
  async updateAccountInfo(id: number, data: Partial<AccountModel>) {
    await this.accountRepository.update(id, data);
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
  ) {
    return await this.accountRepository.update(id, {
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
    });
  }
}
