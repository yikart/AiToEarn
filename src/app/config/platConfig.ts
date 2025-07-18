import { PubType } from "@/app/config/publishConfig";
import ksSvg from "@/assets/svgs/plat/ks.svg";
import bilibiliSvg from "@/assets/svgs/plat/bilibili.svg";
import youtubeSvg from "@/assets/svgs/plat/youtube.svg";
import douyinSvg from "@/assets/svgs/plat/douyin.svg";
import tiktokSvg from "@/assets/svgs/plat/tiktok.svg";
import twitterSvg from "@/assets/svgs/plat/twtter.svg";
import facebookSvg from "@/assets/svgs/plat/facebook.svg";
import instagramSvg from "@/assets/svgs/plat/instagram.svg";
import threadsSvg from "@/assets/svgs/plat/xiancheng.svg";
import wxGzhSvg from "@/assets/svgs/plat/wx-gzh.svg";  
import wxSphSvg from "@/assets/svgs/plat/wx-sph.svg";
import pinterestSvg from "@/assets/svgs/plat/pinterest.svg";

// 平台类型
export enum PlatType {
  Tiktok = "tiktok", // tiktok
  Douyin = "douyin", // 抖音
  Xhs = "xhs", // 小红书
  WxSph = "wxSph", // 微信视频号
  KWAI = "KWAI", // 快手
  YouTube = "youtube", // YouTube
  BILIBILI = "bilibili", // B站
  Twitter = "twitter", // Twitter
  WxGzh = "wxGzh", // 微信公众号
  Facebook = "facebook", // Facebook
  Instagram = "instagram", // Instagram
  Threads = "threads", // Threads
  Pinterest = "pinterest", // Pinterest
}

export interface IAccountPlatInfo {
  // 平台主题颜色
  themeColor: string;
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

// 各个平台的信息
export const AccountPlatInfoMap = new Map<PlatType, IAccountPlatInfo>([ 
  [
    PlatType.Douyin,
    {
      name: "抖音",
      icon: douyinSvg.src,
      url: "https://www.douyin.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        topicMax: 4,
      },
      themeColor: "#FF4D00",
    },
  ],
  [
    PlatType.KWAI,
    {
      name: "快手",
      icon: ksSvg.src,
      url: "https://cp.kuaishou.com/profile",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        topicMax: 4,
      },
      themeColor: "#FF4D00",
    },
  ],
  [
    PlatType.BILIBILI,
    {
      name: "B站",
      icon: bilibiliSvg.src,
      url: "https://cp.kuaishou.com/profile",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        topicMax: 10,
        titleMax: 80,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.YouTube,
    {
      name: "YouTube",
      icon: youtubeSvg.src,
      url: "https://www.youtube.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Twitter,
    {
      name: "Twitter",
      icon: twitterSvg.src,
      url: "https://x.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Tiktok,
    {
      name: "TikTok",
      icon: tiktokSvg.src,
      url: "https://www.tiktok.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "black",
    },
  ],
  [
    PlatType.Facebook,
    {
      name: "Facebook",
      icon: facebookSvg.src,
      url: "https://www.facebook.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.WxGzh,
    {
      name: "微信公众号",
      icon: wxGzhSvg.src,
      url: "https://mp.weixin.qq.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "green",
    },
  ],
  [
    PlatType.Instagram,
    {
      name: "Instagram",
      icon: instagramSvg.src,
      url: "https://www.instagram.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Threads,
    {
      name: "Threads",
      icon: threadsSvg.src,
      url: "https://www.threads.net/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Pinterest,
    {
      name: "Pinterest",
      icon: pinterestSvg.src,
      url: "https://www.pinterest.com/",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 10,
      },
      themeColor: "#CC2025",
    },
  ],
]);
export const AccountPlatInfoArr = Array.from(AccountPlatInfoMap);
