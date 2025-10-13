"use client";

import { ForwardedRef, forwardRef, memo, useEffect, useRef, useState } from "react";
import styles from "./styles/lyaoutHeader.module.scss";
import { useUserStore } from "@/store/user"; 
import Link from "next/link";
import Image from "next/image";
import LayoutNav from "@/app/layout/layoutNav";
import { NoSSR } from "@kwooshung/react-no-ssr";
import { Button, Dropdown, MenuProps, Badge, Tooltip } from "antd";
import {
  BellOutlined,
  CaretDownOutlined,
  GlobalOutlined,
  CrownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";
import { useGetClientLng } from "@/hooks/useSystem";
import NotificationPanel from "@/components/notification/NotificationPanel";
import { useNotification } from "@/hooks/useNotification";
import SignInCalendar from "@/components/SignInCalendar"; 
import VipContentModal from "@/components/modals/VipContentModal";
import PointsDetailModal from "@/components/modals/PointsDetailModal";

import logo from "@/assets/images/logo.png";
import zhLang from "@/assets/images/zh.png";
import enLang from "@/assets/images/us.png";

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
      key: "5",
      label: (
        <div
          onClick={() => {
            router.push(`/${lng}/material`);
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
            router.push(`/${lng}/cgmaterial`);
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
            style={{ borderRadius: '50%', backgroundColor: '#e9d5ff', padding: '3px' }}
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

    const toggleLanguage = () => {
      const currentLng = userStore.lang;
      const newLng = currentLng === "zh-CN" ? "en" : "zh-CN";
      userStore.setLang(newLng);
      
      // 获取当前路径并替换语言前缀
      const currentPath = location.pathname;
      const pathWithoutLang = currentPath.replace(`/${currentLng}`, "") || "/";
      const newPath = `/${newLng}${pathWithoutLang}`;
      
      router.push(newPath);
    };

    const handleLanguageChange = (newLng: string) => {
      userStore.setLang(newLng);
      
      // 获取当前路径并替换语言前缀
      const currentPath = location.pathname;
      const pathWithoutLang = currentPath.replace(`/${userStore.lang}`, "") || "/";
      const newPath = `/${newLng}${pathWithoutLang}`;
      
      router.push(newPath);
    };

    // 语言选项配置
    const languageOptions = [
      {
        key: 'en',
        label: 'English',
        flag: enLang,
        current: userStore.lang === 'en'
      },
      {
        key: 'zh-CN',
        label: '简体中文',
        flag: zhLang,
        current: userStore.lang === 'zh-CN'
      }
    ];

    const currentLanguage = languageOptions.find(lang => lang.current) || languageOptions[0];

    const languageMenuItems: MenuProps['items'] = languageOptions.map(option => ({
      key: option.key,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image 
              src={option.flag} 
              alt={option.label}
              width={16}
              height={16}
              style={{ borderRadius: '50%' }}
            />
            <span style={{ color: option.current ? '#52c41a' : '#000' }}>{option.label}</span>
          </div>
          {option.current && <span style={{ color: '#52c41a' }}>✓</span>}
        </div>
      ),
      onClick: () => handleLanguageChange(option.key)
    }));

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
              <Dropdown
                menu={{ items: languageMenuItems }}
                trigger={['click']}
                placement="bottomRight"
                overlayClassName={styles.languageDropdown}
              >
                <Button
                  type="text"
                  className={styles.languageButton}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '4px 8px',
                    height: 'auto',
                  }}
                >
                  <Image 
                    src={currentLanguage.flag} 
                    alt={currentLanguage.label}
                    width={16}
                    height={16}
                    style={{ borderRadius: '50%' }}
                  />
                  <span>{currentLanguage.label}</span>
                  <CaretDownOutlined style={{ fontSize: '12px' }} />
                </Button>
              </Dropdown>
              <NoSSR>
                {userStore.token && (
                  <SignInCalendar className={styles.signInCalendarButton} />
                )}
                {/* 会员状态显示 */}
                      {userStore.token && (() => {
                        // 判断是否为有效会员：有vipInfo且未过期
                        const isVip = userStore.userInfo?.vipInfo && 
                                    userStore.userInfo.vipInfo.expireTime && 
                                    new Date(userStore.userInfo.vipInfo.expireTime) > new Date();
                        
                        return (
                          <Button
                            type="text"
                            icon={<CrownOutlined style={{ fontSize: 18, color: isVip ? '#F5AB03' : '#999' }} />}
                            onClick={() => setVipModalVisible(true)}
                            style={{ position: 'relative', marginTop: -14 }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: '28px',
                              width: '55px',
                              right: '-4px',
                              background: 'rgb(245, 171, 3)',
                              color: 'white',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              padding: '1px 4px',
                              borderRadius: '8px',
                              lineHeight: '10px',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}>
                              {isVip ? (tVip("membership" as any) || "Membership") : (tVip("upgrade" as any) || "Upgrade")}
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
        <VipContentModal open={vipModalVisible} onClose={() => setVipModalVisible(false)} />
        {/* 积分详情弹窗 */}
        <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />
      </>
    );
  }),
);

export default LyaoutHeader;
