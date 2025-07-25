"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, App, notification } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense, useEffect, useMemo } from "react";
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
    useCommontStore.getState().setNotification(api);
  }, [api]);

  if (useUserStore.getState().token) {
    useAccountStore.getState().accountInit();
  }

  useEffect(() => {
    useUserStore.getState().setLang(lng);
  }, [lng]);

  return (
    <GoogleOAuthProvider clientId="471394506793-t2g4mg90vr8qgpq5stbua0b22pofqrne.apps.googleusercontent.com"> 
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
