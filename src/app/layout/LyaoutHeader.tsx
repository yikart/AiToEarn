"use client";

import { ForwardedRef, forwardRef, memo, useRef, useState } from "react";
import styles from "./styles/lyaoutHeader.module.scss";
import { useUserStore } from "@/store/user";
import Link from "next/link";
import Image from "next/image";
import LayoutNav from "@/app/layout/layoutNav";
import { NoSSR } from "@kwooshung/react-no-ssr";
import { Button, Dropdown, MenuProps, Badge } from "antd";
import {
  BellOutlined,
  CaretDownOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";
import { useGetClientLng } from "@/hooks/useSystem";
import NotificationPanel from "@/components/notification/NotificationPanel";
import { useNotification } from "@/hooks/useNotification";
import SignInCalendar from "@/components/SignInCalendar";
import VipContentModal from "@/components/modals/VipContentModal";
import PointsDetailModal from "@/components/modals/PointsDetailModal";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

import logo from "@/assets/images/logo.png";

export interface ILyaoutHeaderRef {}

export interface ILyaoutHeaderProps {}

function UserInfo() {
  const userInfo = useUserStore((state) => state.userInfo)!;
  const router = useRouter();
  const { t } = useTransClient("common");
  const { t: tVip } = useTransClient("vip");
  const lng = useGetClientLng();

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            router.push(`/${lng}/profile`);
          }}
        >
          {t("profile")}
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            router.push(`/${lng}/income`);
          }}
        >
          {t("header.income" as any)}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div
          onClick={() => {
            router.push(`/${lng}/wallet`);
          }}
        >
          {t("header.wallet" as any)}
        </div>
      ),
    },
    // {
    //   key: "4",
    //   label: (
    //     <div
    //       onClick={() => {
    //         router.push(`/${lng}/notification`);
    //       }}
    //     >
    //       {t("header.messages")}
    //     </div>
    //   ),
    // },

    {
      key: "7",
      label: (
        <div
          onClick={() => {
            useUserStore.getState().logout();
            router.push(`/${lng}/`);
          }}
        >
          {t("logout")}
        </div>
      ),
    },
  ];

  return (
    <div className={styles["layoutHeader-userinfo__wrapper"]}>
      <Dropdown menu={{ items }} arrow placement="bottom">
        <div className={styles["layoutHeader-userinfo"]}>
          <Image
            className={styles["layoutHeader-userinfo-avatar"]}
            src={userInfo?.avatar || logo}
            alt={t("profile")}
            width={35}
            height={35}
            style={{
              borderRadius: "50%",
              backgroundColor: "#e9d5ff",
              padding: "3px",
            }}
          />
          <div className={styles["layoutHeader-userinfo-name"]}>
            {userInfo?.name || t("unknownUser")}
          </div>
          <CaretDownOutlined />
        </div>
      </Dropdown>
    </div>
  );
}

const LyaoutHeader = memo(
  forwardRef(({}: ILyaoutHeaderProps, ref: ForwardedRef<ILyaoutHeaderRef>) => {
    const userStore = useUserStore();
    const layoutHeader = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { t } = useTransClient("common");
    const { t: tVip } = useTransClient("vip");
    const lng = useGetClientLng();
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [vipModalVisible, setVipModalVisible] = useState(false);
    const [pointsModalVisible, setPointsModalVisible] = useState(false);
    const { unreadCount } = useNotification();

    return (
      <>
        <div ref={layoutHeader} className={styles.layoutHeader}>
          <div className={styles.layoutHeader_wrapper}>
            <div className={styles["layoutHeader_wrapper-left"]}>
              <h1 className={styles["layoutHeader_wrapper-logo"]}>
                <Link href="/">
                  <Image src={logo} alt="AIToEarn" width={50} />
                </Link>
              </h1>
              <LayoutNav />
            </div>

            <div
              className={styles["layoutHeader_wrapper-right"]}
              suppressHydrationWarning={true}
            >
              <LanguageSwitcher
                className={styles.languageButton}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 8px",
                  height: "auto",
                  fontSize: "12px",
                }}
              />
              <NoSSR>
                {userStore.token && (
                  <SignInCalendar className={styles.signInCalendarButton} />
                )}
                {/* 会员状态显示 */}
                {userStore.token &&
                  (() => {
                    // 判断是否为有效会员：有vipInfo且未过期
                    const isVip =
                      userStore.userInfo?.vipInfo &&
                      userStore.userInfo.vipInfo.expireTime &&
                      new Date(userStore.userInfo.vipInfo.expireTime) >
                        new Date();

                    return (
                      <Button
                        type="text"
                        icon={
                          <CrownOutlined
                            style={{
                              fontSize: 18,
                              color: isVip ? "#F5AB03" : "#999",
                            }}
                          />
                        }
                        onClick={() => setVipModalVisible(true)}
                        style={{ position: "relative", marginTop: -14 }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "28px",
                            width: "55px",
                            right: "-4px",
                            background: "rgb(245, 171, 3)",
                            color: "white",
                            fontSize: "8px",
                            fontWeight: "bold",
                            padding: "1px 4px",
                            borderRadius: "8px",
                            lineHeight: "10px",
                            minWidth: "16px",
                            textAlign: "center",
                          }}
                        >
                          {isVip
                            ? tVip("membership" as any) || "Membership"
                            : tVip("upgrade" as any) || "Upgrade"}
                        </span>
                      </Button>
                    );
                  })()}
                {/* 通知 */}
                {userStore.token && (
                  <Badge count={unreadCount} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      onClick={() => setNotificationVisible(true)}
                      className={styles.notificationButton}
                    />
                  </Badge>
                )}
                {userStore.token ? (
                  <UserInfo />
                ) : (
                  <Button
                    onClick={() => {
                      router.push(`/${lng}/login`);
                    }}
                  >
                    {t("login")}
                  </Button>
                )}
              </NoSSR>
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        <NotificationPanel
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
        />
        {/* VIP 弹窗 */}
        <VipContentModal
          open={vipModalVisible}
          onClose={() => setVipModalVisible(false)}
        />
        {/* 积分详情弹窗 */}
        <PointsDetailModal
          open={pointsModalVisible}
          onClose={() => setPointsModalVisible(false)}
        />
      </>
    );
  }),
);

export default LyaoutHeader;
