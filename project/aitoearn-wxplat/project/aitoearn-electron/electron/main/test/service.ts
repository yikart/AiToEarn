/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 用户服务
 */
import { AppDataSource } from '../../db';
import { Injectable } from '../core/decorators';
import { Repository } from 'typeorm';
import { AccountModel } from '../../db/models/account';

@Injectable()
export class TestService {
  private accountRepository: Repository<AccountModel>;
  constructor() {
    this.accountRepository = AppDataSource.getRepository(AccountModel);
  }

  // 获取用户
  async getInfoById(id: number) {
    return await this.accountRepository.findOne({ where: { id } });
  }
}
