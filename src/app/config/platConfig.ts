import { PubType } from "@/app/config/publishConfig";
import ksSvg from "@/assets/svgs/plat/ks.svg";
import xhsSvg from "@/assets/svgs/plat/xhs.svg";
import douyinSvg from "@/assets/svgs/plat/douyin.svg";
import wxSphSvg from "@/assets/svgs/plat/wx-sph.svg";

// 平台类型
export enum PlatType {
  Douyin = "douyin", // 抖音
  Xhs = "xhs", // 小红书
  WxSph = "wxSph", // 微信视频号
  KWAI = "KWAI", // 快手
}

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

const PubTypeAll = new Set([PubType.ARTICLE, PubType.VIDEO, PubType.ImageText]);
// 各个平台的信息
export const AccountPlatInfoMap = new Map<PlatType, IAccountPlatInfo>([
  [
    PlatType.KWAI,
    {
      name: "快手",
      icon: ksSvg.src,
      url: "https://cp.kuaishou.com/profile",
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
    PlatType.Xhs,
    {
      name: "小红书",
      icon: xhsSvg.src,
      url: "https://creator.xiaohongshu.com/login?source=official",
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
    PlatType.Douyin,
    {
      name: "抖音",
      icon: douyinSvg.src,
      url: "https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web",
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
      // tips: {
      //   account: '首次登录的抖音号可能会频繁掉线，通常将在重登2-3次后趋于稳定',
      //   publish:
      //     '首次登录的抖音账号请先在账户单独完成一次内容发布后再做一键发布',
      // },
    },
  ],
  [
    PlatType.WxSph,
    {
      name: "微信视频号",
      icon: wxSphSvg.src,
      url: "https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/hepler_merlin_mmdata?_rid=67b30b55-6e3ea588",
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
export const AccountPlatInfoArr = Array.from(AccountPlatInfoMap);
