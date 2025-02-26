/*
 * @Author: nevin
 * @Date: 2025-01-21 15:58:41
 * @LastEditTime: 2025-02-12 17:38:55
 * @LastEditors: nevin
 * @Description: 账户
 */

import { AccountStatus, AccountType } from '../../../commont/AccountEnum';
import { PubType } from '../../../commont/publish/PublishEnum';
import ksSvg from '@/assets/svgs/account/ks.svg';
import xhsSvg from '@/assets/svgs/account/xhs.svg';
import douyinSvg from '@/assets/svgs/account/douyin.svg';
import wxSphSvg from '@/assets/svgs/account/wx-sph.svg';

export interface IAccountPlatInfo {
  // 显示的icon
  icon: string;
  // 平台中文名称
  name: string;
  // 平台url
  url: string;
  // 支持的发布类型
  pubTypes: Set<PubType>;
}

// 支持所有发布
const PubTypeAll = new Set([PubType.ARTICLE, PubType.VIDEO]);
// 各个平台的信息
export const AccountPlatInfoMap = new Map<AccountType, IAccountPlatInfo>([
  [
    AccountType.KWAI,
    {
      name: '快手',
      icon: ksSvg,
      url: 'https://cp.kuaishou.com/profile',
      pubTypes: PubTypeAll,
    },
  ],
  [
    AccountType.Xhs,
    {
      name: '小红书',
      icon: xhsSvg,
      url: 'https://creator.xiaohongshu.com/login?source=official',
      // url: 'https://www.xiaohongshu.com/explore',
      pubTypes: PubTypeAll,
    },
  ],
  [
    AccountType.Douyin,
    {
      name: '抖音',
      icon: douyinSvg,
      url: 'https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web',
      pubTypes: PubTypeAll,
    },
  ],
  [
    AccountType.WxSph,
    {
      name: '微信视频号',
      icon: wxSphSvg,
      url: 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/hepler_merlin_mmdata?_rid=67b30b55-6e3ea588',
      pubTypes: PubTypeAll,
    },
  ],
]);

export interface AccountInfo {
  id: number;
  userId: string;
  type: AccountType;
  loginCookie: string;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  status: AccountStatus;
}
