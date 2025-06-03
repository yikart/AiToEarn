"use client";

import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { Segmented } from "antd";
import {
  VideoCameraOutlined,
  FileImageOutlined,
  ContainerOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";

export interface IPublishSidebarRef {}

export interface IPublishSidebarProps {}

const PublishSidebar = memo(
  forwardRef(
    ({}: IPublishSidebarProps, ref: ForwardedRef<IPublishSidebarRef>) => {
      const pathname = usePathname();
      const router = useRouter();

      const currChooseRoute = useMemo(() => {
        return pathname.split("/publish/")[1];
      }, [pathname]);

      return (
        <Segmented
          value={currChooseRoute}
          vertical
          size="large"
          options={[
            {
              label: "视频发布",
              value: "imagePage",
              icon: <VideoCameraOutlined />,
            },
            // { label: '文章发布', value: '/publish/text', icon: <FileOutlined /> },
            {
              label: "图片发布",
              value: "imagePage",
              icon: <FileImageOutlined />,
            },
            {
              label: "发布记录",
              value: "pubRecord",
              icon: <ContainerOutlined />,
            },
          ]}
          onChange={(value) => {
            router.push(value);
          }}
        />
      );
    },
  ),
);

export default PublishSidebar;
