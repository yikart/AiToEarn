"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, App, notification } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense, useEffect } from "react";
import type { Locale } from "antd/es/locale";
import zh_CN from "antd/es/locale/zh_CN";
import en_US from "antd/es/locale/en_US";
import { fallbackLng } from "@/app/i18n/settings";
import useCssVariables from "@/app/hooks/useCssVariables";
import { useAccountStore } from "@/store/account";
import { useUserStore } from "@/store/user";
import { useCommontStore } from "@/store/commont";

// antd 语言获取
const getAntdLang = (lang: string): Locale => {
  switch (lang) {
    case "zh-CN":
      return zh_CN;
    case "en":
      return en_US;
  }
  return getAntdLang(fallbackLng);
};

export function Providers({
  children,
  lng,
}: {
  children: React.ReactNode;
  lng: string;
}) {
  const cssVariables = useCssVariables();
  const [api, contextHolder] = notification.useNotification({
    top: 74,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get("token");
    if (queryToken) {
      useUserStore.getState().setToken(queryToken);
    }
    if (useUserStore.getState().token) {
      useUserStore.getState().getUserInfo();
      useAccountStore.getState().accountInit();
    }
  }, []);

  useEffect(() => {
    useCommontStore.getState().setNotification(api);
  }, [api]);

  useEffect(() => {
    useUserStore.getState().setLang(lng);
  }, [lng]);

  return (
    <GoogleOAuthProvider clientId="1094109734611-flskoscgp609mecqk9ablvc6i3205vqk.apps.googleusercontent.com">
      <ConfigProvider
        locale={getAntdLang(lng)}
        theme={{
          token: {
            colorPrimary: cssVariables["--theColor5"],
          },
        }}
      >
        <App component={false}>
          <Suspense>
            <AntdRegistry>
              {contextHolder}
              {children}
            </AntdRegistry>
          </Suspense>
        </App>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}
