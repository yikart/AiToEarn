import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { Button, Dropdown, Image, Popover } from "antd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { useShallow } from "zustand/react/shallow";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import styles from "./recordCore.module.scss";
import dayjs from "dayjs";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import {
  FieldTimeOutlined,
  FullscreenOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import AvatarPlat from "@/components/AvatarPlat";
import { useAccountStore } from "@/store/account";
import type { MenuProps } from "antd";

export interface IRecordCoreRef {}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem;
}

const RecordCore = memo(
  forwardRef(
    (
      { publishRecord }: IRecordCoreProps,
      ref: ForwardedRef<IRecordCoreRef>,
    ) => {
      const { calendarCallWidth } = useCalendarTiming(
        useShallow((state) => ({
          calendarCallWidth: state.calendarCallWidth,
        })),
      );
      const { accountUidMap } = useAccountStore(
        useShallow((state) => ({
          accountUidMap: state.accountUidMap,
        })),
      );
      const dropdownItems: MenuProps["items"] = [
        {
          key: "2",
          label: "复制链接",
        },
        {
          key: "3",
          danger: true,
          label: "删除",
        },
      ];

      const days = useMemo(() => {
        return dayjs(publishRecord.publishTime);
      }, [publishRecord]);

      const account = useMemo(() => {
        return accountUidMap.get(publishRecord.flowId)!;
      }, [accountUidMap, publishRecord.flowId]);

      const platIcon = useMemo(() => {
        return AccountPlatInfoMap.get(publishRecord.accountType)?.icon;
      }, [publishRecord]);

      return (
        <Popover
          placement="right"
          rootClassName={styles.recordPopover}
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
                  <AvatarPlat account={account} size="large" />
                  <span className="recordDetails-center-title">
                    {account.nickname}
                  </span>
                </div>
                <div className="recordDetails-center-right">
                  <Image src={publishRecord.coverUrl} />
                </div>
              </div>
              <div className="recordDetails-bottom">
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
              <img src={platIcon} />
              <div className="recordCore-left-date">{days.format("HH:MM")}</div>
            </div>
            <div className="recordCore-right">
              <img src={publishRecord.coverUrl} />
            </div>
          </Button>
        </Popover>
      );
    },
  ),
);

export default RecordCore;
