import { StaticImageData } from "next/image";
import { MenuItemType } from "antd/es/menu/interface";

export interface IRouterDataItem {
  // 导航标题
  name: string;
  // 翻译键
  translationKey: string;
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
  // {
  //   name: "首页",
  //   translationKey: "home",
  //   path: "/",
  // },
  {
    name: "账户",
    translationKey: "accounts",
    path: "/accounts",
  },
  {
    name: "热门内容",
    translationKey: "hotContent",
    path: "/hotContent",
  },
  {
    name: "AI工具",
    translationKey: "aiTools",
    path: "/material/ai-generate",
  },
  {
    name: "任务中心",
    translationKey: "tasks",
    path: "/tasks",
  },
  {
    name: "数据统计",
    translationKey: "dataStatistics",
    path: "/dataStatistics",
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
