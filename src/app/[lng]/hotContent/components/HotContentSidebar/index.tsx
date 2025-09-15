import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./hotContentSidebar.module.scss";
import React from "react";
import Icon from "@ant-design/icons";
import { Menu } from "antd";
import type { GetProp, MenuProps } from "antd";
import HotContentSvg from "../../svgs/hotContent.svg";
import HotEventSvg from "../../svgs/hotEvent.svg";
import HotFeaturesSvg from "../../svgs/hotFeatures.svg";
import HotTitleSvg from "../../svgs/hotTitle.svg";

type MenuItem = GetProp<MenuProps, "items">[number];

export interface IHotContentSidebarRef {}

export interface IHotContentSidebarProps {}

const HotContentSidebar = memo(
  forwardRef(
    ({}: IHotContentSidebarProps, ref: ForwardedRef<IHotContentSidebarRef>) => {
      const items = useMemo(() => {
        const items: MenuItem[] = [
          {
            key: "1",
            icon: <Icon component={HotContentSvg} />,
            label: "热门内容",
          },
          {
            key: "2",
            icon: <Icon component={HotEventSvg} />,
            label: "热点事件",
          },
          {
            key: "3",
            icon: <Icon component={HotFeaturesSvg} />,
            label: "热门专题",
          },
          {
            key: "4",
            icon: <Icon component={HotTitleSvg} />,
            label: "爆款标题",
          },
        ];
        return items;
      }, []);

      console.log(HotContentSvg);

      return (
        <div className={styles.hotContentSidebar}>
          <Menu
            style={{ width: 256 }}
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            items={items}
            mode="inline"
          />
        </div>
      );
    },
  ),
);

export default HotContentSidebar;
