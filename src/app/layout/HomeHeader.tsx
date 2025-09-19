import { ForwardedRef, forwardRef, memo } from "react";
import { useTransClient } from "@/app/i18n/client";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import styles from "@/app/[lng]/styles/difyHome.module.scss";
import Image from "next/image";
import logo from "@/assets/images/logo.png";
import Link from "next/link";
import { Button } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { removeLocalePrefix } from "@/app/layout/layout.utils";
import { homeHeaderRouterData } from "@/app/layout/routerData";

export interface IHomeHeaderRef {}

export interface IHomeHeaderProps {}

const HomeHeader = memo(
  forwardRef(({}: IHomeHeaderProps, ref: ForwardedRef<IHomeHeaderRef>) => {
    const pathname = usePathname();
    const { t } = useTransClient("home");
    const router = useRouter();
    const userStore = useUserStore();
    const currentPath = removeLocalePrefix(pathname).replace(/\/+$/, "") || "/";

    const toggleLanguage = () => {
      const newLng = userStore.lang === "zh-CN" ? "en" : "zh-CN";
      userStore.setLang(newLng);
      router.push(
        `/${newLng}${location.pathname.replace(`/${userStore.lang}`, "")}`,
      );
    };

    const isActive = (href: string) => {
      if (!href.startsWith("/")) return false;
      const normalizedHref = href.replace(/\/+$/, "") || "/";
      if (normalizedHref === "/") return currentPath === "/";
      if (currentPath === normalizedHref) return true;
      return currentPath.startsWith(normalizedHref + "/");
    };

    return (
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div
            className={styles.logo}
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <Image src={logo} alt="logo" width={50} />
            <span className={styles.logoText}>{t("header.logo")}</span>
          </div>
          <nav className={styles.nav}>
            {homeHeaderRouterData.value.map((v) => {
              return (
                <Link
                  key={v.title}
                  className={`${styles.navLink} ${isActive(v.href) ? styles.active : ""}`}
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ paddingTop: "3px" }}
                >
                  {v.title}
                </Link>
              );
            })}
          </nav>

          <div className={styles.headerRight}>
            <Button
              type="text"
              icon={<GlobalOutlined />}
              onClick={toggleLanguage}
              className={styles.languageButton}
            >
              {userStore.lang === "zh-CN" ? "EN" : "中文"}
            </Button>

            <button
              onClick={() => {
                router.push("/accounts");
              }}
              className={styles.getStartedBtn}
            >
              {t("header.getStarted")}
            </button>
          </div>
        </div>
      </header>
    );
  }),
);

export default HomeHeader;
