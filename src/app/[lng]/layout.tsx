import "@/app/var.css";
import "../globals.css";
import { Providers } from "../layout/Providers";

import { dir } from "i18next";
import { languages, fallbackLng } from "@/app/i18n/settings";
import { useTranslation } from "@/app/i18n";
import LyaoutHeader from "@/app/layout/LyaoutHeader";
import LyaoutFooter from "@/app/layout/LyaoutFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>;
}) {
  let { lng } = await params;
  if (languages.indexOf(lng) < 0) lng = fallbackLng;
  const { t } = await useTranslation(lng);
  return {
    title: t("title"),
    description: t("content"),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}>) {
  const { lng } = await params;
  return (
    <html lang={lng} dir={dir(lng)}>
      <body>
        <Providers lng={lng}>
          <LyaoutHeader />
          {children}
          <LyaoutFooter lng={lng} />
        </Providers>
      </body>
    </html>
  );
}
