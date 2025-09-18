import { ForwardedRef, forwardRef, memo, useEffect, useMemo } from "react";
import styles from "./hotContentSidebar.module.scss";
import React from "react";
import Icon from "@ant-design/icons";
import { Menu } from "antd";
import type { GetProp, MenuProps } from "antd";
import HotContentSvg from "../../svgs/hotContent.svg";
import HotEventSvg from "../../svgs/hotEvent.svg";
import HotFeaturesSvg from "../../svgs/hotFeatures.svg";
import HotTitleSvg from "../../svgs/hotTitle.svg";
import { HotType } from "@/app/[lng]/hotContent/hotContent.enum";
import { useShallow } from "zustand/react/shallow";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";

type MenuItem = GetProp<MenuProps, "items">[number];

export interface IHotContentSidebarRef {}

export interface IHotContentSidebarProps {}

const yikaOss = process.env.NEXT_PUBLIC_YIKA_OSS_HOST;

const HotContentSidebar = memo(
  forwardRef(
    ({}: IHotContentSidebarProps, ref: ForwardedRef<IHotContentSidebarRef>) => {
      const {
        setHotType,
        hotType,
        hotContentPlatformList,
        twoMenuKey,
        setTwoMenuKey,
        init,
        hotTitlePlatformList,
        changeHotContentPlatform,
      } = useHotContent(
        useShallow((state) => ({
          setHotType: state.setHotType,
          hotType: state.hotType,
          hotContentPlatformList: state.hotContentPlatformList,
          setTwoMenuKey: state.setTwoMenuKey,
          twoMenuKey: state.twoMenuKey,
          init: state.init,
          hotTitlePlatformList: state.hotTitlePlatformList,
          changeHotContentPlatform: state.changeHotContentPlatform,
        })),
      );

      const items = useMemo(() => {
        const items: MenuItem[] = [
          {
            key: HotType.hotContent,
            icon: <Icon component={HotContentSvg} />,
            label: <b>热门内容</b>,
            children: hotContentPlatformList.map((platform) => ({
              key: `${HotType.hotContent}_${platform.id}`,
              label: platform.name,
              icon: (
                <img
                  src={`${yikaOss}/${platform.icon}`}
                  style={{ width: "18px" }}
                />
              ),
            })),
          },
          {
            key: HotType.hotEvent,
            icon: <Icon component={HotEventSvg} />,
            label: <b>热点事件</b>,
          },
          {
            key: HotType.hotFeatures,
            icon: <Icon component={HotFeaturesSvg} />,
            label: <b>热门专题</b>,
            children: [
              {
                key: "AIGC",
                label: "AIGC",
              },
              {
                key: "短剧",
                label: "短剧",
              },
              {
                key: "文旅",
                label: "文旅",
              },
              {
                key: "内容出海",
                label: "内容出海",
              },
            ],
          },
          {
            key: HotType.hotTitle,
            icon: <Icon component={HotTitleSvg} />,
            label: <b>爆款标题</b>,
            children: hotTitlePlatformList.map((platform) => ({
              key: `${HotType.hotTitle}_${platform.id}`,
              label: platform.name,
              icon: (
                <img
                  src={`${yikaOss}/${platform.icon}`}
                  style={{ width: "18px" }}
                />
              ),
            })),
          },
        ];
        return items;
      }, [hotContentPlatformList, hotTitlePlatformList]);

      useEffect(() => {
        init();
      }, [init]);

      return (
        <div className={styles.hotContentSidebar}>
          <Menu
            style={{ width: 180 }}
            defaultSelectedKeys={[hotType]}
            defaultOpenKeys={[
              HotType.hotContent,
              HotType.hotEvent,
              HotType.hotFeatures,
              HotType.hotTitle,
            ]}
            selectedKeys={twoMenuKey ? [twoMenuKey, hotType] : [hotType]}
            onClick={(e) => {
              const hotType = e["keyPath"][e["keyPath"].length - 1] as HotType;
              // 热门内容分类设置
              setHotType(hotType);

              switch (hotType) {
                case HotType.hotContent:
                  changeHotContentPlatform(e.key);
                  break;
                case HotType.hotTitle:
                  changeHotContentPlatform(e.key);
                  break;
              }

              if (e.keyPath.length === 2) {
                // 侧边栏二级菜单选择
                setTwoMenuKey(e.key);
              } else {
                setTwoMenuKey("");
              }
            }}
            items={items}
            mode="inline"
            inlineIndent={10}
          />
        </div>
      );
    },
  ),
);

export default HotContentSidebar;
