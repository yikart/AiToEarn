import "@/var.css";
import "./globals.css";
import { Providers } from "./layout/Providers";
import { dir } from "i18next";
import { languages, fallbackLng } from "@/app/i18n/settings";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={fallbackLng} dir={dir(fallbackLng)}>
      <body>
        <Providers lng={fallbackLng}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 