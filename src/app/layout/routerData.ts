import ai from "./images/icon/ai.png";
import audio from "./images/icon/audio.png";
import numberman from "./images/icon/numberman.png";
import doctor from "./images/icon/doctor.png";
import resort from "./images/icon/resort.png";
import copyright from "./images/icon/copyright.png";
import weChatIcon from "./images/icon/weChat-icon.png";
import firmWXIcon from "./images/icon/firmWX-icon.png";
import dealPlatformIcon from "./images/icon/dealPlatform-icon.png";
import platformIcon from "./images/icon/platform-icon.png";
import { StaticImageData } from "next/image";
import { MenuItemType } from "antd/es/menu/interface";

export interface IRouterDataItem {
  // 导航标题
  name: string;

  // 跳转链接
  path?: string;
  // icon
  icon?: StaticImageData;
  // 导航背景颜色
  backColor?: string;
  // 子导航
  children?: IRouterDataItem[];
}

export const routerData: IRouterDataItem[] = [
  {
    name: "首页",
    path: "/",
  },
  {
    name: "Chat",
    path: "/chat",
  },
  {
    name: "AI+",
    path: "/pages/aiPlus",
    children: [
      {
        name: "数字人",
        icon: numberman,
        backColor: "linear-gradient(#FEF7EF, #FAF0E3)",
        children: [
          {
            name: "2D写实",
            children: [
              {
                name: "小艺数字人",
                path: "/pages/aiPlus/xiaoice?type=2",
              },
              // {
              //   name: "医疗数字人",
              //   path: "/pages/aiPlus/numberman?type=1",
              // },
              // {
              //   name: "古装数字人",
              //   path: "/pages/aiPlus/numberman?type=0",
              // },
            ],
          },
          {
            name: "2D卡通数字人",
            children: [
              {
                name: "邮小游",
                path: "/pages/aiPlus/live2dPersonPage?id=0",
              },
              {
                name: "天安门东东",
                path: "/pages/aiPlus/live2dPersonPage?id=1",
              },
            ],
          },
        ],
      },
      {
        name: "声音",
        backColor: "linear-gradient(#F4FCFF, #EAF6FB)",
        icon: audio,
        children: [
          {
            name: "艺秒数字人播报",
            path: "https://bobao.yikart.cn/",
          },
          {
            name: "声音定制",
            path: "/pages/aiPlus/audioCustom",
          },
          {
            name: "打电话",
            path: "/pages/aiPlus/ringUp",
          },
        ],
      },
      {
        name: "医疗",
        backColor: "linear-gradient(#F5F5FF, #F5F5FF)",
        icon: doctor,
        children: [
          {
            name: "医咖APP",
            path: "/pages/aiPlus/prodDisplay/aiHealth",
          },
          {
            name: "医疗图像分析",
            path: "/chat/#/new-chat?mask=100004",
          },
        ],
      },
      {
        name: "文旅",
        backColor: "linear-gradient(#FEF7EF, #FAF0E3)",
        icon: resort,
        children: [
          {
            name: "艺咖小行星",
            path: "/pages/aiPlus/prodDisplay/asteroid",
          },
          {
            name: "艺咖AI文创服务",
            path: "/pages/aiPlus/prodDisplay/culture",
          },
          {
            name: "北京旅行导游",
            path: "/pages/aiPlus/prodDisplay/guide",
          },
        ],
      },
      {
        name: "AIGC",
        backColor: "linear-gradient(#F5F5FF, #F5F5FF)",
        icon: ai,
        children: [
          {
            name: "智能绘画",
            path: "/pages/aiPlus/aiDrawing",
          },
          {
            name: "视频生成",
            path: "/pages/aiPlus/aiVideo",
          },
          {
            name: "音乐生成",
            path: "/pages/aiPlus/aiAudio",
          },
          {
            name: "AI换装",
            path: "/pages/aiPlus/reloading",
          },
          {
            name: "图像编辑",
            path: "/pages/aiPlus/doodle",
          },
        ],
      },
    ],
  },
  {
    name: "其它",
    path: "/pages/other",
    children: [
      {
        name: "微信",
        backColor: "linear-gradient(#F4FFF9, #EAFBF0)",
        icon: weChatIcon,
        path: "/pages/other/wx",
      },
      {
        name: "企业微信",
        backColor: "linear-gradient(#F4FCFF, #EAF6FB)",
        icon: firmWXIcon,
        path: "/pages/other/firmWX",
      },
      {
        name: "数字资产交易流通平台",
        backColor: "linear-gradient(#F5F5FF, #F5F5FF)",
        icon: dealPlatformIcon,
        path: "/pages/other/dealPlatform",
      },
      // {
      //   name: "元宇宙",
      //   icon: metaverse,
      //   backColor: "linear-gradient(#FEF7EF, #FAF0E3)",
      //   children: [
      //     {
      //       name: "星元数元宇宙",
      //       path: "/pages/other/metaverse",
      //     },
      //     {
      //       name: "乡村振兴元宇宙",
      //       path: "https://o2vr.net/upload/3D_editor/o2preview/#/?id=2668&secret=MjY2OA==",
      //     },
      //   ],
      // },
      {
        name: "数字资产平台",
        icon: platformIcon,
        backColor: "linear-gradient(#F5F5FF, #F5F5FF)",
        children: [
          // {
          //   name: "元荷APP",
          //   path: "/pages/other/yuanhe",
          // },
          {
            name: "华文数交",
            path: "https://luanshu.hbcpre.com/",
          },
        ],
      },
      {
        name: "艺咖APP",
        backColor: "linear-gradient(#F4FCFF, #EAF6FB)",
        icon: copyright,
        path: "/pages/other/copyright",
      },
    ],
  },
  {
    name: "关于我们",
    path: "/pages/about",
  },
  {
    name: "艺咖动态",
    path: "/pages/dynamic",
  },
  {
    name: "个人中心",
    path: "/pages/member",
  },
];

const recursion = (
  child: IRouterDataItem[] | undefined,
): MenuItemType[] | null => {
  if (!child) return null;
  return child.map((v) => {
    return {
      label: v.name,
      key: v.path || v.name,
      children: recursion(v.children),
    };
  });
};

export const peRouterData = recursion(routerData);
