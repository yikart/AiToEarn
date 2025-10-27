/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-06 19:14:12
 * @LastEditors: nevin
 * @Description:
 */
import { Controller, Icp, Inject } from '../core/decorators';
import { UserService } from './service';
import { UserModel } from '../../db/models/user';

@Controller()
export class UserController {
  @Inject(UserService)
  private readonly userService!: UserService;

  /**
   * 添加用户
   */
  @Icp('ICP_USER_ADD')
  async addUser(
    event: Electron.IpcMainInvokeEvent,
    user: UserModel,
  ): Promise<UserModel> {
    const currUser = {
      ...user,
      phone: user.phone || user.wxOpenId,
      loginTime: new Date(),
    };
    await this.userService.addUser(currUser);
    return currUser;
  }

  /**
   * 获取平台存储的所有用户信息
   */
  @Icp('ICP_USER_ALL')
  async getUserList(): Promise<UserModel[]> {
    return await this.userService.getUsers();
  }
}
