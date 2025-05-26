"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, App } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense } from "react";
import type { Locale } from "antd/es/locale";
import zh_CN from "antd/es/locale/zh_CN";
import en_US from "antd/es/locale/en_US";
import { fallbackLng } from "@/app/i18n/settings";
import useCssVariables from "@/app/hooks/useCssVariables";
import { useAccountStore } from "@/store/account";
import { useUserStore } from "@/store/user";

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

  if (useUserStore.getState().token) {
    useAccountStore.getState().init();
  }

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
            <AntdRegistry>{children}</AntdRegistry>
          </Suspense>
        </App>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}
