import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./avatarPlat.module.scss";
import { AvatarSize } from "antd/es/avatar/AvatarContext";
import { SocialAccount } from "@/api/types/account.type";
import { Avatar } from "antd";
import { AccountPlatInfoMap } from "@/app/config/platConfig";

export interface IAvatarPlatRef {}

export interface IAvatarPlatProps {
  account: SocialAccount;
  size?: AvatarSize;
}

const AvatarPlat = memo(
  forwardRef(
    (
      { account, size = "default" }: IAvatarPlatProps,
      ref: ForwardedRef<IAvatarPlatRef>,
    ) => {
      const plat = AccountPlatInfoMap.get(account.type)!;
      return (
        <>
          <div className={styles.avatarPlat}>
            <Avatar src={account.avatar} size={size} />
            <img
              src={plat.icon}
              style={{
                width: size === "large" ? 15 : size === "default" ? 12.5 : 10,
              }}
            />
          </div>
        </>
      );
    },
  ),
);

export default AvatarPlat;
