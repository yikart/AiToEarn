import { memo } from "react";
import { Button, Tag } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  SendOutlined,
  EditOutlined,
  MoreOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { PublishRecordItem, PublishStatus } from "@/api/plat/types/publish.types";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { getOssUrl } from "@/utils/oss";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { useTransClient } from "@/app/i18n/client";
import styles from "./queueItem.module.scss";

interface QueueItemProps {
  record: PublishRecordItem;
  onRetry?: (record: PublishRecordItem) => void;
  onEdit?: (record: PublishRecordItem) => void;
  onMore?: (record: PublishRecordItem) => void;
}

const QueueItem = memo(({ record, onRetry, onEdit, onMore }: QueueItemProps) => {
  const { t } = useTransClient("publish");
  const { accountMap } = useAccountStore(
    useShallow((state) => ({
      accountMap: state.accountMap,
    })),
  );

  const account = accountMap.get(record.accountId);
  const platInfo = AccountPlatInfoMap.get(record.accountType);
  const days = getDays(record.publishTime);

  const getStatusInfo = () => {
    switch (record.status) {
      case PublishStatus.FAIL:
        return {
          color: "error",
          text: t("status.publishFailed"),
          icon: <CloseCircleOutlined />
        };
      case PublishStatus.PUB_LOADING:
        return {
          color: "cyan",
          text: t("status.publishing"),
          icon: <LoadingOutlined />
        };
      case PublishStatus.RELEASED:
        return {
          color: "success",
          text: t("status.publishSuccess"),
          icon: <CheckCircleOutlined />
        };
      case PublishStatus.UNPUBLISH:
        return {
          color: "processing",
          text: t("status.waitingPublish"),
          icon: <ClockCircleOutlined />
        };
      default:
        return {
          color: "default",
          text: "未知状态",
          icon: null
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={styles.queueItem}>
      {/* 状态头部 */}
      <div className={styles.statusHeader}>
        <div className={styles.statusInfo}>
          <span className={styles.statusText}>{statusInfo.text}</span>
          <div className={styles.dateTime}>
            <span className={styles.date}>{days.format("MMM DD")}</span>
            <span className={styles.time}>{days.format("h:mm A")}</span>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        </div>
        <div className={styles.commentIcon}>
          <MessageOutlined />
        </div>
      </div>

      {/* 错误信息横幅 */}
      {record.status === PublishStatus.FAIL && record.errorMsg && (
        <div className={styles.errorBanner}>
          <div className={styles.errorIcon}>
            <CloseCircleOutlined />
          </div>
          <div className={styles.errorMessage}>
            {record.errorMsg}
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className={styles.contentArea}>
        {/* 账户信息 */}
        <div className={styles.accountInfo}>
          <div className={styles.avatarContainer}>
            <img 
              src={getOssUrl(account?.avatar || "")} 
              alt="avatar" 
              className={styles.avatar}
            />
            <div className={styles.platformIcon}>
              <img 
                src={platInfo?.icon} 
                alt="platform" 
                className={styles.platIcon}
              />
            </div>
          </div>
          <div className={styles.accountDetails}>
            <div className={styles.accountName}>{account?.nickname}</div>
            <div className={styles.accountHandle}>@{account?.account}</div>
          </div>
        </div>

        {/* 发布内容 */}
        <div className={styles.postContent}>
          <div className={styles.postText}>{record.desc}</div>
          
          {/* 媒体内容 */}
          {(record.coverUrl || record.imgUrlList?.length > 0) && (
            <div className={styles.mediaContainer}>
              {record.videoUrl ? (
                <div className={styles.videoThumbnail}>
                  <img 
                    src={getOssUrl(record.coverUrl || "")} 
                    alt="video thumbnail"
                    className={styles.mediaImage}
                  />
                  <div className={styles.playButton}>
                    <div className={styles.playIcon}>▶</div>
                  </div>
                </div>
              ) : (
                <div className={styles.imageContainer}>
                  <img 
                    src={getOssUrl(record.coverUrl || record.imgUrlList?.[0] || "")} 
                    alt="post image"
                    className={styles.mediaImage}
                  />
                </div>
              )}
            </div>
          )}

          {/* 分享图标 */}
          <div className={styles.shareIcon}>
            <div className={styles.shareSymbol}>↗</div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className={styles.footer}>
        <div className={styles.creationInfo}>
          您于 {days.format("YYYY年MM月DD日")} 创建了此内容
        </div>
        <div className={styles.actionButtons}>
          {record.status === PublishStatus.FAIL && (
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => onRetry?.(record)}
              className={styles.retryButton}
            >
              {t("buttons.publishNow")}
            </Button>
          )}
          <Button 
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
            className={styles.editButton}
          />
          <Button 
            icon={<MoreOutlined />}
            onClick={() => onMore?.(record)}
            className={styles.moreButton}
          />
        </div>
      </div>
    </div>
  );
});

QueueItem.displayName = "QueueItem";

export default QueueItem;
