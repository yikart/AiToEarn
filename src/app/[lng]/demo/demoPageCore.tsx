"use client";

import { useTranslation } from "@/app/i18n/client";

export const DemoPageCore = ({ lng }: { lng: string }) => {
  const { t } = useTranslation(lng, "demo");

  return <div>{t("demoText")}</div>;
};
