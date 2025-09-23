import { PubType } from "@/app/config/publishConfig";
import ksSvg from "@/assets/svgs/plat/ks.svg";
import bilibiliSvg from "@/assets/svgs/plat/bilibili.svg";
import youtubeSvg from "@/assets/svgs/plat/youtube.png";
import douyinSvg from "@/assets/svgs/plat/douyin.svg";
import tiktokSvg from "@/assets/svgs/plat/tiktok.svg";
import twitterSvg from "@/assets/svgs/plat/twitter.png";
import facebookSvg from "@/assets/svgs/plat/facebook.png";
import instagramSvg from "@/assets/svgs/plat/instagram.png";
import threadsSvg from "@/assets/svgs/plat/threads.png";
import wxSphSvg from "@/assets/svgs/plat/wx-sph.svg";
import gongzhonghaoSvg from "@/assets/svgs/plat/gongzhonghao.png";
import pinterestSvg from "@/assets/svgs/plat/pinterest.png";
import xhsSvg from "@/assets/svgs/plat/xhs.svg";
import linkedinSvg from "@/assets/svgs/plat/linkedin.png";
import { directTrans } from "@/app/i18n/client";

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
  LinkedIn = "linkedin", // LinkedIn
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
    // 描述字数限制
    desMax: number;
    // 图片数量限制
    imagesMax?: number;
  };
  // 是否在PC端不显示
  pcNoThis?: boolean;
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
    PlatType.Xhs,
    {
      name: "rednote",
      icon: xhsSvg,
      url: "https://www.xiaohongshu.com/",
      themeColor: "red",
      pubTypes: new Set([]),
      commonPubParamsConfig: {
        titleMax: 100,
        topicMax: 100,
        desMax: 1000,
      },
      pcNoThis: true,
    },
  ],
  [
    PlatType.KWAI,
    {
      name: "kwai",
      icon: ksSvg,
      url: "https://cp.kuaishou.com/profile",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        topicMax: 4,
        desMax: 500,
      },
      themeColor: "#FF4D00",
    },
  ],
  [
    PlatType.BILIBILI,
    {
      name: "bilibili",
      icon: bilibiliSvg,
      url: "https://cp.kuaishou.com/profile",
      pubTypes: new Set([PubType.VIDEO]),
      commonPubParamsConfig: {
        topicMax: 10,
        titleMax: 80,
        desMax: 2000,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.WxGzh,
    {
      name: "wxgzh",
      icon: gongzhonghaoSvg.src,
      url: "https://mp.weixin.qq.com/",
      pubTypes: new Set([PubType.ImageText, PubType.Article]),
      commonPubParamsConfig: {
        topicMax: 10,
        desMax: 2200,
        imagesMax: 20,
      },
      themeColor: "green",
    },
  ],

  [
    PlatType.Douyin,
    {
      name: "douyin",
      icon: douyinSvg,
      url: "https://www.douyin.com/",
      pubTypes: new Set([]),
      commonPubParamsConfig: {
        titleMax: 30,
        topicMax: 5,
        desMax: 1000,
      },
      themeColor: "#FF4D00",
      pcNoThis: true,
    },
  ],
  [
    PlatType.WxSph,
    {
      name: "wxsph",
      icon: wxSphSvg,
      url: "https://mp.weixin.qq.com/",
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        titleMax: 100,
        topicMax: 100,
        desMax: 5000,
      },
      themeColor: "green",
      pcNoThis: true,
    },
  ],
  [
    PlatType.Tiktok,
    {
      name: "TikTok",
      icon: tiktokSvg,
      url: "https://www.tiktok.com/",
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        topicMax: 100,
        desMax: 4000,
        imagesMax: 10,
      },
      themeColor: "black",
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
        titleMax: 100,
        topicMax: 100,
        desMax: 5000,
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
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText, PubType.Article]),
      commonPubParamsConfig: {
        topicMax: 100,
        desMax: 280,
        imagesMax: 4,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Facebook,
    {
      name: "Facebook",
      icon: facebookSvg.src,
      url: "https://www.facebook.com/",
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        titleMax: 80,
        topicMax: 100,
        desMax: 5000,
        imagesMax: 10,
      },
      themeColor: "blue",
    },
  ],
  [
    PlatType.Instagram,
    {
      name: "Instagram",
      icon: instagramSvg.src,
      url: "https://www.instagram.com/",
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        titleMax: 80,
        topicMax: 100,
        desMax: 2200,
        imagesMax: 10,
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
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText, PubType.Article]),
      commonPubParamsConfig: {
        titleMax: 80,
        topicMax: 100,
        desMax: 500,
        imagesMax: 20,
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
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        titleMax: 16,
        topicMax: 100,
        desMax: 2200,
        imagesMax: 1,
      },
      themeColor: "#CC2025",
    },
  ],
  [
    PlatType.LinkedIn,
    {
      name: "LinkedIn",
      icon: linkedinSvg.src,
      url: "https://www.linkedin.com/",
      pubTypes: new Set([PubType.VIDEO, PubType.ImageText]),
      commonPubParamsConfig: {
        titleMax: 80,
        topicMax: 100,
        desMax: 500,
        imagesMax: 20,
      },
      themeColor: "blue",
    },
  ],
]);
export const AccountPlatInfoArr = Array.from(AccountPlatInfoMap);

// 遍历设置 name getter
AccountPlatInfoMap.forEach((info) => {
  const rawName = info.name;
  Object.defineProperty(info, "name", {
    get() {
      return directTrans("account", rawName);
    },
    configurable: true,
    enumerable: true,
  });
});
