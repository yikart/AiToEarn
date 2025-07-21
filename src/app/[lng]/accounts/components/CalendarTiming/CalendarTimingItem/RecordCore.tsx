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
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  MoreOutlined,
  SendOutlined,
} from "@ant-design/icons";
import AvatarPlat from "@/components/AvatarPlat";
import { useAccountStore } from "@/store/account";
import type { MenuProps } from "antd";
import { TooltipRef } from "antd/lib/tooltip";
import { deletePublishRecordApi, nowPubTaskApi } from "@/api/plat/publish";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { getOssUrl } from "@/utils/oss";



export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem;
}

const PubStatus = ({ status }: { status: PublishStatus }) => {
  return (
    <div className={styles.pubStatus}>
      {status === PublishStatus.FAIL ? (
        <Tag color="error">
          发布失败
          <CloseCircleOutlined />
        </Tag>
      ) : status === PublishStatus.PUB_LOADING ? (
        <Tag color="cyan">
          发布中
          <LoadingOutlined />
        </Tag>
      ) : status === PublishStatus.RELEASED ? (
        <Tag color="success">
          发布成功
          <CheckCircleOutlined />
        </Tag>
      ) : status === PublishStatus.UNPUBLISH ? (
        <Tag color="processing">
          等待发布
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
      const dropdownItems: MenuProps["items"] = [
        {
          key: "2",
          label: "复制链接",
          onClick: async () => {
            await navigator.clipboard.writeText(publishRecord.workLink);
          },
        },
        {
          key: "3",
          danger: true,
          label: "删除",
          onClick: async () => {
            setPopoverOpen(false);
            setListLoading(true);
            await deletePublishRecordApi(publishRecord.id);
            getPubRecord();
          },
        },
      ];

      const days = useMemo(() => {
        return getDays(publishRecord.publishTime);
      }, [publishRecord]);

      const account = useMemo(() => {
        return accountAccountMap.get(publishRecord.accountId)!;
      }, [accountAccountMap, publishRecord.accountId]);

      const platIcon = useMemo(() => {
        return AccountPlatInfoMap.get(publishRecord.accountType)?.icon;
      }, [publishRecord]);

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
                  {days.format("YYYY-MM-DD HH:MM")}
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
                  <div className="recordDetails-center-left-status">
                    <PubStatus status={publishRecord.status} />
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
              <div className="recordDetails-bottom">
                <Button
                  icon={<SendOutlined />}
                  onClick={async () => {
                    await nowPubTaskApi(publishRecord.id);
                    getPubRecord();
                  }}
                >
                  立即发布
                </Button>
                <Dropdown menu={{ items: dropdownItems }} placement="top">
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
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
              <img src={platIcon}  style={{width: '25px', height: '25px'}}/>
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
