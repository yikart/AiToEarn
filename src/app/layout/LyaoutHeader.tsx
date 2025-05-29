"use client";

import { ForwardedRef, forwardRef, memo, useEffect, useRef } from "react";
import styles from "./styles/lyaoutHeader.module.scss";
import { useUserStore } from "@/store/user";
import Link from "next/link";
import Image from "next/image";
import LayoutNav from "@/app/layout/layoutNav";
import { NoSSR } from "@kwooshung/react-no-ssr";
import { Button, Dropdown, MenuProps } from "antd";
import logo from "@/assets/images/logo.png";
import defaultAvatar from "./images/defaultAvatar.jpg";
import { CaretDownOutlined, GlobalOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

export interface ILyaoutHeaderRef {}

export interface ILyaoutHeaderProps {}

function UserInfo() {
  const userInfo = useUserStore((state) => state.userInfo)!;
  const router = useRouter();

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            router.push("/profile");
          }}
        >
          个人中心
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            useUserStore.getState().logout();
            router.push("/");
          }}
        >
          退出登录
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
            alt="头像"
            width={35}
            height={35}
          />
          <div className={styles["layoutHeader-userinfo-name"]}>
            {userInfo.name || "未知用户"}
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
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
      setLanguage(language === "zh-CN" ? "en" : "zh-CN");
    };

    useEffect(() => {
      setTimeout(() => {
        let layoutHeaderHegiht = "0px";
        layoutHeaderHegiht = layoutHeader.current!.offsetHeight + "px";

        document.body.style.paddingTop = layoutHeaderHegiht;

        document.documentElement.style.setProperty(
          `--layoutHeaderHegiht`,
          layoutHeaderHegiht,
        );
      }, 2);
    }, []);

    return (
      <div ref={layoutHeader} className={styles.layoutHeader}>
        <div className={styles.layoutHeader_wrapper}>
          <div className={styles["layoutHeader_wrapper-left"]}>
            <h1 className={styles["layoutHeader_wrapper-logo"]}>
              <Link href="/">
                <Image src={logo} alt="logo" width={50} />
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
              {language === "zh-CN" ? "EN" : "中文"}
            </Button>
            <NoSSR>
              {userStore.token ? (
                <UserInfo />
              ) : (
                <Button
                  onClick={() => {
                    router.push("/login");
                  }}
                >
                  登录
                </Button>
              )}
            </NoSSR>
          </div>
        </div>
      </div>
    );
  }),
);

export default LyaoutHeader;
