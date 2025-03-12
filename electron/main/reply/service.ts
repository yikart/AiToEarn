/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: Reply reply
 */
import { Injectable } from '../core/decorators';
import { douyinService } from '../../plat/douyin/index';
import { AccountModel } from '../../db/models/account';
import { shipinhaoService } from '../../plat/shipinhao';

@Injectable()
export class ReplyService {
  // 测试获取抖音作品列表
  async testGetDouyinList(account: AccountModel) {
    const cookie: Electron.Cookie[] = JSON.parse(account.loginCookie);

    let msToken = '';
    for (let i = 0; i < cookie.length; i++) {
      if (cookie[i].name === 'msToken') {
        msToken = cookie[i].value;
        break;
      }
    }
    console.log('------ msToken ----', msToken);

    // 秒级时间戳
    const timestamp = Date.now();
    console.log('------ timestamp ----', timestamp);

    const res = await douyinService.getCreatorItems(cookie, timestamp + '', '');

    console.log('------ res ----', res);

    return 1;
  }

  async testGetSphCreatorList(account: AccountModel) {
    const cookie: Electron.Cookie[] = JSON.parse(account.loginCookie);

    const res = await shipinhaoService.getPostList(cookie, {
      pageNo: 1,
      pageSize: 10,
    });

    console.log('------ res ----', res);
  }
}
