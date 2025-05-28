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
    name: "账户",
    path: "/accounts",
  },
  {
    name: "发布",
    path: "/publish",
  },
  {
    name: "热门内容",
    path: "/hot-content",
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
