import {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Dropdown, Image, Popover, Tag } from "antd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import {
  PublishRecordItem,
  PublishStatus,
} from "@/api/plat/types/publish.types";
import styles from "./recordCore.module.scss";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  FullscreenOutlined,
  LikeOutlined,
  LoadingOutlined,
  MessageOutlined,
  MoreOutlined,
  SendOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import AvatarPlat from "@/components/AvatarPlat";
import { useAccountStore } from "@/store/account";
import type { MenuProps } from "antd";
import { TooltipRef } from "antd/lib/tooltip";
import { deletePublishRecordApi, nowPubTaskApi } from "@/api/plat/publish";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { getOssUrl } from "@/utils/oss";
import { useTransClient } from "@/app/i18n/client";
import ScrollButtonContainer from "@/components/ScrollButtonContainer";

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem;
}

const PubStatus = ({ status }: { status: PublishStatus }) => {
  const { t } = useTransClient("publish");

  return (
    <div className={styles.pubStatus}>
      {status === PublishStatus.FAIL ? (
        <Tag color="error">
          {t("status.publishFailed")}
          <CloseCircleOutlined />
        </Tag>
      ) : status === PublishStatus.PUB_LOADING ? (
        <Tag color="cyan">
          {t("status.publishing")}
          <LoadingOutlined />
        </Tag>
      ) : status === PublishStatus.RELEASED ? (
        <Tag color="success">
          {t("status.publishSuccess")}
          <CheckCircleOutlined />
        </Tag>
      ) : status === PublishStatus.UNPUBLISH ? (
        <Tag color="processing">
          {t("status.waitingPublish")}
          <ClockCircleOutlined />
        </Tag>
      ) : (
        <></>
      )}
    </div>
  );
};

