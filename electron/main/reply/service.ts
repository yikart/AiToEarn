/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: Reply reply
 */
import { Injectable } from '../core/decorators';
import { douyinService } from '../../plat/douyin/index';
import { AccountModel } from '../../db/models/account';

@Injectable()
export class ReplyService {
  // 测试获取抖音作品列表
  async testGetDouyinList(account: AccountModel) {
    const cookie: any = JSON.parse(account.loginCookie);
    const res = await douyinService.getCreatorItems(
      cookie,
      '11111',
      cookie.msToken,
    );

    console.log(res);

    return res;
  }
}
