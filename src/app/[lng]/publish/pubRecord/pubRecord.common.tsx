// 图片视图组件
import { useEffect, useMemo, useState } from "react";
import styles from "./pubRecord.module.scss";
import { PubStatus, AccountType } from "@/api/publish";
import { Image, Tag, Avatar, Space, Typography } from "antd";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubRecordModel } from "@/app/[lng]/publish/pubRecord/page";

const { Text, Title } = Typography;

export const ImageView = ({
  prm,
  width,
  height,
}: {
  prm: PubRecordModel;
  width: number | string;
  height: number | string;
}) => {
  const [imgUrl, setImgUrl] = useState("");

  useEffect(() => {
    // 优先使用 coverUrl，如果没有则使用 coverPath
    const coverUrl = prm.coverUrl || prm.coverPath;
    if (coverUrl) {
      if (coverUrl.includes("https://") || coverUrl.includes("http://")) {
        setImgUrl(coverUrl);
      } else {
        // 如果是本地路径，可以转换为 URL
        setImgUrl(coverUrl);
      }
    }
  }, [prm.coverUrl, prm.coverPath]);

  const filename = useMemo(() => {
    const videoUrl = prm.videoUrl || prm.videoPath;
    if (videoUrl) {
      return videoUrl.split("/").pop() || "未知文件";
    }
    return "未知文件";
  }, [prm.videoUrl, prm.videoPath]);

  return (
    <div
      className={styles["pubRecord-pubCon"]}
      style={{ minHeight: height + "px" }}
    >
      {imgUrl ? (
        <Image src={imgUrl} height={height} width={width} />
      ) : (
        <div
          style={{
            width,
            height,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>无封面</span>
        </div>
      )}
      <span title={filename} className="pubRecord-pubCon-name">
        {filename}
      </span>
    </div>
  );
};

// 平台展示组件
export const PlatformView = ({ accountType }: { accountType: AccountType }) => {
  const platInfo = AccountPlatInfoMap.get(accountType as unknown as PlatType);

  if (!platInfo) {
    return <Tag color="default">未知平台</Tag>;
  }

  return (
    <Space>
      <Avatar size="small" src={platInfo.icon} />
      <Text>{platInfo.name}</Text>
    </Space>
  );
};

// 发布状态标签组件
export const PubRecordStatusTag = ({ status }: { status: PubStatus }) => {
  switch (status) {
    case PubStatus.FAIL:
      return <Tag color="error">发布失败</Tag>;
    case PubStatus.RELEASED:
      return <Tag color="success">发布成功</Tag>;
    case PubStatus.PartSuccess:
      return <Tag color="warning">部分发布成功</Tag>;
    case PubStatus.UNPUBLISH:
      return <Tag color="processing">未发布</Tag>;
    default:
      return <Tag color="default">未知状态</Tag>;
  }
};
