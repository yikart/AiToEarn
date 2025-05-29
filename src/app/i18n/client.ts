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
    ...getOptions(),
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
    useEffect(() => {
      if (activeLng === i18next.resolvedLanguage) return;
      setActiveLng(i18next.resolvedLanguage);
    }, [activeLng, i18next.resolvedLanguage]);
    useEffect(() => {
      if (!lng || i18next.resolvedLanguage === lng) return;
      i18next.changeLanguage(lng);
    }, [lng, i18next]);
    useEffect(() => {
      if (i18nextCookie === lng) return;
      setCookie(cookieName, lng, { path: "/" });
    }, [lng, i18nextCookie]);
  }
  return useTranslation(ns, options);
}
