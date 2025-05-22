"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, App } from "antd";
import zh_CN from "antd/es/locale/zh_CN";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId="471394506793-t2g4mg90vr8qgpq5stbua0b22pofqrne.apps.googleusercontent.com">
      <ConfigProvider
        locale={zh_CN}
        theme={{
          token: {
            colorPrimary: "#d49c61",
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