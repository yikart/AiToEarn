import { useTranslation } from "@/app/i18n";
import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";
import { AlbumDetailCore } from "./albumDetailCore";

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "material");
  return await getMetadata(
    {
      title: "素材库详情",
    },
    lng,
  );
}

export default async function Page({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "material");

  return (
    <>
      <AlbumDetailCore albumId={params.id} />
    </>
  );
} 