const RecordCore = memo(
  forwardRef(
    (
      { publishRecord }: IRecordCoreProps,
      ref: ForwardedRef<IRecordCoreRef>,
    ) => {
      const { calendarCallWidth, setListLoading, getPubRecord } =
        useCalendarTiming(
          useShallow((state) => ({
            calendarCallWidth: state.calendarCallWidth,
            setListLoading: state.setListLoading,
            getPubRecord: state.getPubRecord,
          })),
        );
      const { accountAccountMap } = useAccountStore(
        useShallow((state) => ({
          accountAccountMap: state.accountAccountMap,
        })),
      );
      const [popoverOpen, setPopoverOpen] = useState(false);
      const popoverRef = useRef<TooltipRef>(null);
      const { t } = useTransClient("publish");
      const [nowPubLoading, setNowPubLoading] = useState(false);

      const dropdownItems: MenuProps["items"] = useMemo(() => {
        if (publishRecord.workLink) {
          return [
            {
              key: "2",
              label: t("buttons.copyLink"),
              onClick: async () => {
                await navigator.clipboard.writeText(
                  publishRecord?.workLink ?? "",
                );
              },
            },
          ];
        }

        if (publishRecord.status === PublishStatus.UNPUBLISH) {
          return [
            {
              key: "3",
              danger: true,
              label: t("buttons.delete"),
              onClick: async () => {
                setPopoverOpen(false);
                setListLoading(true);
                await deletePublishRecordApi(publishRecord.id);
                getPubRecord();
              },
            },
          ];
        }
      }, [publishRecord]);

      const days = useMemo(() => {
        return getDays(publishRecord.publishTime);
      }, [publishRecord]);

      const account = useMemo(() => {
        return accountAccountMap.get(publishRecord?.accountId ?? "");
      }, [accountAccountMap, publishRecord.accountId]);

      const platIcon = useMemo(() => {
        return AccountPlatInfoMap.get(
          publishRecord?.accountType ?? PlatType.Xhs,
        )?.icon;
      }, [publishRecord]);

      const recordInfo = useMemo(() => {
        return [
          {
            label: t("record.metrics.views"),
            icon: <EyeOutlined />,
            key: "viewCount",
          },
          {
            label: t("record.metrics.comments"),
            icon: <MessageOutlined />,
            key: "commentCount",
          },
          {
            label: t("record.metrics.likes"),
            icon: <LikeOutlined />,
            key: "likeCount",
          },
          {
            label: t("record.metrics.shares"),
            icon: <ShareAltOutlined />,
            key: "shareCount",
          },
        ];
      }, [t]);

      return (
        <Popover
          ref={popoverRef}
          placement="right"
          rootClassName={styles.recordPopover}
          open={popoverOpen}
          onOpenChange={(e) => setPopoverOpen(e)}
          content={
            <div className={styles.recordDetails}>
              <div className="recordDetails-top">
                <div className="recordDetails-top-left">
                  {days.format("YYYY-MM-DD HH:mm")}
                  <FieldTimeOutlined />
                </div>
                <Button icon={<FullscreenOutlined />} size="small" />
              </div>
              <div className="recordDetails-center">
                <div className="recordDetails-center-left">
                  <div className="recordDetails-center-left-user">
                    <AvatarPlat account={account} size="large" />
                    <span className="recordDetails-center-title">
                      {account?.nickname}
                    </span>
                  </div>
                  <div
                    title={publishRecord.desc}
                    className="recordDetails-center-left-desc"
                  >
                    {publishRecord.desc}
                  </div>
                  <div className="recordDetails-center-left-status">
                    {publishRecord.status && (
                      <PubStatus status={publishRecord.status} />
                    )}
                  </div>
                  <div
                    title={publishRecord.errorMsg}
                    className="recordDetails-center-left-failMsg"
                  >
                    {publishRecord.errorMsg}
                  </div>
                </div>
                <div className="recordDetails-center-right">
                  {publishRecord.videoUrl ? (
                    <>
                      <Image
                        src={getOssUrl(publishRecord.coverUrl || "")}
                        preview={{
                          destroyOnHidden: true,
                          imageRender: () => (
                            <video
                              muted
                              width="80%"
                              height={500}
                              controls
                              src={publishRecord.videoUrl}
                            />
                          ),
                          toolbarRender: () => null,
                        }}
                      />
                    </>
                  ) : (
                    <Image.PreviewGroup items={publishRecord.imgUrlList}>
                      <Image src={getOssUrl(publishRecord.coverUrl || "")} />
                    </Image.PreviewGroup>
                  )}
                </div>
              </div>
              <ScrollButtonContainer>
                <div className="recordDetails-info">
                  {recordInfo.map((v) => (
                    <div key={v.label} className="recordDetails-info-item">
                      <div className="recordDetails-info-item-top">
                        {v.icon}
                        <span>{v.label}</span>
                      </div>
                      {publishRecord.engagement && (
                        <div className="recordDetails-info-item-num">
                          {publishRecord.engagement[v.key as "viewCount"] ?? 0}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollButtonContainer>
              <div className="recordDetails-bottom">
                {publishRecord.workLink && (
                  <Button
                    icon={<ExportOutlined />}
                    onClick={() => {
                      window.open(publishRecord.workLink, "_blank");
                    }}
                  >
                    {t("record.viewWork")}
                  </Button>
                )}

                {publishRecord.status !== PublishStatus.RELEASED && (
                  <Button
                    loading={nowPubLoading}
                    icon={<SendOutlined />}
                    onClick={async () => {
                      setNowPubLoading(true);
                      await nowPubTaskApi(publishRecord.id);
                      getPubRecord();
                      setNowPubLoading(false);
                    }}
                  >
                    {t("buttons.publishNow")}
                  </Button>
                )}
                {dropdownItems && dropdownItems.length > 0 && (
                  <Dropdown menu={{ items: dropdownItems }} placement="top">
                    <Button icon={<MoreOutlined />} />
                  </Dropdown>
                )}
              </div>
            </div>
          }
          trigger="click"
        >
          <Button
            className={styles.recordCore}
            style={{ width: calendarCallWidth + "px" }}
          >
            <div className="recordCore-left">
              <img src={platIcon} style={{ width: "25px", height: "25px" }} />
              <div className="recordCore-left-date">{days.format("HH:mm")}</div>
            </div>
            <div className="recordCore-right">
              <img src={getOssUrl(publishRecord.coverUrl || "")} />
            </div>
          </Button>
        </Popover>
      );
    },
  ),
);

export default RecordCore;
