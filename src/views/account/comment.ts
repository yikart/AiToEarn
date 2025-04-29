/*
 * @Author: nevin
 * @Date: 2025-01-21 15:58:41
 * @LastEditTime: 2025-02-12 17:38:55
 * @LastEditors: nevin
 * @Description: 账户
 */

import { AccountType } from '../../../commont/AccountEnum';
import { PubType } from '../../../commont/publish/PublishEnum';
import ksSvg from '../../assets/svgs/account/ks.svg';
import xhsSvg from '../../assets/svgs/account/xhs.svg';
import douyinSvg from '../../assets/svgs/account/douyin.svg';
import wxSphSvg from '../../assets/svgs/account/wx-sph.svg';
import { AccountModel } from '../../../electron/db/models/account';

export interface IAccountPlatInfo {
  // 显示的icon
  icon: string;
  // 平台中文名称
  name: string;
  // 平台url
  url: string;
  // 支持的发布类型
  pubTypes: Set<PubType>;
  /**
   * 通用发布参数配置，有两个地方用到
   * 1. 在设置通用发布参数的时候会根据当前选择的账户中的最小参数为基准设置参数限制
   * 2. 规定每个平台通用参数的限制
   */
  commonPubParamsConfig: {
    // title限制字数，可以不填，不填表示该平台无标题参数
    titleMax?: number;
    // 定时发布，可以不填，不填表示该平台无定时发布参数
    timingMax?: {
      // 同 VideoPubSetModalCommon.maxDate
      maxDate: number;
      // 同 VideoPubSetModalCommon.timeOffset
      timeOffset: number;
    };
    // 话题数量限制
    topicMax: number;
    // 仅图文发布的限制参数
    imgTextConfig?: {
      imagesMax: number;
    };
  };
  // 平台提示
  tips?: {
    // 添加账号时候的提示
    account: string;
    // 在发布时添加账号时候的提示
    publish: string;
  };
}

// 支持所有发布
const PubTypeAll = new Set([PubType.ARTICLE, PubType.VIDEO, PubType.ImageText]);
// 各个平台的信息
export const AccountPlatInfoMap = new Map<AccountType, IAccountPlatInfo>([
  [
    AccountType.KWAI,
    {
      name: '快手',
      icon: ksSvg,
      url: 'https://cp.kuaishou.com/profile',
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        timingMax: {
          maxDate: 13,
          timeOffset: 60,
        },
        topicMax: 4,
      },
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
      commonPubParamsConfig: {
        timingMax: {
          maxDate: 14,
          timeOffset: 60,
        },
        topicMax: 20,
        titleMax: 20,
        imgTextConfig: {
          imagesMax: 18,
        },
      },
    },
  ],
  [
    AccountType.Douyin,
    {
      name: '抖音',
      icon: douyinSvg,
      url: 'https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web',
      pubTypes: PubTypeAll,
      commonPubParamsConfig: {
        timingMax: {
          maxDate: 14,
          timeOffset: 120,
        },
        titleMax: 30,
        topicMax: 5,
        imgTextConfig: {
          imagesMax: 35,
        },
      },
      tips: {
        account: '首次登录的抖音号可能会频繁掉线，通常将在重登2-3次后趋于稳定',
        publish:
          '首次登录的抖音账号请先在账户单独完成一次内容发布后再做一键发布',
      },
    },
  ],
  [
    AccountType.WxSph,
    {
      name: '微信视频号',
      icon: wxSphSvg,
      url: 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/hepler_merlin_mmdata?_rid=67b30b55-6e3ea588',
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        timingMax: {
          maxDate: 30,
          timeOffset: 60,
        },
        titleMax: 16,
        topicMax: 10,
      },
    },
  ],
]);

export type AccountInfo = AccountModel;
