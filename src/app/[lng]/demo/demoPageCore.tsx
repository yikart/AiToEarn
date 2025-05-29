"use client";

import { useTransClient } from "@/app/i18n/client";

export const DemoPageCore = () => {
  const { t } = useTransClient("demo");
  return <div>{t("demoText")}</div>;
};
