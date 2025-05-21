import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense } from "react";
import { App, ConfigProvider } from "antd";
import zh_CN from "antd/es/locale/zh_CN";
import { APP_TITLE } from "@/constant";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "哎呦赚官方网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
