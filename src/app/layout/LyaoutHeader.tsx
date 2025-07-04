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
import {
  BellOutlined,
  CaretDownOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";

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
      key: "2",
      label: (
        <div
          onClick={() => {
            router.push("/material");
          }}
        >
          素材库
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div
          onClick={() => {
            router.push("/cgmaterial");
          }}
        >
          草稿箱
        </div>
      ),
    },
    {
      key: "4",
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
            alt="头像"
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

    const toggleLanguage = () => {
      const newLng = userStore.lang === "zh-CN" ? "en" : "zh-CN";
      userStore.setLang(newLng);
      router.push(
        `/${newLng}${location.pathname.replace(`/${userStore.lang}`, "")}`,
      );
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
              {userStore.lang === "zh-CN" ? "EN" : "中文"}
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
                  {t("login")}
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
