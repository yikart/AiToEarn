import { useTranslation } from "@/app/i18n";
import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";
import { DemoPageCore } from "@/app/[lng]/demo/demoPageCore";
import { DemoPublish } from "@/app/[lng]/demo/demoPublish";

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "demo");
  return await getMetadata(
    {
      title: t("title"),
    },
    lng,
  );
}

export default async function Page({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "demo");

  return (
    <>
      <div>{t("demoText")} 1</div>
      <DemoPageCore />
      <DemoPublish />
    </>
  );
}
