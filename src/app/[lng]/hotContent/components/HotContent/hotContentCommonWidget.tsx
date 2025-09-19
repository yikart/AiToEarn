import styles from "@/app/[lng]/hotContent/components/HotContent/hotContent.module.scss";
import Icon from "@ant-design/icons";
import Uparrow from "@/app/[lng]/hotContent/svgs/uparrow.svg";
import { describeNumber } from "@/utils";
import { Avatar } from "antd";
import { useTransClient } from "@/app/i18n/client";

export const AnaAddCall = ({
  add,
  total,
  highlight = false,
}: {
  add: number;
  total: number;
  highlight?: boolean;
}) => {
  const { t } = useTransClient("hot-content");
  return (
    <div
      className={`${styles.anaAddCall} ${highlight ? styles["anaAddCall-highlight"] : ""}`}
    >
      <div className="anaAddCall-add">
        {add ? (
          <>
            <Icon component={Uparrow} />
            {describeNumber(add)}
          </>
        ) : (
          "-"
        )}
      </div>
      <div className="anaAddCall-total">
        {t("total")}
        {describeNumber(total)}
      </div>
    </div>
  );
};

export const SingleNumberCall = ({
  total,
  highlight = false,
}: {
  total: number;
  highlight?: boolean;
}) => {
  return (
    <p
      style={{
        textAlign: "center",
        fontSize: "var(--fs-md)",
        color: highlight ? "var(--colorPrimary5)" : "#3d4242",
        fontFamily: "DIN",
        fontWeight: 100,
      }}
    >
      {describeNumber(total)}
    </p>
  );
};

export const HotContentBaseInfo = ({
  cover,
  title,
  avatar,
  nickname,
  fansCount,
  publishTime,
  onClick,
}: {
  cover: string;
  title: string;
  avatar: string;
  nickname: string;
  fansCount?: number;
  publishTime: string;
  onClick?: () => void;
}) => {
  const { t } = useTransClient("hot-content");
  return (
    <div className={styles.baseInfo}>
      <img className="baseInfo-cover" src={cover} />
      <div className="baseInfo-right">
        {title ? (
          <div className="baseInfo-right-title" title={title}>
            {title}
          </div>
        ) : (
          <div className="baseInfo-right-noTitle">{t("noTitle")}</div>
        )}

        <div
          className="baseInfo-right-author"
          onClick={() => {
            if (onClick) onClick();
          }}
        >
          <Avatar
            className="baseInfo-right-author-avatar"
            src={avatar}
            size="small"
          />
          <p className="baseInfo-right-author-name">{nickname}</p>
          {fansCount && (
            <p className="baseInfo-right-author-fans">
              {t("fans")} {describeNumber(fansCount)}
            </p>
          )}
          <p className="baseInfo-right-author-pubTime">
            {t("publishTime")}
            {publishTime}
          </p>
        </div>
      </div>
    </div>
  );
};
