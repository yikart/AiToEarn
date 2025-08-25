"use client";

import styles from "@/app/layout/styles/layoutNav.module.scss";
import {
  IRouterDataItem,
  peRouterData,
  routerData,
} from "@/app/layout/routerData";
import Link from "next/link";
import { MenuFoldOutlined, RightOutlined, UpOutlined } from "@ant-design/icons";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Drawer, Menu } from "antd";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";

/**
 *
 * @param child
 * @param iconLoca 0=上，1=右
 */
function getNameTag(child: IRouterDataItem, iconLoca: number = 1) {
  const { t } = useTransClient("route");
  const path = child.path || "/";
  return (
    <>
      {!child.children ? (
        <Link href={path || "/"} target={path[0] === "/" ? "_self" : "_blank"}>
          {t(child.translationKey as any)}
        </Link>
      ) : (
        <span>
          {t(child.translationKey as any)}
          {child.children &&
            (iconLoca === 0 ? <UpOutlined /> : <RightOutlined />)}
        </span>
      )}
    </>
  );
}

/**
 * 递归级联
 * @param child
 */
function RecursionNav({ child }: { child: IRouterDataItem }) {
  return (
    child.children && (
      <ul className={styles["recursionNav"]}>
        {child.children.map((v) => {
          return (
            <li key={v.name}>
              {getNameTag(v)}
              {v.children && <RecursionNav child={v} />}
            </li>
          );
        })}
      </ul>
    )
  );
}

function ParcelTag({
  child,
  children,
}: {
  child: IRouterDataItem;
  children: React.ReactNode;
}) {
  if (child.children) {
    return <>{children}</>;
  } else {
    return <Link href={child.path || "/"}>{children}</Link>;
  }
}

/**
 * 二级导航
 * @param child
 * @param visible
 */
function ChildNav({
  child,
  visible,
}: {
  child: IRouterDataItem;
  visible: boolean;
}) {
  const elRef = useRef<HTMLUListElement | null>(null);
  const [height, setHeight] = useState("auto");
  const animaTime = 0.3;
  const timer = useRef<NodeJS.Timeout>();
  const { t } = useTransClient("route");

  useEffect(() => {
    if (!elRef.current) return;
    const h = elRef.current!.offsetHeight;
    if (h === 0) return;
    setHeight(`${h}px`);
  }, []);

  useEffect(() => {
    if (height !== "auto") {
      setTimeout(() => {
        elRef.current!.style.visibility = "visible";
        elRef.current!.style.transition = animaTime + "s";
      }, 1);
    }
  }, [height]);

  useEffect(() => {
    if (!elRef.current) return;
    if (visible) {
      timer.current = setTimeout(() => {
        elRef.current!.style.overflow = "visible";
      }, animaTime * 1000);
    } else {
      elRef.current!.style.overflow = "hidden";
      clearTimeout(timer.current);
    }
  }, [visible]);

  return (
    child.children && (
      <ul
        ref={elRef}
        className={styles["layoutNavPC-one"]}
        style={
          visible || height === "auto"
            ? { height: height }
            : { height: 0, padding: 0 }
        }
      >
        {child.children.map((v1) => {
          return (
            <li key={v1.name}>
              <div
                className={styles["layoutNavPC-one-item"]}
                style={{ backgroundImage: v1.backColor }}
              >
                <ParcelTag child={v1}>
                  <div className={styles["layoutNavPC-one-icon"]}>
                    {v1.icon ? (
                      <Image src={v1.icon!} alt="icon" width={20} />
                    ) : (
                      ""
                    )}
                  </div>
                  <span className={styles["layoutNavPC-one-text"]}>
                    {t(v1.translationKey as any)}
                  </span>
                  {v1.children && <RightOutlined />}
                </ParcelTag>
              </div>
              <RecursionNav child={v1} />
            </li>
          );
        })}
      </ul>
    )
  );
}

function NavPC() {
  const [activeNav, setActiveNav] = useState("");
  const timer = useRef<NodeJS.Timeout>();
  const route = useSelectedLayoutSegments();
  const { t } = useTransClient("route");
  
  let currRouter = "/";
  if (route.length === 1) {
    currRouter = route[0];
    currRouter = currRouter === "/" ? currRouter : "/" + currRouter;
  } else {
    currRouter = "/" + route.slice(0, 2).join("/");
  }

  return (
    <ul className={styles.layoutNavPC}>
      {routerData.map((v1) => {
        return (
          <li
            key={v1.name}
            className={
              activeNav === v1.name || v1.path === currRouter
                ? styles["layoutNavPC-item-active"]
                : ""
            }
            onMouseEnter={() => {
              setActiveNav(v1.children ? v1.name : "");
              clearTimeout(timer.current);
            }}
            onMouseLeave={() => {
              timer.current = setTimeout(() => {
                setActiveNav("");
              }, 300);
            }}
          >
            {getNameTag(v1, 0)}
            <ChildNav
              key={v1.name}
              child={v1}
              visible={activeNav === v1.name}
            />
          </li>
        );
      })}
    </ul>
  );
}

function NavPE() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTransClient("route");

  const translatedMenuItems = routerData.map((item) => ({
    key: item.path || item.name,
    label: t(item.translationKey as any),
    children: item.children?.map((child) => ({
      key: child.path || child.name,
      label: t(child.translationKey as any),
    })),
  }));

  return (
    <div className={styles.layoutNavPE}>
      <div onClick={() => setOpen(true)} className={styles["layoutNavPE-menu"]}>
        <MenuFoldOutlined />
      </div>
      <Drawer
        title={t("navigation")}
        placement="right"
        onClose={() => setOpen(false)}
        width="85%"
        open={open}
      >
        <Menu
          className="layoutNavPE-menu"
          selectable={false}
          onClick={(e) => {
            router.push(e.key);
            setOpen(false);
          }}
          style={{ width: "100%" }}
          mode="inline"
          items={translatedMenuItems}
        />
      </Drawer>
    </div>
  );
}

function LayoutNav() {
  return (
    <div className={styles.navContainer}>
      <NavPC />
      <NavPE />
    </div>
  );
}

export default LayoutNav;
