import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./avatarPlat.module.scss";
import { AvatarSize } from "antd/es/avatar/AvatarContext";
import { SocialAccount } from "@/api/types/account.type";
import { Avatar } from "antd";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { OSS_DOMAIN } from "@/utils/oss";

export interface IAvatarPlatRef {}

export interface IAvatarPlatProps {
  account: SocialAccount;
  size?: AvatarSize;
  className?: string;
  width?: number;
  avatarWidth?: number;
}

const getAvatar = (url: string) => {
  if (url.includes("https://")) {
    return url;
  } else {
    return `${OSS_DOMAIN}/` + url;
  }
};

const AvatarPlat = memo(
  forwardRef(
    (
      {
        account,
        size = "default",
        className,
        width,
        avatarWidth,
      }: IAvatarPlatProps,
      ref: ForwardedRef<IAvatarPlatRef>,
    ) => {
      const plat = AccountPlatInfoMap.get(account.type)!;
      return (
        <>
          <div className={`${styles.avatarPlat} ${className}`}>
            <Avatar
              src={getAvatar(account.avatar)}
              size={avatarWidth ? avatarWidth : size}
            />
            <img
              src={plat?.icon}
              style={
                !width
                  ? {
                      width:
                        size === "large" ? 16 : size === "default" ? 12.5 : 10,
                    }
                  : {
                      width,
                    }
              }
            />
          </div>
        </>
      );
    },
  ),
);

export default AvatarPlat;
