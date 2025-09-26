"use client";

import { ForwardedRef, forwardRef, memo, useEffect, useRef, useState } from "react";
import styles from "./styles/lyaoutHeader.module.scss";
import { useUserStore } from "@/store/user"; 
import Link from "next/link";
import Image from "next/image";
import LayoutNav from "@/app/layout/layoutNav";
import { NoSSR } from "@kwooshung/react-no-ssr";
import { Button, Dropdown, MenuProps, Badge, Tooltip } from "antd";
import logo from "@/assets/images/logo.png";
import defaultAvatar from "./images/defaultAvatar.jpg";
import {
  BellOutlined,
  CaretDownOutlined,
  GlobalOutlined,
  CrownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";
import NotificationPanel from "@/components/notification/NotificationPanel";
import { useNotification } from "@/hooks/useNotification";
import SignInCalendar from "@/components/SignInCalendar"; 
import VipContentModal from "@/components/modals/VipContentModal";
import PointsDetailModal from "@/components/modals/PointsDetailModal";

export interface ILyaoutHeaderRef {}

export interface ILyaoutHeaderProps {}

function UserInfo() {
  const userInfo = useUserStore((state) => state.userInfo)!;
  const router = useRouter();
  const { t } = useTransClient("common");

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            router.push("/profile");
          }}
        >
          {t("profile")}
        </div>
      ),
    },
    {
      key: "5",
      label: (
        <div
          onClick={() => {
            router.push("/material");
          }}
        >
          {t("header.materialLibrary")}
        </div>
      ),
    },
    {
      key: "6",
      label: (
        <div
          onClick={() => {
            router.push("/cgmaterial");
          }}
        >
          {t("header.draftBox")}
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            router.push("/income");
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
            router.push("/wallet");
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
    //         router.push("/notification");
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
            router.push("/");
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
            src={userInfo?.avatar || defaultAvatar}
            alt={t("profile")}
            width={35}
            height={35}
          />
          <div className={styles["layoutHeader-userinfo-name"]}>
            {userInfo.name || t("unknownUser")}
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
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [vipModalVisible, setVipModalVisible] = useState(false);
    const [pointsModalVisible, setPointsModalVisible] = useState(false);
    const { unreadCount } = useNotification();

    const toggleLanguage = () => {
      const newLng = userStore.lang === "zh-CN" ? "en" : "zh-CN";
      userStore.setLang(newLng);
      router.push(
        `/${newLng}${location.pathname.replace(`/${userStore.lang}`, "")}`,
      );
    };

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
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={toggleLanguage}
                className={styles.languageButton}
              >
                {userStore.lang === "zh-CN" ? "EN" : "中文"}
              </Button>
              <NoSSR>
                {userStore.token && (
                  <SignInCalendar className={styles.signInCalendarButton} />
                )}
                {/* 未开通 VIP 时显示图标，点击打开 VIP 弹窗 */}
                      {userStore.token && !userStore.userInfo?.vipInfo && (
                        <Tooltip title={t("vip" as any) || "VIP"}>
                          <Button
                            type="text"
                            icon={<CrownOutlined />}
                            onClick={() => setVipModalVisible(true)}
                            style={{ position: 'relative' }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: '-2px',
                              right: '-11px',
                              background: '#ff4d4f',
                              color: 'white',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              padding: '1px 4px',
                              borderRadius: '8px',
                              lineHeight: '10px',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}>
                              HOT
                            </span>
                          </Button>
                        </Tooltip>
                      )}
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
                      router.push("/login");
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
        <VipContentModal open={vipModalVisible} onClose={() => setVipModalVisible(false)} />
        {/* 积分详情弹窗 */}
        <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />
      </>
    );
  }),
);

export default LyaoutHeader;
