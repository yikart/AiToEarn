import { memo } from "react";
import { Avatar, Button, Tag } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  SendOutlined,
  MessageOutlined,
  UserOutlined
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
  const { accountMap, accountActive } = useAccountStore(
    useShallow((state) => ({
      accountMap: state.accountMap,
      accountActive: state.accountActive,
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
          text: t("status.unknown"),
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
         
          <div className={styles.dateTime}>
            <span className={styles.date}>{days.format("MMM DD")}</span>
            <span className={styles.time}>{days.format("h:mm A")}</span>
          </div>
          <span className={styles.statusText}>{statusInfo.text}</span>
        </div>
        {/* <div className={styles.statusBadge}>
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        </div> */}
        <div className={styles.commentIcon}>
          {/* <MessageOutlined /> */}
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

        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '12px'}}>

                   {/* 账户信息 */}

                   <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}> 

                   <div className={styles.accountInfo}>
          <div className={styles.avatarContainer}>

          <Avatar
              size={40}
              src={getOssUrl(accountActive?.avatar || "")}
              className={styles.avatar}
            >
              {accountActive?.nickname?.charAt(0) || accountActive?.account?.charAt(0)}
            </Avatar>

            {/* <Avatar
              src={getOssUrl(account?.avatar || "")}
              icon={!account?.avatar ? <UserOutlined /> : undefined}
              className={styles.avatar}
            /> */}
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

                   <div className={styles.postText}>{record.desc}</div>
                   </div>
    

              {/* 发布内容 */}
              <div className={styles.postContent}>
         
          
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

        </div>

        </div>
     

  
      </div>

      {/* 底部信息 */}
      <div className={styles.footer}>
        <div className={styles.creationInfo}>
          {t("creationInfo", { date: days.format("YYYY-MM-DD") })}
        </div>
        <div className={styles.actionButtons}>
          {record.status === PublishStatus.UNPUBLISH && (
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => onRetry?.(record)}
              className={styles.retryButton}
            >
              {t("buttons.publishNow")}
            </Button>
          )}
          {record.workLink && (
            <Button 
              icon={<SendOutlined />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(record.workLink);
                  // 可以添加一个提示消息
                } catch (err) {
                  console.error('复制链接失败:', err);
                }
              }}
              className={styles.copyButton}
            >
              {t("buttons.copyLink")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

QueueItem.displayName = "QueueItem";

export default QueueItem;
