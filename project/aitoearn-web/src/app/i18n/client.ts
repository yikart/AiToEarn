"use client";

import { useEffect, useState } from "react";
import i18next, { FlatNamespace, KeyPrefix } from "i18next";
import {
  initReactI18next,
  UseTranslationOptions,
  UseTranslationResponse,
  FallbackNs,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { cookieName, getOptions, languages } from "./settings";
import { useTranslation } from "react-i18next";
import { getCookie, setCookie } from "cookies-next";
import { useGetClientLng } from "@/hooks/useSystem";

const runsOnServerSide = typeof window === "undefined";

// on client side the normal singleton is ok
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  // .use(LocizeBackend) // locize backend could be used on client side, but prefer to keep it in sync with server side
  .init({
    ...getOptions(undefined), // 不传递 lng 参数，让 i18next 自动检测
    lng: undefined, // let detect the language on client side
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    preload: runsOnServerSide ? languages : [],
  });

export function useTransClient<
  Ns extends FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  ns?: Ns,
  options?: UseTranslationOptions<KPrefix>,
): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
  const i18nextCookie = getCookie(cookieName);
  const lng = useGetClientLng();
  if (typeof lng !== "string")
    throw new Error("useT is only available inside /app/[lng]");

  if (runsOnServerSide && i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng);
  } else {
    const [activeLng, setActiveLng] = useState(i18next.resolvedLanguage);

    // 监听 i18next 语言变化
    useEffect(() => {
      if (activeLng === i18next.resolvedLanguage) return;
      setActiveLng(i18next.resolvedLanguage);
    }, [activeLng, i18next.resolvedLanguage]);

    // 强制同步 URL 参数中的语言到 i18next
    useEffect(() => {
      if (!lng) return;

      // 始终使用 URL 参数中的语言，忽略 i18next 的自动检测
      if (i18next.resolvedLanguage !== lng) {
        i18next.changeLanguage(lng).then(() => {
          // 语言切换完成后，强制重新渲染
          setActiveLng(lng);
        });
      } else {
        // 即使语言相同，也确保状态同步
        setActiveLng(lng);
      }
    }, [lng]);

    // 同步 cookie
    useEffect(() => {
      if (i18nextCookie === lng) return;
      setCookie(cookieName, lng, { path: "/" });
    }, [lng, i18nextCookie]);
  }
  return useTranslation(ns, options);
}

export default i18next;

// 静态方法，注意这个方法的国际化不会自动更新
export function directTrans<Ns extends FlatNamespace>(
  ns: Ns,
  key: string,
): string {
  // @ts-ignore
  const t = (key: string) => i18next.t(key, { ns });
  // @ts-ignore
  return t(key);
}
