/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 用户服务
 */
import { AppDataSource } from '../../db';
import { Injectable } from '../core/decorators';
import { Repository } from 'typeorm';
import { UserModel } from '../../db/models/user';

@Injectable()
export class UserService {
  private userRepository: Repository<UserModel>;
  constructor() {
    this.userRepository = AppDataSource.getRepository(UserModel);
  }
  // 添加用户
  async addUser(user: UserModel) {
    return await this.userRepository.save(user);
  }

  // 获取用户
  async getUser(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  // 获取所有用户
  async getUsers() {
    return await this.userRepository.find();
  }
}
